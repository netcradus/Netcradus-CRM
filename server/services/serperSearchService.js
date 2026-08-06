const axios = require("axios");

/**
 * Service to execute google searches via Serper.dev
 */
const performSearch = async ({ query, page = 1, country = "us", language = "en" }) => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY_MISSING");
  }

  const startTime = Date.now();

  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      {
        q: query,
        page: Number(page) || 1,
        gl: country || "us",
        hl: language || "en"
      },
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json"
        },
        timeout: 5000 // 5 seconds request timeout
      }
    );

    const searchTimeMs = Date.now() - startTime;
    const data = response.data || {};

    // Normalize Organic Results
    const organicResults = (data.organic || []).map((item) => {
      const url = item.link || "";
      let domain = "";
      if (url) {
        try {
          const parsed = new URL(url);
          domain = parsed.hostname;
        } catch (e) {
          domain = url;
        }
      }
      return {
        title: item.title || "",
        url: url,
        displayUrl: domain,
        snippet: item.snippet || "",
        position: Number(item.position) || 0,
        favicon: domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : ""
      };
    });

    // Normalize Answer Box
    let answerBox = null;
    if (data.answerBox) {
      answerBox = {
        title: data.answerBox.title || "",
        answer: data.answerBox.answer || data.answerBox.snippet || ""
      };
    }

    // Normalize Knowledge Graph
    let knowledgeGraph = null;
    if (data.knowledgeGraph) {
      knowledgeGraph = {
        title: data.knowledgeGraph.title || "",
        type: data.knowledgeGraph.type || "",
        description: data.knowledgeGraph.description || "",
        imageUrl: data.knowledgeGraph.imageUrl || null
      };
    }

    // Normalize People Also Ask
    const peopleAlsoAsk = (data.peopleAlsoAsk || []).map((item) => ({
      question: item.question || "",
      snippet: item.snippet || "",
      url: item.link || ""
    }));

    // Normalize Related Searches
    const relatedSearches = (data.relatedSearches || []).map((item) => item.query || "").filter(Boolean);

    // Retrieve estimate of total results if provided by Serper
    const totalResults = data.searchParameters?.totalResults || null;

    return {
      success: true,
      query,
      page: Number(page) || 1,
      results: organicResults,
      knowledgeGraph,
      answerBox,
      relatedSearches,
      peopleAlsoAsk,
      totalResults,
      searchTimeMs
    };
  } catch (error) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new Error("SERPER_API_TIMEOUT");
    }
    if (error.response) {
      if (error.response.status === 403 || error.response.status === 401) {
        throw new Error("SERPER_API_KEY_INVALID");
      }
      if (error.response.status === 429) {
        throw new Error("SERPER_QUOTA_EXCEEDED");
      }
    }
    throw error;
  }
};

module.exports = {
  performSearch
};
