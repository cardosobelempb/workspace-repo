@echo off
setlocal

cd /d "%~dp0.."

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Solicitando permissao de Administrador para acessar o Docker Desktop...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

:menu
echo.
echo ========================================
echo  SURB/SUTB Imagens Docker - Windows
echo ========================================
echo  1. Ver configuracao atual
echo  2. Criar imagem frontend
echo  3. Criar imagem backend
echo  4. Criar imagem auth
echo  5. Criar imagens APIs backend + auth
echo  6. Criar todas as imagens proprias
echo  7. Exportar frontend .tar.gz
echo  8. Exportar APIs .tar.gz
echo  9. Exportar APIs + Postgres + Redis .tar.gz
echo  A. Exportar todas as imagens proprias .tar.gz
echo  B. Exportar somente Postgres + Redis .tar.gz
echo  C. Criar OCI multi-plataforma .tar.gz
echo  D. Carregar imagens de .tar.gz
echo  E. Listar imagens locais
echo  0. Sair
echo.
choice /C 123456789ABCDE0 /N /M "Escolha uma opcao: "
set "MENU_OPTION=%errorlevel%"

if "%MENU_OPTION%"=="1" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" info
  pause
  goto menu
)

if "%MENU_OPTION%"=="2" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" build-frontend
  pause
  goto menu
)

if "%MENU_OPTION%"=="3" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" build-backend
  pause
  goto menu
)

if "%MENU_OPTION%"=="4" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" build-auth
  pause
  goto menu
)

if "%MENU_OPTION%"=="5" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" build-api
  pause
  goto menu
)

if "%MENU_OPTION%"=="6" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" build
  pause
  goto menu
)

if "%MENU_OPTION%"=="7" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" tar-frontend-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="8" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" tar-api-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="9" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" tar-api-deps-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="10" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" tar-all-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="11" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" tar-runtime-deps-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="12" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" multi-oci-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="13" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" load-gzip
  pause
  goto menu
)

if "%MENU_OPTION%"=="14" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0images-windows.ps1" list
  pause
  goto menu
)

echo Saindo.
exit /b 0
