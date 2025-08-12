#!/bin/bash

# Script de instalação automática do iAgris no cPanel
# Execute este script após fazer upload dos arquivos

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════╗"
echo "║            INSTALAÇÃO iAgris - cPanel          ║"
echo "║          Sistema de Gestão Agrícola            ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz da aplicação iAgris"
    error "Certifique-se de que o arquivo package.json existe"
    exit 1
fi

log "🔍 Verificando pré-requisitos..."

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "✅ Node.js encontrado: $NODE_VERSION"
    
    # Verificar se a versão é adequada (18+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        error "Node.js versão 18+ é necessário. Versão atual: $NODE_VERSION"
        error "Solicite ao seu provedor de hospedagem para atualizar o Node.js"
        exit 1
    fi
else
    error "Node.js não encontrado!"
    error "Solicite ao seu provedor de hospedagem para instalar Node.js 18+"
    exit 1
fi

# Verificar NPM
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log "✅ NPM encontrado: $NPM_VERSION"
else
    error "NPM não encontrado!"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    warn "Arquivo .env não encontrado"
    
    if [ -f "env.example" ]; then
        info "Copiando env.example para .env"
        cp env.example .env
        warn "⚠️  CONFIGURE o arquivo .env com suas informações antes de continuar!"
        warn "Edite .env e configure DATABASE_URL e SESSION_SECRET"
        echo ""
        echo "Exemplo de DATABASE_URL para PostgreSQL:"
        echo "DATABASE_URL=\"postgresql://usuario:senha@localhost:5432/nome_do_banco\""
        echo ""
        echo "Pressione ENTER quando terminar de configurar o .env..."
        read
    else
        error "Arquivo env.example não encontrado!"
        exit 1
    fi
fi

# Verificar se DATABASE_URL está configurado
if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=\"\"" .env; then
    error "DATABASE_URL não está configurado no arquivo .env"
    error "Configure a string de conexão do banco PostgreSQL"
    exit 1
fi

log "📦 Instalando dependências de produção..."

# Limpar instalação anterior se existir
if [ -d "node_modules" ]; then
    warn "Removendo node_modules existente..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi

# Instalar dependências
npm install --production --no-optional --no-audit --no-fund

if [ $? -ne 0 ]; then
    error "Falha na instalação das dependências"
    exit 1
fi

log "✅ Dependências instaladas com sucesso"

# Verificar se o build existe
if [ ! -d "dist" ]; then
    error "Diretório 'dist' não encontrado!"
    error "Execute 'npm run build' antes de fazer upload para o cPanel"
    exit 1
fi

log "✅ Build da aplicação encontrado"

# Criar diretórios necessários
log "📁 Criando diretórios necessários..."

mkdir -p photos
mkdir -p logs
mkdir -p backups

# Configurar permissões
chmod 755 photos
chmod 755 logs
chmod 755 backups
chmod 644 .env
chmod 644 package.json
chmod +x backup.sh

log "✅ Diretórios criados e permissões configuradas"

# Testar configuração do banco
log "🗄️  Testando configuração do banco de dados..."

if command -v node &> /dev/null && [ -f "setup-database.js" ]; then
    node setup-database.js
    if [ $? -eq 0 ]; then
        log "✅ Configuração do banco testada com sucesso"
    else
        warn "Teste do banco falhou, mas continuando..."
    fi
fi

# Aplicar schema do banco
log "📊 Aplicando schema do banco de dados..."

npm run db:push

if [ $? -eq 0 ]; then
    log "✅ Schema aplicado com sucesso"
else
    error "Falha ao aplicar schema do banco"
    error "Verifique a configuração DATABASE_URL no arquivo .env"
    exit 1
fi

# Verificar se a aplicação inicia
log "🚀 Testando inicialização da aplicação..."

timeout 10s node dist/index.js &
APP_PID=$!

sleep 5

if ps -p $APP_PID > /dev/null; then
    log "✅ Aplicação iniciou com sucesso"
    kill $APP_PID 2>/dev/null
else
    warn "Aplicação não iniciou corretamente, verifique logs"
fi

# Criar arquivo de status da instalação
cat > installation-status.txt << EOF
# Status da Instalação iAgris
Data: $(date)
Node.js: $(node --version)
NPM: $(npm --version)
Usuario: $(whoami)
Diretorio: $(pwd)

## Arquivos Verificados
✅ package.json
✅ dist/ (build da aplicação)
✅ .env (configurado)
✅ Dependências instaladas
✅ Schema do banco aplicado

## Próximos Passos
1. Configure aplicação Node.js no cPanel
2. Defina 'dist/index.js' como arquivo de startup
3. Configure variáveis de ambiente no cPanel
4. Acesse a aplicação em seu domínio

## Comandos Úteis
- Backup: ./backup.sh
- Logs: tail -f logs/app.log
- Status: curl https://seudominio.com/health
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            INSTALAÇÃO CONCLUÍDA!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

log "✅ Instalação do iAgris concluída com sucesso!"
echo ""
info "📋 PRÓXIMOS PASSOS NO cPANEL:"
echo "   1. Vá para 'Setup Node.js App'"
echo "   2. Clique 'Create Application'"
echo "   3. Configure:"
echo "      - Application Root: $(basename $(pwd))"
echo "      - Startup File: dist/index.js"
echo "      - Node.js Version: 18.x+"
echo "   4. Adicione variáveis de ambiente do arquivo .env"
echo "   5. Clique 'Create'"
echo ""
info "🌐 Sua aplicação estará disponível em:"
echo "   https://seudominio.com/$(basename $(pwd))"
echo ""
info "🔍 Para monitorar:"
echo "   https://seudominio.com/$(basename $(pwd))/health"
echo ""
warn "⚠️  IMPORTANTE:"
echo "   - Mantenha backups regulares: ./backup.sh"
echo "   - Monitore logs em: logs/app.log"
echo "   - Configure cron job para backup automático"
echo ""

log "🎉 iAgris está pronto para produção!"