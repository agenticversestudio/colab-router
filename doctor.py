#!/usr/bin/env python3
"""
Colab Router Doctor - Root Entrypoint
Runs scripts/doctor.py
"""
import os, sys, runpy

if __name__ == "__main__":
    root = os.path.dirname(os.path.abspath(__file__))
    script = os.path.join(root, "scripts", "doctor.py")
    runpy.run_path(script, run_name="__main__")
