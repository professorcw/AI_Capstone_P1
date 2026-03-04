import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function InfoTooltip({ title, description, usage, why }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        close();
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  return (
    <div className="info-tooltip-wrapper">
      <button
        ref={buttonRef}
        className="info-tooltip-trigger"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Learn more about ${title}`}
        aria-expanded={open}
        type="button"
      >
        <HelpCircle size={16} />
      </button>
      {open && (
        <div className="info-tooltip-panel" ref={panelRef} role="dialog" aria-label={title}>
          <div className="info-tooltip-header">
            <span className="info-tooltip-title">{title}</span>
            <button className="info-tooltip-close" onClick={close} aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <div className="info-tooltip-body">
            <p className="info-tooltip-desc">{description}</p>
            {usage && (
              <div className="info-tooltip-section">
                <strong>How to use</strong>
                <p>{usage}</p>
              </div>
            )}
            {why && (
              <div className="info-tooltip-section">
                <strong>Why it matters</strong>
                <p>{why}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
