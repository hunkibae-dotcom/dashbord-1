Add-Type -AssemblyName System.Drawing

function New-FWorkIcon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # 검정 배경
    $g.Clear([System.Drawing.Color]::Black)

    # 흰 테두리 (2% 두께)
    $bw = [int]([Math]::Max(2, $Size * 0.025))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $bw)
    $half = [int]($bw / 2)
    $g.DrawRectangle($pen, $half, $half, $Size - $bw, $Size - $bw)

    # "F" 텍스트
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
    $g.Dispose(); $font.Dispose(); $brush.Dispose(); $pen.Dispose(); $bmp.Dispose()
    Write-Host "생성 완료: $Path  ($Size x $Size)"
}

$iconsDir = Join-Path $PSScriptRoot "icons"
if (!(Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir | Out-Null }

New-FWorkIcon -Size 192  -Path (Join-Path $iconsDir "icon-192.png")
New-FWorkIcon -Size 512  -Path (Join-Path $iconsDir "icon-512.png")
New-FWorkIcon -Size 180  -Path (Join-Path $iconsDir "apple-touch-icon.png")
New-FWorkIcon -Size 48   -Path (Join-Path $iconsDir "favicon-48.png")

Write-Host ""
Write-Host "모든 아이콘이 icons\ 폴더에 생성되었습니다."
Write-Host "PWA를 재설치(홈화면 추가)하면 새 아이콘이 적용됩니다."
