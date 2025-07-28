import { useState, useEffect } from 'react';

interface EmailStats {
  request_id: string;
  total: number;
  last_24h: number;
  last_3d: number;
  last_7d: number;
  last_14d: number;
  last_30d: number;
  over_30d: number;
}

interface UseEmailStatsReturn {
  stats: EmailStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEmailStats(requestId: string): UseEmailStatsReturn {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!requestId) {
      setError('Request ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/get-activity-stats?request_id=${encodeURIComponent(requestId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email stats';
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [requestId]);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
} 