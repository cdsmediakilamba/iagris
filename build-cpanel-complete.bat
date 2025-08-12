@echo off
REM Script para preparar o iAgris COMPLETO para cPanel (Windows)
REM Inclui todas as dependências e arquivos necessários

setlocal EnableDelayedExpansion

echo.
echo ════════════════════════════════════════════════
echo      PREPARACAO COMPLETA iAgris para cPanel     
echo         Pacote Completo com Dependencias       
echo ════════════════════════════════════════════════
echo.

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ERRO: Execute este script no diretorio raiz do projeto iAgris
    pause
    exit /b 1
)

if not exist "vite.config.ts" (
    echo ERRO: Execute este script no diretorio raiz do projeto iAgris
    pause
    exit /b 1
)

echo [%time%] Verificando ambiente...

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado! Instale Node.js 18+ primeiro
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [%time%] Node.js: %NODE_VERSION%

REM Verificar NPM
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: NPM nao encontrado!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [%time%] NPM: %NPM_VERSION%

REM Limpar arquivos antigos
echo [%time%] Limpando arquivos antigos...
if exist "dist" rmdir /s /q "dist"
if exist "node_modules" rmdir /s /q "node_modules"
for /d %%d in (iagris-cpanel-complete-*) do rmdir /s /q "%%d"
del /q iagris-cpanel-complete-*.zip 2>nul

REM Instalar dependências de produção
echo [%time%] Instalando dependencias de producao...
npm ci --production
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias de producao
    pause
    exit /b 1
)

REM Instalar dependências de build temporariamente
echo [%time%] Instalando dependencias de build...
npm install --save-dev vite esbuild @types/node typescript
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias de build
    pause
    exit /b 1
)

REM Build da aplicação
echo [%time%] Fazendo build da aplicacao...
set NODE_ENV=production
npx vite build
if errorlevel 1 (
    echo ERRO: Falha no build da aplicacao
    pause
    exit /b 1
)

npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if errorlevel 1 (
    echo ERRO: Falha no build do servidor
    pause
    exit /b 1
)

REM Verificar build
if not exist "dist\index.js" (
    echo ERRO: Build nao foi criado corretamente
    pause
    exit /b 1
)

echo [%time%] Build concluido com sucesso

REM Reinstalar apenas dependências de produção
echo [%time%] Reinstalando apenas dependencias de producao...
rmdir /s /q "node_modules"
npm ci --production --silent
if errorlevel 1 (
    echo ERRO: Falha ao reinstalar dependencias
    pause
    exit /b 1
)

REM Criar diretório do pacote completo
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "BUILD_DIR=iagris-cpanel-complete-%timestamp%"

mkdir "%BUILD_DIR%"

echo [%time%] Preparando pacote completo...

REM Copiar arquivos necessários
xcopy /E /I /Q "dist" "%BUILD_DIR%\dist\"
xcopy /E /I /Q "node_modules" "%BUILD_DIR%\node_modules\"
xcopy /E /I /Q "server" "%BUILD_DIR%\server\"
xcopy /E /I /Q "shared" "%BUILD_DIR%\shared\"

REM Criar diretório photos se não existir
if exist "photos" (
    xcopy /E /I /Q "photos" "%BUILD_DIR%\photos\"
) else (
    mkdir "%BUILD_DIR%\photos"
)

REM Copiar arquivos de configuração
copy "package.json" "%BUILD_DIR%\"
copy "package-lock.json" "%BUILD_DIR%\"
copy "drizzle.config.ts" "%BUILD_DIR%\"
copy ".htaccess" "%BUILD_DIR%\"
copy "env.example" "%BUILD_DIR%\"
copy "setup-database.js" "%BUILD_DIR%\"
copy "backup.sh" "%BUILD_DIR%\"
copy "install-cpanel.sh" "%BUILD_DIR%\"

REM Criar diretórios necessários
mkdir "%BUILD_DIR%\logs"
mkdir "%BUILD_DIR%\backups"

REM Criar script de inicialização para cPanel
echo // Script de inicializacao para cPanel - iAgris > "%BUILD_DIR%\start-cpanel.js"
echo // Use: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo const fs = require('fs'); >> "%BUILD_DIR%\start-cpanel.js"
echo const path = require('path'); >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo console.log('🚀 Iniciando iAgris no cPanel...'); >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo // Verificar se .env existe >> "%BUILD_DIR%\start-cpanel.js"
echo if (!fs.existsSync('.env')) { >> "%BUILD_DIR%\start-cpanel.js"
echo     console.error('❌ ERRO: Arquivo .env nao encontrado!'); >> "%BUILD_DIR%\start-cpanel.js"
echo     console.error('📋 Copie env.example para .env e configure as variaveis'); >> "%BUILD_DIR%\start-cpanel.js"
echo     process.exit(1); >> "%BUILD_DIR%\start-cpanel.js"
echo } >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo // Carregar variaveis do .env >> "%BUILD_DIR%\start-cpanel.js"
echo require('dotenv').config(); >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo // Definir variaveis obrigatorias >> "%BUILD_DIR%\start-cpanel.js"
echo process.env.NODE_ENV = 'production'; >> "%BUILD_DIR%\start-cpanel.js"
echo process.env.CPANEL_MODE = 'true'; >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo console.log('✅ Configuracao validada'); >> "%BUILD_DIR%\start-cpanel.js"
echo console.log('🔄 Carregando aplicacao principal...'); >> "%BUILD_DIR%\start-cpanel.js"
echo. >> "%BUILD_DIR%\start-cpanel.js"
echo // Importar e iniciar a aplicacao principal >> "%BUILD_DIR%\start-cpanel.js"
echo require('./dist/index.js'); >> "%BUILD_DIR%\start-cpanel.js"

REM Criar .env template para cPanel
echo # Configuracao para cPanel - iAgris > "%BUILD_DIR%\.env.cpanel-template"
echo # Copie este arquivo para .env e configure com seus dados >> "%BUILD_DIR%\.env.cpanel-template"
echo. >> "%BUILD_DIR%\.env.cpanel-template"
echo # DATABASE - Configure com seus dados PostgreSQL do cPanel >> "%BUILD_DIR%\.env.cpanel-template"
echo DATABASE_URL="postgresql://seuusuario:suasenha@localhost:5432/seuusuario_iagris" >> "%BUILD_DIR%\.env.cpanel-template"
echo. >> "%BUILD_DIR%\.env.cpanel-template"
echo # CONFIGURACOES OBRIGATORIAS >> "%BUILD_DIR%\.env.cpanel-template"
echo NODE_ENV="production" >> "%BUILD_DIR%\.env.cpanel-template"
echo SESSION_SECRET="ALTERE_PARA_UMA_CHAVE_SECRETA_FORTE_DE_PELO_MENOS_32_CARACTERES" >> "%BUILD_DIR%\.env.cpanel-template"
echo. >> "%BUILD_DIR%\.env.cpanel-template"
echo # CONFIGURACOES CPANEL >> "%BUILD_DIR%\.env.cpanel-template"
echo CPANEL_MODE="true" >> "%BUILD_DIR%\.env.cpanel-template"
echo PORT="0" >> "%BUILD_DIR%\.env.cpanel-template"

REM Criar instruções
echo === iAgris - Pacote Completo para cPanel === > "%BUILD_DIR%\README-CPANEL.txt"
echo. >> "%BUILD_DIR%\README-CPANEL.txt"
echo ESTE PACOTE CONTEM TUDO QUE VOCE PRECISA! >> "%BUILD_DIR%\README-CPANEL.txt"
echo. >> "%BUILD_DIR%\README-CPANEL.txt"
echo 1. Extraia na pasta 'iagris' do seu cPanel >> "%BUILD_DIR%\README-CPANEL.txt"
echo 2. Configure .env com dados do seu PostgreSQL >> "%BUILD_DIR%\README-CPANEL.txt"
echo 3. Execute: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js >> "%BUILD_DIR%\README-CPANEL.txt"
echo. >> "%BUILD_DIR%\README-CPANEL.txt"
echo Ou use Node.js App no cPanel: >> "%BUILD_DIR%\README-CPANEL.txt"
echo - Startup File: start-cpanel.js >> "%BUILD_DIR%\README-CPANEL.txt"
echo - Application Root: iagris >> "%BUILD_DIR%\README-CPANEL.txt"

REM Verificar se dotenv existe e instalar se necessário
if not exist "%BUILD_DIR%\node_modules\dotenv" (
    echo [%time%] Adicionando dotenv...
    cd "%BUILD_DIR%"
    npm install dotenv --production
    cd ..
)

REM Criar ZIP usando PowerShell
echo [%time%] Criando arquivo ZIP...
powershell Compress-Archive -Path "%BUILD_DIR%\*" -DestinationPath "%BUILD_DIR%.zip" -Force

echo.
echo ================================================
echo   PACOTE COMPLETO CRIADO COM SUCESSO!
echo ================================================
echo.
echo Pasta criada: %BUILD_DIR%\
echo Arquivo ZIP: %BUILD_DIR%.zip
echo.
echo PROXIMOS PASSOS:
echo 1. Faca upload do arquivo ZIP para seu cPanel
echo 2. Extraia na pasta 'iagris'
echo 3. Configure .env com dados do PostgreSQL
echo 4. Execute: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js
echo.
echo Veja README-CPANEL.txt para detalhes
echo.
pause