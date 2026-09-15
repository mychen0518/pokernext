@echo off
chcp 65001>nul
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0step1-grill.ps1"
