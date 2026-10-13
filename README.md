# Apache NiFi Centralized Monitoring Dashboard

A centralized monitoring dashboard built for observing and managing 20+ Apache NiFi instances across multiple environments (Production, UAT, Staging, Dev, DR) with live real-time telemetry.

## Features

- **Real-Time NiFi Integration** — Live connection to Apache NiFi clusters via the NiFi REST API
- **Automated Background Poller** — Background async worker polls all registered instances on a scheduled interval (default 60s)
- **On-Demand Polling ("Poll Now")** — Trigger immediate metric updates from any instance detail page
- **Self-Service Instance Registration** — "Add Instance" UI modal to onboard and monitor new NiFi clusters in seconds
- **Dashboard Overview** — Live KPI cards showing Total, Healthy, Warning, Critical, and Unreachable clusters
- **Search & Filter Table** — Real-time searching, environment filters (Production, UAT, Staging, Dev, DR), status filters, and sorting
- **Detailed Instance Drilldown** — View Running/Stopped process groups, queued FlowFiles, queued bytes, active threads, and direct links to NiFi Web UI
- **Dark / Light Theme** — Toggle between dark and light themes with persistence

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v3 |
| **Data Fetching** | TanStack Query (React Query) |
| **Routing** | React Router v6 |
| **Icons** | Lucide React |
| **Backend** | Python 3.10+, FastAPI |
| **Async Poller** | AsyncIO Background Worker |
| **ORM & DB** | SQLAlchemy 2.x (async), SQLite (or PostgreSQL) |

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend starts at `http://127.0.0.1:8000`:
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`
- Background poller runs automatically in the background

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

## Monitored Instances

- **HMG UAT NiFi**: `http://10.201.216.172:8443/nifi/` (Apache NiFi v1.28.1)
- Additional instances can be added by clicking **"+ Add Instance"** on the dashboard.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/instances/summary` | Cluster health and KPI card statistics |
| `GET` | `/api/instances` | List instances with search, filtering, and sorting |
| `POST` | `/api/instances` | Register a new NiFi instance |
| `GET` | `/api/instances/{id}` | Detailed telemetry and alerts for an instance |
| `POST` | `/api/instances/{id}/poll` | Trigger an immediate live poll against NiFi REST API |
| `PUT` | `/api/instances/{id}` | Edit instance configuration |
| `DELETE` | `/api/instances/{id}` | Delete an instance from monitoring |
| `GET` | `/api/alerts` | List active alerts and bulletins |
| `PATCH` | `/api/alerts/{id}/acknowledge` | Acknowledge alert |
