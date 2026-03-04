import React, { useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import InfoTooltip from './InfoTooltip';

const SEVERITY_COLORS = {
  1: '#2ecc71',
  2: '#d4a017',
  3: '#e67e22',
  4: '#e74c3c'
};

const SEVERITY_LABELS = {
  1: 'Severity 1 — Minor',
  2: 'Severity 2 — Moderate',
  3: 'Severity 3 — Serious',
  4: 'Severity 4 — Major'
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{SEVERITY_LABELS[d.severity]}</strong>
      <div>{d.count.toLocaleString()} accidents</div>
      <div>{d.pct.toFixed(1)}% of total</div>
    </div>
  );
}

function renderLabel({ severity, pct, cx, cy, midAngle, innerRadius, outerRadius }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (pct < 3) return null; // Skip tiny slices
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontWeight="700" fontSize="13">
      {pct.toFixed(0)}%
    </text>
  );
}

export default function SeverityBreakdown({ data, filters, onFilterChange }) {
  const chartData = (data || []).map(d => ({
    ...d,
    pct: d.pct != null ? d.pct * 100 : 0
  }));

  // Recalculate percentages based on visible data (filters may change totals)
  const total = chartData.reduce((sum, d) => sum + d.count, 0);
  const normalizedData = chartData.map(d => ({
    ...d,
    pct: total > 0 ? (d.count / total) * 100 : 0
  }));

  const handleClick = useCallback((entry) => {
    if (!onFilterChange) return;
    const sev = entry.severity;
    const current = filters.severity;
    if (current.length === 1 && current.includes(sev)) {
      // Clicking the only selected severity resets to all
      onFilterChange({ severity: [1, 2, 3, 4] });
    } else if (current.length === 4) {
      // From "all", isolate this severity
      onFilterChange({ severity: [sev] });
    } else if (current.includes(sev)) {
      // Remove this severity
      onFilterChange({ severity: current.filter(s => s !== sev) });
    } else {
      // Add this severity
      onFilterChange({ severity: [...current, sev].sort() });
    }
  }, [filters, onFilterChange]);

  if (!normalizedData.length) return null;

  return (
    <div className="chart-card severity-breakdown">
      <h3 className="section-title">
        Severity Breakdown
        <InfoTooltip
          title="Severity Breakdown"
          description="Distribution of accidents across four severity levels. Severity measures traffic disruption duration, not injury: 1 = minimal impact, 2 = moderate delay, 3 = significant disruption, 4 = extended road closure."
          usage="Click any donut slice or legend item to filter the entire dashboard to that severity level. Click again to deselect. This cross-filters all other charts."
          why="Understanding the severity mix is critical for prioritization. ~79% of accidents are Severity 2, so raw counts skew toward moderate events. Filtering to Severity 3–4 reveals where the most disruptive incidents concentrate."
        />
      </h3>
      <div className="severity-chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={normalizedData}
              dataKey="count"
              nameKey="severity"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={110}
              paddingAngle={2}
              cursor="pointer"
              onClick={handleClick}
              label={renderLabel}
              labelLine={false}
            >
              {normalizedData.map(d => (
                <Cell
                  key={d.severity}
                  fill={SEVERITY_COLORS[d.severity]}
                  stroke="white"
                  strokeWidth={2}
                  opacity={filters.severity.includes(d.severity) ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="severity-total-label">
          <span className="severity-total-value">{total.toLocaleString()}</span>
          <span className="severity-total-text">Total</span>
        </div>
      </div>
      <div className="severity-legend">
        {normalizedData.map(d => (
          <button
            key={d.severity}
            className={`severity-legend-item ${filters.severity.includes(d.severity) ? 'active' : ''}`}
            onClick={() => handleClick(d)}
            aria-label={`Filter by ${SEVERITY_LABELS[d.severity]}`}
          >
            <span className="legend-dot" style={{ background: SEVERITY_COLORS[d.severity] }} />
            <span className="severity-legend-label">Sev {d.severity}</span>
            <span className="severity-legend-count">{d.count.toLocaleString()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
