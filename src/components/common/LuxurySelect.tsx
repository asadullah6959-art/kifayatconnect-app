import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface LuxurySelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface LuxurySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<LuxurySelectOption | string>;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export const LuxurySelect: React.FC<LuxurySelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  searchable,
  searchPlaceholder,
  compact = false,
  disabled = false,
  className = '',
  buttonClassName = '',
  ariaLabel
}) => {
  const { language } = useApp();
  const isUr = language === 'ur';
  const resolvedPlaceholder = placeholder ?? (isUr ? 'آپشن منتخب کریں...' : 'Select an option...');
  const resolvedSearchPlaceholder = searchPlaceholder ?? (isUr ? 'تلاش کریں...' : 'Search options...');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo<LuxurySelectOption[]>(() => {
    return options.map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

  const selectedOption = useMemo(
    () => normalizedOptions.find(opt => opt.value === value),
    [normalizedOptions, value]
  );

  const shouldShowSearch = searchable !== undefined ? searchable : normalizedOptions.length > 6;

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      opt =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleSelect = (val: string) => {
    onChange(val);
    handleClose();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || label || resolvedPlaceholder}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}
        className={`w-full min-h-[44px] flex items-center justify-between gap-2 text-left rounded-xl border transition-colors ${
          compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'
        } ${
          disabled
            ? 'bg-[#090D16]/60 border-slate-800 text-slate-500 cursor-not-allowed'
            : 'kc-luxury-input hover:border-[#F5D061]/70 cursor-pointer'
        } ${buttonClassName}`}
      >
        <span className={`truncate font-semibold ${selectedOption ? 'text-slate-100' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : resolvedPlaceholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#D4AF37] shrink-0" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-[calc(100vw-24px)] sm:max-w-sm max-h-[65dvh] flex flex-col kc-luxury-modal rounded-2xl overflow-hidden text-slate-100 box-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Compact Header with top-right Close (X) */}
            <div className="px-4 py-3 border-b border-[#D4AF37]/25 bg-[#090D16] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-[#F5D061] truncate">
                  {label || resolvedPlaceholder}
                </p>
                <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {isUr
                    ? `${normalizedOptions.length} دستیاب آپشنز`
                    : `${normalizedOptions.length} option${normalizedOptions.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label={isUr ? 'بند کریں' : 'Close selector'}
                className="min-w-[44px] min-h-[44px] rounded-lg bg-[#141B2D] border border-[#D4AF37]/35 text-slate-300 hover:text-white hover:border-[#F5D061] flex items-center justify-center shrink-0 kc-pressable cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Search Bar */}
            {shouldShowSearch && (
              <div className="px-3 py-2 border-b border-[#D4AF37]/20 bg-[#0E1422] shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={resolvedSearchPlaceholder}
                    className="w-full min-h-[44px] pl-8 pr-9 py-2 kc-luxury-input rounded-lg text-xs"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#D4AF37]/10 p-1.5" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {isUr ? 'کوئی متعلقہ آپشن نہیں ملا۔' : 'No matching options found.'}
                </div>
              ) : (
                filteredOptions.map(opt => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={`${opt.value}-${opt.label}`}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 text-left kc-pressable cursor-pointer ${
                        active
                          ? 'bg-[#1E293B] border border-[#38BDF8]/55 text-[#38BDF8]'
                          : 'hover:bg-[#1E293B]/65 text-[#F8FAFC] border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.sublabel}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-[#090D16] border border-[#D4AF37]/30 text-[10px] font-bold text-[#F5D061] tabular-nums">
                            {opt.badge}
                          </span>
                        )}
                        {active && <Check className="w-4 h-4 text-[#F5D061]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
