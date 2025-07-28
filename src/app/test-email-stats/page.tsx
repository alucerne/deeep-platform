import EmailActivityStats from '@/components/analytics/EmailActivityStats';

export default function TestEmailStatsPage() {
  const testStats = {
    total: 1287,
    last_24h: 453,
    last_3d: 623,
    last_7d: 802,
    last_14d: 1045,
    last_30d: 1190,
    over_30d: 97
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Email Activity Stats Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the EmailActivityStats component with sample data
          </p>
        </div>
        
        <EmailActivityStats stats={testStats} />
        
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Data Used:
          </h3>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(testStats, null, 2)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
} 