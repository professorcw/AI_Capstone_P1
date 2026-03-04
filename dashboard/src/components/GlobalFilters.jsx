import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ChevronDown, Search, X } from 'lucide-react';

const SEVERITY_COLORS = {
  1: '#2ecc71',
  2: '#d4a017',
  3: '#e67e22',
  4: '#e74c3c'
};

function MultiSelect({ label, options, selected, onChange, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = searchable && search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const displayText = selected.length === 0
    ? `All ${label}`
    : selected.length <= 3
      ? selected.join(', ')
      : `${selected.length} selected`;

  const toggle = (val) => {
    const next = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val];
    onChange(next);
  };

  return (
    <div className="filter-group" ref={ref}>
      <label className="filter-label">{label}</label>
      <button
        className={`filter-select ${open ? 'open' : ''} ${selected.length > 0 ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Filter by ${label}`}
      >
        <span>{displayText}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="filter-dropdown">
          {searchable && (
            <div className="filter-search">
              <Search size={14} />
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          <div className="filter-options">
            {filtered.map(opt => (
              <label key={opt} className="filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="filter-empty">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityFilter({ selected, onChange }) {
  const toggle = (sev) => {
    const next = selected.includes(sev)
      ? selected.filter(s => s !== sev)
      : [...selected, sev].sort();
    if (next.length > 0) onChange(next);
  };

  return (
    <div className="filter-group">
      <label className="filter-label">Severity</label>
      <div className="severity-checkboxes">
        {[1, 2, 3, 4].map(sev => (
          <label
            key={sev}
            className={`severity-chip ${selected.includes(sev) ? 'active' : ''}`}
            style={{
              '--chip-color': SEVERITY_COLORS[sev],
              backgroundColor: selected.includes(sev) ? SEVERITY_COLORS[sev] : 'transparent',
              color: selected.includes(sev) ? '#fff' : SEVERITY_COLORS[sev],
              borderColor: SEVERITY_COLORS[sev]
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(sev)}
              onChange={() => toggle(sev)}
              aria-label={`Severity ${sev}`}
            />
            <span>{sev}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function GlobalFilters({ filters, options, onChange, onReset }) {
  const hasActiveFilters = filters.years.length > 0 ||
    filters.states.length > 0 ||
    filters.severity.length < 4;

  return (
    <div className="global-filters" role="search" aria-label="Dashboard filters">
      <MultiSelect
        label="Year"
        options={options.years.map(String)}
        selected={filters.years.map(String)}
        onChange={vals => onChange({ years: vals.map(Number) })}
      />

      <MultiSelect
        label="State"
        options={options.states}
        selected={filters.states}
        onChange={vals => onChange({ states: vals })}
        searchable
      />

      <SeverityFilter
        selected={filters.severity}
        onChange={vals => onChange({ severity: vals })}
      />

      {hasActiveFilters && (
        <button
          className="reset-button"
          onClick={onReset}
          aria-label="Reset all filters"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
