# GitHub Repository Setup Script for Data Structure Visualizer
# Run this script to automatically set up and push to GitHub

Write-Host "=== GitHub Repository Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if repository exists
Write-Host "Checking if repository exists..." -ForegroundColor Yellow
$null = git ls-remote https://github.com/Tanzyl/data-structure-visualizer.git 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Repository exists! Pushing code..." -ForegroundColor Green
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository URL: https://github.com/Tanzyl/data-structure-visualizer" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/Tanzyl/data-structure-visualizer/settings/pages" -ForegroundColor White
        Write-Host "2. Select main branch under Source" -ForegroundColor White
        Write-Host "3. Click Save" -ForegroundColor White
        Write-Host "4. Your site will be live at: https://tanzyl.github.io/data-structure-visualizer/" -ForegroundColor Green
    }
} else {
    Write-Host "Repository not found on GitHub." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create the repository first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: data-structure-visualizer" -ForegroundColor White
    Write-Host "3. Set to Public" -ForegroundColor White
    Write-Host "4. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
    Write-Host "5. Click Create repository" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run: git push -u origin main" -ForegroundColor Yellow
}
