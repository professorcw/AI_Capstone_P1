import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ErrorBar
} from 'recharts';
import InfoTooltip from './InfoTooltip';

// Color-code by feature category
const CATEGORY_MAP = {
  // Temporal
  Hour: 'temporal', DayOfWeek: 'temporal', Month: 'temporal', IsWeekend: 'temporal',
  // Environmental
  'Temperature(F)': 'environmental', 'Humidity(%)': 'environmental',
  'Visibility(mi)': 'environmental', 'Wind_Speed(mph)': 'environmental',
  'Pressure(in)': 'environmental',
  // Infrastructure
  Amenity: 'infrastructure', Bump: 'infrastructure', Crossing: 'infrastructure',
  Give_Way: 'infrastructure', Junction: 'infrastructure', No_Exit: 'infrastructure',
  Railway: 'infrastructure', Roundabout: 'infrastructure', Station: 'infrastructure',
  Stop: 'infrastructure', Traffic_Calming: 'infrastructure', Traffic_Signal: 'infrastructure',
  Turning_Loop: 'infrastructure',
  // Composite
  Road_Feature_Count: 'composite', Weather_Risk_Score: 'composite'
};

const CATEGORY_COLORS = {
  temporal: '#4A7FB5',
  environmental: '#2AA198',
  infrastructure: '#e67e22',
  composite: '#8e44ad'
};

const CATEGORY_LABELS = {
  temporal: 'Temporal',
  environmental: 'Environmental',
  infrastructure: 'Infrastructure',
  composite: 'Composite'
};

function CustomTooltip({ active, payload, modelType }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{d.feature}</strong>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>
        {CATEGORY_LABELS[d.category] || 'Unknown'}
      </div>
      {modelType === 'lr' ? (
        <>
          <div>Coefficient: {d.value.toFixed(4)}</div>
          <div>Odds Ratio: {d.oddsRatio?.toFixed(3)}</div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#5a6b7f', maxWidth: 220 }}>
            {d.oddsRatio > 1
              ? `${d.feature} is associated with ${d.oddsRatio.toFixed(1)}× higher odds of a severe outcome.`
              : `${d.feature} is associated with ${(1 / d.oddsRatio).toFixed(1)}× lower odds of a severe outcome (protective).`}
          </div>
        </>
      ) : (
        <>
          <div>Importance: {d.rawValue != null ? d.rawValue.toFixed(4) : d.value.toFixed(4)} {d.direction === 'negative' ? '(protective)' : ''}</div>
          {d.std != null && <div>Std: ±{d.std.toFixed(4)}</div>}
          <div style={{ marginTop: 4, fontSize: 11, color: '#5a6b7f', maxWidth: 220 }}>
            {d.direction === 'negative'
              ? `Shuffling ${d.feature} improved model accuracy by ${(d.value * 100).toFixed(1)} pp — the feature may capture noise or act as a proxy.`
              : `Shuffling ${d.feature} reduced model accuracy by ${(d.value * 100).toFixed(1)} pp — a key severity predictor.`}
          </div>
        </>
      )}
    </div>
  );
}

export default function FeatureImportance({ data }) {
  const [modelType, setModelType] = useState('rf'); // 'lr' or 'rf'

  const chartData = useMemo(() => {
    if (!data) return [];

    let items;
    if (modelType === 'lr' && data.logistic_regression?.length) {
      items = data.logistic_regression.map(d => ({
        feature: d.Feature,
        value: Math.abs(d.Coefficient),
        rawValue: d.Coefficient,
        oddsRatio: d.Odds_Ratio,
        category: CATEGORY_MAP[d.Feature] || 'infrastructure'
      }));
    } else if (modelType === 'rf' && data.random_forest?.length) {
      items = data.random_forest.map(d => ({
        feature: d.Feature,
        value: Math.abs(d.Importance),
        rawValue: d.Importance,
        direction: d.Importance >= 0 ? 'positive' : 'negative',
        std: d.Std,
        category: CATEGORY_MAP[d.Feature] || 'infrastructure'
      }));
    } else {
      return [];
    }

    // Sort descending by absolute importance, take top 15
    items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return items.slice(0, 15).reverse(); // Reverse for horizontal bar (top at top)
  }, [data, modelType]);

  const comparison = data?.comparison;
  const isPending = data?.status === 'pending';

  if (isPending) {
    return (
      <div className="chart-card feature-importance">
        <h3 className="section-title">Feature Importance</h3>
        <div className="chart-placeholder">
          Model results pending — run Phase 5 to generate feature importance data.
        </div>
      </div>
    );
  }

  if (!chartData.length) return null;

  return (
    <div className="chart-card feature-importance">
      <div className="chart-header">
        <h3 className="section-title">
          Feature Importance
          <span className="filter-scope-badge">All data</span>
          <InfoTooltip
            title="Feature Importance"
            description="Top 15 features ranked by their predictive power for severe accidents (Severity 3+). Toggle between Logistic Regression (interpretable coefficients/odds ratios) and Random Forest (permutation importance with error bars)."
            usage="Switch between LR and RF to see which features rank high in both models — those are the most robust predictors. Bars are color-coded by category: temporal (blue), environmental (teal), infrastructure (orange), and composite (purple)."
            why="Features that rank highly in both models provide the strongest evidence for DOT recommendations. Infrastructure features are controllable (the DOT can add signals/crossings), while weather is not — this distinction shapes actionable policy."
          />
        </h3>
        <div className="chart-toggle" role="group" aria-label="Model type">
          <button
            className={`toggle-btn ${modelType === 'lr' ? 'active' : ''}`}
            onClick={() => setModelType('lr')}
          >
            Logistic Reg.
          </button>
          <button
            className={`toggle-btn ${modelType === 'rf' ? 'active' : ''}`}
            onClick={() => setModelType('rf')}
          >
            Random Forest
          </button>
        </div>
      </div>

      {comparison && (
        <div className="model-auc-badges">
          <span className="auc-badge" style={{ opacity: modelType === 'lr' ? 1 : 0.5 }}>
            LR AUC: {comparison.lr_auc?.toFixed(3)}
          </span>
          <span className="auc-badge" style={{ opacity: modelType === 'rf' ? 1 : 0.5 }}>
            RF AUC: {comparison.rf_auc?.toFixed(3)}
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 26)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, bottom: 10, left: 130 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#5a6b7f' }}
            tickFormatter={v => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 11, fill: '#5a6b7f' }}
            width={120}
          />
          <Tooltip content={<CustomTooltip modelType={modelType} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[d.category] || '#999'} fillOpacity={d.direction === 'negative' ? 0.5 : 1} />
            ))}
            {modelType === 'rf' && <ErrorBar dataKey="std" width={4} strokeWidth={1.5} stroke="#666" />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Category legend */}
      <div className="feature-category-legend">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <span key={key} className="feature-legend-item">
            <span className="legend-dot" style={{ background: CATEGORY_COLORS[key] }} />
            {label}
          </span>
        ))}
        {modelType === 'rf' && (
          <>
            <span className="feature-legend-divider">|</span>
            <span className="feature-legend-item">
              <span className="legend-dot" style={{ background: '#666', opacity: 1 }} />
              Risk-increasing
            </span>
            <span className="feature-legend-item">
              <span className="legend-dot" style={{ background: '#666', opacity: 0.5 }} />
              Protective (negative)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
