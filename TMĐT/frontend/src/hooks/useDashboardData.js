import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../utils/api";

export const useDashboardData = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu tổng quan");
      console.error("Failed to fetch dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    await fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refreshSummary,
  };
};
