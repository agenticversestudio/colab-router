@echo off
title GDQ Colab Autonomous 24/7 Orchestrator
cd /d "%~dp0\.."
echo ========================================================
echo  GDQ Colab Kit - Autonomous 24/7 Cloud Orchestrator
echo ========================================================
python -u orchestrator\orchestrator.py
pause
