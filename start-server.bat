@echo off
echo Starting CoastalEngineer Pro Local Server...
echo.
echo Opening browser at http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:8000
python -m http.server 8000
