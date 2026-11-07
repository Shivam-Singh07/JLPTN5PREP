@echo off
title JLPT N5 Master Prep App
echo ====================================================
echo       JLPT N5 Master Prep Web Application
echo ====================================================
echo.
echo Starting web application on http://localhost:5173 ...
echo.
cd web
start http://localhost:5173
npm run preview -- --port 5173
pause

