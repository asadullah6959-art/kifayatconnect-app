import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, MapPin, Check, X } from 'lucide-react';
import { searchPakistanCities, ALL_PAKISTAN_CITY_ENTRIES, PROVINCE_OPTIONS } from '../../data/locationData';

export interface SelectedLocationValue {
  stateProvince: string;
  district: string;
  cityTown: string;
  tehsil?: string;
}

interface SearchableLocationSelectProps {
  value: SelectedLocationValue;
  onChange: (val: SelectedLocationValue) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const SearchableLocationSelect: React.FC<SearchableLocationSelectProps> = ({
  value,
  onChange,
  label = 'District / City across Pakistan',
  required = false,
  placeholder = 'Search any city, tehsil, or district...',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customProvince, setCustomProvince] = useState(value.stateProvince || 'Punjab');
  const [customCityText, setCustomCityText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const matches = useMemo(() => {
    if (!query.trim()) {
      return ALL_PAKISTAN_CITY_ENTRIES.slice(0, 60);
    }
    return searchPakistanCities(query).slice(0, 80);
  }, [query]);

  const displayLabel = value.cityTown
    ? `${value.cityTown}${value.district && value.district !== value.cityTown ? ` (Dist. ${value.district})` : ''} — ${value.stateProvince}`
    : '';

  const handleApplyCustom = () => {
    const clean = customCityText.trim();
    if (!clean) return;
    onChange({
      stateProvince: customProvince,
      district: clean,
      cityTown: clean,
      tehsil: clean
    });
    setCustomMode(false);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-left bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 ${
          compact ? 'py-2 text-xs' : 'py-2.5 text-xs'
        } text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className={`truncate ${displayLabel ? 'font-medium' : 'text-slate-400'}`}>
            {displayLabel || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-w-full">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCustomMode(false);
              }}
              placeholder="Type city, town, tehsil, or district..."
              className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!customMode ? (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {matches.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                  <p>No matching Pakistan city/district found for "{query}".</p>
                </div>
              ) : (
                matches.map((entry, idx) => {
                  const isSelected =
                    value.cityTown?.toLowerCase() === entry.city.toLowerCase() &&
                    value.district?.toLowerCase() === entry.district.toLowerCase();
                  return (
                    <button
                      key={`${entry.province}-${entry.district}-${entry.city}-${idx}`}
                      type="button"
                      onClick={() => {
                        onChange({
                          stateProvince: entry.province,
                          district: entry.district,
                          cityTown: entry.city,
                          tehsil: entry.tehsil || entry.city
                        });
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors ${
                        isSelected ? 'bg-amber-50/80 dark:bg-amber-950/30 font-bold' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-slate-900 dark:text-white font-semibold block truncate">
                          {entry.city}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          Dist. {entry.district} · {entry.province}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </button>
                  );
                })
              )}

              {/* Other / Custom City Option */}
              <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCustomMode(true);
                    setCustomCityText(query);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#0a192f] hover:bg-slate-800 text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Other / Custom City or Town</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2.5 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Enter Custom City / Town
                </span>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="text-[10px] text-amber-600 hover:underline font-semibold"
                >
                  Back to list
                </button>
              </div>
              <select
                value={customProvince}
                onChange={(e) => setCustomProvince(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {PROVINCE_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                value={customCityText}
                onChange={(e) => setCustomCityText(e.target.value)}
                placeholder="Type your exact city, tehsil, or village..."
                className="w-full text-xs px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleApplyCustom}
                disabled={!customCityText.trim()}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
              >
                Use Custom City
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
