import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GlobalFilters from './components/GlobalFilters';
import KPICards from './components/KPICards';
import InteractiveMap from './components/InteractiveMap';
import SeverityBreakdown from './components/SeverityBreakdown';
import WeatherImpact from './components/WeatherImpact';
import TemporalHeatmap from './components/TemporalHeatmap';
import MonthlyTrends from './components/MonthlyTrends';
import FeatureImportance from './components/FeatureImportance';
import InsightsPanel from './components/InsightsPanel';
import './App.css';

const DATA_FILES = [
  'temporal_patterns', 'geographic_hotspots', 'weather_severity',
  'infrastructure_factors', 'severity_distribution', 'monthly_trends',
  'hourly_patterns', 'state_summary', 'model_feature_importance'
];

function App() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    years: [],
    states: [],
    severity: [1, 2, 3, 4],
    dateRange: { start: null, end: null }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all(
      DATA_FILES.map(f =>
        fetch(`${process.env.PUBLIC_URL}/data/${f}.json`).then(r => {
          if (!r.ok) throw new Error(`Failed to load ${f}.json`);
          return r.json();
        })
      )
    )
      .then(results => {
        const dataObj = {};
        DATA_FILES.forEach((f, i) => { dataObj[f] = results[i]; });
        setData(dataObj);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Extract available filter options from loaded data
  const filterOptions = useMemo(() => {
    if (!data) return { years: [], states: [] };

    const years = [...new Set(
      data.severity_distribution.by_year.map(d => d.year)
    )].sort();

    const states = [...new Set(
      data.state_summary.map(d => d.state)
    )].sort();

    return { years, states };
  }, [data]);

  // Compute filtered/derived data based on active filters
  const filteredData = useMemo(() => {
    if (!data) return null;

    const { years, states, severity } = filters;

    // Filter severity distribution
    let severityOverall = data.severity_distribution.overall;
    if (severity.length < 4) {
      severityOverall = severityOverall.filter(d => severity.includes(d.severity));
    }

    let severityByYear = data.severity_distribution.by_year;
    if (years.length > 0) {
      severityByYear = severityByYear.filter(d => years.includes(d.year));
    }
    if (severity.length < 4) {
      severityByYear = severityByYear.filter(d => severity.includes(d.severity));
    }

    let severityByState = data.severity_distribution.by_state;
    if (states.length > 0) {
      severityByState = severityByState.filter(d => states.includes(d.state));
    }
    if (severity.length < 4) {
      severityByState = severityByState.filter(d => severity.includes(d.severity));
    }

    // Filter geographic hotspots
    let cities = data.geographic_hotspots.cities;
    if (states.length > 0) {
      cities = cities.filter(d => states.includes(d.state));
    }

    // Filter state summary
    let stateSummary = data.state_summary;
    if (states.length > 0) {
      stateSummary = stateSummary.filter(d => states.includes(d.state));
    }

    // Compute KPI values from filtered data
    const totalAccidents = severityByState.length > 0
      ? severityByState.reduce((sum, d) => sum + d.count, 0)
      : severityOverall.reduce((sum, d) => sum + d.count, 0);

    const weightedSeverity = severityByState.length > 0
      ? severityByState.reduce((sum, d) => sum + d.severity * d.count, 0) /
        Math.max(severityByState.reduce((sum, d) => sum + d.count, 0), 1)
      : severityOverall.reduce((sum, d) => sum + d.severity * d.count, 0) /
        Math.max(severityOverall.reduce((sum, d) => sum + d.count, 0), 1);

    const severeCount = (severityByState.length > 0 ? severityByState : severityOverall)
      .filter(d => d.severity >= 3)
      .reduce((sum, d) => sum + d.count, 0);
    const pctSevere = totalAccidents > 0 ? (severeCount / totalAccidents) * 100 : 0;

    const topState = stateSummary.length > 0
      ? stateSummary.reduce((max, d) => d.total > max.total ? d : max, stateSummary[0]).state
      : 'N/A';

    return {
      ...data,
      severity_distribution: {
        overall: severityOverall,
        by_year: severityByYear,
        by_state: severityByState
      },
      geographic_hotspots: {
        ...data.geographic_hotspots,
        cities
      },
      state_summary: stateSummary,
      kpi: {
        totalAccidents,
        avgSeverity: weightedSeverity,
        pctSevere,
        topState
      }
    };
  }, [data, filters]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      years: [],
      states: [],
      severity: [1, 2, 3, 4],
      dateRange: { start: null, end: null }
    });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <p>Make sure JSON files exist in <code>public/data/</code></p>
      </div>
    );
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header" role="banner">
        <div className="header-content">
          <h1>US Traffic Accidents Dashboard</h1>
          <p className="header-subtitle">Department of Transportation — Data-Driven Safety Analysis</p>
        </div>
      </header>

      <main className="app-main" id="main-content">
        <GlobalFilters
          filters={filters}
          options={filterOptions}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <KPICards kpi={filteredData.kpi} />

        <div className="dashboard-row map-severity-row">
          <div className="map-section">
            <InteractiveMap
              cities={filteredData.geographic_hotspots.cities}
              filters={filters}
            />
          </div>
          <SeverityBreakdown
            data={filteredData.severity_distribution.overall}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        <WeatherImpact
          data={filteredData.weather_severity}
          filters={filters}
        />

        <div className="dashboard-row temporal-row">
          <TemporalHeatmap
            data={filteredData.hourly_patterns}
          />
          <MonthlyTrends
            data={filteredData.monthly_trends}
            filters={filters}
          />
        </div>

        <FeatureImportance
          data={filteredData.model_feature_importance}
        />

        <InsightsPanel />
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>US Traffic Accidents Analysis — Capstone Project | Data: Sobhan Moosavi US Accidents Dataset (2016–2023)</p>
      </footer>
    </div>
  );
}

export default App;
