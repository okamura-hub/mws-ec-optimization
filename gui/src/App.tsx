import { useState, useEffect } from 'react';
import type { GitHubIssue } from './types/issue';
import { fetchIssues, getPriorityFromLabels, getCategoryFromLabels } from './services/github';
import KanbanBoard from './components/KanbanBoard';
import PriorityFilter from './components/PriorityFilter';
import CategoryFilter from './components/CategoryFilter';
import StatsPanel from './components/StatsPanel';

function App() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    loadIssues();
  }, []);
  
  async function loadIssues() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch (err) {
      setError('Issueの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  const filteredIssues = issues.filter(issue => {
    const priority = getPriorityFromLabels(issue.labels);
    const category = getCategoryFromLabels(issue.labels);
    
    if (selectedPriority && priority !== selectedPriority) {
      return false;
    }
    
    if (selectedCategory && category !== selectedCategory) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                MWS EC Optimization
              </h1>
              <p className="text-gray-600">
                EC運営最適化プロジェクト カンバンボード
              </p>
            </div>
            <a
              href="https://github.com/okamura-hub/mws-ec-optimization"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
          
          <button
            onClick={loadIssues}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? '読み込み中...' : '更新'}
          </button>
        </header>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <StatsPanel issues={filteredIssues} />
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">フィルタ</h2>
          <PriorityFilter
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
          />
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Issueを読み込んでいます...</p>
          </div>
        ) : (
          <KanbanBoard issues={filteredIssues} />
        )}
        
        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>
            最終更新: {new Date().toLocaleString('ja-JP')}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
