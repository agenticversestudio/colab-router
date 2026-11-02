@echo off
title Colab Router Autonomous 24/7 Orchestrator
cd /d "%~dp0\.."
echo ========================================================
echo  Colab Router - Autonomous 24/7 Cloud Orchestrator
echo ========================================================
python -u orchestrator\orchestrator.py
pause
