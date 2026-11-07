@echo off
echo ==============================================
echo   Deploying JLPT N5 Prep Master to Vercel
echo ==============================================

echo [1/2] Building latest static assets...
call npm run build

echo [2/2] Deploying to Vercel...
call npx vercel deploy web/dist --prod

echo Done!
pause

