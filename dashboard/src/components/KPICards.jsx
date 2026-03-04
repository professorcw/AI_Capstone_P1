import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, MapPin } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function animate(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

function KPICard({ icon: Icon, label, value, format, color, tooltip }) {
  const numericTarget = typeof value === 'number' ? value : 0;
  const animated = useCountUp(numericTarget);

  let displayValue;
  if (typeof value === 'string') {
    displayValue = value;
  } else if (format === 'integer') {
    displayValue = Math.round(animated).toLocaleString();
  } else if (format === 'decimal') {
    displayValue = animated.toFixed(2);
  } else if (format === 'percent') {
    displayValue = animated.toFixed(1) + '%';
  } else {
    displayValue = Math.round(animated).toLocaleString();
  }

  return (
    <div className="kpi-card" role="status" aria-label={`${label}: ${displayValue}`}>
      <div className="kpi-icon" style={{ color }}>
        <Icon size={24} />
      </div>
      <div className="kpi-content">
        <div className="kpi-value">{displayValue}</div>
        <div className="kpi-label">{label}</div>
      </div>
      {tooltip && (
        <div className="kpi-info">
          <InfoTooltip {...tooltip} />
        </div>
      )}
    </div>
  );
}

const KPI_TOOLTIPS = {
  totalAccidents: {
    title: 'Total Accidents',
    description: 'The total number of traffic accident records in the dataset matching your current filter selections.',
    usage: 'Use the global filters (year, state, severity) to narrow this count to specific segments. Compare across states or years to spot trends.',
    why: 'Provides baseline volume context. A high count in a state may reflect reporting coverage rather than actual danger — always pair with per-capita or severity metrics.'
  },
  avgSeverity: {
    title: 'Average Severity',
    description: 'The mean severity score (1–4) across all filtered accidents. Severity measures traffic disruption duration, not injury: 1 = minimal delay, 4 = extended road closure.',
    usage: 'Compare across filters to see which states, years, or weather conditions produce more disruptive accidents on average.',
    why: 'A higher average indicates longer traffic disruptions. Even small shifts (e.g., 2.1 → 2.3) can signal meaningful infrastructure or policy differences when applied across millions of incidents.'
  },
  pctSevere: {
    title: '% Severe (Severity 3+)',
    description: 'The percentage of accidents classified as Severity 3 or 4 — meaning significant to major traffic disruption.',
    usage: 'Filter by state or time period and watch this metric to identify where and when the most disruptive accidents cluster.',
    why: 'Raw counts can be misleading because they scale with population. This ratio normalizes for volume and highlights where severe outcomes are disproportionately common.'
  },
  topState: {
    title: 'Top State',
    description: 'The state with the highest accident count within your current filter selections.',
    usage: 'Apply year or severity filters to see which state leads under different conditions. The top state may change when filtering to severe-only accidents.',
    why: 'Identifies where the DOT might concentrate resources. Note: states with better traffic API coverage (e.g., CA, TX) may appear dominant due to reporting infrastructure, not just road danger.'
  }
};

export default function KPICards({ kpi }) {
  return (
    <div className="kpi-grid">
      <KPICard
        icon={BarChart3}
        label="Total Accidents"
        value={kpi.totalAccidents}
        format="integer"
        color="#4A7FB5"
        tooltip={KPI_TOOLTIPS.totalAccidents}
      />
      <KPICard
        icon={TrendingUp}
        label="Avg Severity"
        value={kpi.avgSeverity}
        format="decimal"
        color="#e67e22"
        tooltip={KPI_TOOLTIPS.avgSeverity}
      />
      <KPICard
        icon={AlertTriangle}
        label="% Severe (≥3)"
        value={kpi.pctSevere}
        format="percent"
        color="#e74c3c"
        tooltip={KPI_TOOLTIPS.pctSevere}
      />
      <KPICard
        icon={MapPin}
        label="Top State"
        value={kpi.topState}
        format="string"
        color="#2AA198"
        tooltip={KPI_TOOLTIPS.topState}
      />
    </div>
  );
}
