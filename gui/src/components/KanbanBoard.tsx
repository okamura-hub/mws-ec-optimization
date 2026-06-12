import type { GitHubIssue } from '../types/issue';
import IssueCard from './IssueCard';

interface KanbanColumnProps {
  title: string;
  issues: GitHubIssue[];
  color: string;
}

function KanbanColumn({ title, issues, color }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[300px] bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
          {issues.length}
        </span>
      </div>
      <div className="space-y-3">
        {issues.map(issue => (
          <IssueCard key={issue.number} issue={issue} />
        ))}
        {issues.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Issueなし
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  issues: GitHubIssue[];
}

export default function KanbanBoard({ issues }: KanbanBoardProps) {
  const todoIssues = issues.filter(issue => 
    !issue.labels.some(label => label.name === 'in-progress')
  );
  
  const inProgressIssues = issues.filter(issue => 
    issue.labels.some(label => label.name === 'in-progress')
  );
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <KanbanColumn
        title="Todo"
        issues={todoIssues}
        color="bg-blue-100 text-blue-800"
      />
      <KanbanColumn
        title="In Progress"
        issues={inProgressIssues}
        color="bg-yellow-100 text-yellow-800"
      />
      <KanbanColumn
        title="Done"
        issues={[]}
        color="bg-green-100 text-green-800"
      />
    </div>
  );
}
