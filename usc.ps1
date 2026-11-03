#Requires -Version 5.1
<#
  Orquesta docker-compose (profile "prod": postgres + app + migrate) para
  correr USC Certificates en local en Windows, mas backup/restore de la
  base. Pensado para ser invocado por los .bat de doble clic en la raiz
  del repo, no para edicion manual del docker-compose.yml/Dockerfile.
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Up", "Down", "Restart", "Status", "Logs", "Seed", "Backup", "Restore", "Update")]
    [string]$Action,

    [string]$File
)

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

# pg_dump y psql hablan UTF-8; sin esto PowerShell decodifica/codifica la
# salida/entrada de docker.exe con el codepage del sistema y corrompe
# acentos (nombres con tildes, "ñ", etc.) al respaldar o restaurar.
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

# Repositorio oficial del que se actualiza la instalacion (rama de produccion).
$RepoUrl = "https://github.com/dedujeong/usc-certificates.git"
$RepoBranch = "main"

$ComposeArgs = @("compose", "--profile", "prod")
$BackupsDir = Join-Path $RepoRoot "backups"

function Invoke-Compose {
    param([string[]]$CommandArgs)
    & docker @ComposeArgs @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "docker $(($ComposeArgs + $CommandArgs) -join ' ') fallo con codigo $LASTEXITCODE"
    }
}

function Assert-DockerRunning {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop no esta corriendo. Abrelo y espera a que termine de iniciar antes de volver a intentar."
    }
}

function Ensure-EnvFile {
    $envPath = Join-Path $RepoRoot ".env"
    if (Test-Path $envPath) {
        return
    }
    Write-Host "No existe .env, creandolo a partir de .env.example con un JWT_SECRET nuevo..."
    Copy-Item (Join-Path $RepoRoot ".env.example") $envPath

    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $_.ToString("x2") })

    (Get-Content $envPath) -replace '^JWT_SECRET=.*', "JWT_SECRET=`"$secret`"" |
        Set-Content $envPath
}

function Wait-PostgresReady {
    Write-Host "Esperando a que Postgres este listo..."
    $deadline = (Get-Date).AddMinutes(2)
    while ((Get-Date) -lt $deadline) {
        docker @ComposeArgs exec -T postgres pg_isready -U usc -d usc_certificates *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "Postgres no quedo listo despues de 2 minutos."
}

function Assert-GitInstalled {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git no esta instalado. Instalalo desde https://git-scm.com/download/win y vuelve a intentar."
    }
}

function Invoke-Git {
    param([string[]]$GitArgs)
    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') fallo con codigo $LASTEXITCODE"
    }
}

switch ($Action) {
    "Update" {
        Assert-GitInstalled
        Assert-DockerRunning

        # Instalacion descargada como .zip (sin .git): se enlaza al repositorio
        # oficial conservando .env y backups\ (no estan versionados).
        if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
            Write-Host "Esta carpeta no estaba enlazada a Git; enlazando con $RepoUrl ..."
            Invoke-Git @("init", "-b", $RepoBranch)
            Invoke-Git @("remote", "add", "origin", $RepoUrl)
            Invoke-Git @("fetch", "origin", $RepoBranch)
            Invoke-Git @("reset", "--hard", "origin/$RepoBranch")
            Invoke-Git @("branch", "--set-upstream-to=origin/$RepoBranch", $RepoBranch)
        }
        else {
            # Si el origin apunta a otro lado (instalaciones anteriores), se corrige.
            $current = (& git remote get-url origin 2>$null)
            if ($LASTEXITCODE -ne 0) {
                Invoke-Git @("remote", "add", "origin", $RepoUrl)
            }
            elseif ($current -ne $RepoUrl) {
                Write-Host "Actualizando origin: $current -> $RepoUrl"
                Invoke-Git @("remote", "set-url", "origin", $RepoUrl)
            }

            $dirty = (& git status --porcelain --untracked-files=no)
            if ($dirty) {
                throw "Hay archivos modificados localmente; no se actualiza para no perderlos:`n$($dirty -join "`n")"
            }
            Invoke-Git @("fetch", "origin", $RepoBranch)
            Invoke-Git @("checkout", $RepoBranch)
            Invoke-Git @("merge", "--ff-only", "origin/$RepoBranch")
        }

        Write-Host "Respaldando la base antes de actualizar..."
        & $PSCommandPath -Action Backup
        & $PSCommandPath -Action Up
    }
    "Up" {
        Assert-DockerRunning
        Ensure-EnvFile
        Invoke-Compose @("up", "-d", "postgres")
        Wait-PostgresReady
        Invoke-Compose @("run", "--rm", "--build", "migrate")
        Invoke-Compose @("up", "-d", "--build", "app")
        Write-Host ""
        Write-Host "Listo: http://localhost:3000"
        Write-Host "Si la base esta vacia, corre Sembrar.bat para cargar carreras/materias/firmantes."
    }
    "Down" {
        Assert-DockerRunning
        Invoke-Compose @("down")
    }
    "Restart" {
        & $PSCommandPath -Action Down
        & $PSCommandPath -Action Up
    }
    "Status" {
        Assert-DockerRunning
        Invoke-Compose @("ps")
    }
    "Logs" {
        Assert-DockerRunning
        Invoke-Compose @("logs", "--tail", "200", "app")
    }
    "Seed" {
        Assert-DockerRunning
        Invoke-Compose @("run", "--rm", "migrate", "npx", "prisma", "db", "seed")
    }
    "Backup" {
        Assert-DockerRunning
        New-Item -ItemType Directory -Force -Path $BackupsDir | Out-Null

        $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $sqlPath = Join-Path $BackupsDir "usc_certificates_$stamp.sql"
        $zipPath = Join-Path $BackupsDir "usc_certificates_$stamp.zip"

        Write-Host "Generando respaldo..."
        $dump = (docker @ComposeArgs exec -T postgres pg_dump -U usc -d usc_certificates --clean --if-exists) -join "`n"
        if ($LASTEXITCODE -ne 0) {
            throw "pg_dump fallo con codigo $LASTEXITCODE"
        }
        [System.IO.File]::WriteAllText($sqlPath, $dump, $Utf8NoBom)

        Compress-Archive -Path $sqlPath -DestinationPath $zipPath -Force
        Remove-Item $sqlPath

        $old = Get-ChildItem $BackupsDir -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10
        foreach ($f in $old) { Remove-Item $f.FullName }

        Write-Host "Respaldo guardado en $zipPath"
    }
    "Restore" {
        $zipPath = $File
        if (-not $zipPath) {
            $available = Get-ChildItem $BackupsDir -Filter "*.zip" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending
            if (-not $available) {
                throw "No hay respaldos en $BackupsDir. Corre Respaldar.bat primero."
            }
            Write-Host "Respaldos disponibles:"
            for ($i = 0; $i -lt $available.Count; $i++) {
                Write-Host "  [$($i + 1)] $($available[$i].Name)"
            }
            $choice = Read-Host "Escribe el numero del respaldo a restaurar"
            $index = 0
            if (-not [int]::TryParse($choice, [ref]$index) -or $index -lt 1 -or $index -gt $available.Count) {
                throw "Opcion invalida: $choice"
            }
            $zipPath = $available[$index - 1].FullName
        }
        if (-not (Test-Path $zipPath)) {
            throw "No existe el archivo: $zipPath"
        }

        Write-Host "Esto va a SOBREESCRIBIR la base de datos actual con el contenido de $zipPath"
        $confirm = Read-Host "Escribe 'si' para continuar"
        if ($confirm -ne "si") {
            Write-Host "Cancelado."
            return
        }

        Assert-DockerRunning
        $tempDir = Join-Path $env:TEMP "usc-restore-$(Get-Date -Format 'yyyyMMddHHmmss')"
        New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
        Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
        $sqlFile = Get-ChildItem $tempDir -Filter "*.sql" | Select-Object -First 1
        if (-not $sqlFile) {
            throw "El .zip no contiene un .sql"
        }

        Invoke-Compose @("stop", "app")
        $restoreSql = Get-Content $sqlFile.FullName -Raw -Encoding UTF8
        $restoreSql | docker @ComposeArgs exec -T postgres psql -U usc -d usc_certificates
        if ($LASTEXITCODE -ne 0) {
            Remove-Item $tempDir -Recurse -Force
            throw "La restauracion fallo con codigo $LASTEXITCODE"
        }
        Invoke-Compose @("up", "-d", "app")

        Remove-Item $tempDir -Recurse -Force
        Write-Host "Restauracion completa."
    }
}
