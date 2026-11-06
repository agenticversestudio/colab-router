@echo off
title Colab Router Colab Shift Orchestrator (best-effort)
cd /d "%~dp0\.."
echo ========================================================
echo  Colab Router - Colab Shift Orchestrator (best-effort)
echo ========================================================
python -u orchestrator\orchestrator.py
pause
