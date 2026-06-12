import type { GitHubIssue } from '../types/issue';

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'okamura-hub';
const REPO_NAME = 'mws-ec-optimization';

export async function fetchIssues(): Promise<GitHubIssue[]> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=100`
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const issues = await response.json();
    return issues.filter((issue: any) => !issue.pull_request);
  } catch (error) {
    console.error('Failed to fetch issues:', error);
    return [];
  }
}

export function getPriorityFromLabels(labels: any[]): 'P0' | 'P1' | 'P2' | null {
  const priorityLabel = labels.find(label => 
    label.name.startsWith('P0') || label.name.startsWith('P1') || label.name.startsWith('P2')
  );
  
  if (!priorityLabel) return null;
  
  if (priorityLabel.name.startsWith('P0')) return 'P0';
  if (priorityLabel.name.startsWith('P1')) return 'P1';
  if (priorityLabel.name.startsWith('P2')) return 'P2';
  
  return null;
}

export function getCategoryFromLabels(labels: any[]): string | null {
  const categoryLabels = [
    'ec-operations',
    'data-analytics',
    'content-optimization',
    'org-development'
  ];
  
  const categoryLabel = labels.find(label => 
    categoryLabels.includes(label.name)
  );
  
  return categoryLabel?.name || null;
}
