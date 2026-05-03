from pydantic import BaseModel
from typing import Dict, Any, List, Optional


class CPUModel(BaseModel):
    current: float
    previous: float
    change_rate: float
    delta_percent: float
    avg: float
    trend: str
    variance: float
    volatility: str
    spike: bool
    sustained_high: bool


class MemoryModel(BaseModel):
    current: float
    growth_rate: float
    leak_pattern: bool
    time_to_critical: Optional[float] = None


class DiskModel(BaseModel):
    current: float
    fill_rate_bytes_sec: float
    fill_rate_mb_sec: float
    time_to_full_sec: Optional[float] = None
    time_to_full_hr: Optional[float] = None
    risk: bool


class ProcessModel(BaseModel):
    dominant: str
    cpu_share: float


class FeatureModel(BaseModel):
    system_id: str
    timestamp: int

    cpu: CPUModel
    memory: MemoryModel
    disk: DiskModel
    process: ProcessModel

    correlation: Dict[str, Any]
    context: Dict[str, Any]
    flags: Dict[str, Any]
    meta: Dict[str, Any]


class AlertModel(BaseModel):
    alert_id: str
    system_id: str
    timestamp: int
    alert_type: str
    severity: str
    priority: int
    category: str
    short_code: str
    tags: Dict[str, Any]
    metric: str
    value: float
    threshold: Optional[float] = None
    message: str
    confidence: float
    status: str
    source: str



class PredictionModel(BaseModel):
    anomaly_score: float
    risk_level: str


# -------- OUTPUT MODEL -------- #

class DiagnosisModel(BaseModel):
    root_cause: str
    primary_resource: str
    severity: str
    confidence: float
    category: str
    stage: str
    impact: List[str]


class OutputModel(BaseModel):
    system_id: str
    timestamp: int

    diagnosis: DiagnosisModel
    signals: Dict[str, Any]
    evidence: Dict[str, Any]
    priority: int
    meta: Dict[str, Any]