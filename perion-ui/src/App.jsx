import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Server, Inbox, FileText, ActivitySquare } from 'lucide-react';
import './index.css';

const API_BASE = 'http://localhost:8000';

function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [health, setHealth] = useState({ health_score: 100, active_incidents: 0, resolved_today: 0, uptime: '100%' });
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    fetchIncidents();
    fetchHealth();
    const interval = setInterval(() => {
      fetchIncidents();
      fetchHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      const data = await res.json();
      setIncidents(data);
    } catch (e) { console.error("API Error", e); }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/system-health`);
      const data = await res.json();
      setHealth(data);
    } catch (e) { console.error("Health API Error", e); }
  };

  const selectIncident = async (incident) => {
    setSelectedIncident(incident);
    setAnalysis(null);
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${API_BASE}/analysis/${incident.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      } else {
        setAnalysis({ summary: "Analysis in progress... Check back in a few seconds." });
      }
    } catch (e) {
      setAnalysis({ summary: "Error fetching analysis report." });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', minHeight: '100vh' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivitySquare color="#000000" size={20} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>PerionOps</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: health.health_score > 70 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
          {health.health_score > 70 ? 'All systems operational' : 'System degradation detected'}
        </div>
      </header>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard title="System Health" value={`${health.health_score}%`} icon={<Activity size={16} />} />
        <MetricCard title="Active Incidents" value={health.active_incidents} icon={<AlertCircle size={16} />} />
        <MetricCard title="Resolved Today" value={health.resolved_today} icon={<CheckCircle size={16} />} />
        <MetricCard title="Uptime SLA" value={health.uptime} icon={<Clock size={16} />} />
      </div>

      {/* Main Layout */}
      <main style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', flexGrow: 1, alignItems: 'start' }}>
        
        {/* Sidebar / Incident List */}
        <section className="surface" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Recent Incidents
          </div>
          
          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            {incidents.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Inbox size={24} />
                No incidents reported
              </div>
            ) : (
              incidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => selectIncident(inc)}
                  className="surface-hover"
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid var(--border-subtle)', 
                    cursor: 'pointer',
                    background: selectedIncident?.id === inc.id ? 'var(--bg-surface-active)' : 'transparent',
                    borderLeft: selectedIncident?.id === inc.id ? '2px solid var(--text-primary)' : '2px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span className={`badge ${inc.severity}`}>{inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', lineHeight: '1.4' }}>
                    {inc.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <Server size={12} />
                    {inc.source.service}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Detail View */}
        <section className="surface" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedIncident ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
              <FileText size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Select an incident to view details</p>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span className={`badge ${selectedIncident.severity}`}>{selectedIncident.severity.toUpperCase()}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>ID: {selectedIncident.id}</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>{selectedIncident.message}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Server size={14} /> Service: {selectedIncident.source.service}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(selectedIncident.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Analysis Content */}
              <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, backgroundColor: 'var(--bg-main)' }}>
                {loadingAnalysis ? (
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px', alignItems: 'center' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Generating AI analysis...
                  </div>
                ) : analysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div className="surface" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{analysis.summary}</p>
                    </div>

                    <div className="surface" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Root Cause Hypothesis</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{analysis.root_cause_hypothesis}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="surface" style={{ padding: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Impact Level</div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{analysis.impact_level}</div>
                      </div>
                      <div className="surface" style={{ padding: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Suggested Assignee</div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{analysis.contributor_suitability}</div>
                      </div>
                    </div>

                    <div className="surface" style={{ padding: '0', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Suggested Fix</h3>
                      </div>
                      <pre className="font-mono" style={{ padding: '16px', margin: 0, fontSize: '13px', color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap', background: 'var(--bg-surface)' }}>
                        {analysis.suggested_fix || "No fix available."}
                      </pre>
                    </div>

                    {analysis.tags && analysis.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {analysis.tags.map(tag => (
                          <span key={tag} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-surface-active)', color: 'var(--text-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </main>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="surface" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
        {icon}
        {title}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

export default App;
