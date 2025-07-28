import React from 'react';
import { Activity, Clock, Calendar, TrendingUp } from 'lucide-react';

interface EmailActivityStatsProps {
  stats: {
    total: number;
    last_24h: number;
    last_3d: number;
    last_7d: number;
    last_14d: number;
    last_30d: number;
    over_30d: number;
  };
}

const EmailActivityStats: React.FC<EmailActivityStatsProps> = ({ stats }) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getPercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const timeBuckets = [
    { key: 'last_24h', label: 'Last 24 Hours', icon: Clock, color: 'bg-blue-500' },
    { key: 'last_3d', label: 'Last 3 Days', icon: Calendar, color: 'bg-green-500' },
    { key: 'last_7d', label: 'Last 7 Days', icon: TrendingUp, color: 'bg-purple-500' },
    { key: 'last_14d', label: 'Last 14 Days', icon: Activity, color: 'bg-orange-500' },
    { key: 'last_30d', label: 'Last 30 Days', icon: TrendingUp, color: 'bg-indigo-500' },
    { key: 'over_30d', label: 'Over 30 Days', icon: Clock, color: 'bg-gray-500' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Email Activity Statistics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of email validation activity across different time periods
        </p>
      </div>

      {/* Total Stats Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Total Emails Processed</h3>
            <p className="text-3xl font-bold">{formatNumber(stats.total)}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatNumber(stats.last_30d)}</div>
            <div className="text-sm opacity-90">Active (30 days)</div>
          </div>
        </div>
      </div>

      {/* Time Buckets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timeBuckets.map(({ key, label, icon: Icon, color }) => {
          const value = stats[key as keyof typeof stats];
          const percentage = getPercentage(value, stats.total);
          
          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(value)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {label}
              </h4>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Recent Activity</p>
              <p className="text-2xl font-bold">{formatNumber(stats.last_7d)}</p>
              <p className="text-sm opacity-90">Last 7 days</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Today's Activity</p>
              <p className="text-2xl font-bold">{formatNumber(stats.last_24h)}</p>
              <p className="text-sm opacity-90">Last 24 hours</p>
            </div>
            <Activity className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Older Data</p>
              <p className="text-2xl font-bold">{formatNumber(stats.over_30d)}</p>
              <p className="text-sm opacity-90">Over 30 days</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailActivityStats; 