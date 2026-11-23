$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $project '.runtime\server.pid'
if (Test-Path -LiteralPath $pidFile) {
    $gamePid = [int](Get-Content -LiteralPath $pidFile)
    $gameProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$gamePid" -ErrorAction SilentlyContinue
    $serverScript = Join-Path $PSScriptRoot 'serve.mjs'
    if ($gameProcess -and $gameProcess.CommandLine.Contains($serverScript)) {
        Stop-Process -Id $gamePid -ErrorAction SilentlyContinue
        Write-Output 'Der Spielserver wurde beendet. Dein Spielstand bleibt im Browser gespeichert.'
    }
}
