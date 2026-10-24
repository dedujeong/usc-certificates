@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0usc.ps1" -Action Status
pause
