import { useState, useEffect, useRef } from 'react';

interface Option {
  code: number | string;
  name: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  onChange: (value: Option) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder = 'Chọn...', className = '', disabled = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.code == value || o.name === value);

  useEffect(() => {
    setFilteredOptions(
      options.filter(option => 
        option.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className={`w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white flex justify-between items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded p-2 text-sm focus:ring-0 text-gray-900 dark:text-white"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.code}
                  className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${option.code === value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-500 text-center text-sm">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
