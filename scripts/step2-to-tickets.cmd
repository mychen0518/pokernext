@echo off
chcp 65001>nul
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0step2-to-tickets.ps1"
