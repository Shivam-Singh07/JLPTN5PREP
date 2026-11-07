# Launch JLPT N5 Master Web App
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "      JLPT N5 Master Prep Web Application           " -ForegroundColor Magenta
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening web application at http://localhost:5173 ..." -ForegroundColor Green

Set-Location "$PSScriptRoot\web"
Start-Process "http://localhost:5173"
npm run preview -- --port 5173

