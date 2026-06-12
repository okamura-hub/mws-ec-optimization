interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const categories = [
    { value: null, label: 'すべて', icon: '📋' },
    { value: 'ec-operations', label: 'EC運営', icon: '🛒' },
    { value: 'data-analytics', label: 'データ分析', icon: '📊' },
    { value: 'content-optimization', label: 'コンテンツ最適化', icon: '✨' },
    { value: 'org-development', label: '組織開発', icon: '👥' }
  ];
  
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {categories.map(category => (
        <button
          key={category.value || 'all'}
          onClick={() => onCategoryChange(category.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            selectedCategory === category.value
              ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-400'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}
