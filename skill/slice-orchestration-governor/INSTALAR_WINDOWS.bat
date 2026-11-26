@echo off
chcp 65001 >nul
where node >nul 2>nul || (echo Node.js nao encontrado. Instale Node.js e tente novamente.& pause & exit /b 1)
node "%~dp0scripts\install.mjs"
if errorlevel 1 (echo. & echo Instalacao falhou. & pause & exit /b 1)
echo. & echo Instalacao concluida. & pause
