import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import InfoTooltip from './InfoTooltip';

const SEVERITY_COLORS = {
  1: '#2ecc71',
  2: '#d4a017',
  3: '#e67e22',
  4: '#e74c3c'
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill }}>
          {p.name}: {p.value.toLocaleString()} ({total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}%)
        </div>
      ))}
      <div style={{ marginTop: 4, fontWeight: 600 }}>
        Total: {total.toLocaleString()}
      </div>
    </div>
  );
}

export default function WeatherImpact({ data, filters }) {
  const [mode, setMode] = useState('count'); // 'count' or 'proportion'

  const chartData = useMemo(() => {
    if (!data || !data.conditions || !data.severity_matrix) return [];

    const { conditions, severity_matrix } = data;
    // severity_matrix: N rows (conditions) × 4 cols (sev 1-4)
    const items = conditions.map((condition, i) => {
      const counts = {};
      let total = 0;
      for (let sev = 0; sev < 4; sev++) {
        const val = severity_matrix[i]?.[sev] || 0;
        counts[`sev${sev + 1}`] = val;
        total += val;
      }
      return { condition, ...counts, total };
    });

    // Sort by total descending, take top 10
    items.sort((a, b) => b.total - a.total);
    const top10 = items.slice(0, 10);

    if (mode === 'proportion') {
      return top10.map(item => {
        const t = item.total || 1;
        return {
          ...item,
          sev1: (item.sev1 / t) * 100,
          sev2: (item.sev2 / t) * 100,
          sev3: (item.sev3 / t) * 100,
          sev4: (item.sev4 / t) * 100,
          _raw: item // Keep raw counts for tooltip
        };
      });
    }

    return top10;
  }, [data, mode]);

  // Filter severity bars based on active severity filters
  const activeSeverities = filters?.severity || [1, 2, 3, 4];

  if (!chartData.length) return null;

  return (
    <div className="chart-card weather-impact">
      <div className="chart-header">
        <h3 className="section-title">
          Weather Impact on Severity
          <span className="filter-scope-badge">Severity filter only</span>
          <InfoTooltip
            title="Weather Impact on Severity"
            description="Top 10 weather conditions by accident count, with severity breakdown shown as stacked bars. Toggle between raw counts and proportional view."
            usage="Switch to 'Proportion' mode to compare the severity mix across weather conditions — this reveals which conditions produce disproportionately severe outcomes regardless of volume. Hover any bar segment for details."
            why="Weather is the #1 predictor in the Random Forest model (via wind speed and pressure). Overcast and low-visibility conditions show a 2.8× higher severe-accident rate compared to fair weather, supporting DOT weather-responsive signage recommendations."
          />
        </h3>
        <div className="chart-toggle" role="group" aria-label="Display mode">
          <button
            className={`toggle-btn ${mode === 'count' ? 'active' : ''}`}
            onClick={() => setMode('count')}
          >
            Count
          </button>
          <button
            className={`toggle-btn ${mode === 'proportion' ? 'active' : ''}`}
            onClick={() => setMode('proportion')}
          >
            Proportion
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="condition"
            tick={{ fontSize: 11, fill: '#5a6b7f' }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#5a6b7f' }}
            tickFormatter={v => mode === 'proportion' ? `${v.toFixed(0)}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
          />
          <Tooltip content={mode === 'proportion' ? ProportionTooltip : <CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => value.replace('sev', 'Severity ')}
          />
          {activeSeverities.includes(1) && (
            <Bar dataKey="sev1" name="sev1" stackId="a" fill={SEVERITY_COLORS[1]} />
          )}
          {activeSeverities.includes(2) && (
            <Bar dataKey="sev2" name="sev2" stackId="a" fill={SEVERITY_COLORS[2]} />
          )}
          {activeSeverities.includes(3) && (
            <Bar dataKey="sev3" name="sev3" stackId="a" fill={SEVERITY_COLORS[3]} />
          )}
          {activeSeverities.includes(4) && (
            <Bar dataKey="sev4" name="sev4" stackId="a" fill={SEVERITY_COLORS[4]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProportionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const raw = payload[0]?.payload?._raw;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill }}>
          {p.name.replace('sev', 'Severity ')}: {p.value.toFixed(1)}%
          {raw && <span style={{ color: '#888' }}> ({raw[p.dataKey]?.toLocaleString()})</span>}
        </div>
      ))}
      {raw && (
        <div style={{ marginTop: 4, fontWeight: 600 }}>
          Total: {raw.total.toLocaleString()}
        </div>
      )}
    </div>
  );
}
