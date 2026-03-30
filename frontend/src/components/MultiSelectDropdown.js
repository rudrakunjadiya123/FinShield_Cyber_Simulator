import React, { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllSelected = selectedValues.length === options.length && options.length > 0;

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.value));
    }
  };

  const handleSelectOption = (value, e) => {
    e.stopPropagation();
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  let displayText = placeholder;
  if (selectedValues.length > 0) {
    if (isAllSelected) {
      displayText = 'All ' + placeholder.replace('Select ', '');
    } else if (selectedValues.length === 1) {
      const selectedOpt = options.find(o => o.value === selectedValues[0]);
      displayText = selectedOpt ? selectedOpt.label : selectedValues[0];
    } else {
      displayText = `${selectedValues.length} Selected`;
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-cyan-400 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedValues.length === 0 ? "text-slate-400" : "text-slate-800"}>
          {displayText}
        </span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder={searchPlaceholder || "Search..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <div 
              className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer rounded text-sm"
              onClick={handleSelectAll}
            >
              <input
                type="checkbox"
                className="mr-2 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                checked={isAllSelected}
                readOnly
              />
              <span className="font-medium text-slate-700">All {placeholder.replace('Select ', '')}</span>
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value} 
                  className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer rounded text-sm"
                  onClick={(e) => handleSelectOption(opt.value, e)}
                >
                  <input
                    type="checkbox"
                    className="mr-2 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    checked={selectedValues.includes(opt.value)}
                    readOnly
                  />
                  <span className="text-slate-700">{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
