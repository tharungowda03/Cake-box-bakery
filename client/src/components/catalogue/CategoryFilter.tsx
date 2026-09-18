import React from 'react';
import type { Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
          selectedCategoryId === null
            ? 'bg-amber-800 text-white shadow-xs'
            : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
        }`}
      >
        All Items
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategoryId === cat.id
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
