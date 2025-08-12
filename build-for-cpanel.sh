#!/bin/bash

# Script para preparar o iAgris para deployment no cPanel
# Execute este script na sua máquina local antes de fazer upload

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════╗"
echo "║        PREPARAÇÃO iAgris para cPanel           ║"
echo "║         Build para Produção                    ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERRO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] AVISO: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -f "vite.config.ts" ]; then
    error "Execute este script no diretório raiz do projeto iAgris"
    exit 1
fi

log "🔍 Verificando ambiente de desenvolvimento..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado! Instale Node.js 18+ primeiro"
    exit 1
fi

NODE_VERSION=$(node --version)
log "✅ Node.js: $NODE_VERSION"

# Verificar NPM
if ! command -v npm &> /dev/null; then
    error "NPM não encontrado!"
    exit 1
fi

NPM_VERSION=$(npm --version)
log "✅ NPM: $NPM_VERSION"

# Limpar builds anteriores
log "🧹 Limpando builds anteriores..."
rm -rf dist/
rm -rf node_modules/.vite/

# Instalar dependências (caso não estejam atualizadas)
log "📦 Verificando dependências..."
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    log "Instalando dependências..."
    npm ci
fi

log "✅ Dependências verificadas"

# Build da aplicação
log "🔨 Fazendo build da aplicação para produção..."

# Definir variável de ambiente para build
export NODE_ENV=production

# Executar build usando npx (funciona sem comandos globais)
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

if [ $? -ne 0 ]; then
    error "Falha no build da aplicação!"
    exit 1
fi

log "✅ Build concluído com sucesso"

# Verificar se o build foi criado corretamente
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    error "Build não foi criado corretamente!"
    error "Verifique se 'npm run build' executou sem erros"
    exit 1
fi

log "✅ Arquivos de build verificados"

# Criar diretório para empacotamento
BUILD_DIR="iagris-cpanel-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BUILD_DIR

log "📁 Preparando arquivos para upload..."

# Copiar arquivos necessários
cp -r dist/ $BUILD_DIR/
cp -r server/ $BUILD_DIR/
cp -r shared/ $BUILD_DIR/
cp package.json $BUILD_DIR/
cp package-lock.json $BUILD_DIR/
cp drizzle.config.ts $BUILD_DIR/
cp .htaccess $BUILD_DIR/
cp env.example $BUILD_DIR/
cp setup-database.js $BUILD_DIR/
cp backup.sh $BUILD_DIR/
cp install-cpanel.sh $BUILD_DIR/

# Copiar pasta photos se existir
if [ -d "photos" ]; then
    cp -r photos/ $BUILD_DIR/
fi

# Criar pastas necessárias
mkdir -p $BUILD_DIR/logs
mkdir -p $BUILD_DIR/backups

# Criar arquivo README para o upload
cat > $BUILD_DIR/LEIA-ME-CPANEL.txt << EOF
# iAgris - Instruções para cPanel

## ARQUIVOS INCLUÍDOS
✅ dist/ - Build da aplicação React/Vite
✅ server/ - Código do servidor Express
✅ shared/ - Schemas compartilhados
✅ package.json - Dependências
✅ .htaccess - Configurações Apache
✅ env.example - Exemplo de configuração
✅ setup-database.js - Script de configuração do banco
✅ backup.sh - Script de backup
✅ install-cpanel.sh - Script de instalação automatizada

## PRÓXIMOS PASSOS

1. UPLOAD DOS ARQUIVOS
   - Faça upload de todos os arquivos para public_html/iagris/

2. CONFIGURAR BANCO DE DADOS
   - Crie banco PostgreSQL no cPanel
   - Anote: host, porta, usuário, senha, nome do banco

3. CONFIGURAR VARIÁVEIS DE AMBIENTE
   - Copie env.example para .env
   - Configure DATABASE_URL com dados do seu banco
   - Configure SESSION_SECRET com chave forte

4. CONFIGURAR NODE.JS APP NO cPANEL
   - Setup Node.js App → Create Application
   - Application Root: iagris
   - Startup File: dist/index.js
   - Node.js Version: 18.x+

5. EXECUTAR INSTALAÇÃO
   - Via SSH: ./install-cpanel.sh
   - Ou manualmente: npm install --production

6. APLICAR SCHEMA DO BANCO
   - npm run db:push

7. ACESSAR APLICAÇÃO
   - https://seudominio.com/iagris
   - https://seudominio.com/iagris/health (para verificar status)

## SUPORTE
Em caso de problemas, verifique:
- Logs em logs/app.log
- Status em /health
- Configurações no arquivo .env

Data do build: $(date)
Versão Node.js utilizada: $NODE_VERSION
EOF

# Criar arquivo zip para facilitar upload
log "📦 Criando arquivo ZIP para upload..."

zip -r "${BUILD_DIR}.zip" $BUILD_DIR/ > /dev/null

# Estatísticas do build
DIST_SIZE=$(du -sh dist/ | cut -f1)
TOTAL_SIZE=$(du -sh $BUILD_DIR/ | cut -f1)
ZIP_SIZE=$(du -sh "${BUILD_DIR}.zip" | cut -f1)

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               BUILD CONCLUÍDO!                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

log "✅ Build para cPanel preparado com sucesso!"
echo ""
info "📊 ESTATÍSTICAS DO BUILD:"
echo "   📁 Tamanho do build: $DIST_SIZE"
echo "   📦 Tamanho total: $TOTAL_SIZE"
echo "   🗜️  Arquivo ZIP: $ZIP_SIZE"
echo ""
info "📁 ARQUIVOS CRIADOS:"
echo "   📂 $BUILD_DIR/ - Arquivos para upload"
echo "   📦 ${BUILD_DIR}.zip - Arquivo compactado"
echo ""
info "🚀 PRÓXIMOS PASSOS:"
echo "   1. Faça upload do conteúdo de $BUILD_DIR/ para seu cPanel"
echo "   2. Ou envie o arquivo ${BUILD_DIR}.zip e extraia no cPanel"
echo "   3. Siga as instruções em LEIA-ME-CPANEL.txt"
echo "   4. Configure banco PostgreSQL no cPanel"
echo "   5. Execute ./install-cpanel.sh no servidor"
echo ""
warn "⚠️  IMPORTANTE:"
echo "   - Configure o arquivo .env com dados reais do banco"
echo "   - Use uma SESSION_SECRET forte e única"
echo "   - Faça backup regular com ./backup.sh"
echo ""

log "🎉 iAgris está pronto para produção no cPanel!"