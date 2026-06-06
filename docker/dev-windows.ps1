#requires -Version 5.1

[CmdletBinding()]
param(
  [ValidateSet("up", "infra", "project", "frontend", "backend", "auth", "validate", "ps", "logs", "down", "restart", "clean")]
  [string]$Action = "up",

  [string]$Service = "",
  [switch]$Build,
  [switch]$Detached,
  [switch]$Follow,
  [switch]$ShowLogs,
  [switch]$Volumes,
  [switch]$AutoStartDocker,
  [int]$DockerTimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")
$ComposeFile = Join-Path $ScriptDir "compose.dev.windows.yml"
$EnvFile = Join-Path $RootDir ".env.development"
$EnvExampleFile = Join-Path $RootDir ".env.example"
$ProjectName = "surb-dev"

function Write-Step {
  param([string]$Text)

  Write-Host ""
  Write-Host "[PASSO] $Text" -ForegroundColor Cyan
}

function Write-Title {
  param([string]$Text)

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host " $Text" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$Name)

  Write-Step "Verificando comando: $Name"

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando obrigatorio nao encontrado: $Name"
  }

  Write-Host "OK: $Name encontrado." -ForegroundColor Green
}

function Test-Docker {
  Require-Command "docker"

  Write-Step "Verificando Docker Desktop"
  $dockerInfo = Test-DockerInfo
  if ($dockerInfo.Ready) {
    Write-Host "OK: Docker Desktop esta respondendo." -ForegroundColor Green
    return
  }

  if ($dockerInfo.PermissionDenied) {
    throw "Sem permissao para acessar o Docker Desktop. Execute como Administrador ou adicione seu usuario ao grupo docker-users e faca logoff/login."
  }

  if (-not $AutoStartDocker) {
    throw "Docker Desktop nao esta respondendo. Abra o Docker Desktop e tente novamente."
  }

  Start-DockerDesktop
  Wait-DockerReady
}

function Test-DockerInfo {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = & docker info 2>&1
    $exitCode = $LASTEXITCODE
    $text = ($output | Out-String)

    return [pscustomobject]@{
      Ready = $exitCode -eq 0
      PermissionDenied = $text -match "permission denied|acesso negado|access is denied"
      Output = $text
    }
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

function Start-DockerDesktop {
  $dockerDesktop = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LocalAppData\Docker\Docker Desktop.exe"
  ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

  if (-not $dockerDesktop) {
    throw "Docker Desktop nao encontrado. Instale ou abra manualmente antes de rodar o script."
  }

  Write-Host "Abrindo Docker Desktop..." -ForegroundColor Yellow
  Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
}

function Wait-DockerReady {
  Write-Host "Aguardando Docker Desktop ficar pronto..." -ForegroundColor Yellow

  $deadline = (Get-Date).AddSeconds($DockerTimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 3
    $dockerInfo = Test-DockerInfo

    if ($dockerInfo.Ready) {
      Write-Host "Docker Desktop pronto." -ForegroundColor Green
      return
    }

    if ($dockerInfo.PermissionDenied) {
      throw "Docker Desktop abriu, mas este usuario nao tem permissao no Docker. Execute como Administrador ou entre no grupo docker-users."
    }
  }

  throw "Docker Desktop nao ficou pronto em $DockerTimeoutSeconds segundos."
}

function Ensure-EnvFile {
  Write-Step "Verificando arquivo .env.development"
  Write-Host "Caminho: $EnvFile"

  if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvExampleFile) {
      Copy-Item $EnvExampleFile $EnvFile
      Write-Host ".env.development criado a partir de .env.example." -ForegroundColor Yellow
    }
    else {
      throw "Arquivo .env.development nao encontrado em $EnvFile"
    }
  }

  Write-Host "OK: .env.development encontrado." -ForegroundColor Green
}

function Invoke-Compose {
  param(
    [string[]]$ComposeArgs,
    [switch]$IgnoreExitCode
  )

  Push-Location $RootDir
  try {
    Write-Step "Executando Docker Compose"
    Write-Host "Diretorio: $RootDir"
    Write-Host "Compose: $ComposeFile"
    Write-Host "Env: $EnvFile"
    Write-Host "Comando: docker compose --project-name $ProjectName --env-file `"$EnvFile`" -f `"$ComposeFile`" $($ComposeArgs -join ' ')" -ForegroundColor DarkGray
    Write-Host ""

    & docker compose `
      --project-name $ProjectName `
      --env-file $EnvFile `
      -f $ComposeFile `
      @ComposeArgs

    if ($LASTEXITCODE -ne 0 -and -not $IgnoreExitCode) {
      throw "docker compose falhou com codigo $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

function Compose-Up {
  param([string[]]$Services)

  Write-Step "Subindo servicos: $($Services -join ', ')"

  $args = @("up")

  if ($Build) {
    $args += "--build"
  }

  if ($Detached) {
    $args += "-d"
  }

  $args += $Services
  Invoke-Compose $args
}

function Show-ServiceLogs {
  param([string[]]$Services)

  Write-Step "Acompanhando logs dos servicos"
  if ($Follow) {
    Write-Host "Pressione Ctrl+C para parar de acompanhar os logs. Os containers continuam rodando." -ForegroundColor Yellow
    Invoke-Compose -ComposeArgs (@("logs", "-f", "--tail", "120") + $Services) -IgnoreExitCode
    Write-Host "Logs encerrados." -ForegroundColor Yellow
    return
  }

  Write-Host "Mostrando ultimas 120 linhas. Use a acao logs -Follow para acompanhar ao vivo." -ForegroundColor Yellow
  Invoke-Compose (@("logs", "--tail", "120") + $Services)
}

function Show-Urls {
  Write-Host ""
  Write-Host "URLs locais:" -ForegroundColor Green
  Write-Host "  Frontend: http://localhost:3000"
  Write-Host "  Backend:  http://localhost:4000/docs"
  Write-Host "  Auth:     http://localhost:4001/docs"
  Write-Host "  Postgres: localhost:5432"
  Write-Host "  Redis:    localhost:6379"
}

function Main {
  Write-Title "SURB/SUTB Dev Local - Windows 10"
  Test-Docker
  Ensure-EnvFile

  switch ($Action) {
    "validate" {
      Invoke-Compose @("config", "--quiet")
      Write-Host "Compose local valido." -ForegroundColor Green
    }

    "infra" {
      $services = @("postgres", "redis")
      Compose-Up $services
      Show-Urls
      if ($ShowLogs) { Show-ServiceLogs $services }
    }

    "project" {
      $services = @("postgres", "redis", "project")
      Compose-Up $services
      Show-Urls
      if ($ShowLogs) { Show-ServiceLogs $services }
    }

    "frontend" {
      $services = @("postgres", "redis", "project", "frontend")
      Compose-Up $services
      Show-Urls
      if ($ShowLogs) { Show-ServiceLogs $services }
    }

    "backend" {
      $services = @("postgres", "redis", "project", "auth", "backend")
      Compose-Up $services
      Show-Urls
      if ($ShowLogs) { Show-ServiceLogs $services }
    }

    "auth" {
      $services = @("postgres", "redis", "project", "auth")
      Compose-Up $services
      Show-Urls
      if ($ShowLogs) { Show-ServiceLogs $services }
    }

    "up" {
      $services = @("postgres", "redis", "project", "auth", "backend", "frontend")
      Compose-Up $services
      Show-Urls
      if ($ShowLogs) { Show-ServiceLogs $services }
    }

    "ps" {
      Invoke-Compose @("ps")
    }

    "logs" {
      $args = @("logs")

      if ($Follow) {
        $args += "-f"
      }

      if ($Service) {
        $args += $Service
      }

      Invoke-Compose $args
    }

    "restart" {
      $args = @("restart")

      if ($Service) {
        $args += $Service
      }

      Invoke-Compose $args
    }

    "down" {
      Invoke-Compose @("down", "--remove-orphans")
    }

    "clean" {
      $args = @("down", "--remove-orphans")

      if ($Volumes) {
        $args += "--volumes"
      }

      Invoke-Compose $args
      Write-Host "Ambiente local removido." -ForegroundColor Green
    }
  }
}

Main
