import React, { useState, useRef, useEffect } from 'react';
import { Department } from '../../types/auth';
import { Building, Plus, Check, Sparkles, ChevronDown, X } from 'lucide-react';

interface DepartmentCreatableSelectProps {
  departments: Department[];
  selectedDepartmentId: number | '';
  customDepartmentName: string;
  onChange: (deptId: number | '', deptName: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export const DepartmentCreatableSelect: React.FC<DepartmentCreatableSelectProps> = ({
  departments,
  selectedDepartmentId,
  customDepartmentName,
  onChange,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display text with parent value
  useEffect(() => {
    if (selectedDepartmentId) {
      const match = departments.find((d) => d.id === Number(selectedDepartmentId));
      if (match) {
        setSearchQuery(match.name);
        setIsEditingText(false);
      }
    } else if (customDepartmentName) {
      setSearchQuery(customDepartmentName);
      setIsEditingText(false);
    } else {
      setSearchQuery('');
      setIsEditingText(false);
    }
  }, [selectedDepartmentId, customDepartmentName, departments]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditingText(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedDepartments = [...departments].sort((a, b) => a.name.localeCompare(b.name));
  const selectedDeptObj = sortedDepartments.find((d) => d.id === Number(selectedDepartmentId));
  const isQueryMatchingSelected = selectedDeptObj && searchQuery.trim().toLowerCase() === selectedDeptObj.name.toLowerCase();

  // If user is not actively typing a new search filter, show ALL departments
  const showAll = !isEditingText || !searchQuery.trim() || isQueryMatchingSelected;

  const filteredDepts = showAll
    ? sortedDepartments
    : sortedDepartments.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.code.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const exactMatch = sortedDepartments.find(
    (d) => d.name.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const isCustomMode = Boolean(searchQuery.trim() && !exactMatch && !selectedDepartmentId);

  const handleSelectExisting = (dept: Department) => {
    setSearchQuery(dept.name);
    setIsEditingText(false);
    onChange(dept.id, dept.name);
    setIsOpen(false);
  };

  const handleCreateCustom = (customName: string) => {
    const clean = customName.trim();
    if (!clean) return;
    setSearchQuery(clean);
    setIsEditingText(false);
    onChange('', clean);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setIsEditingText(true);
    setIsOpen(true);

    const match = departments.find(
      (d) => d.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      onChange(match.id, match.name);
    } else if (val.trim()) {
      onChange('', val.trim());
    } else {
      onChange('', '');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    setIsEditingText(true);
    onChange('', '');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Click to browse all or type any custom department..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-16 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        />
        
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:text-slate-200 rounded transition"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mode / Status Tag */}
      {isCustomMode && searchQuery.trim() && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Will automatically create and register <strong>"{searchQuery.trim()}"</strong> department</span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl divide-y divide-slate-800 animate-fadeIn">
          {/* Custom Create Option if user typed something not matching any existing department */}
          {searchQuery.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => handleCreateCustom(searchQuery)}
              className="w-full px-3.5 py-2.5 text-left text-xs bg-indigo-950/40 hover:bg-indigo-900/60 flex items-center justify-between text-indigo-300 transition group border-b border-indigo-500/20"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>
                  Create new department: <strong className="text-white underline">"{searchQuery.trim()}"</strong>
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                + New
              </span>
            </button>
          )}

          {/* Department Header */}
          <div className="px-3.5 py-1.5 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Available Departments ({departments.length})</span>
            {showAll && selectedDeptObj && <span className="text-indigo-400 lowercase font-normal">showing all</span>}
          </div>

          {/* Existing Departments List */}
          {filteredDepts.length > 0 ? (
            filteredDepts.map((d) => {
              const isSelected = Number(selectedDepartmentId) === d.id || (!selectedDepartmentId && customDepartmentName.toLowerCase() === d.name.toLowerCase());
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectExisting(d)}
                  className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-200 font-semibold'
                      : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-100">{d.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                      {d.code}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-[11px] text-slate-400 text-center">
                {searchQuery.trim()
                  ? `No matching registered departments found.`
                  : `No departments registered yet in the database.`}
              </p>
              
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Suggested Standard Departments:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    'Sales',
                    'Marketing',
                    'Customer Success',
                    'Engineering',
                    'Finance',
                    'Operations',
                    'Human Resources',
                    'Executive',
                  ]
                    .filter((s) => !searchQuery.trim() || s.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleCreateCustom(s)}
                        className="px-2.5 py-1.5 text-left text-xs rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 flex items-center justify-between transition group"
                      >
                        <span className="truncate">{s}</span>
                        <Plus className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
