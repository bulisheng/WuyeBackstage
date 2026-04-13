$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

function Test-UrlReady {
  param([string]$Url)
  try {
    Invoke-WebRequest -UseBasicParsing -Uri $Url | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Wait-UrlReady {
  param(
    [string]$Name,
    [string]$Url,
    [int]$MaxRetry = 30
  )
  for ($i = 1; $i -le $MaxRetry; $i++) {
    if (Test-UrlReady -Url $Url) {
      Write-Host "$Name is ready." -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 2
  }
  Write-Host "$Name did not become ready in time." -ForegroundColor Yellow
  return $false
}

function Start-ServiceWindow {
  param(
    [string]$WindowTitle,
    [string]$Command
  )
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', $Command -WindowStyle Normal | Out-Null
}

Write-Host '[1/3] Starting MongoDB service if available...'
try {
  $mongoService = Get-Service -Name 'MongoDB' -ErrorAction Stop
  if ($mongoService.Status -ne 'Running') {
    Start-Service -Name 'MongoDB'
  }
} catch {
  Write-Host 'MongoDB service not installed, skip.' -ForegroundColor Yellow
}

Write-Host '[2/3] Starting backend server...'
Start-ServiceWindow -WindowTitle 'Property Server' -Command "cd /d `"$PSScriptRoot\server`" && mvn spring-boot:run"

Write-Host '[3/3] Starting web admin...'
Start-ServiceWindow -WindowTitle 'Web Admin' -Command "cd /d `"$PSScriptRoot\web-admin`" && npm run dev -- --host 0.0.0.0"

Write-Host ''
Write-Host 'Services are starting.'
Write-Host 'Backend: http://192.168.5.4:8080'
Write-Host 'Web admin: http://192.168.5.4:5173'
Write-Host 'Openclaw: http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain'
Write-Host ''
Write-Host 'Please make sure openclaw is already running separately.'
Write-Host 'Close the opened windows to stop the backend and web admin.'
Read-Host 'Press Enter to exit'
