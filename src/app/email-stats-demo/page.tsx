'use client';

import { useState } from 'react';
import { useEmailStats } from '@/hooks/useEmailStats';
import EmailActivityStats from '@/components/analytics/EmailActivityStats';
import Spinner from '@/components/ui/spinner';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

export default function EmailStatsDemoPage() {
  const [requestId, setRequestId] = useState('req_1753668661539_rsw24qic6');
  const { stats, loading, error, refetch } = useEmailStats(requestId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Email Activity Stats Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fetch and display real email activity statistics from the database
          </p>
        </div>

        {/* Request ID Input */}
        <div className="mb-8 max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="requestId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Request ID
              </label>
              <input
                type="text"
                id="requestId"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="Enter request_id..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading email activity statistics...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Error Loading Stats
                </h3>
              </div>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error}
              </p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {stats && !loading && !error && (
          <div>
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  Stats loaded successfully for request: {stats.request_id}
                </span>
              </div>
            </div>
            
            <EmailActivityStats stats={stats} />
            
            {/* Raw Data Display */}
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Raw Data
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    {JSON.stringify(stats, null, 2)}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              How to Test
            </h3>
            <ul className="text-blue-700 dark:text-blue-300 space-y-2 text-sm">
              <li>• <strong>Valid Request ID:</strong> Use "req_1753668661539_rsw24qic6" to see real data</li>
              <li>• <strong>Invalid Request ID:</strong> Try "invalid_id" to see error handling</li>
              <li>• <strong>Empty Request ID:</strong> Leave blank to see validation</li>
              <li>• <strong>Network Issues:</strong> Disconnect internet to test error states</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 