import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Tìm kiếm...',
  required = false,
  disabled = false,
  className = '',
  label = '',
  error = '',
  allowCustomInput = false, // Cho phép nhập thủ công nếu không tìm thấy
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchQuery) {
      const filtered = options.filter(opt =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.name === value || opt.code === value);

  const handleSelect = (option) => {
    onChange(option.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomInput = () => {
    if (searchQuery.trim() && allowCustomInput) {
      onChange(searchQuery.trim());
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-lg text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
          error
            ? 'border-red-300 bg-red-50'
            : disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500 text-center mb-2">
                  Không tìm thấy kết quả
                </div>
                {allowCustomInput && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleCustomInput}
                    className="w-full px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200 transition-colors"
                  >
                    Sử dụng "{searchQuery.trim()}"
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.map((option) => (
                  <button
                    key={option.code || option.name}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${
                      (selectedOption?.code === option.code || selectedOption?.name === option.name)
                        ? 'bg-brand-100 text-brand-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
                {allowCustomInput && searchQuery.trim() && !filteredOptions.find(opt => opt.name.toLowerCase() === searchQuery.toLowerCase()) && (
                  <div className="border-t border-gray-200 pt-2">
                    <button
                      type="button"
                      onClick={handleCustomInput}
                      className="w-full text-left px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      + Sử dụng "{searchQuery.trim()}"
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

