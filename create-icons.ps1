Add-Type -AssemblyName System.Drawing

function New-FWorkIcon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # 파란 그라디언트 배경 (#0055FF → #00B0FF, 대각선)
    $c1 = [System.Drawing.Color]::FromArgb(0, 85, 255)
    $c2 = [System.Drawing.Color]::FromArgb(0, 176, 255)
    $pt1 = New-Object System.Drawing.PointF(0, 0)
    $pt2 = New-Object System.Drawing.PointF($Size, $Size)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt1, $pt2, $c1, $c2)
    $g.FillRectangle($gradBrush, 0, 0, $Size, $Size)
    $gradBrush.Dispose()

    # "F" 텍스트 (흰색, 중앙 정렬)
    $fontSize = [float]($Size) / 2.0
    if ($fontSize -lt 1) { $fontSize = 1.0 }
    try {
        $font = New-Object System.Drawing.Font("Arial Black", $fontSize, [System.Drawing.FontStyle]::Bold)
    } catch {
        try {
            $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        } catch {
            $font = [System.Drawing.SystemFonts]::DefaultFont
        }
    }
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf    = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect  = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $g.DrawString("F", $font, $brush, $rect, $sf)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $font.Dispose(); $brush.Dispose(); $bmp.Dispose()
    Write-Host "생성 완료: $Path  ($Size x $Size)"
}

$iconsDir = Join-Path $PSScriptRoot "icons"
if (!(Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir | Out-Null }

New-FWorkIcon -Size 192  -Path (Join-Path $iconsDir "icon-192.png")
New-FWorkIcon -Size 512  -Path (Join-Path $iconsDir "icon-512.png")
New-FWorkIcon -Size 192  -Path (Join-Path $iconsDir "icon-maskable-192.png")
New-FWorkIcon -Size 512  -Path (Join-Path $iconsDir "icon-maskable-512.png")
New-FWorkIcon -Size 180  -Path (Join-Path $iconsDir "apple-touch-icon.png")
New-FWorkIcon -Size 48   -Path (Join-Path $iconsDir "favicon-48.png")

Write-Host ""
Write-Host "모든 아이콘이 icons\ 폴더에 생성되었습니다."
Write-Host "PWA를 재설치(홈화면 추가)하면 새 아이콘이 적용됩니다."
