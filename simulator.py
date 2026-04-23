import httpx
import time
import random
import asyncio

API_URL = "http://localhost:8000/incident"

INCIDENTS = [
    {
        "severity": "critical",
        "message": "Database connection pool exhausted in 'auth-service'. Transactions are failing.",
        "stack_trace": "ConnectionTimeout: Timeout waiting for connection from pool at postgres.py:124",
        "source": {"service": "auth-service", "component": "database", "version": "1.4.2"},
        "metadata": {"pool_size": 20, "active_conns": 20}
    },
    {
        "severity": "high",
        "message": "Malformed JWT signature detected from unknown source IP 192.168.1.45.",
        "stack_trace": "SignatureVerificationError: Invalid signature format at jwt_handler.py:56",
        "source": {"service": "gateway", "component": "security", "version": "2.1.0"},
        "metadata": {"attacker_ip": "192.168.1.45"}
    },
    {
        "severity": "medium",
        "message": "Slow response times ( > 2s) detected on /api/v1/search endpoint.",
        "stack_trace": None,
        "source": {"service": "search-api", "component": "elastic-proxy", "version": "0.9.5"},
        "metadata": {"latency_ms": 2450}
    },
    {
        "severity": "low",
        "message": "Worker node cpu-04 is reporting higher than average disk I/O wait.",
        "stack_trace": None,
        "source": {"service": "infrastructure", "component": "k8s-node", "version": "v1.24"},
        "metadata": {"io_wait": "15%"}
    }
]

async def trigger_incident():
    incident = random.choice(INCIDENTS)
    print(f"Triggering incident: {incident['message']}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, json=incident)
            print(f"Status: {response.status_code}, ID: {response.json().get('incident_id')}")
        except Exception as e:
            print(f"Failed to connect to API: {e}")

async def main():
    print("Perion System Simulator Started...")
    print("Injecting sample incidents into the pipeline...")
    for _ in range(3):
        await trigger_incident()
        await asyncio.sleep(2)
    
    print("\nKeep this script running to trigger occasional incidents or stop to finish.")
    while True:
        await asyncio.sleep(60) # Monthly heartbeats or random bursts
        if random.random() > 0.7:
            await trigger_incident()

if __name__ == "__main__":
    asyncio.run(main())
