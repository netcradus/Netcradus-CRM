import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
  timeout: 30000,
});

export function useZohoAdmin() {
  const token = localStorage.getItem("token");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [users, setUsers] = useState([]);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setLoadingStatus(true);
    try {
      const { data } = await axios.get(apiUrl("/api/zoho/status"), authHeaders(token));
      setConnectionStatus(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to load Zoho connection status.",
      };
    } finally {
      setLoadingStatus(false);
    }
  }, [token]);

  const loadLinkedAccounts = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(apiUrl("/api/zoho/accounts"), authHeaders(token));
      setLinkedAccounts(Array.isArray(data.linkedAccounts) ? data.linkedAccounts : []);
      setUsers(Array.isArray(data.users) ? data.users : []);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to load Zoho linked accounts.",
      };
    }
  }, [token]);

  const initiateConnect = useCallback(async () => {
    const { data } = await axios.get(apiUrl("/api/zoho/connect"), authHeaders(token));
    if (data.authUrl) {
      window.location.href = data.authUrl;
    }
  }, [token]);

  const disconnect = useCallback(async () => {
    try {
      await axios.post(apiUrl("/api/zoho/disconnect"), {}, authHeaders(token));
      await Promise.all([loadStatus(), loadLinkedAccounts()]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to disconnect Zoho Mail.",
      };
    }
  }, [loadLinkedAccounts, loadStatus, token]);

  const linkAccount = useCallback(
    async (userId, zohoEmail) => {
      try {
        await axios.post(apiUrl("/api/zoho/accounts/link"), { userId, zohoEmail }, authHeaders(token));
        await loadLinkedAccounts();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to link this Zoho mailbox.",
        };
      }
    },
    [loadLinkedAccounts, token]
  );

  const unlinkAccount = useCallback(
    async (userId) => {
      try {
        await axios.delete(apiUrl(`/api/zoho/accounts/${userId}/unlink`), authHeaders(token));
        await loadLinkedAccounts();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to unlink this Zoho mailbox.",
        };
      }
    },
    [loadLinkedAccounts, token]
  );

  useEffect(() => {
    loadStatus();
    loadLinkedAccounts();
  }, [loadLinkedAccounts, loadStatus]);

  return {
    connectionStatus,
    disconnect,
    initiateConnect,
    linkAccount,
    linkedAccounts,
    loadingStatus,
    unlinkAccount,
    users,
  };
}
