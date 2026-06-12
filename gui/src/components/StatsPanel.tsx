import type { GitHubIssue } from '../types/issue';
import { getPriorityFromLabels, getCategoryFromLabels } from '../services/github';

interface StatsPanelProps {
  issues: GitHubIssue[];
}

export default function StatsPanel({ issues }: StatsPanelProps) {
  const priorityCounts = {
    P0: issues.filter(issue => getPriorityFromLabels(issue.labels) === 'P0').length,
    P1: issues.filter(issue => getPriorityFromLabels(issue.labels) === 'P1').length,
    P2: issues.filter(issue => getPriorityFromLabels(issue.labels) === 'P2').length
  };
  
  const categoryCounts = {
    'ec-operations': issues.filter(issue => getCategoryFromLabels(issue.labels) === 'ec-operations').length,
    'data-analytics': issues.filter(issue => getCategoryFromLabels(issue.labels) === 'data-analytics').length,
    'content-optimization': issues.filter(issue => getCategoryFromLabels(issue.labels) === 'content-optimization').length,
    'org-development': issues.filter(issue => getCategoryFromLabels(issue.labels) === 'org-development').length
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">統計</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">優先度別</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-sm text-gray-700">P0 (最優先)</span>
              </span>
              <span className="text-lg font-bold text-red-600">{priorityCounts.P0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-sm text-gray-700">P1 (優先)</span>
              </span>
              <span className="text-lg font-bold text-yellow-600">{priorityCounts.P1}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm text-gray-700">P2 (計画的)</span>
              </span>
              <span className="text-lg font-bold text-green-600">{priorityCounts.P2}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">カテゴリ別</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">🛒 EC運営</span>
              <span className="text-lg font-bold text-blue-600">{categoryCounts['ec-operations']}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">📊 データ分析</span>
              <span className="text-lg font-bold text-blue-600">{categoryCounts['data-analytics']}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">✨ コンテンツ最適化</span>
              <span className="text-lg font-bold text-blue-600">{categoryCounts['content-optimization']}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">👥 組織開発</span>
              <span className="text-lg font-bold text-blue-600">{categoryCounts['org-development']}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">合計Issue数</span>
          <span className="text-2xl font-bold text-gray-800">{issues.length}</span>
        </div>
      </div>
    </div>
  );
}
