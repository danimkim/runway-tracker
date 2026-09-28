'use client';

import { useEffect, useId, useState } from 'react';
import { searchMerchantNames } from '@/features/transactions/actions/search-merchant-names';

interface MerchantAutocompleteProps {
  defaultValue?: string;
  placeholder?: string;
}

export function MerchantAutocomplete({ defaultValue = '', placeholder }: MerchantAutocompleteProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const showList = open && suggestions.length > 0;

  useEffect(() => {
    if (!open) return;

    let current = true;
    const timeout = window.setTimeout(async () => {
      try {
        const names = await searchMerchantNames(value);
        if (current) setSuggestions(names);
      } catch {
        if (current) setSuggestions([]);
      }
    }, value.trim() ? 200 : 0);

    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [open, value]);

  function select(name: string) {
    setValue(name);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label className="field-label" htmlFor="merchantName">Merchant</label>
      <input
        id="merchantName"
        name="merchantName"
        className="field-input"
        placeholder={placeholder}
        required
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setValue(event.target.value);
          setSuggestions([]);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (!showList || event.nativeEvent.isComposing) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            select(suggestions[activeIndex]);
          }
        }}
      />
      {showList && (
        <div id={listId} role="listbox" aria-label="Merchant suggestions" className="absolute z-20 mt-1 w-full overflow-hidden rounded-btn border border-border-input bg-white shadow-card">
          {suggestions.map((name, index) => (
            <button
              key={name}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`block w-full px-3.5 py-3 text-left text-sm text-primary ${index === activeIndex ? 'bg-surface' : 'hover:bg-surface'}`}
              onClick={() => select(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
