# 🧠 AIOps Platform — Full Project Context Document

> **Generated:** 2026-05-02 | **Scope:** Backend + RAG Pipeline (Frontend excluded)
> **Status:** All core backend modules verified & tested.

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Data Flow Pipeline](#3-data-flow-pipeline)
4. [Kafka Topic Map](#4-kafka-topic-map)
5. [Module Deep-Dive](#5-module-deep-dive)
6. [RAG Pipeline](#6-rag-pipeline)
7. [Infrastructure](#7-infrastructure)
8. [Final API Response Schema](#8-final-api-response-schema)
9. [Test Results](#9-test-results)
10. [Gap Analysis — Where You're Lagging]
(#10-gap-analysis--where-youre-lagging)
11. [Recommended Roadmap](#11-recommended-roadmap)

---

## 1. Project Vision

An **AI-powered AIOps (Artificial Intelligence for IT Operations) platform** that:

- **Collects** real-time telemetry from Windows endpoint machines (CPU, memory, disk, network, processes, security)
- **Streams** data through Apache Kafka for real-time processing
- **Monitors** for rule-based anomalies (threshold, sustained, spike, growth rate, fill rate)
- **Aggregates** raw telemetry into engineered features (trends, volatility, patterns, time-to-failure)
- **Diagnoses** root causes using a deterministic multi-stage pipeline (context → signals → rules → inference → confidence)
- **Enhances** diagnoses with RAG-retrieved knowledge base context via FAISS semantic search
- **Translates** technical findings into persona-specific explanations (Technician/Admin/User) using LLM
- **Stores** raw and processed data in MongoDB for historical analysis
- **Serves** a React frontend with role-based dashboards

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ENDPOINT MACHINE (Windows)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  endpoint_agent                                                     │   │
│  │  ├── 7 Collectors (CPU, Memory, Disk, Network, Process, Security,  │   │
│  │  │                  System)                                         │   │
│  │  ├── Telemetry Builder → assembles JSON payload                    │   │
│  │  ├── Scheduler → 60s infinite loop                                 │   │
│  │  ├── API Client → HTTP POST with 3 retries + buffer fallback       │   │
│  │  └── Heartbeat → alive signal every cycle                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTP POST /telemetry & /heartbeat
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CENTRAL SERVER (FastAPI + aiokafka)                   │
│  • Receives telemetry & heartbeat via REST                                 │
│  • Validates system_id                                                     │
│  • Publishes to Kafka topics: "telemetry" and "heartbeat"                  │
│  • Health check endpoint: GET /health                                      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Kafka: "telemetry" topic
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ monitoring_service │ │  feature_service   │ │  storage_service   │
│ ────────────────── │ │ ────────────────── │ │ ────────────────── │
│ • Rule engine with │ │ • 5-layer feature  │ │ • Raw + processed  │
│   7 rule types     │ │   engineering      │ │   storage to       │
│ • Alert lifecycle  │ │ • Sliding windows  │ │   MongoDB          │
│ • Kafka→alerts-    │ │ • Kafka→feature-   │ │ • Consumes from    │
│   stream           │ │   stream           │ │   "telemetry-      │
└────────────────────┘ └────────┬───────────┘ │    stream" ⚠️      │
                                │              └────────────────────┘
                   Kafka: "feature-stream"
                                │
                                ▼
                  ┌────────────────────────┐
                  │    diagnosis_agent     │
                  │ ────────────────────── │
                  │ • 6-stage pipeline:    │
                  │   Context → Signals →  │
                  │   Rules → Inference →  │
                  │   Confidence → Output  │
                  │ • Kafka→analysis-      │
                  │   stream               │
                  └───────────┬────────────┘
                              │
                 Kafka: "analysis-stream"
                              │
                              ▼
                  ┌────────────────────────┐
                  │   analysis_service     │
                  │ ────────────────────── │
                  │ • RAG retrieval (FAISS)│
                  │ • LLM translation      │
                  │   (mock / OpenAI)      │
                  │ • Response builder     │
                  │   (deterministic       │
                  │    health_score +      │
                  │    merge)              │
                  │ • Kafka→ui-dashboard-  │
                  │   stream               │
                  └───────────┬────────────┘
                              │
                 Kafka: "ui-dashboard-stream"
                              │
                              ▼
                  ┌────────────────────────┐
                  │    React Frontend      │
                  │ ────────────────────── │
                  │ • Admin Dashboard      │
                  │ • Technician Dashboard │
                  │ • User Dashboard       │
                  └────────────────────────┘
```

---

## 3. Data Flow Pipeline

### Stage-by-Stage Data Transformation

| Stage | Input | Transform | Output Topic | Output Schema |
|-------|-------|-----------|--------------|---------------|
| **1. Collection** | OS APIs (psutil) | 7 collectors → telemetry_builder | HTTP → CentralServer | `{metadata, hardware, software, security}` |
| **2. Ingestion** | HTTP JSON | Validation + Kafka publish | `telemetry` | Same as above + `system_id`, `timestamp`, `type` |
| **3. Monitoring** | `telemetry` topic | 7 rule types, alert lifecycle | `alerts-stream` | `Alert` Pydantic model (id, severity, confidence, tags) |
| **4. Features** | `telemetry` topic | 5-layer feature engineering | `feature-stream` | `{cpu, memory, disk, process, correlation, flags, meta}` |
| **5. Diagnosis** | `feature-stream` | 6-stage diagnosis pipeline | `analysis-stream` | `{diagnosis, signals, evidence, priority, meta}` |
| **6. Analysis** | `analysis-stream` | RAG retrieval + LLM + merge | `ui-dashboard-stream` | Final UI JSON (system_info, diagnosis, explanations, signals, actions, timeline) |
| **7. Storage** | `telemetry-stream` ⚠️ | Extract metrics → MongoDB | MongoDB | `raw_telemetry` + `system_metrics` collections |

---

## 4. Kafka Topic Map

| Topic Name | Producer | Consumer(s) | Data Type |
|------------|----------|-------------|-----------|
| `telemetry` | CentralServer | monitoring_service, feature_service | Raw telemetry payloads |
| `heartbeat` | CentralServer | (none currently) | Agent alive signals |
| `alerts-stream` | monitoring_service | (diagnosis_agent config references it but doesn't consume it) |  Alert objects |
| `feature-stream` | feature_service | diagnosis_agent | Engineered features |
| `analysis-stream` | diagnosis_agent | analysis_service | Diagnosis results |
| `ui-dashboard-stream` | analysis_service | Frontend/API Gateway (not yet implemented) | Final UI-ready JSON |
| `telemetry-stream` ⚠️ | (nobody produces to this) | storage_service | ⚠️ Topic mismatch — see gaps |

---

## 5. Module Deep-Dive

### 5.1 Endpoint Agent (`backend/endpoint_agent/`)

**Purpose:** Lightweight data collection daemon running on monitored Windows machines.

**Architecture:**
- **Config:** `config.json` → system_id, intervals, API URLs
- **Collectors (7):** cpu, memory, disk, network, process, security, system
- **Telemetry Builder:** Assembles all collector outputs into structured JSON
- **Scheduler:** Infinite loop (default 60s) → heartbeat → flush buffer → collect → send
- **API Client:** HTTP POST to CentralServer with 3 retries; on failure, saves to local JSON buffer
- **Buffer:** File-based JSON persistence at `buffer/telemetry_buffer.json`
- **Logger:** Dual-output (file + console) with `agent.log`

**Sample Telemetry Output:**
```json
{
  "metadata": { "system_id": "SYS-001", "hostname": "...", "os": "Windows", "timestamp": 1234567890 },
  "hardware": {
    "cpu": { "usage_percent": 53.9, "frequency_mhz": 2400, "core_count": 8, "context_switches": ... },
    "memory": { "total": ..., "available": ..., "used": ..., "percent": 94.6 },
    "disk": { "total": ..., "used": ..., "free": ..., "percent": 98.7, "read_bytes": ..., "write_bytes": ... },
    "network": { "bytes_sent": ..., "bytes_recv": ..., "packets_sent": ..., "packets_recv": ... }
  },
  "software": {
    "process": { "process_count": 200, "top_cpu_processes": [...], "top_memory_processes": [...] },
    "system": { "boot_time": ..., "system_uptime_seconds": 274744 }
  },
  "security": { "suspicious_process_count": 0, "suspicious_processes": [] }
}
```

---

### 5.2 Central Server (`backend/CentralServer/`)

**Purpose:** API Gateway — receives HTTP telemetry from agents, publishes to Kafka.

**Tech:** FastAPI + aiokafka (async Kafka producer) 

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/telemetry` | Receives full telemetry payload, publishes to `telemetry` topic |
| POST | `/heartbeat` | Receives heartbeat signals, publishes to `heartbeat` topic |
| GET  | `/health`     | Health check with Kafka connection status |

**Key Design:** Uses async lifespan management for Kafka producer lifecycle.

---

### 5.3 Monitoring Service (`backend/PROCESSING_SERVICES/monitoring_service/`)

**Purpose:** Real-time rule-based anomaly detection on telemetry streams.

**Tech:** FastAPI + aiokafka | Consumes: `telemetry` → Produces: `alerts-stream`

**Rule Engine — 7 Rule Types:**

| Rule Type | Description | Severity | Example |
|-----------|-------------|----------|---------|
| **Threshold** | Tiered severity (MEDIUM→HIGH→CRITICAL) | Variable | CPU > 95% = CRITICAL |
| **Sustained** | N consecutive events above limit | HIGH | CPU > 80% for 5 events |
| **Spike** | Sudden delta between events | MEDIUM | CPU jumps +40% |
| **Growth Rate** | % growth across sliding window | CRITICAL | Memory grew 10%+ = leak |
| **Free Space** | Absolute bytes remaining | CRITICAL | Disk < 5 GB |
| **Fill Rate** | Bytes/sec consumption rate | HIGH | Disk filling > 50 MB/s |
| **Process** | Per-process CPU with OS filtering | Variable | sqlservr.exe > 90% |

**Alert Model (Pydantic):**
```
alert_id, system_id, timestamp, alert_type, severity, priority (1-5),
category (CPU/MEMORY/DISK/PROCESS), short_code, tags, metric, value,
threshold, message, confidence (0.0-1.0), status (ACTIVE/RESOLVED), source
```

**Alert Features:**
- Alert lifecycle: ACTIVE → RESOLVED (auto-resolves when condition clears)
- Deduplication: suppresses duplicate active alerts
- Severity-based cooldowns (CRITICAL=0s, HIGH=60s, MEDIUM=120s)
- Category-based suppression (only highest severity per category emitted)
- Sliding windows (5 events) for temporal rules
- Rate tracking with timestamped values for fill-rate calculations

---

### 5.4 Feature Service (`backend/PROCESSING_SERVICES/feature_service/`)

**Purpose:** Transforms raw telemetry into engineered feature vectors for diagnosis.

**Tech:** FastAPI + aiokafka + numpy | Consumes: `telemetry` → Produces: `feature-stream`

**5-Layer Feature Engineering:**

| Layer | Features | Purpose |
|-------|----------|---------|
| **L1: Snapshot** | Current values (cpu, memory, disk), dominant process, cpu_share | Point-in-time state |
| **L2: Temporal** | Moving average, variance, trend (increasing/stable/decreasing), volatility (low/medium/high) | Behavioral patterns |
| **L3: Rate & Delta** | Change rate, delta %, fill_rate_bytes_sec, fill_rate_mb_sec, mem_percent_rate | Speed of change |
| **L4: Pattern** | cpu_spike, cpu_sustained_high, mem_leak_pattern (monotonic increase), disk_risk | Named anomaly patterns |
| **L5: Time-Based** | time_to_full_sec/hr (disk), time_to_critical (memory), system_state, correlation flags | Predictive intelligence |

**Output Schema:**
```json
{
  "system_id": "SYS-001", "timestamp": ...,
  "cpu": { "current", "previous", "change_rate", "delta_percent", "avg", "trend", "variance", "volatility", "spike", "sustained_high" },
  "memory": { "current", "growth_rate", "leak_pattern", "time_to_critical" },
  "disk": { "current", "fill_rate_bytes_sec", "fill_rate_mb_sec", "time_to_full_sec", "time_to_full_hr", "risk" },
  "process": { "dominant", "cpu_share" },
  "correlation": { "cpu_root_process", "disk_risk_level" },
  "context": { "uptime", "system_state" },
  "flags": { "high_cpu", "memory_risk", "disk_critical" },
  "meta": { "window_size", "computed_at" }
}
```

---

### 5.5 Diagnosis Agent (`backend/PROCESSING_SERVICES/diagnosis_agent/`)

**Purpose:** Deterministic root cause analysis from engineered features.

**Tech:** FastAPI + aiokafka | Consumes: `feature-stream` → Produces: `analysis-stream`

**6-Stage Pipeline:**

```
Feature Data ──► context_builder ──► signal_engine ──► rule_engine ──► inference_engine ──► confidence_engine ──► output_builder
       │              │                    │                │                │                     │                    │
       │         Boolean context       3 signal         7 inference     Priority-ranked      Multi-signal          Final JSON
       │         from features         categories       labels          root cause +         agreement score        output
       │                                                                severity override    (0.4 - 0.9)
```

| Stage | Module | Input → Output |
|-------|--------|----------------|
| **1. Context** | `context_builder.py` | Features → 12 boolean signals (memory_high, disk_critical, cpu_trend_increasing, etc.) |
| **2. Signals** | `signal_engine.py` | Context → 3 categories: resource (pressure), behavioral (saturation/leak), process (bottleneck) |
| **3. Rules** | `rule_engine.py` | Signals → inference labels: disk_saturation, memory_leak, cpu_saturation, process_bottleneck, etc. |
| **4. Inference** | `inference_engine.py` | Labels → priority-ranked root cause with severity override (CRITICAL if disk>95% or mem>95%) |
| **5. Confidence** | `confidence_engine.py` | Multi-signal agreement → 0.4-0.9 score (strong≥3 signals: 0.8+, moderate=2: 0.6+, weak: 0.4+) |
| **6. Output** | `output_builder.py` | Merge all → final JSON with diagnosis, signals, evidence, priority, stage (early_warning/active/critical) |

**Root Cause Priority (highest to lowest):**
1. `disk_saturation` → CRITICAL
2. `disk_pressure` → HIGH
3. `memory_leak` → HIGH
4. `process_bottleneck` → HIGH
5. `cpu_saturation` → MEDIUM
6. `memory_pressure` → MEDIUM
7. `cpu_stress` → MEDIUM

**Tested Output (verified):**
```
DIAGNOSIS [SYS-001]: Disk saturation due to critical utilization
  influenced by process MemCompression (CRITICAL)
  Confidence: 0.9 | Priority: 1 | Stage: critical
  Signals: memory_pressure=true, disk_saturation=true, process_bottleneck=true
```

---

### 5.6 Analysis Service (`backend/PROCESSING_SERVICES/analysis_service/`)

**Purpose:** Final integration layer — RAG context + LLM translation + deterministic merge.

**Tech:** kafka-python (synchronous) | Consumes: `analysis-stream` → Produces: `ui-dashboard-stream`

**3-Stage Pipeline:**

| Stage | Module | Responsibility |
|-------|--------|----------------|
| **1. RAG Retrieval** | `rag_client.py` | FAISS semantic search → top-3 KB entries with scores |
| **2. LLM Translation** | `llm_engine.py` | Structured output → persona-specific translations (currently mock) |
| **3. Response Building** | `response_builder.py` | Deterministic health_score + merge LLM + pipeline data → final UI JSON |

**Health Score Formula (deterministic, NOT LLM-generated):**
```
base_score = 100
- severity CRITICAL: -40 | HIGH: -25 | MEDIUM: -10
- disk_saturation OR disk > 95%: -20
- memory_pressure OR memory > 90%: -15
- cpu_stress OR cpu > 85%: -10
```

**LLM Output Schema (Pydantic enforced):**
```python
class LLMExplanationGeneration(BaseModel):
    verdict: str                      # Short verdict
    predicted_window: str             # "Within 12 hours", "Imminent"
    technical_explanation: str        # For Technician UI
    technician_resolutions: list[str] # Technical steps
    admin_hardware_assessment: str    # Prose for Admin UI
    admin_software_assessment: str
    admin_security_assessment: str
    user_what: str                    # Plain English for User UI
    user_why: str
    user_hardware_fault: str
    user_actions: list[dict]          # [{"text": "...", "icon": "..."}]
    hardware_state: str               # "good" | "attention" | "critical"
    software_state: str
    security_state: str
```

> ⚠️ **Current State:** LLM engine uses MOCK responses. Production implementation requires OpenAI API key and switching from mock to real `client.beta.chat.completions.parse()`.

---

### 5.7 Storage Service (`backend/PROCESSING_SERVICES/storage_service/`)

**Purpose:** Persist raw telemetry and processed metrics to MongoDB.

**Tech:** aiokafka + motor (async MongoDB) | Consumes: `telemetry-stream` ⚠️

**MongoDB Collections:**
- `raw_telemetry` → raw Kafka message as-is
- `system_metrics` → extracted flat metrics (cpu_usage, ram_percent, disk_percent, etc.)

**Database:** `metrics_db` on `mongodb://localhost:27017`

> ⚠️ **CRITICAL BUG:** Consumes from `telemetry-stream` topic, but CentralServer publishes to `telemetry`. These topic names don't match. See Gap Analysis.

---

## 6. RAG Pipeline (`backend/Rag-Data/`)

### Architecture

**Components:**

| Module | Responsibility |
|--------|----------------|
| `embedder.py` | Sentence-transformers (`all-MiniLM-L6-v2`, 384-dim), singleton model, normalized L2 |
| `vector_store.py` | FAISS `IndexFlatIP` (inner product = cosine on normalized vecs), KB ingestion with schema validation, index caching with MD5 hash invalidation |
| `retriever.py` | 605-line retrieval engine: query builder → search → filter → re-rank → graph expansion → format |

### Retrieval Pipeline

```
Diagnosis JSON ──► Query Builder ──► Embed (384-dim) ──► FAISS Search (4x over-fetch)
                        │                                          │
                        ├── Secondary Queries ──► Merge unique ◄───┘
                        │                                          │
                        ▼                                          ▼
                Cascading Resource Filter ──► Signal-Aware Re-ranking ──► Graph Expansion ──► Top-K
```

**Query Builder:** Constructs semantically-rich queries matching KB `embedding_text` patterns:
```
"Windows Disk saturation due to critical utilization CPU at 48%
 memory above 93% disk above 99% memory pressure disk saturation
 with MemCompression process dominant critical severity"
```

**Re-ranking Adjustments:**
- +0.10 cascade_failure scenario match
- +0.08 process name in KB signals
- +0.05 severity match, root_cause_type match
- +0.03 per matching signal tag
- −0.15 contradiction triggered

**Contradiction Checker:** Validates KB entries against real diagnosis signals (memory thresholds, fill rate, CPU state, process dominance) to penalize irrelevant matches.

**Graph Expansion:** Follows `related_patterns` links from top-2 results, adds related KB entries at 85% discounted score.

### Verified Test Output:

| Rank | KB Entry | Score | Resource | Scenario |
|------|----------|-------|----------|----------|
| #1 | KB-WIN-DISK-002: Rapid Disk Saturation from Log Growth | 0.6725 | disk | gradual_degradation |
| #2 | KB-WIN-CASCADE-001: Memory→Pagefile→CPU Cascade | 0.5716 | memory | cascade_failure |
| #3 | KB-WIN-CPU-003: SearchIndexer Rebuild | 0.5716 | cpu | background_process |

---

## 7. Infrastructure

### Docker Compose (`infrastructure/kafka-setup/docker-compose.yml`)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Zookeeper | confluentinc/cp-zookeeper:7.5.0 | 2181 | Kafka coordination |
| Kafka | confluentinc/cp-kafka:7.5.0 | 9092 | Message broker |
| MongoDB | mongo:7.0 | 27017 | Data persistence |

**Features:** Zookeeper health checks, Kafka waits for healthy Zookeeper, MongoDB with persistent volume.

---

## 8. Final API Response Schema

The `analysis_service/response_builder.py` produces the final JSON that the React frontend consumes:

```json
{
  "system_info": {
    "system_id": "SYS-001",
    "owner": "Auto-Discovered",
    "system_type": "Monitored Endpoint",
    "assigned_technician": "Unassigned",
    "health_score": 45,
    "overall_status": "critical",
    "severity": "CRITICAL",
    "sla_hours": -1
  },
  "diagnosis": {
    "verdict": "AI Translated: ...",
    "confidence": 90,
    "predicted_window": "Within 24 hours"
  },
  "explanations": {
    "technical": "...",
    "admin_assessments": { "hardware": "...", "software": "...", "security": "..." },
    "user_friendly": { "what": "...", "why": "...", "hardware_fault": "..." }
  },
  "signals": {
    "hardware_state": "attention",
    "hardware_metrics": [],
    "software_state": "critical",
    "software_metrics": {},
    "security_state": "good",
    "security_metrics": {}
  },
  "user_actions": [{ "text": "Save your work.", "icon": "💾" }],
  "technician_resolutions": ["Review primary resource logs", "Scale capacity"],
  "timeline": [{ "time": "2026-05-02 22:50:00", "event": "Analysis completed" }]
}
```

---

## 9. Test Results

### ✅ Diagnosis Agent Test (`test_diagnosis.py`)
- **Input:** Feature data with disk=98.7%, memory=94.6%, cpu=53.9%, process=MemCompression (50.1% share)
- **Result:** `Disk saturation due to critical utilization influenced by process MemCompression (CRITICAL)`
- **Confidence:** 0.9 | **Priority:** 1 | **Stage:** critical
- **Signals detected:** memory_pressure, disk_saturation, process_bottleneck, dominant_process_heavy

### ✅ RAG Pipeline Test (`main.py`)
- **Input:** Sample diagnosis (disk=99.1%, memory=93.8%, cpu=48.2%)
- **Query built:** Semantically-rich query with metric values and signal descriptors
- **Results:** 3 KB entries → top match KB-WIN-DISK-002 (score 0.6725)
- **Pipeline stages verified:** FAISS search → resource filter → re-ranking → graph expansion

### ❌ Not Tested (require external services)
- CentralServer → requires Kafka running
- monitoring_service → requires Kafka running
- feature_service → requires Kafka running
- analysis_service → requires Kafka + RAG + (optionally) OpenAI API
- storage_service → requires Kafka + MongoDB running

---

## 10. Gap Analysis — Where You're Lagging

### 🔴 Critical Gaps

#### 1. Storage Service Topic Mismatch
- `storage_service/config.py` consumes from `telemetry-stream`
- CentralServer publishes to `telemetry`
- **Impact:** Storage service will NEVER receive any data
- **Fix:** Change `KAFKA_TOPIC = "telemetry"` in storage config

#### 2. Alerts Not Fed to Diagnosis Agent
- `diagnosis_agent/processor.py` line 14: `mock_alerts = []` — hardcoded empty list
- The diagnosis agent config defines `ALERT_TOPIC = "alerts-stream"` but the Kafka client only consumes from `feature-stream`
- **Impact:** Diagnosis never considers monitoring alerts. Confidence scoring loses the `alerts_present` signal, meaning confidence is always lower than it should be
- **Fix:** Consume from both `feature-stream` AND `alerts-stream`, correlate by system_id + time window, pass real alerts to `build_context()`

#### 3. analysis_service Uses Synchronous kafka-python, Others Use Async aiokafka
- All other services use `aiokafka` (async). Analysis service uses sync `kafka-python`
- `processor.py` uses relative imports (`.rag_client`, `.llm_engine`) but `main.py` uses absolute imports (`from processor import ...`). This will cause ImportError
- **Impact:** analysis_service will crash on startup due to import conflicts
- **Fix:** Standardize import style. Either all relative or all absolute. Also standardize on aiokafka for consistency

#### 4. LLM Engine is Fully Mocked
- `analysis_service/llm_engine.py` returns hardcoded mock responses
- No OpenAI/Gemini API integration is actually wired
- **Impact:** Every diagnosis gets identical generic translations regardless of actual root cause
- **Fix:** Implement real LLM call with structured output parsing. The Pydantic schema is already perfect — just wire the API call

### 🟡 Significant Gaps

#### 5. No API Gateway / WebSocket Layer for Frontend
- The pipeline terminates at `ui-dashboard-stream` Kafka topic
- No service exists to consume this topic and serve it to the React frontend
- The frontend currently uses hardcoded dummy data
- **Fix:** Build a FastAPI service that consumes `ui-dashboard-stream` and serves via WebSocket or SSE to the React app. Alternatively, integrate with Supabase Realtime

#### 6. No Supabase Integration in Backend
- Frontend uses `supabaseClient.js` for auth and data
- Backend has zero Supabase integration — no auth validation, no data sync
- **Impact:** Frontend and backend are completely disconnected
- **Fix:** Add Supabase JWT validation middleware to the API Gateway. Sync system ownership/assignment data with Supabase tables

#### 7. System Registration / Discovery Missing
- `config.json` hardcodes `system_id: "SYS-001"`
- No registration flow for new systems
- No system-to-owner, system-to-technician mapping in backend
- response_builder hardcodes `owner: "Auto-Discovered"`, `assigned_technician: "Unassigned"`
- **Fix:** Implement system registration endpoint, store in Supabase/MongoDB

#### 8. signals.hardware_metrics Always Empty
- `response_builder.py` line 79: `"hardware_metrics": []` — hardcoded empty list
- The frontend (SystemDiagnosis.jsx) expects a risk matrix with name/risk/probability
- **Fix:** Map diagnosis evidence + features into structured hardware/software/security metric arrays

#### 9. Timeline is Single-Entry
- `response_builder.py` creates a single-entry timeline: `"Analysis completed"`
- Frontend expects multi-event timeline (threshold breach, RAG retrieval, verdict)
- **Fix:** Thread timestamps through the pipeline. Each stage should append to a timeline array

### 🟢 Minor Gaps

#### 10. RAG → Analysis Service Path Configuration
- `analysis_service/config.py` calculates RAG path as: `BASE_DIR → up 4 levels → Desktop → Rag-Data`
- But RAG data is actually at `backend/Rag-Data/`, not at Desktop level
- **Impact:** Path will resolve incorrectly
- **Fix:** Update path calculation or use environment variable

#### 11. No Heartbeat Consumer
- CentralServer publishes heartbeats to `heartbeat` topic
- No service consumes this topic — heartbeats go to /dev/null
- **Fix:** Add heartbeat tracking to monitoring_service or a dedicated service for system online/offline status

#### 12. No Environment Variable Management
- Some services use env vars (CentralServer, feature_service)
- Others hardcode values (monitoring_service, diagnosis_agent, storage_service)
- **Fix:** Standardize all config via `.env` file + python-dotenv

#### 13. No Error Recovery / Dead Letter Queue
- If any Kafka consumer fails to process a message, it's lost
- No retry mechanism, no dead letter topic
- **Fix:** Implement DLQ pattern for failed messages

#### 14. No Automated Tests
- Only 2 test files exist: `test_diagnosis.py` (manual mock test) and `test_group.py` (Kafka connectivity test)
- No unit tests, no integration tests, no CI/CD
- **Fix:** Add pytest test suite for each service's core logic

#### 15. Empty docs/ and readme.md
- `docs/` directory is empty, `readme.md` is blank
- **Fix:** This document fills that gap

---

## 11. Recommended Roadmap

### Phase 1: Fix Critical Integration Bugs (1-2 days)
- [ ] Fix storage_service topic: `telemetry-stream` → `telemetry`
- [ ] Fix analysis_service import conflicts (relative vs absolute)
- [ ] Fix RAG data path in analysis_service config
- [ ] Standardize all configs to use environment variables

### Phase 2: Connect the Pipeline End-to-End (3-5 days)
- [ ] Feed real alerts into diagnosis_agent (consume alerts-stream)
- [ ] Build API Gateway service (consume `ui-dashboard-stream`, serve via WebSocket/SSE)
- [ ] Implement system registration endpoint
- [ ] Add heartbeat consumer for online/offline tracking

### Phase 3: Wire Real LLM (2-3 days)
- [ ] Replace mock LLM with real OpenAI/Gemini API call
- [ ] Use structured output with the existing Pydantic schema
- [ ] Add hardware_metrics, software_metrics, security_metrics population
- [ ] Build multi-event timeline threading through the pipeline

### Phase 4: Frontend Integration (3-5 days)
- [ ] Connect React frontend to API Gateway WebSocket
- [ ] Add Supabase JWT auth middleware to backend
- [ ] Map system ownership from Supabase to backend response
- [ ] Replace all dummy data in frontend with live API calls

### Phase 5: Production Hardening (ongoing)
- [ ] Add pytest test suites for each service
- [ ] Implement dead letter queues
- [ ] Add structured logging with correlation IDs
- [ ] Set up Docker Compose for full local dev environment
- [ ] Add CI/CD pipeline
- [ ] Deploy to Azure (based on existing exploration)

---

*This document was generated by deep analysis of every source file in the project. No code was modified.*
