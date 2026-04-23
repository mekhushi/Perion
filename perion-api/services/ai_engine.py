import os
import json
import google.generativeai as genai
from models import Incident, AnalysisReport
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

async def analyze_incident(incident: Incident) -> AnalysisReport:
    """
    Uses Google Gemini to analyze the incident and produce a structured report.
    """
    if not api_key:
        # Fallback for manual testing or missing key
        return AnalysisReport(
            incident_id=incident.id,
            summary=f"Automated summary for: {incident.message}",
            root_cause_hypothesis="Hypothetical root cause based on message pattern.",
            severity_assessment=incident.severity.upper(),
            impact_level="Medium",
            suggested_fix="Check logs and recent commits.",
            contributor_suitability="Help Wanted",
            tags=["automated", incident.source.service]
        )

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    You are an expert Reliability Engineer at Perion. 
    Analyze the following system incident and provide a structured JSON report.
    
    INCIDENT DATA:
    Service: {incident.source.service}
    Component: {incident.source.component}
    Severity: {incident.severity}
    Message: {incident.message}
    Stack Trace: {incident.stack_trace or "None provided"}
    Metadata: {json.dumps(incident.metadata)}
    
    RESPONSE FORMAT (JSON):
    {{
        "summary": "Short, clear explanation of what happened",
        "root_cause_hypothesis": "The most likely technical reason for this failure",
        "severity_assessment": "Independent assessment of severity (LOW, MEDIUM, HIGH, CRITICAL)",
        "impact_level": "Degree of user impact",
        "suggested_fix": "Concrete code or configuration steps to resolve this",
        "contributor_suitability": "Tag one: 'Good First Issue' (simple), 'Help Wanted' (moderate), 'Core Maintainer' (complex/security)",
        "tags": ["list", "of", "relevant", "tags"]
    }}
    
    Ensure the JSON is valid and strictly follows the schema.
    """
    
    response = model.generate_content(prompt)
    
    try:
        # Clean response text in case Gemini adds markdown backticks
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
            
        data = json.loads(text)
        
        return AnalysisReport(
            incident_id=incident.id,
            summary=data.get("summary", ""),
            root_cause_hypothesis=data.get("root_cause_hypothesis", ""),
            severity_assessment=data.get("severity_assessment", incident.severity.upper()),
            impact_level=data.get("impact_level", "Unknown"),
            suggested_fix=data.get("suggested_fix"),
            contributor_suitability=data.get("contributor_suitability", "Help Wanted"),
            tags=data.get("tags", [])
        )
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        # Fallback report
        return AnalysisReport(
            incident_id=incident.id,
            summary="Failed to parse AI analysis. Raw result available in logs.",
            root_cause_hypothesis="Undetermined",
            severity_assessment="UNKNOWN",
            impact_level="UNKNOWN",
            contributor_suitability="Core Maintainer",
            tags=["error"]
        )
