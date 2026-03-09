# US Traffic Accidents Analysis: Executive Summary

## Department of Transportation — Data-Driven Safety Recommendations

This analysis examined 7.7 million US traffic accident records (2016–2023) compiled from traffic APIs, applying PySpark data processing, six statistical hypothesis tests, and two machine learning classification models to a 1-million-row stratified sample. The goal was to identify actionable patterns in accident timing, environmental conditions, and road infrastructure that the Department of Transportation can use to reduce accident severity across the national road network.

---

## Insight 1: Rush-Hour and Low-Light Periods Concentrate Risk

Weekday rush hours (7–8 AM and 3–5 PM) account for 30% of all accidents within just 17% of weekly hours, with Tuesday through Thursday mornings showing the most intense peaks. Evening and nighttime hours (6 PM–5 AM) show severity rates of 17–22%, elevated above the daytime baseline. The chi-square test confirms a statistically significant association between time of day and severity, and Hour ranks as the 4th most important feature in random forest permutation importance.

**Recommendation:** Implement dynamic speed limit reductions during the 6–9 AM and 3–6 PM weekday windows on high-volume corridors. Deploy enhanced LED lighting and reflective signage on routes with elevated nighttime severity rates.

---

## Insight 2: Weather and Visibility Conditions Multiply Severity

While fair weather accounts for the majority of accidents by volume, it has the lowest severe-accident rate at just 12.4%. Overcast and scattered-cloud conditions — which reduce average visibility to 4–5 miles — show severe-accident rates of 35%, nearly 3× the fair-weather rate. Wind speed is the single strongest severity predictor in the random forest model (permutation importance = 0.0326), and barometric pressure is the second strongest. These environmental factors outweigh all infrastructure and temporal features in predictive power.

**Recommendation:** Install automated weather-responsive variable message signs and variable speed advisories on high-incident corridors, triggered by visibility drops below 5 miles or wind speeds above 20 mph. Partner with navigation apps to push real-time low-visibility warnings.

---

## Insight 3: Junction and Railway Infrastructure Gaps Drive Severity

Accidents at junctions are 28.0% severe versus the 20.4% overall baseline — an 8-percentage-point elevation affecting over 536,000 accidents. Railway crossings (OR = 2.07×) and give-way features (OR = 1.93×) approximately double the odds of a severe outcome in the logistic regression model. Conversely, stop signs (OR = 0.39) and crossing markings (OR = 0.59) show strong protective associations, and intersections with multiple installed safety features (higher Road_Feature_Count) tend to produce less severe outcomes (OR = 0.75).

**Recommendation:** Conduct a targeted infrastructure audit at the top 200 accident-hotspot cities, focusing on junctions lacking traffic signals, lighting, or lane markings. Prioritize stop sign and crossing-marking installations where absent, and consider roundabout conversions for high-severity junctions.

---

## Next Steps

These findings are associational — the dataset lacks a control group of non-accident conditions, so causal claims cannot be made. Future work should link with NHTSA fatality data to distinguish traffic disruption severity from injury severity, incorporate Census demographic overlays for per-capita normalization, and cross-reference with FHWA road inventory databases to validate infrastructure findings. Gradient boosting models and geospatial features could further improve classification accuracy.

The interactive React dashboard accompanying this analysis allows stakeholders to explore these patterns by year, state, severity level, and date range at http://localhost:3000.
