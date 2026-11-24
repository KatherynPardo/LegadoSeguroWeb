# Revisa el Word generado: abre el documento en Word, cuenta las páginas y guarda como PNG las páginas que indiques.
# Uso:  .\render-paginas.ps1 -Docx "E:\...\MANUAL_CONSTRUCCION_v7.docx" -Salida "C:\temp\paginas" -Buscar "Procedimiento 7.14.3|125|130"
#   -Buscar acepta textos (se busca la primera coincidencia y se toma su página) o números de página, separados por |
# Necesita Microsoft Word instalado. El documento se abre de solo lectura y no se modifica.
param([string]$Docx, [string]$Salida, [string]$Buscar)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Salida | Out-Null
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
$d = $w.Documents.Open($Docx, $false, $true)
$d.Repaginate()
"paginas: " + $d.ComputeStatistics(2)
$paginas = @()
foreach ($t in ($Buscar -split '\|')) {
  if (-not $t) { continue }
  if ($t -match '^\d+$') { $paginas += [int]$t; continue }
  $r = $d.Content; $f = $r.Find; $f.ClearFormatting()
  $ok = $f.Execute($t)
  if ($ok) { $p = $r.Information(3); "$t => pagina $p"; $paginas += $p } else { "$t => no encontrado" }
}
$w.ActiveWindow.View.Type = 3
foreach ($p in $paginas) {
  $bytes = $w.ActiveWindow.ActivePane.Pages.Item($p).EnhMetaFileBits
  $ms = New-Object System.IO.MemoryStream(, $bytes)
  $img = [System.Drawing.Image]::FromStream($ms)
  $bmp = New-Object System.Drawing.Bitmap 900, 1170
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($img, 0, 0, 900, 1170)
  $bmp.Save("$Salida\pag_$p.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}
$d.Close($false); $w.Quit()
