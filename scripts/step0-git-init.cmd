@echo off
chcp 65001>nul
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0step0-git-init.ps1"
