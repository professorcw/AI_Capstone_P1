import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import InfoTooltip from './InfoTooltip';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Distinct colors for each year line
const YEAR_COLORS = [
  '#1B2A4A', '#4A7FB5', '#2AA198', '#e67e22', '#e74c3c',
  '#8e44ad', '#27ae60', '#f39c12', '#3498db', '#c0392b'
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{MONTH_NAMES[label - 1] || label}</strong>
      {payload
        .filter(p => p.value != null)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .map(p => (
          <div key={p.name} style={{ color: p.stroke }}>
            {p.name}: {p.value.toLocaleString()}
          </div>
        ))
      }
    </div>
  );
}

export default function MonthlyTrends({ data, filters }) {
  const [hiddenYears, setHiddenYears] = useState(new Set());

  const { chartData, years, hasPartialYears } = useMemo(() => {
    if (!data?.data) return { chartData: [], years: [], hasPartialYears: false };

    // If user explicitly selected years via filter, respect that
    // Otherwise, exclude partial years (2016, 2023) which have incomplete data
    const PARTIAL_YEARS = [2016, 2023];
    const userSelectedYears = filters?.years?.length > 0;
    const filtered = userSelectedYears
      ? data.data.filter(d => filters.years.includes(d.year))
      : data.data.filter(d => !PARTIAL_YEARS.includes(d.year));

    // Check if partial years exist in the full dataset
    const allDataYears = [...new Set(data.data.map(d => d.year))];
    const hasPartialYears = PARTIAL_YEARS.some(y => allDataYears.includes(y));

    // Get unique years
    const allYears = [...new Set(filtered.map(d => d.year))].sort();

    // Pivot: one row per month, one column per year
    const byMonth = {};
    for (let m = 1; m <= 12; m++) {
      byMonth[m] = { month: m };
    }

    filtered.forEach(d => {
      if (byMonth[d.month]) {
        byMonth[d.month][d.year] = d.count;
      }
    });

    return {
      chartData: Object.values(byMonth).sort((a, b) => a.month - b.month),
      years: allYears,
      hasPartialYears
    };
  }, [data, filters]);

  const toggleYear = (year) => {
    setHiddenYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        // Don't hide the last visible year
        if (next.size < years.length - 1) {
          next.add(year);
        }
      }
      return next;
    });
  };

  if (!chartData.length || !years.length) return null;

  return (
    <div className="chart-card monthly-trends">
      <h3 className="section-title">
        Monthly Accident Trends
        <InfoTooltip
          title="Monthly Accident Trends"
          description="Year-over-year line chart showing monthly accident counts. Each line represents one calendar year, allowing seasonal pattern comparison."
          usage="Click any year in the legend to hide/show it. Use year filters to focus on specific periods. Look for consistent seasonal peaks (typically Oct–Dec) and year-over-year growth."
          why="Seasonal decomposition reveals a strong 12-month cycle driven by weather and daylight changes. Year-over-year growth partly reflects expanded data collection, not necessarily more accidents — a key caveat when interpreting trends."
        />
      </h3>
      {hasPartialYears && !filters?.years?.length && (
        <p className="chart-note">Partial years (2016, 2023) hidden — use year filter to view them.</p>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tickFormatter={m => MONTH_NAMES[m - 1]}
            tick={{ fontSize: 12, fill: '#5a6b7f' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#5a6b7f' }}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            onClick={(e) => toggleYear(parseInt(e.value))}
            wrapperStyle={{ cursor: 'pointer', fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (
              <span style={{ opacity: hiddenYears.has(parseInt(value)) ? 0.4 : 1 }}>
                {value}
              </span>
            )}
          />
          {years.map((year, i) => (
            <Line
              key={year}
              type="monotone"
              dataKey={year}
              name={String(year)}
              stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              hide={hiddenYears.has(year)}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
