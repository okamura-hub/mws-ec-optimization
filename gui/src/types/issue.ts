export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Label[];
  assignee: Assignee | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Assignee {
  login: string;
  avatar_url: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  issues: GitHubIssue[];
}

export type Priority = 'P0' | 'P1' | 'P2';

export interface IssueMetadata {
  priority: Priority;
  category: string;
  assignee: string;
  estimatedHours: number;
}
