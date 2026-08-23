# Erzeugt aus images/hero/DAlabLogo.png die abgeleiteten Bilder:
#   images/og-image.png    1200x600er Vorschaubild fuer Link-Previews (Slack, LinkedIn, ...)
#   images/favicon-32.png  Browser-Tab-Icon
#   images/favicon-180.png Icon fuer den Homescreen auf iOS
#
# Nur noetig, wenn das Logo ausgetauscht wurde. Aufruf im Website-Ordner:
#   powershell -ExecutionPolicy Bypass -File make-images.ps1

Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
$logoPath = Join-Path $root 'images\hero\DAlabLogo.png'
if (-not (Test-Path $logoPath)) { throw "Logo nicht gefunden: $logoPath" }
$logo = [System.Drawing.Bitmap]::FromFile($logoPath)

$main   = [System.Drawing.Color]::FromArgb(9, 70, 105)    # #094669
$accent = [System.Drawing.Color]::FromArgb(0, 175, 177)   # #00afb1

function New-Canvas($w, $h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode     = 'AntiAlias'
    $g.PixelOffsetMode   = 'HighQuality'
    , @($bmp, $g)
}

# ---- Vorschaubild: Markenverlauf + vollstaendiges Logo ----
$r = New-Canvas 1200 630; $bmp = $r[0]; $g = $r[1]
$rect  = New-Object System.Drawing.RectangleF(0, 0, 1200, 630)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $accent, $accent, 45.0)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
$blend.Colors    = @($accent, $main, $accent)
$blend.Positions = @(0.0, 0.5, 1.0)
$brush.InterpolationColors = $blend
$g.FillRectangle($brush, 0, 0, 1200, 630)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($accent)), 0, 626, 1200, 4)
$lw = 520; $lh = [int]($logo.Height * $lw / $logo.Width)
$g.DrawImage($logo, [int]((1200 - $lw) / 2), [int]((630 - $lh) / 2), $lw, $lh)
$g.Dispose()
$bmp.Save((Join-Path $root 'images\og-image.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
'images/og-image.png    1200x630'

# ---- Favicons: nur das DA-Monogramm, damit es bei 32px lesbar bleibt ----
# Das Logo besteht aus Monogramm (oben) und Wortmarke (unten), getrennt durch
# eine Leerzeile. Die Trennung wird hier ueber die Alphakanal-Zeilen gesucht,
# damit ein neues Logo nicht an fest verdrahteten Pixelwerten scheitert.
$rowFilled = @(0) * $logo.Height
for ($y = 0; $y -lt $logo.Height; $y++) {
    for ($x = 0; $x -lt $logo.Width; $x++) {
        if ($logo.GetPixel($x, $y).A -gt 20) { $rowFilled[$y] = 1; break }
    }
}
$monoH = 0
for ($y = 1; $y -lt $logo.Height; $y++) {
    if ($rowFilled[$y] -eq 0 -and $rowFilled[$y - 1] -eq 1) { $monoH = $y; break }
}
if ($monoH -eq 0) { $monoH = $logo.Height }

$minX = $logo.Width; $maxX = 0
for ($y = 0; $y -lt $monoH; $y++) {
    for ($x = 0; $x -lt $logo.Width; $x++) {
        if ($logo.GetPixel($x, $y).A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
}
$mw = $maxX - $minX + 1
$mono = New-Object System.Drawing.Bitmap($mw, $monoH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$mg = [System.Drawing.Graphics]::FromImage($mono)
$mg.DrawImage($logo, (New-Object System.Drawing.Rectangle(0, 0, $mw, $monoH)), $minX, 0, $mw, $monoH, [System.Drawing.GraphicsUnit]::Pixel)
$mg.Dispose()

foreach ($size in 32, 180) {
    $r = New-Canvas $size $size; $b = $r[0]; $g = $r[1]
    $g.Clear($main)
    $pad = [int]($size * 0.16)
    $box = $size - 2 * $pad
    $sc  = [Math]::Min($box / $mw, $box / $monoH)
    $dw  = [int]($mw * $sc); $dh = [int]($monoH * $sc)
    $g.DrawImage($mono, [int](($size - $dw) / 2), [int](($size - $dh) / 2), $dw, $dh)
    $g.Dispose()
    $b.Save((Join-Path $root "images\favicon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $b.Dispose()
    "images/favicon-$size.png  ${size}x${size}"
}

$mono.Dispose(); $logo.Dispose()
