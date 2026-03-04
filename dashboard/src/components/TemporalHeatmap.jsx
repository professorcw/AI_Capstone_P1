import React, { useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import InfoTooltip from './InfoTooltip';

const HOUR_LABELS = [
  '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am',
  '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm',
  '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="chart-tooltip">
      <strong>{HOUR_LABELS[d.hour]}</strong>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <div>
          <span style={{ color: '#4A7FB5', fontWeight: 600 }}>Weekday:</span>{' '}
          {d.weekday.toLocaleString()}
        </div>
        <div>
          <span style={{ color: '#2AA198', fontWeight: 600 }}>Weekend:</span>{' '}
          {d.weekend.toLocaleString()}
        </div>
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
        <span style={{ color: '#e74c3c', fontWeight: 600 }}>Severity rate:</span>{' '}
        {d.severityRate.toFixed(1)}%
        <span style={{ color: '#5a6b7f', fontSize: 11, marginLeft: 4 }}>
          ({d.severeCount.toLocaleString()} of {d.total.toLocaleString()} severe)
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#5a6b7f' }}>
        Sev 1: {d.sev1.toLocaleString()} · Sev 2: {d.sev2.toLocaleString()} · Sev 3: {d.sev3.toLocaleString()} · Sev 4: {d.sev4.toLocaleString()}
      </div>
    </div>
  );
}

export default function TemporalRiskProfile({ data }) {
  const chartData = useMemo(() => {
    if (!data?.by_hour || !data?.by_hour_severity) return [];

    // Build severity lookup: hour -> { 1: count, 2: count, 3: count, 4: count }
    const sevByHour = {};
    for (const entry of data.by_hour_severity) {
      if (!sevByHour[entry.hour]) sevByHour[entry.hour] = {};
      sevByHour[entry.hour][entry.severity] = entry.count;
    }

    return data.by_hour.map(h => {
      const sev = sevByHour[h.hour] || {};
      const sev1 = sev[1] || 0;
      const sev2 = sev[2] || 0;
      const sev3 = sev[3] || 0;
      const sev4 = sev[4] || 0;
      const total = sev1 + sev2 + sev3 + sev4;
      const severeCount = sev3 + sev4;

      return {
        hour: h.hour,
        label: HOUR_LABELS[h.hour],
        weekday: h.weekday_count,
        weekend: h.weekend_count,
        total,
        sev1, sev2, sev3, sev4,
        severeCount,
        severityRate: total > 0 ? (severeCount / total) * 100 : 0
      };
    });
  }, [data]);

  if (!chartData.length) return null;

  // Find the max severity rate for annotation
  const maxSevHour = chartData.reduce((max, d) => d.severityRate > max.severityRate ? d : max, chartData[0]);
  const avgSevRate = chartData.reduce((sum, d) => sum + d.severityRate, 0) / chartData.length;

  return (
    <div className="chart-card temporal-risk-profile">
      <h3 className="section-title">
        Accident Volume &amp; Severity by Hour
        <span className="filter-scope-badge">All years &amp; states</span>
        <InfoTooltip
          title="Temporal Risk Profile"
          description="Blue and teal areas show accident volume for weekdays vs weekends. The red line shows the severity rate — the percentage of accidents that are Severity 3–4 (high disruption) at each hour."
          usage="Compare the two stories: rush hours (7–9 AM, 3–6 PM) have the MOST accidents, but nighttime hours have the HIGHEST severity rate. This means the most frequent ≠ the most dangerous."
          why="38% of all accidents occur during 17% of weekly hours (rush-hour windows), but nighttime severity rates reach 22%+ vs. ~19% during the day. Both temporal patterns are actionable for the DOT."
        />
      </h3>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          {/* Rush hour highlight bands */}
          <ReferenceArea x1={6} x2={9} fill="#4A7FB5" fillOpacity={0.06} />
          <ReferenceArea x1={15} x2={18} fill="#4A7FB5" fillOpacity={0.06} />

          <XAxis
            dataKey="hour"
            tickFormatter={(h) => HOUR_LABELS[h]}
            tick={{ fontSize: 11, fill: '#5a6b7f' }}
            interval={1}
            tickMargin={4}
          />

          {/* Left Y-axis: accident count */}
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
            tick={{ fontSize: 11, fill: '#5a6b7f' }}
            width={50}
            label={{
              value: 'Accidents',
              angle: -90,
              position: 'insideLeft',
              offset: 0,
              style: { fontSize: 11, fill: '#5a6b7f' }
            }}
          />

          {/* Right Y-axis: severity rate */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 30]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#e74c3c' }}
            width={48}
            label={{
              value: '% Severe',
              angle: 90,
              position: 'insideRight',
              offset: 8,
              style: { fontSize: 11, fill: '#e74c3c' }
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            height={36}
            iconType="rect"
            wrapperStyle={{ fontSize: 12 }}
          />

          {/* Volume areas */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="weekday"
            name="Weekday"
            stackId="volume"
            fill="#4A7FB5"
            fillOpacity={0.4}
            stroke="#4A7FB5"
            strokeWidth={1.5}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="weekend"
            name="Weekend"
            stackId="volume"
            fill="#2AA198"
            fillOpacity={0.4}
            stroke="#2AA198"
            strokeWidth={1.5}
          />

          {/* Average severity baseline */}
          <ReferenceLine
            yAxisId="right"
            y={avgSevRate}
            stroke="#e74c3c"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />

          {/* Severity rate line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="severityRate"
            name="Severity Rate (% Sev 3–4)"
            stroke="#e74c3c"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#e74c3c', strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#e74c3c', strokeWidth: 2, fill: 'white' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Annotation callouts */}
      <div className="temporal-annotations">
        <div className="temporal-callout rush-hour">
          <span className="callout-badge" style={{ background: 'rgba(74, 127, 181, 0.12)', color: '#4A7FB5' }}>
            Rush Hours (7–9am, 3–6pm)
          </span>
          <span className="callout-text">38% of all accidents in 17% of weekly hours</span>
        </div>
        <div className="temporal-callout severity-peak">
          <span className="callout-badge" style={{ background: 'rgba(231, 76, 60, 0.12)', color: '#e74c3c' }}>
            Peak Severity: {HOUR_LABELS[maxSevHour.hour]}
          </span>
          <span className="callout-text">{maxSevHour.severityRate.toFixed(1)}% severe — highest risk hour</span>
        </div>
      </div>
    </div>
  );
}
