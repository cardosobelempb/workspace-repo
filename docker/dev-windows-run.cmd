@echo off
setlocal

cd /d "%~dp0.."

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Solicitando permissao de Administrador para acessar o Docker Desktop...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo ========================================
echo  SURB Dev Local - Windows 10
echo ========================================
echo.
echo Este launcher vai:
echo  1. Abrir o Docker Desktop se necessario
echo  2. Aguardar o Docker ficar pronto
echo  3. Criar .env.development se ele nao existir
echo  4. Criar o container do projeto em modo dev
echo  5. Construir e subir o ambiente dev local
echo.
echo Na primeira execucao o pnpm install pode levar alguns minutos.
echo Depois de subir, os ultimos logs vao aparecer nesta janela.
echo Para acompanhar logs ao vivo depois, use docker\dev-windows.ps1 logs -Follow.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" up -Detached -AutoStartDocker -ShowLogs
set "PS_EXIT_CODE=%errorlevel%"

if not "%PS_EXIT_CODE%"=="0" (
  echo.
  echo Falha ao iniciar o ambiente local.
  echo Codigo: %PS_EXIT_CODE%
  echo.
  pause
  exit /b 1
)

echo.
echo Ambiente local iniciado com sucesso.
echo.
echo Projeto:  container surb_project_dev
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000/docs
echo Auth:     http://localhost:4001/docs
echo.

:menu
echo.
echo ========================================
echo  Opcoes uteis
echo ========================================
echo  1. Ver status dos containers
echo  2. Acompanhar logs ao vivo
echo  3. Ver ultimos logs
echo  4. Reiniciar ambiente
echo  5. Parar ambiente
echo  6. Validar compose
echo  0. Sair
echo.
choice /C 1234560 /N /M "Escolha uma opcao: "
set "MENU_OPTION=%errorlevel%"

if "%MENU_OPTION%"=="1" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" ps
  goto menu
)

if "%MENU_OPTION%"=="2" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" logs -Follow
  goto menu
)

if "%MENU_OPTION%"=="3" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" logs
  goto menu
)

if "%MENU_OPTION%"=="4" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" restart
  goto menu
)

if "%MENU_OPTION%"=="5" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" down
  goto menu
)

if "%MENU_OPTION%"=="6" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-windows.ps1" validate
  goto menu
)

echo Saindo.
exit /b 0
