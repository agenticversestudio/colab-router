#!/usr/bin/env bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"
echo "========================================================"
echo " Colab Router - Colab Shift Orchestrator (best-effort)"
echo "========================================================"
python3 -u orchestrator/orchestrator.py
