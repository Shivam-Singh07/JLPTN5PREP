Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Deploying JLPT N5 Prep Master to Vercel" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Building production bundle..." -ForegroundColor Yellow
npm run build

Write-Host "`n[2/2] Deploying to Vercel..." -ForegroundColor Yellow
npx vercel deploy web/dist --prod

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
