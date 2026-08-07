# 🧠 MetricMind - AI-Powered Semantic BI Engine

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)
![Recharts](https://img.shields.io/badge/Recharts-2.12-22b455?style=for-the-badge&logo=chart.js)

> **MetricMind** is a fully semantic AI BI engine that transforms natural language questions into real-time data visualizations. It analyzes sales and pricing data across 24 countries, supports local currencies, and provides multi-step reasoning for deep business insights.

**Live Demo**: [https://metricmind-ui.vercel.app](https://metricmind-ui.vercel.app)

---

## 📖 Table of Contents
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Project Architecture & Data Pipeline](#-project-architecture--data-pipeline)
- [Getting Started (Local Development)](#-getting-started-local-development)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Example Queries](#-example-queries)
- [Future Roadmap](#-future-roadmap)
- [Team Contributors](#-team-contributors)

---

## 🚀 Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (React 19), Tailwind CSS, Recharts |
| **Backend & API** | Next.js API Routes (`/api/chat`) |
| **Data Handling** | Custom Semantic Layer & JSON Transaction Datasets |
| **AI & Logic** | Custom LLM Agent logic (Reasoning steps & Governance) |
| **Infrastructure** | Vercel (Hosting, CI/CD, Auto-deploys) |
| **Version Control** | GitHub |

---

## ✨ Key Features
- 🗣️ **Natural Language Querying**: Ask questions like *"Show me sales by region"* or *"What is our profit margin?"*.
- 📊 **Interactive Dashboards**: Real-time charts (Bar, Line, Area) and live KPI cards.
- 🧠 **Multi-Step Reasoning**: The AI breaks down complex queries into logical steps, revealing exactly *how* it arrived at the answer.
- 🔍 **Transparency Layer**: Every query exposes the underlying API call structure (measures, dimensions, filters) so you know what data is being fetched.
- 📐 **Semantic Governance**: All metrics (revenue, profit, costs) are defined in a centralized semantic layer. No hardcoded values—everything is calculated dynamically.

---

## 🧩 Project Architecture & Data Pipeline
Below is the exact flow of how MetricMind processes a user's question:

1. **User Input** -> The user types a question (e.g., *"Show me sales by region"*) into the Chat interface.
2. **API Call** -> The Next.js frontend sends a `POST` request to the internal `/api/chat` route.
3. **Intent Parsing** -> The backend AI engine analyzes the question to determine required data dimensions, countries, and timeframes.
4. **Semantic Retrieval** -> The engine fetches the exact data slices from the `semantic_layer`/dataset based on the parsed metrics.
5. **Reasoning & Analytics** -> The agent computes the necessary aggregations (totals, margins, regional sums) and logs its step-by-step reasoning.
6. **Visualization & Response** -> The raw data is formatted and sent back to the frontend.
7. **Client Rendering** -> The frontend uses `Recharts` to dynamically render KPIs, data tables, or Bar/Line charts based on the response type.

---

## 🛠️ Getting Started (Local Development)
Follow these steps to run MetricMind on your local machine.

### Prerequisites
- **Node.js** (v18 or newer) installed on your computer.
- **Git** installed.
- A **GitHub account** (for cloning and future contributions).

### Installation
1. Clone the repository:
```bash
git clone https://github.com/ayushkr2007/metricmind.git
cd metricmind
