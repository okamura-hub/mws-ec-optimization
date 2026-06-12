interface PriorityFilterProps {
  selectedPriority: string | null;
  onPriorityChange: (priority: string | null) => void;
}

export default function PriorityFilter({ selectedPriority, onPriorityChange }: PriorityFilterProps) {
  const priorities = [
    { value: null, label: 'すべて', color: 'bg-gray-100 text-gray-800' },
    { value: 'P0', label: 'P0 (最優先)', color: 'bg-red-100 text-red-800' },
    { value: 'P1', label: 'P1 (優先)', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'P2', label: 'P2 (計画的)', color: 'bg-green-100 text-green-800' }
  ];
  
  return (
    <div className="flex gap-2 mb-4">
      {priorities.map(priority => (
        <button
          key={priority.value || 'all'}
          onClick={() => onPriorityChange(priority.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedPriority === priority.value
              ? `${priority.color} ring-2 ring-offset-2 ring-gray-400`
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {priority.label}
        </button>
      ))}
    </div>
  );
}
