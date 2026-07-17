# MetricMind Architecture

## Overview
MetricMind is a semantic BI engine that combines a semantic layer, natural language query parsing, and interactive visualizations.

## Components
1. **Semantic Layer** — Defines all metrics declaratively (measures, dimensions, filters)
2. **Query Engine** — Parses natural language to structured queries
3. **Visualization** — Chart.js renders bar charts, line charts, and KPI cards
4. **Transparency Layer** — Every response includes the underlying API call

## Data Flow
User Query -> parseQuery() -> executeQuery() -> generateExplanation() -> renderChart()
