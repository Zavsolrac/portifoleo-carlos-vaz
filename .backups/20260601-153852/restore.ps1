# Restaura o snapshot tirado em 2026-06-01 15:38:52 (UTC-3).
# Execute a partir da raiz do projeto:
#   .\.backups\20260601-153852\restore.ps1
#
# Sobrescreve os arquivos atuais com as versoes do backup.

$ErrorActionPreference = "Stop"
$base = ".backups/20260601-153852"
$map  = @{
  "$base/index.html.bak"     = "index.html"
  "$base/style.css.bak"      = "src/css/style.css"
  "$base/narrative.js.bak"   = "src/js/narrative.js"
  "$base/i18n.js.bak"        = "src/js/i18n.js"
  "$base/craft.js.bak"       = "src/js/craft.js"
  "$base/main.js.bak"        = "src/js/main.js"
}

Write-Host "Restaurando snapshot 20260601-153852..." -ForegroundColor Cyan
foreach ($pair in $map.GetEnumerator()) {
  Copy-Item $pair.Key $pair.Value -Force
  Write-Host "  OK $($pair.Value)" -ForegroundColor Green
}
Write-Host "Restauracao concluida." -ForegroundColor Cyan
