# map-data-panel

A web UI to monitor data from 3DGS (3D Gaussian Splatting) maps.

## Features

### Map Management
- **Projects** – organise maps into separate projects
- **Map upload** – upload `.ply`, `.splat`, and `.ksplat` 3DGS files
- **Map calibration** – adjust position offset (X/Y/Z), rotation (X/Y/Z), and scale

### Data Flow
- **Widget placement** – click anywhere on the 3D map to create a data widget at that point
- **Data ingestion API** – `POST /api/data` to push values to any widget
- **Real-time updates** – WebSocket connection broadcasts new data to every connected browser instantly

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLite (SQLAlchemy) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Three.js |
| Container | Docker + docker-compose + nginx |

---

## Quick start — Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

Uploaded files are persisted in `./backend/uploads/` and the database in `./backend/app.db` via Docker volumes.

---

## Quick start — manual

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # dev server on http://localhost:5173
# or
npm run build && npm run preview   # production preview on http://localhost:4173
```

> The Vite dev server proxies `/api` and `/ws` to `http://localhost:8000` automatically.

---

## REST API reference

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/{id}` | Get / update / delete project |
| GET/POST | `/api/projects/{id}/maps` | List / upload map (multipart: `name`, `description`, `file`) |
| GET/PUT/DELETE | `/api/maps/{id}` | Get / update (calibration) / delete map |
| GET | `/api/maps/{id}/file` | Download the raw 3DGS file |
| GET/POST | `/api/maps/{id}/widgets` | List / create widget |
| GET/PUT/DELETE | `/api/widgets/{id}` | Get / update / delete widget |
| GET | `/api/widgets/{id}/data` | Get last 100 data entries |
| POST | `/api/data` | Ingest data `{"widget_id": 1, "value": {...}}` |

### WebSocket

```
ws://localhost:8000/ws/{map_id}
```

Subscribe to a map to receive real-time push messages:

```json
{"type": "data_update", "widget_id": 1, "data": {"id": 5, "value": "{...}", "timestamp": "2026-01-01T00:00:00"}}
```

### Data ingestion example

```bash
curl -X POST http://localhost:8000/api/data \
  -H "Content-Type: application/json" \
  -d '{"widget_id": 1, "value": {"temperature": 23.5, "unit": "C"}}'
```

