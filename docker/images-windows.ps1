#requires -Version 5.1

[CmdletBinding()]
param(
  [ValidateSet("info", "build", "build-frontend", "build-backend", "build-auth", "build-api", "tar", "gzip", "build-tar-gzip", "tar-frontend-gzip", "tar-api-gzip", "tar-api-deps-gzip", "tar-all-gzip", "tar-runtime-deps-gzip", "multi-oci-gzip", "load-tar", "load-gzip", "list")]
  [string]$Action = "info",

  [string]$EnvFile = "",
  [string]$OutputDir = "",
  [string]$TarFile = "",
  [string]$GzipFile = "",
  [string]$Platforms = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")

if (-not $EnvFile) {
  $EnvFile = Join-Path $RootDir ".env.production"
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $ScriptDir "dist"
}

function Write-Title {
  param([string]$Text)

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host " $Text" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Step {
  param([string]$Text)

  Write-Host ""
  Write-Host "[PASSO] $Text" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando obrigatorio nao encontrado: $Name"
  }
}

function Read-EnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Arquivo de ambiente nao encontrado: $Path"
  }

  $values = @{}

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#") -or $line -notmatch "=") {
      return
    }

    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }

  return $values
}

function Get-ImageConfig {
  $envValues = Read-EnvFile $EnvFile
  $registry = if ($envValues.ContainsKey("REGISTRY") -and $envValues["REGISTRY"]) { $envValues["REGISTRY"] } else { "local" }
  $imageTag = if ($envValues.ContainsKey("IMAGE_TAG") -and $envValues["IMAGE_TAG"]) { $envValues["IMAGE_TAG"] } else { "latest" }
  $platformsValue = if ($Platforms) { $Platforms } elseif ($envValues.ContainsKey("PLATFORMS") -and $envValues["PLATFORMS"]) { $envValues["PLATFORMS"] } else { "linux/amd64,linux/arm64" }

  if (-not $TarFile) {
    $script:TarFile = Join-Path $OutputDir "surb-images-$imageTag.tar"
  }

  if (-not $GzipFile) {
    $script:GzipFile = "$script:TarFile.gz"
  }

  return [pscustomobject]@{
    Registry = $registry
    ImageTag = $imageTag
    Platforms = $platformsValue
    EnvValues = $envValues
    FrontendImage = "$registry/surb-frontend:$imageTag"
    BackendImage = "$registry/surb-backend:$imageTag"
    AuthImage = "$registry/surb-auth-service:$imageTag"
    RuntimeImages = @(
      "postgres:16-alpine",
      "redis:7-alpine"
    )
    Images = @(
      "$registry/surb-frontend:$imageTag",
      "$registry/surb-backend:$imageTag",
      "$registry/surb-auth-service:$imageTag"
    )
  }
}

function Get-FrontendBuildArgs {
  param($Config)

  $keys = @(
    "NEXT_PUBLIC_APP_NAME",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_AUTH_URL",
    "BASE_URL",
    "SHORT_NAME",
    "CONTACT_EMAIL",
    "WHATSAPPs",
    "CORS_ORIGINS"
  )

  $args = @()

  foreach ($key in $keys) {
    if ($Config.EnvValues.ContainsKey($key) -and $Config.EnvValues[$key]) {
      $args += "--build-arg"
      $args += "$key=$($Config.EnvValues[$key])"
    }
  }

  return $args
}

function Ensure-OutputDir {
  if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
  }
}

function Test-Docker {
  Require-Command "docker"

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = & docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Docker Desktop nao esta respondendo ou esta sem permissao. Detalhes: $($output | Out-String)"
    }
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

function Test-Buildx {
  Test-Docker

  & docker buildx version | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Buildx nao esta disponivel. Atualize/instale o Docker Desktop."
  }
}

function Build-Images {
  param($Config)

  Build-SelectedImages -Config $Config -Names @("frontend", "backend", "auth-service")
}

function Build-SelectedImages {
  param(
    $Config,
    [string[]]$Names
  )

  Write-Step "Criando imagens Docker de producao: $($Names -join ', ')"
  Push-Location $RootDir
  try {
    if ($Names -contains "frontend") {
      $frontendBuildArgs = Get-FrontendBuildArgs $Config

      & docker build @frontendBuildArgs -f apps/frontend/Dockerfile --target production -t $Config.FrontendImage .
      if ($LASTEXITCODE -ne 0) { throw "Build do frontend falhou com codigo $LASTEXITCODE" }
    }

    if ($Names -contains "backend") {
      & docker build -f apps/backend/Dockerfile --target production -t $Config.BackendImage .
      if ($LASTEXITCODE -ne 0) { throw "Build do backend falhou com codigo $LASTEXITCODE" }
    }

    if ($Names -contains "auth-service") {
      & docker build -f apps/auth-service/Dockerfile --target production -t $Config.AuthImage .
      if ($LASTEXITCODE -ne 0) { throw "Build do auth-service falhou com codigo $LASTEXITCODE" }
    }
  }
  finally {
    Pop-Location
  }
}

function Pull-RuntimeImages {
  param($Config)

  Write-Step "Baixando dependencias oficiais de runtime"
  foreach ($image in $Config.RuntimeImages) {
    & docker pull $image
    if ($LASTEXITCODE -ne 0) {
      throw "docker pull falhou para $image com codigo $LASTEXITCODE"
    }
  }
}

function Build-MultiPlatformOciArchives {
  param($Config)

  Ensure-OutputDir
  Write-Step "Criando arquivos OCI multi-plataforma"
  Write-Host "Plataformas: $($Config.Platforms)"
  Write-Host "Formato: .oci.tar.gz"
  Write-Host "Observacao: estes arquivos sao para multi-plataforma. Para imagem local simples, use .tar."

  $frontendBuildArgs = Get-FrontendBuildArgs $Config
  $targets = @(
    [pscustomobject]@{
      Name = "frontend"
      Dockerfile = "apps/frontend/Dockerfile"
      Image = $Config.Images[0]
      Args = $frontendBuildArgs
    },
    [pscustomobject]@{
      Name = "backend"
      Dockerfile = "apps/backend/Dockerfile"
      Image = $Config.Images[1]
      Args = @()
    },
    [pscustomobject]@{
      Name = "auth-service"
      Dockerfile = "apps/auth-service/Dockerfile"
      Image = $Config.Images[2]
      Args = @()
    }
  )

  Push-Location $RootDir
  try {
    foreach ($target in $targets) {
      $ociTar = Join-Path $OutputDir "surb-$($target.Name)-$($Config.ImageTag)-multi.oci.tar"
      $ociGzip = "$ociTar.gz"

      Write-Step "Build multi-plataforma: $($target.Image)"
      Write-Host "Saida: $ociTar"

      & docker buildx build `
        --platform $Config.Platforms `
        --target production `
        --tag $target.Image `
        --output "type=oci,dest=$ociTar" `
        @($target.Args) `
        -f $target.Dockerfile `
        .

      if ($LASTEXITCODE -ne 0) {
        throw "Build multi-plataforma de $($target.Name) falhou com codigo $LASTEXITCODE"
      }

      Compress-FileToGzip -SourcePath $ociTar -DestinationPath $ociGzip
      Write-Host "Gerado: $ociGzip" -ForegroundColor Green
    }
  }
  finally {
    Pop-Location
  }
}

function Export-Tar {
  param($Config)

  Export-ImagesTar -Images $Config.Images -TargetTarFile $TarFile
}

function Export-ImagesTar {
  param(
    [string[]]$Images,
    [string]$TargetTarFile
  )

  Ensure-OutputDir
  Write-Step "Exportando imagens para .tar"
  Write-Host "Arquivo: $TargetTarFile"
  Write-Host "Imagens:"
  $Images | ForEach-Object { Write-Host "  $_" }

  & docker save -o $TargetTarFile @($Images)
  if ($LASTEXITCODE -ne 0) {
    throw "docker save falhou com codigo $LASTEXITCODE"
  }
}

function Export-ImagesTarGzip {
  param(
    [string[]]$Images,
    [string]$BaseName
  )

  $archiveTar = Join-Path $OutputDir "$BaseName.tar"
  $archiveGzip = "$archiveTar.gz"

  Export-ImagesTar -Images $Images -TargetTarFile $archiveTar
  Write-Step "Compactando pacote para .tar.gz"
  Write-Host "Origem: $archiveTar"
  Write-Host "Destino: $archiveGzip"
  Compress-FileToGzip -SourcePath $archiveTar -DestinationPath $archiveGzip
}

function Compress-TarToGzip {
  if (-not (Test-Path $TarFile)) {
    throw "Arquivo .tar nao encontrado: $TarFile"
  }

  Ensure-OutputDir
  Write-Step "Compactando .tar para .tar.gz"
  Write-Host "Origem: $TarFile"
  Write-Host "Destino: $GzipFile"

  Compress-FileToGzip -SourcePath $TarFile -DestinationPath $GzipFile
}

function Compress-FileToGzip {
  param(
    [string]$SourcePath,
    [string]$DestinationPath
  )

  $source = [System.IO.File]::OpenRead($SourcePath)
  try {
    $target = [System.IO.File]::Create($DestinationPath)
    try {
      $gzip = New-Object System.IO.Compression.GzipStream($target, [System.IO.Compression.CompressionMode]::Compress)
      try {
        $source.CopyTo($gzip)
      }
      finally {
        $gzip.Dispose()
      }
    }
    finally {
      $target.Dispose()
    }
  }
  finally {
    $source.Dispose()
  }
}

function Expand-GzipToTar {
  if (-not (Test-Path $GzipFile)) {
    throw "Arquivo .tar.gz nao encontrado: $GzipFile"
  }

  Ensure-OutputDir
  Write-Step "Descompactando .tar.gz para .tar"
  Write-Host "Origem: $GzipFile"
  Write-Host "Destino: $TarFile"

  $source = [System.IO.File]::OpenRead($GzipFile)
  try {
    $gzip = New-Object System.IO.Compression.GzipStream($source, [System.IO.Compression.CompressionMode]::Decompress)
    try {
      $target = [System.IO.File]::Create($TarFile)
      try {
        $gzip.CopyTo($target)
      }
      finally {
        $target.Dispose()
      }
    }
    finally {
      $gzip.Dispose()
    }
  }
  finally {
    $source.Dispose()
  }
}

function Load-Tar {
  if (-not (Test-Path $TarFile)) {
    throw "Arquivo .tar nao encontrado: $TarFile"
  }

  Write-Step "Carregando imagens a partir do .tar"
  & docker load -i $TarFile
  if ($LASTEXITCODE -ne 0) {
    throw "docker load falhou com codigo $LASTEXITCODE"
  }
}

function List-Images {
  param($Config)

  Write-Step "Listando imagens SURB"
  foreach ($image in $Config.Images) {
    & docker image ls $image
  }
}

function Show-Info {
  param($Config)

  Write-Step "Configuracao atual"
  Write-Host "Env: $EnvFile"
  Write-Host "Output: $OutputDir"
  Write-Host "Tar: $TarFile"
  Write-Host "Gzip: $GzipFile"
  Write-Host "Platforms: $($Config.Platforms)"
  Write-Host ""
  Write-Host "Imagens:"
  $Config.Images | ForEach-Object { Write-Host "  $_" }
  Write-Host ""
  Write-Host "Dependencias oficiais:"
  $Config.RuntimeImages | ForEach-Object { Write-Host "  $_" }
}

function Main {
  Write-Title "SURB/SUTB Imagens Docker - Windows"
  $config = Get-ImageConfig

  switch ($Action) {
    "info" {
      Show-Info $config
    }

    "build" {
      Test-Docker
      Show-Info $config
      Build-Images $config
    }

    "build-frontend" {
      Test-Docker
      Show-Info $config
      Build-SelectedImages -Config $config -Names @("frontend")
    }

    "build-backend" {
      Test-Docker
      Show-Info $config
      Build-SelectedImages -Config $config -Names @("backend")
    }

    "build-auth" {
      Test-Docker
      Show-Info $config
      Build-SelectedImages -Config $config -Names @("auth-service")
    }

    "build-api" {
      Test-Docker
      Show-Info $config
      Build-SelectedImages -Config $config -Names @("backend", "auth-service")
    }

    "tar" {
      Test-Docker
      Show-Info $config
      Export-Tar $config
    }

    "gzip" {
      Show-Info $config
      Compress-TarToGzip
    }

    "build-tar-gzip" {
      Test-Docker
      Show-Info $config
      Build-Images $config
      Export-Tar $config
      Compress-TarToGzip
    }

    "tar-frontend-gzip" {
      Test-Docker
      Show-Info $config
      Export-ImagesTarGzip -Images @($config.FrontendImage) -BaseName "surb-frontend-$($config.ImageTag)"
    }

    "tar-api-gzip" {
      Test-Docker
      Show-Info $config
      Export-ImagesTarGzip -Images @($config.BackendImage, $config.AuthImage) -BaseName "surb-api-$($config.ImageTag)"
    }

    "tar-api-deps-gzip" {
      Test-Docker
      Show-Info $config
      Pull-RuntimeImages $config
      Export-ImagesTarGzip -Images @($config.BackendImage, $config.AuthImage, $config.RuntimeImages[0], $config.RuntimeImages[1]) -BaseName "surb-api-with-db-redis-$($config.ImageTag)"
    }

    "tar-all-gzip" {
      Test-Docker
      Show-Info $config
      Export-ImagesTarGzip -Images @($config.Images) -BaseName "surb-apps-$($config.ImageTag)"
    }

    "tar-runtime-deps-gzip" {
      Test-Docker
      Show-Info $config
      Pull-RuntimeImages $config
      Export-ImagesTarGzip -Images @($config.RuntimeImages) -BaseName "surb-runtime-deps-$($config.ImageTag)"
    }

    "multi-oci-gzip" {
      Test-Buildx
      Show-Info $config
      Build-MultiPlatformOciArchives $config
    }

    "load-tar" {
      Test-Docker
      Show-Info $config
      Load-Tar
    }

    "load-gzip" {
      Test-Docker
      Show-Info $config
      Expand-GzipToTar
      Load-Tar
    }

    "list" {
      Test-Docker
      Show-Info $config
      List-Images $config
    }
  }

  Write-Host ""
  Write-Host "Concluido." -ForegroundColor Green
}

Main
