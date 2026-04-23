from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class IncidentSource(BaseModel):
    service: str
    component: Optional[str] = None
    version: Optional[str] = None

class Incident(BaseModel):
    id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    severity: str # "low", "medium", "high", "critical"
    message: str
    stack_trace: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    source: IncidentSource

class AnalysisReport(BaseModel):
    incident_id: str
    summary: str
    root_cause_hypothesis: str
    severity_assessment: str
    impact_level: str
    suggested_fix: Optional[str] = None
    contributor_suitability: str # "Good First Issue", "Help Wanted", "Core Maintainer"
    tags: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.now)

class SystemState(BaseModel):
    health_score: int # 0-100
    active_incidents: int
    resolved_today: int
    uptime: str
