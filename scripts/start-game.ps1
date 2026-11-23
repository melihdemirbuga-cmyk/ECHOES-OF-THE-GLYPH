param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$url = 'http://127.0.0.1:4173'
$ready = $false
try {
    $health = Invoke-RestMethod -Uri "$url/health" -TimeoutSec 2
    $ready = $health.game -eq 'echoes-of-the-glyph'
} catch { }
if (-not $ready) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw 'Node.js fehlt. Installiere Node.js 22.12 oder neuer und starte das Spiel erneut.' }
    if (-not (Test-Path -LiteralPath (Join-Path $project 'dist\index.html'))) { throw 'Der fertige Build fehlt. Fuehre zuerst npm ci --legacy-peer-deps und npm run build aus.' }
    $serverScript = Join-Path $PSScriptRoot 'serve.mjs'
    $process = Start-Process -FilePath $nodeCommand.Source -ArgumentList ('"{0}"' -f $serverScript) -WorkingDirectory $project -WindowStyle Hidden -PassThru
    $runtime = Join-Path $project '.runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $runtime 'server.pid') -Value $process.Id
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 150
        try { $health = Invoke-RestMethod -Uri "$url/health" -TimeoutSec 1; if ($health.game -eq 'echoes-of-the-glyph') { $ready = $true; break } } catch { }
    }
}
if (-not $ready) { throw 'Port 4173 ist belegt oder der Spielserver konnte nicht starten.' }
if (-not $NoBrowser) { Start-Process $url }
Write-Output "Das Spiel ist bereit: $url"
