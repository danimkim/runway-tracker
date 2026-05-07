'use client';

import { useState } from 'react';
import { addCategory, updateCategoryName, deleteCategory } from './actions';

type Category = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

interface CategoriesListProps {
  categories: Category[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <form action={addCategory} className="flex gap-2">
        <input
          name="name"
          placeholder="New category name"
          className="field-input flex-1"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-(--color-accent) shrink-0"
        >
          Add
        </button>
      </form>

      {categories.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(59,66,78,0.06)]">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < categories.length - 1 ? 'border-b border-(--color-surface)' : ''
              }`}
            >
              <div
                className="w-[10px] h-[10px] shrink-0 rounded-[4px]"
                style={{ background: cat.color }}
              />

              {editId === cat.id ? (
                <form
                  action={updateCategoryName}
                  className="flex flex-1 items-center gap-2"
                  onSubmit={() => setEditId(null)}
                >
                  <input type="hidden" name="id" value={cat.id} />
                  <input
                    name="name"
                    defaultValue={editVal}
                    className="field-input flex-1"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-(--color-accent) shrink-0"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-(--color-accent)">
                    {cat.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(cat.id);
                      setEditVal(cat.name);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-(--color-label) bg-(--color-surface) shrink-0"
                  >
                    Edit
                  </button>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-50 shrink-0"
                    >
                      Delete
                    </button>
                  </form>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
