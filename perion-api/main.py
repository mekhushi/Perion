import os
import uuid
from typing import List
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import Incident, AnalysisReport, SystemState
from services.ai_engine import analyze_incident
from datetime import datetime

app = FastAPI(title="Perion API", description="Intelligent Engineering Ops Engine")

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo purposes
incidents_db = []
analysis_reports = {}

@app.get("/")
async def root():
    return {"message": "Perion API is active", "status": "operational"}

@app.post("/incident", response_model=dict)
async def ingest_incident(incident: Incident, background_tasks: BackgroundTasks):
    # Assign ID if not present
    if not incident.id:
        incident.id = str(uuid.uuid4())
    
    incidents_db.append(incident)
    
    # Trigger AI analysis in background for efficiency
    background_tasks.add_task(process_incident_analysis, incident)
    
    return {"status": "ingested", "incident_id": incident.id}

async def process_incident_analysis(incident: Incident):
    try:
        report = await analyze_incident(incident)
        analysis_reports[incident.id] = report
        print(f"Analysis complete for incident {incident.id}")
    except Exception as e:
        print(f"Analysis failed for incident {incident.id}: {str(e)}")

@app.get("/incidents", response_model=List[Incident])
async def get_incidents():
    return incidents_db[::-1] # Most recent first

@app.get("/analysis/{incident_id}", response_model=AnalysisReport)
async def get_analysis(incident_id: str):
    if incident_id not in analysis_reports:
        raise HTTPException(status_code=404, detail="Analysis still in progress or not found")
    return analysis_reports[incident_id]

@app.get("/system-health", response_model=SystemState)
async def get_system_health():
    # Mock global state
    return SystemState(
        health_score=85 if len(incidents_db) < 5 else 60,
        active_incidents=len([i for i in incidents_db if i.severity in ["high", "critical"]]),
        resolved_today=len(analysis_reports),
        uptime="99.98%"
    )
