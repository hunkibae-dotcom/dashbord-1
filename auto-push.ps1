$folder = "C:\Users\배훈기(HunkiBae)\Desktop\Html\dashbord-1"
Set-Location $folder

function Get-LatestWriteTime {
    Get-ChildItem -Path "$folder\*" -Include *.html,*.js,*.json,*.css -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1 -ExpandProperty LastWriteTime
}

$lastWrite = Get-LatestWriteTime

Write-Host "Watching for changes... Press Ctrl+C to stop." -ForegroundColor Green

while ($true) {
    Start-Sleep -Seconds 3
    $current = Get-LatestWriteTime
    if ($current -ne $lastWrite) {
        Start-Sleep -Seconds 1
        $lastWrite = Get-LatestWriteTime
        Write-Host "Change detected. Pushing to GitHub..." -ForegroundColor Yellow
        git add .
        git commit -m "update"
        git push origin main
        Write-Host "Done." -ForegroundColor Cyan
    }
}
