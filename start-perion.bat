@echo off
echo Starting Perion: The Intelligent Engineering Ops Engine...

start "Perion Backend" /D "perion-api" cmd /k "python -m pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000"
timeout /t 5
start "Perion UI" /D "perion-ui" cmd /k "npm install && npm run dev"
timeout /t 5
start "Perion Simulator" cmd /k "python simulator.py"

echo Perion is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
