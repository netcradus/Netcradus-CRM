import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';

let cachedSnapshot = null;
let lastFetch = 0;
const SNAPSHOT_TTL = 30 * 1000;
let fetchPromise = null;

export const useAttendanceSnapshot = (pollInterval = 60000) => {
  const [snapshot, setSnapshot] = useState(cachedSnapshot);
  const [loading, setLoading] = useState(!cachedSnapshot);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const fetchSnapshot = async () => {
      const now = Date.now();
      if (cachedSnapshot && now - lastFetch < SNAPSHOT_TTL) {
        if (isMounted) {
          setSnapshot(cachedSnapshot);
          setLoading(false);
        }
        return;
      }

      if (!fetchPromise) {
        fetchPromise = axios.get(apiUrl("/api/attendance/admin/today-snapshot"), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(res => {
          cachedSnapshot = res.data.data;
          lastFetch = Date.now();
          fetchPromise = null;
          return cachedSnapshot;
        }).catch(err => {
          fetchPromise = null;
          throw err;
        });
      }

      try {
        const data = await fetchPromise;
        if (isMounted) {
          setSnapshot(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSnapshot();
    if (pollInterval) {
      timer = setInterval(fetchSnapshot, pollInterval);
    }

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [pollInterval]);

  return { snapshot, loading, error };
};
