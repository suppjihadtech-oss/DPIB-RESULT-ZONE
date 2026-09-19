import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Search, ChevronDown } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SelectBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
  emptyText?: string;
}

export const SelectBottomSheet: React.FC<SelectBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  searchable,
  emptyText = 'কোনো বিকল্প পাওয়া যায়নি',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isSearchable = searchable ?? options.length > 5;

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
        (opt.badge && opt.badge.toLowerCase().includes(term)) ||
        opt.value.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        setSearchTerm('');
        onClose();
      }}
      title={title}
      subtitle={subtitle}
      maxHeight="max-h-[85vh]"
    >
      <div className="space-y-3 pb-4">
        {/* Search input if searchable */}
        {isSearchable && (
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Options List */}
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {filteredOptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === selectedValue;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelect(opt.value);
                    setSearchTerm('');
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group active:scale-[0.99] ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300/80 text-blue-900 shadow-2xs font-bold'
                      : 'bg-white/80 hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {Icon && (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-100/90 text-slate-500 border-slate-200 group-hover:text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm truncate ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 font-outfit uppercase border ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate font-normal">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'border border-slate-300 group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export interface SelectTriggerProps {
  label?: string;
  required?: boolean;
  value: string;
  displayValue?: string;
  placeholder?: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  label,
  required,
  value,
  displayValue,
  placeholder = 'নির্বাচন করুন',
  onClick,
  icon: Icon,
  className = '',
  disabled = false,
  id,
}) => {
  const textToShow = displayValue || value || placeholder;
  const isPlaceholder = !displayValue && !value;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
          isPlaceholder ? 'text-slate-400' : 'text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className="truncate">{textToShow}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:translate-y-0.5" />
      </button>
    </div>
  );
};
