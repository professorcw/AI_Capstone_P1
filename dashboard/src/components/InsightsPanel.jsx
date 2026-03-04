import React, { useState } from 'react';
import { ChevronDown, Clock, CloudRain, Construction } from 'lucide-react';

const INSIGHTS = [
  {
    id: 1,
    icon: Clock,
    accentColor: '#4A7FB5',
    title: 'Rush-Hour & Low-Light Periods Concentrate Risk',
    punchline: '38%',
    keyStat: '38% of accidents occur in just 17% of weekly hours',
    finding:
      'Weekday rush hours (7–8 AM and 3–5 PM) account for a disproportionate share of all accidents, with Tuesday through Thursday mornings showing the most intense peaks. Evening and nighttime hours (6 PM–5 AM) show severity rates of 17–22%, elevated above the daytime baseline.',
    evidence: [
      'Chi-square test: statistically significant association between time of day and severity',
      'Hour is the 4th-strongest positive predictor in random forest permutation importance',
      'Heatmap reveals sharp weekday morning and afternoon concentration bands',
    ],
    recommendation:
      'Implement dynamic speed limit reductions during the 6–9 AM and 3–6 PM weekday windows on high-volume corridors. Deploy enhanced LED lighting and reflective signage on routes with elevated nighttime severity rates.',
  },
  {
    id: 2,
    icon: CloudRain,
    accentColor: '#e67e22',
    title: 'Weather & Visibility Conditions Multiply Severity',
    punchline: '2.8×',
    keyStat: 'Overcast conditions show 35% severe-accident rate — 2.8× fair weather',
    finding:
      'While fair weather accounts for the majority of accidents by volume, it has the lowest severe-accident rate at just 12.4%. Overcast and scattered-cloud conditions — which reduce average visibility to 4–5 miles — show severe-accident rates of 35%. Wind speed is the strongest positive predictor in the random forest model, with the highest permutation importance among features that increase severity prediction.',
    evidence: [
      'Wind speed: RF permutation importance = 0.033 (rank #1)',
      'Barometric pressure: RF permutation importance = 0.021 (rank #2)',
      'ANOVA and Kruskal-Wallis tests confirm significant differences across severity levels',
    ],
    recommendation:
      'Install automated weather-responsive variable message signs and variable speed advisories on high-incident corridors, triggered by visibility drops below 5 miles or wind speeds above 20 mph. Partner with navigation apps to push real-time low-visibility warnings.',
  },
  {
    id: 3,
    icon: Construction,
    accentColor: '#2ecc71',
    title: 'Junction & Railway Infrastructure Gaps Drive Severity',
    punchline: '2.07×',
    keyStat: 'Railway crossings double the odds of a severe outcome (OR = 2.07×)',
    finding:
      'Accidents at junctions are 28.0% severe versus the 20.4% overall baseline — an 8-percentage-point elevation affecting over 536,000 accidents. Railway crossings and give-way features approximately double the odds of a severe outcome. Conversely, stop signs and crossing markings show strong protective associations.',
    evidence: [
      'Logistic regression: Railway OR = 2.07×, Give_Way OR = 1.93×, Stop OR = 0.39 (protective)',
      'Road_Feature_Count shows OR = 0.75 — more safety features correlate with lower severity',
      'Point-biserial correlations confirm infrastructure–severity associations',
    ],
    recommendation:
      'Conduct a targeted infrastructure audit at the top 200 accident-hotspot cities, focusing on junctions lacking traffic signals, lighting, or lane markings. Prioritize stop sign and crossing-marking installations where absent, and consider roundabout conversions for high-severity junctions.',
  },
];

function InsightsPanel() {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand(id);
    }
  };

  return (
    <div className="insights-panel" role="region" aria-label="Key DOT Insights">
      <h2 className="section-title">Three Key DOT Insights</h2>
      <div className="insights-grid">
        {INSIGHTS.map((insight) => {
          const isOpen = !!expanded[insight.id];
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className={`insight-card ${isOpen ? 'expanded' : ''}`}
              style={{ '--accent': insight.accentColor }}
            >
              <div
                className="insight-header"
                onClick={() => toggleExpand(insight.id)}
                onKeyDown={(e) => handleKeyDown(e, insight.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`insight-content-${insight.id}`}
              >
                <div className="insight-icon-wrapper">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <div className="insight-header-text">
                  <div className="insight-title-row">
                    <h3 className="insight-title">{insight.title}</h3>
                    {insight.punchline && (
                      <span className="insight-punchline" style={{ color: insight.accentColor }}>
                        {insight.punchline}
                      </span>
                    )}
                  </div>
                  <p className="insight-key-stat">{insight.keyStat}</p>
                </div>
                <ChevronDown
                  className={`insight-chevron ${isOpen ? 'rotated' : ''}`}
                  size={20}
                  aria-hidden="true"
                />
              </div>

              <div
                id={`insight-content-${insight.id}`}
                className="insight-body"
                role="region"
                aria-hidden={!isOpen}
              >
                <div className="insight-body-inner">
                  <div className="insight-section">
                    <h4>Finding</h4>
                    <p>{insight.finding}</p>
                  </div>
                  <div className="insight-section">
                    <h4>Statistical Evidence</h4>
                    <ul>
                      {insight.evidence.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="insight-section insight-recommendation">
                    <h4>DOT Recommendation</h4>
                    <p>{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InsightsPanel;
