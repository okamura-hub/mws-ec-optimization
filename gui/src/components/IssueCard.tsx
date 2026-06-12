import type { GitHubIssue } from '../types/issue';
import { getPriorityFromLabels, getCategoryFromLabels } from '../services/github';

interface IssueCardProps {
  issue: GitHubIssue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const priority = getPriorityFromLabels(issue.labels);
  const category = getCategoryFromLabels(issue.labels);
  
  const priorityColors = {
    P0: 'bg-red-100 text-red-800 border-red-300',
    P1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    P2: 'bg-green-100 text-green-800 border-green-300'
  };
  
  const categoryLabels = {
    'ec-operations': 'EC運営',
    'data-analytics': 'データ分析',
    'content-optimization': 'コンテンツ最適化',
    'org-development': '組織開発'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <a
          href={issue.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
        >
          #{issue.number}
        </a>
        {priority && (
          <span className={`px-2 py-1 rounded text-xs font-bold border ${priorityColors[priority]}`}>
            {priority}
          </span>
        )}
      </div>
      
      <h3 className="text-gray-900 font-medium text-sm mb-2 line-clamp-2">
        {issue.title}
      </h3>
      
      {category && (
        <div className="mb-2">
          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
            {categoryLabels[category as keyof typeof categoryLabels] || category}
          </span>
        </div>
      )}
      
      {issue.assignee && (
        <div className="flex items-center text-xs text-gray-600">
          <img
            src={issue.assignee.avatar_url}
            alt={issue.assignee.login}
            className="w-5 h-5 rounded-full mr-1"
          />
          <span>{issue.assignee.login}</span>
        </div>
      )}
      
      <div className="mt-2 flex flex-wrap gap-1">
        {issue.labels
          .filter(label => !['P0', 'P1', 'P2', 'ec-operations', 'data-analytics', 'content-optimization', 'org-development'].includes(label.name))
          .slice(0, 3)
          .map(label => (
            <span
              key={label.id}
              className="inline-block bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}` }}
            >
              {label.name}
            </span>
          ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        更新: {new Date(issue.updated_at).toLocaleDateString('ja-JP')}
      </div>
    </div>
  );
}
