import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, MapPin, Check, X } from 'lucide-react';
import { searchPakistanCities, ALL_PAKISTAN_CITY_ENTRIES, PROVINCE_OPTIONS } from '../../data/locationData';
import { LuxurySelect } from './LuxurySelect';

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

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const matches = useMemo(() => {
    if (!query.trim()) {
      return ALL_PAKISTAN_CITY_ENTRIES.slice(0, 75);
    }
    return searchPakistanCities(query).slice(0, 100);
  }, [query]);

  const displayLabel = value.cityTown
    ? `${value.cityTown}${value.district && value.district !== value.cityTown ? ` (Dist. ${value.district})` : ''} — ${value.stateProvince}`
    : '';

  const handleClose = () => {
    setIsOpen(false);
    setCustomMode(false);
    setQuery('');
  };

  const handleApplyCustom = () => {
    const clean = customCityText.trim();
    if (!clean) return;
    onChange({
      stateProvince: customProvince,
      district: clean,
      cityTown: clean,
      tehsil: clean
    });
    handleClose();
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-[11px] font-bold text-[#F5D061] mb-1 uppercase tracking-wider">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between gap-2 text-left bg-[#0A0D12] border border-[#D4AF37]/35 hover:border-[#D4AF37] rounded-xl px-3 ${
          compact ? 'py-1.5 text-xs' : 'py-2.5 text-xs'
        } text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-colors cursor-pointer`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className={`truncate ${displayLabel ? 'font-semibold text-white' : 'text-slate-400'}`}>
            {displayLabel || placeholder}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#D4AF37] shrink-0" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm max-h-[55vh] flex flex-col bg-[#111622] border border-[#D4AF37]/50 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Compact Header with top-right Close (X) */}
            <div className="px-4 py-3 border-b border-[#D4AF37]/25 bg-[#0A0D12] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-[#F5D061] truncate">
                  {label || 'Select Location'}
                </p>
                <p className="text-[10px] text-slate-400">172 Pakistan Districts · Towns & Villages</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close location selector"
                className="w-8 h-8 rounded-lg bg-[#161D2C] border border-[#D4AF37]/30 text-slate-300 hover:text-white hover:border-[#D4AF37] flex items-center justify-center shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-800 bg-[#0E131D] flex items-center gap-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCustomMode(false);
                }}
                placeholder="Type city, town, tehsil, or district..."
                className="w-full bg-[#0A0D12] border border-[#D4AF37]/25 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!customMode ? (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {matches.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching Pakistan city/district found for "{query}".
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
                            handleClose();
                          }}
                          className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between gap-2 text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D061] font-bold'
                              : 'hover:bg-[#161D2C] text-slate-200 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate">
                              {entry.city}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              Dist. {entry.district} · {entry.province}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-2 bg-[#0A0D12] border-t border-[#D4AF37]/25 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode(true);
                      setCustomCityText(query);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#161D2C] hover:bg-[#1E273B] border border-[#D4AF37]/35 text-[#F5D061] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Other / Village / Custom Town</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3.5 space-y-3 bg-[#111622] flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F5D061]">
                    Enter Custom City / Village
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    className="text-[11px] text-slate-300 hover:text-[#F5D061] underline font-semibold"
                  >
                    Back to list
                  </button>
                </div>
                <LuxurySelect
                  label="Province / Territory"
                  value={customProvince}
                  onChange={setCustomProvince}
                  options={PROVINCE_OPTIONS}
                  compact
                />
                <input
                  type="text"
                  value={customCityText}
                  onChange={(e) => setCustomCityText(e.target.value)}
                  placeholder="Type your exact city, tehsil, or village..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/35 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!customCityText.trim()}
                  className="w-full py-2 rounded-xl kc-gold-button disabled:opacity-50 font-black text-xs transition"
                >
                  Apply Custom Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
