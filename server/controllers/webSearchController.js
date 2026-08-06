const { performSearch } = require("../services/serperSearchService");
const WebSearchHistory = require("../models/WebSearchHistory");
const WebSearchClick = require("../models/WebSearchClick");
const WebPageVisitHistory = require("../models/WebPageVisitHistory");
const { UAParser } = require("ua-parser-js");
const axios = require("axios");
const dns = require("dns").promises;
const mongoose = require("mongoose");

// Validate Mongoose ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Safe URL protocol validator (http and https only)
const isValidUrl = (urlStr) => {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    return false;
  }
};

// Check if IP is private (SSRF Protection)
const isPrivateIpAddress = (ip) => {
  if (!ip) return true;
  const ipLower = ip.toLowerCase().trim();

  if (ipLower === "::1" || ipLower === "localhost" || ipLower === "127.0.0.1") return true;

  // IPv4 Private Range Check
  const ipv4Match = ipLower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, octet1, octet2] = ipv4Match.map(Number);
    if (octet1 === 127) return true; // loopback
    if (octet1 === 10) return true;  // private class A
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true; // private class B
    if (octet1 === 192 && octet2 === 168) return true; // private class C
    if (octet1 === 169 && octet2 === 254) return true; // link-local
    return false;
  }

  // IPv6 Private Range Check
  if (ipLower.startsWith("fc") || ipLower.startsWith("fd") || ipLower.startsWith("fe80")) {
    return true;
  }

  return false;
};

// Perform DNS resolution and check for SSRF
const checkSSRF = async (urlStr) => {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname;

    if (!hostname) return false;
    const hostnameLower = hostname.toLowerCase().trim();

    if (hostnameLower === "localhost" || hostnameLower === "127.0.0.1" || hostnameLower === "::1") {
      return false;
    }

    // Resolve domain to IP addresses
    const addresses = await dns.resolve(hostname).catch(() => []);
    if (addresses.length === 0) {
      // Try resolving as host address directly
      try {
        const lookup = await dns.lookup(hostname);
        if (lookup && lookup.address) {
          addresses.push(lookup.address);
        }
      } catch (e) {
        // Fallback: If dns fails to resolve, reject to prevent blind SSRF requests
        return false;
      }
    }

    for (const addr of addresses) {
      if (isPrivateIpAddress(addr)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Execute Serper.dev web search
 */
const searchWeb = async (req, res) => {
  const startTime = Date.now();
  let { query, page, sessionId } = req.body;

  // 1. Input Validation
  if (typeof query !== "string") {
    return res.status(400).json({ success: false, message: "Search query must be a string." });
  }

  query = query.trim();
  if (query.length < 2) {
    return res.status(400).json({ success: false, message: "Search query must be at least 2 characters long." });
  }
  if (query.length > 200) {
    return res.status(400).json({ success: false, message: "Search query must be 200 characters or less." });
  }

  const pageNumber = parseInt(page, 10);
  if (isNaN(pageNumber) || pageNumber <= 0) {
    return res.status(400).json({ success: false, message: "Page must be a positive integer." });
  }

  const parser = new UAParser(req.headers["user-agent"]);
  const browserName = parser.getBrowser().name || "Unknown Browser";
  const osName = parser.getOS().name || "Unknown OS";
  const deviceType = parser.getDevice().type || "desktop";
  const normalizedIp = (req.ip || "").replace(/^::ffff:/, "");

  let searchResponse;
  let status = "success";

  // 2. Perform Search
  try {
    searchResponse = await performSearch({
      query,
      page: pageNumber,
      country: "us",
      language: "en"
    });
    if (!searchResponse.results || searchResponse.results.length === 0) {
      status = "no_results";
    }
  } catch (err) {
    console.error("Serper search execution failed:", err.message);
    if (err.message === "SERPER_API_TIMEOUT") {
      status = "timeout";
    } else if (err.message === "SERPER_QUOTA_EXCEEDED") {
      status = "rate_limited";
    } else {
      status = "failed";
    }
  }

  const responseTimeMs = Date.now() - startTime;

  // 3. Log Analytics asynchronously to database
  const recordHistory = async () => {
    try {
      const history = await WebSearchHistory.create({
        user: req.user._id || req.user.id,
        employeeId: req.user.userId || "",
        employeeName: req.user.name || "",
        userEmail: req.user.email || "",
        role: req.user.role || "",
        department: req.user.department || "",
        query: query,
        normalizedQuery: query.toLowerCase().trim(),
        page: pageNumber,
        resultCount: searchResponse?.results ? searchResponse.results.length : 0,
        searchStatus: status,
        responseTimeMs: responseTimeMs,
        source: "serper",
        searchedAt: new Date(),
        ipAddress: normalizedIp,
        userAgent: req.headers["user-agent"] || "",
        browser: browserName,
        operatingSystem: osName,
        deviceType: deviceType,
        sessionId: sessionId || "",
        isDeleted: false
      });
      return history._id;
    } catch (logErr) {
      console.error("Failed to log WebSearchHistory record:", logErr.message);
      return null;
    }
  };

  recordHistory()
    .then((historyId) => {
      // 4. Return results with searchHistoryId link
      if (status === "success" || status === "no_results") {
        return res.status(200).json({
          ...searchResponse,
          searchHistoryId: historyId
        });
      } else if (status === "timeout") {
        return res.status(504).json({ success: false, message: "Search request timed out. Please try again." });
      } else {
        return res.status(500).json({ success: false, message: "Search service is temporarily unavailable." });
      }
    })
    .catch((err) => {
      console.error("Callback logging process crashed:", err);
      return res.status(500).json({ success: false, message: "Search service is temporarily unavailable." });
    });
};

/**
 * Log result click history
 */
const trackClick = async (req, res) => {
  try {
    const { searchHistoryId, query, resultTitle, resultUrl, resultDomain, resultPosition, openMethod, sessionId } = req.body;

    if (!searchHistoryId || !query || !resultTitle || !resultUrl || !resultDomain || resultPosition === undefined || !openMethod) {
      return res.status(400).json({ success: false, message: "Missing required click tracking properties." });
    }

    if (!isValidObjectId(searchHistoryId)) {
      return res.status(400).json({ success: false, message: "Invalid searchHistoryId." });
    }

    if (!isValidUrl(resultUrl)) {
      return res.status(400).json({ success: false, message: "Invalid URL protocol. Only HTTP and HTTPS are allowed." });
    }

    const pos = parseInt(resultPosition, 10);
    if (isNaN(pos) || pos < 0) {
      return res.status(400).json({ success: false, message: "resultPosition must be a positive integer." });
    }

    const normalizedIp = (req.ip || "").replace(/^::ffff:/, "");

    // Log WebSearchClick entry asynchronously
    const clickRecord = await WebSearchClick.create({
      user: req.user._id || req.user.id,
      searchHistory: searchHistoryId,
      query,
      resultTitle,
      resultUrl,
      resultDomain,
      resultPosition: pos,
      openedInsideCrm: openMethod !== "external_fallback",
      openMethod,
      ipAddress: normalizedIp,
      sessionId: sessionId || ""
    });

    return res.status(200).json({ success: true, clickHistoryId: clickRecord._id });
  } catch (err) {
    console.error("Click tracking error:", err);
    return res.status(500).json({ success: false, message: "Failed to record click analytics." });
  }
};

/**
 * Log webpage visit creation inside the CRM web viewer
 */
const recordVisit = async (req, res) => {
  try {
    const { searchHistoryId, clickHistoryId, query, pageTitle, url, domain, resultPosition, viewerStatus, navigationType, sessionId } = req.body;

    if (!searchHistoryId || !query || !url || !domain || !viewerStatus || !navigationType) {
      return res.status(400).json({ success: false, message: "Missing required visit tracking properties." });
    }

    if (!isValidObjectId(searchHistoryId)) {
      return res.status(400).json({ success: false, message: "Invalid searchHistoryId." });
    }

    if (clickHistoryId && !isValidObjectId(clickHistoryId)) {
      return res.status(400).json({ success: false, message: "Invalid clickHistoryId." });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ success: false, message: "Invalid URL protocol. Only HTTP and HTTPS are allowed." });
    }

    const visit = await WebPageVisitHistory.create({
      user: req.user._id || req.user.id,
      searchHistory: searchHistoryId,
      clickHistory: clickHistoryId || null,
      query,
      pageTitle: pageTitle || "",
      url,
      domain,
      resultPosition: Number(resultPosition) || 0,
      openedAt: new Date(),
      lastActiveAt: new Date(),
      closedAt: null,
      durationSeconds: 0,
      viewerStatus,
      navigationType,
      sessionId: sessionId || ""
    });

    return res.status(200).json({ success: true, visitHistoryId: visit._id });
  } catch (err) {
    console.error("Visit recording error:", err);
    return res.status(500).json({ success: false, message: "Failed to initialize webpage visit log." });
  }
};

/**
 * Update active visit duration or status
 */
const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationSeconds, closedAt, viewerStatus, lastActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid visit log ID." });
    }

    const updates = {};
    if (durationSeconds !== undefined) updates.durationSeconds = Number(durationSeconds) || 0;
    if (closedAt) updates.closedAt = new Date(closedAt);
    if (viewerStatus) updates.viewerStatus = viewerStatus;
    
    // Heartbeat updates setting active timestamp
    updates.lastActiveAt = lastActive ? new Date(lastActive) : new Date();

    const visit = await WebPageVisitHistory.findByIdAndUpdate(id, updates, { new: true });
    if (!visit) {
      return res.status(404).json({ success: false, message: "Visit log not found." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Visit status update error:", err);
    return res.status(500).json({ success: false, message: "Failed to update visit details." });
  }
};

/**
 * Retrieve user's search history
 */
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, query, dateFrom, dateTo, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false };

    // Role-based scoping: normal users only see their own search history
    if (req.user.role !== "super_user") {
      filter.user = req.user._id || req.user.id;
    } else {
      // Super user organization filtering overrides
      if (req.query.employee && isValidObjectId(req.query.employee)) {
        filter.user = req.query.employee;
      }
      if (req.query.department) {
        filter.department = req.query.department;
      }
      if (req.query.role) {
        filter.role = req.query.role;
      }
    }

    // Filters setup
    if (query) {
      filter.query = { $regex: query, $options: "i" };
    }
    if (status) {
      filter.searchStatus = status;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute queries
    const records = await WebSearchHistory.find(filter)
      .populate("user", "name email role department")
      .sort(sortOption)
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    // Map click counts asynchronously
    const historyWithClicks = await Promise.all(
      records.map(async (record) => {
        const clickCount = await WebSearchClick.countDocuments({ searchHistory: record._id });
        const lastClick = await WebSearchClick.findOne({ searchHistory: record._id })
          .sort({ clickedAt: -1 })
          .select("resultDomain");
        return {
          ...record,
          clickCount,
          lastOpenedDomain: lastClick ? lastClick.resultDomain : ""
        };
      })
    );

    const total = await WebSearchHistory.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: historyWithClicks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (err) {
    console.error("Search history retrieval failed:", err);
    return res.status(500).json({ success: false, message: "Could not fetch search history logs." });
  }
};

/**
 * Retrieve specific search record
 */
const getHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid search log ID." });
    }

    const record = await WebSearchHistory.findById(id).populate("user", "name email role department").lean();
    if (!record || record.isDeleted) {
      return res.status(404).json({ success: false, message: "Search record not found." });
    }

    // normal users check
    if (req.user.role !== "super_user" && String(record.user._id) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const clicks = await WebSearchClick.find({ searchHistory: id }).sort({ clickedAt: 1 }).lean();

    return res.status(200).json({ success: true, record, clicks });
  } catch (err) {
    console.error("Search log fetch failed:", err);
    return res.status(500).json({ success: false, message: "Could not retrieve search record." });
  }
};

/**
 * Soft delete specific search record (setting isDeleted: true)
 */
const deleteHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid search log ID." });
    }

    const record = await WebSearchHistory.findById(id);
    if (!record || record.isDeleted) {
      return res.status(404).json({ success: false, message: "Search record not found." });
    }

    // Auth scoping check
    if (req.user.role !== "super_user" && String(record.user) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied. Cannot delete another user's history." });
    }

    record.isDeleted = true;
    await record.save();

    return res.status(200).json({ success: true, message: "History item soft-deleted successfully." });
  } catch (err) {
    console.error("History item deletion failed:", err);
    return res.status(500).json({ success: false, message: "Could not delete search history entry." });
  }
};

/**
 * Soft delete all user's search history logs
 */
const clearAllHistory = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    
    // Normal users clear own logs only; Super User clears all org logs if requested
    if (req.user.role !== "super_user") {
      filter.user = req.user._id || req.user.id;
    } else {
      // Super User can specify clear scope
      if (req.query.employee && isValidObjectId(req.query.employee)) {
        filter.user = req.query.employee;
      } else if (req.query.all !== "true") {
        // By default, super user clears own history only unless explicitly requested
        filter.user = req.user._id || req.user.id;
      }
    }

    await WebSearchHistory.updateMany(filter, { $set: { isDeleted: true } });

    return res.status(200).json({ success: true, message: "Search history cleared successfully." });
  } catch (err) {
    console.error("Clearing search logs failed:", err);
    return res.status(500).json({ success: false, message: "Could not clear search history logs." });
  }
};

/**
 * Retrieve recent search queries (grouped and deduplicated)
 */
const getRecentSearches = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Fetch user's non-deleted history, newest first
    const history = await WebSearchHistory.find({ user: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .select("query createdAt")
      .lean();

    // Deduplicate queries for cleaner display presentation
    const uniqueQueries = [];
    const seen = new Set();
    for (const item of history) {
      const q = (item.query || "").trim();
      if (q && !seen.has(q.toLowerCase())) {
        seen.add(q.toLowerCase());
        uniqueQueries.push({ query: q, createdAt: item.createdAt });
      }
      if (uniqueQueries.length >= 10) break;
    }

    return res.status(200).json({ success: true, history: uniqueQueries });
  } catch (err) {
    console.error("Recent search retrieval failed:", err);
    return res.status(500).json({ success: false, message: "Could not fetch recent searches." });
  }
};

/**
 * Pre-flight URL check (checking headers and preventing SSRF)
 */
const checkEmbed = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: "URL parameter is required." });
    }

    if (!isValidUrl(url)) {
      return res.status(200).json({ success: true, url, embeddable: false, reason: "Invalid URL protocol." });
    }

    // SSRF lookup resolution check
    const isSafe = await checkSSRF(url);
    if (!isSafe) {
      return res.status(200).json({ success: true, url, embeddable: false, reason: "SSRF security block: Localhost or private networks are prohibited." });
    }

    // Retrieve headers
    try {
      const response = await axios.head(url, {
        timeout: 1500,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        validateStatus: () => true
      });

      const xFrameOptions = (response.headers["x-frame-options"] || "").toLowerCase();
      const csp = (response.headers["content-security-policy"] || "").toLowerCase();

      if (xFrameOptions.includes("deny") || xFrameOptions.includes("sameorigin")) {
        return res.status(200).json({ success: true, url, embeddable: false });
      }

      if (csp.includes("frame-ancestors")) {
        return res.status(200).json({ success: true, url, embeddable: false });
      }

      return res.status(200).json({ success: true, url, embeddable: true });
    } catch (headErr) {
      // Fallback request via GET (some servers block HEAD)
      try {
        const response = await axios.get(url, {
          timeout: 1500,
          maxContentLength: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          validateStatus: () => true
        });

        const xFrameOptions = (response.headers["x-frame-options"] || "").toLowerCase();
        const csp = (response.headers["content-security-policy"] || "").toLowerCase();

        if (xFrameOptions.includes("deny") || xFrameOptions.includes("sameorigin")) {
          return res.status(200).json({ success: true, url, embeddable: false });
        }

        if (csp.includes("frame-ancestors")) {
          return res.status(200).json({ success: true, url, embeddable: false });
        }

        return res.status(200).json({ success: true, url, embeddable: true });
      } catch (getErr) {
        return res.status(200).json({ success: true, url, embeddable: true, warning: "Could not fetch headers" });
      }
    }
  } catch (err) {
    console.error("Embed check error:", err);
    return res.status(500).json({ success: false, message: "Could not execute embed check." });
  }
};

module.exports = {
  searchWeb,
  trackClick,
  recordVisit,
  updateVisit,
  getHistory,
  getHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  getRecentSearches,
  checkEmbed
};
