Digital Transformation Assessment Platform
AIX Voice Agent • Digital Readiness Agent • AI Readiness Agent
Live ADX Dashboard • Figma Plugin • Azure AI Foundry Agents


Overview

This project delivers an end-to-end Digital Transformation Assessment (DTA) platform powered by:

Voice-based autonomous assessment agents

Automated scoring & normalization pipelines

Azure Functions ingestion layer

ADX (Azure Data Explorer) storage

Next.js dashboards with live refresh

Figma plugin for real-time visualization

Azure AI Foundry Agent Orchestration

The system supports three assessment tracks:

AIX Technical Health Assessment (THA)

AI Readiness Assessment

Digital Readiness Assessment

Each agent collects structured maturity data and automatically updates the dashboards and Figma design system.


**
**Solution Architecture : -**

1. Voice Agent Layer (Azure AI Foundry)

Agents built using Azure OpenAI / GPT-4o

System prompts + domain knowledge grounding

Streaming voice interaction

Produces structured JSON output

Direct integration with Azure Functions (OpenAPI)

2. Scoring Normalization Layer

Domain-level and question-level scoring

Maturity level calculations (1–5)

Normalized 0–500 score for dashboards

Gap analysis + priority classification

Automated JSON payload generation

3. Ingestion Pipeline (Azure Function App)

Azure Functions receive payloads via

POST /api/score_and_push?code=<FUNCTION_KEY>
POST /api/ai_readiness_score_and_push
POST /api/digital_readiness_score_and_push

Functions:

Validate payload

Add timestamp

Push records to ADX tables

Respond with 202 Accepted

4. ADX (Azure Data Explorer

5. Tables:

aix_scores

ai_readiness_scores

digital_readiness_scores

Stored as structured records with:

Session metadata

Customer info

Domain scores

Maturity levels

Timestamps

5. Next.js Live Dashboards

Features:

Tailwind-styled UI

Donut gauge visualizations

Auto-refresh every 3 seconds

Customer/participant filters

Domain score breakdown

Routes:

/aix

/ai-readiness

/digital-readiness

6. Figma Plugin (Live Data Sync)

Features:

Fetches latest ADX score

Updates text layers in a selected frame

Auto-positions UI elements

Works for Digital Readiness, AI Readiness, AIX

No manual refresh required

Layers auto-updated:

DigitalScore

DigitalPercent

DigitalLevel

DigitalRaw

DigitalUpdated

7. Optional: Power BI Dashboard

Can read from ADX

Used for deep drill-down

Not required for the plugin

