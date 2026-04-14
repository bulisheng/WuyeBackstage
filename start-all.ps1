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

function Resolve-MavenCommand {
  $candidates = @()
  if ($env:MAVEN_HOME) {
    $candidates += (Join-Path $env:MAVEN_HOME 'bin\mvn.cmd')
  }
  if ($env:M2_HOME) {
    $candidates += (Join-Path $env:M2_HOME 'bin\mvn.cmd')
  }
  $candidates += @(
    'C:\Users\admin\Downloads\apache-maven-3.9.14-bin\apache-maven-3.9.14\bin\mvn.cmd',
    'C:\Users\admin\Downloads\apache-maven-3.9.14\bin\mvn.cmd',
    'C:\Program Files\apache-maven-3.9.14-bin\apache-maven-3.9.14\bin\mvn.cmd',
    'C:\Program Files\Apache\apache-maven-3.9.14\bin\mvn.cmd',
    'C:\Program Files\Apache\Maven\bin\mvn.cmd'
  )
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }
  try {
    $command = Get-Command mvn -ErrorAction Stop
    return $command.Source
  } catch {
    return $null
  }
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
$mavenCommand = Resolve-MavenCommand
if (-not $mavenCommand) {
  Write-Host ''
  Write-Host '未找到 Maven，后端无法自动启动。' -ForegroundColor Red
  Write-Host '请先安装 Maven，或设置 MAVEN_HOME / M2_HOME，再重新运行 start-all。' -ForegroundColor Yellow
  Read-Host 'Press Enter to exit'
  exit 1
}
Start-ServiceWindow -WindowTitle 'Property Server' -Command "cd /d `"$PSScriptRoot\server`" && `"$mavenCommand`" spring-boot:run"

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
