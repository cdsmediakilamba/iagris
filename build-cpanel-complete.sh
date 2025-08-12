#!/bin/bash

# Script para preparar o iAgris COMPLETO para cPanel
# Inclui todas as dependências e arquivos necessários
# No cPanel, apenas extrair e executar

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════╗"
echo "║     PREPARAÇÃO COMPLETA iAgris para cPanel     ║"
echo "║        Pacote Completo com Dependências       ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

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

# Verificar ambiente
if [ ! -f "package.json" ] || [ ! -f "vite.config.ts" ]; then
    error "Execute este script no diretório raiz do projeto iAgris"
    exit 1
fi

log "🔍 Verificando ambiente..."

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

# Limpar tudo
log "🧹 Limpando arquivos antigos..."
rm -rf dist/
rm -rf node_modules/
rm -rf iagris-cpanel-complete-*/
rm -f iagris-cpanel-complete-*.zip

# Instalar dependências de produção
log "📦 Instalando dependências de produção..."
npm ci --production

# Instalar dependências de build temporariamente
log "🔧 Instalando dependências de build..."
npm install --save-dev vite esbuild @types/node typescript

# Build da aplicação
log "🔨 Fazendo build da aplicação..."
export NODE_ENV=production
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

if [ $? -ne 0 ]; then
    error "Falha no build da aplicação!"
    exit 1
fi

# Verificar build
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    error "Build não foi criado corretamente!"
    exit 1
fi

log "✅ Build concluído com sucesso"

# Reinstalar apenas dependências de produção
log "📦 Reinstalando apenas dependências de produção..."
rm -rf node_modules/
npm ci --production --silent

# Criar diretório do pacote completo
BUILD_DIR="iagris-cpanel-complete-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BUILD_DIR

log "📁 Preparando pacote completo..."

# Copiar todos os arquivos necessários
cp -r dist/ $BUILD_DIR/
cp -r node_modules/ $BUILD_DIR/
cp -r server/ $BUILD_DIR/
cp -r shared/ $BUILD_DIR/
cp -r photos/ $BUILD_DIR/ 2>/dev/null || mkdir -p $BUILD_DIR/photos/

# Arquivos de configuração
cp package.json $BUILD_DIR/
cp package-lock.json $BUILD_DIR/
cp drizzle.config.ts $BUILD_DIR/
cp .htaccess $BUILD_DIR/
cp env.example $BUILD_DIR/
cp setup-database.js $BUILD_DIR/
cp backup.sh $BUILD_DIR/
cp install-cpanel.sh $BUILD_DIR/

# Criar diretórios necessários
mkdir -p $BUILD_DIR/logs
mkdir -p $BUILD_DIR/backups
mkdir -p $BUILD_DIR/photos

# Criar script de inicialização específico para cPanel
cat > $BUILD_DIR/start-cpanel.sh << 'EOF'
#!/bin/bash

# Script para iniciar iAgris no cPanel
# Use: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js

echo "Iniciando iAgris no cPanel..."

# Definir variáveis de ambiente
export NODE_ENV=production
export CPANEL_MODE=true

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "ERRO: Arquivo .env não encontrado!"
    echo "Copie env.example para .env e configure as variáveis"
    exit 1
fi

# Carregar variáveis do .env
set -a
source .env
set +a

# Iniciar aplicação com o Node.js do cPanel
/opt/cpanel/ea-nodejs22/bin/node dist/index.js
EOF

# Criar script de inicialização em JavaScript para compatibilidade total
cat > $BUILD_DIR/start-cpanel.js << 'EOF'
// Script de inicialização para cPanel - iAgris
// Use: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando iAgris no cPanel...');

// Verificar se .env existe
if (!fs.existsSync('.env')) {
    console.error('❌ ERRO: Arquivo .env não encontrado!');
    console.error('📋 Copie env.example para .env e configure as variáveis');
    process.exit(1);
}

// Carregar variáveis do .env
require('dotenv').config();

// Definir variáveis obrigatórias
process.env.NODE_ENV = 'production';
process.env.CPANEL_MODE = 'true';

// Verificar variáveis obrigatórias
const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
    console.error('❌ ERRO: Variáveis de ambiente obrigatórias não encontradas:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('📋 Configure essas variáveis no arquivo .env');
    process.exit(1);
}

console.log('✅ Configuração validada');
console.log('🔄 Carregando aplicação principal...');

// Importar e iniciar a aplicação principal
require('./dist/index.js');
EOF

# Criar instruções específicas para cPanel
cat > $BUILD_DIR/INSTRUCOES-CPANEL-COMPLETO.md << 'EOF'
# INSTRUÇÕES CPANEL - PACOTE COMPLETO

## ESTE PACOTE JÁ CONTÉM TUDO!

✅ Aplicação compilada (dist/)
✅ Todas as dependências (node_modules/)
✅ Scripts de inicialização prontos
✅ Configurações otimizadas

## PASSOS PARA INSTALAÇÃO:

### 1. EXTRAIR NO CPANEL
- Faça upload do ZIP para public_html/
- Extraia na pasta `iagris`
- Ou extraia e renomeie a pasta para `iagris`

### 2. CONFIGURAR BANCO POSTGRESQL
No cPanel:
- Criar banco: seuusuario_iagris
- Criar usuário com senha forte
- Dar permissões ALL ao usuário

### 3. CONFIGURAR .ENV
```bash
cp env.example .env
```

Edite .env com seus dados:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/seuusuario_iagris"
NODE_ENV="production"
SESSION_SECRET="sua_chave_secreta_forte_32_caracteres"
CPANEL_MODE="true"
```

### 4. CONFIGURAR PERMISSÕES (Se necessário)
```bash
chmod 755 photos logs backups
chmod 644 .env
chmod +x *.sh
```

### 5. TESTAR BANCO (Opcional)
```bash
/opt/cpanel/ea-nodejs22/bin/node setup-database.js
```

### 6. INICIAR APLICAÇÃO

**Opção A - Via Node.js App (Recomendado):**
- cPanel → "Setup Node.js App"
- Application Root: iagris
- Startup File: start-cpanel.js
- Node.js Version: 22.x

**Opção B - Via Terminal/SSH:**
```bash
cd public_html/iagris
/opt/cpanel/ea-nodejs22/bin/node start-cpanel.js
```

**Opção C - Script direto:**
```bash
./start-cpanel.sh
```

### 7. VERIFICAR
- Aplicação: https://seudominio.com/iagris
- Status: https://seudominio.com/iagris/health

## COMANDOS ÚTEIS:

### Aplicar schema do banco:
```bash
/opt/cpanel/ea-nodejs22/bin/node node_modules/.bin/drizzle-kit push
```

### Backup:
```bash
./backup.sh
```

### Ver logs:
```bash
tail -f logs/app.log
```

### Restart via Node.js App:
- cPanel → Node.js Apps → Restart

## IMPORTANTE:
- Este pacote é COMPLETO - não precisa instalar nada
- Apenas configure .env e inicie
- Todas as dependências já estão incluídas
- Use sempre /opt/cpanel/ea-nodejs22/bin/node para comandos

EOF

# Criar .env configurado para cPanel
cat > $BUILD_DIR/.env.cpanel-template << 'EOF'
# Configuração para cPanel - iAgris
# Copie este arquivo para .env e configure com seus dados

# DATABASE - Configure com seus dados PostgreSQL do cPanel
DATABASE_URL="postgresql://seuusuario:suasenha@localhost:5432/seuusuario_iagris"

# CONFIGURAÇÕES OBRIGATÓRIAS
NODE_ENV="production"
SESSION_SECRET="ALTERE_PARA_UMA_CHAVE_SECRETA_FORTE_DE_PELO_MENOS_32_CARACTERES"

# CONFIGURAÇÕES CPANEL
CPANEL_MODE="true"
PORT="0"

# CONFIGURAÇÕES OPCIONAIS
LOG_LEVEL="info"
MAX_MEMORY="256"
EOF

# Otimizar package.json para cPanel
cat > $BUILD_DIR/package-cpanel.json << 'EOF'
{
  "name": "iagris-cpanel",
  "version": "1.0.0",
  "description": "iAgris - Sistema de Gestão de Fazendas (cPanel)",
  "main": "start-cpanel.js",
  "scripts": {
    "start": "/opt/cpanel/ea-nodejs22/bin/node start-cpanel.js",
    "db:push": "/opt/cpanel/ea-nodejs22/bin/node node_modules/.bin/drizzle-kit push",
    "backup": "./backup.sh"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {}
}
EOF

# Adicionar dotenv se não estiver incluído
if [ ! -d "$BUILD_DIR/node_modules/dotenv" ]; then
    log "📦 Adicionando dotenv..."
    cd $BUILD_DIR
    /opt/cpanel/ea-nodejs22/bin/npm install dotenv --production 2>/dev/null || npm install dotenv --production
    cd ..
fi

# Dar permissões aos scripts
chmod +x $BUILD_DIR/*.sh

log "📄 Criando documentação adicional..."

# Criar README simples
cat > $BUILD_DIR/README-CPANEL.txt << 'EOF'
=== iAgris - Pacote Completo para cPanel ===

ESTE PACOTE CONTÉM TUDO QUE VOCÊ PRECISA!

1. Extraia na pasta 'iagris' do seu cPanel
2. Configure .env com dados do seu PostgreSQL
3. Execute: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js

Ou use Node.js App no cPanel:
- Startup File: start-cpanel.js
- Application Root: iagris

Documentação completa: INSTRUCOES-CPANEL-COMPLETO.md

EOF

# Criar ZIP
log "📦 Criando arquivo ZIP..."
zip -r "${BUILD_DIR}.zip" $BUILD_DIR/ -q

# Verificar tamanho do ZIP
ZIP_SIZE=$(du -h "${BUILD_DIR}.zip" | cut -f1)
FOLDER_SIZE=$(du -sh $BUILD_DIR | cut -f1)

log "✅ Pacote completo criado com sucesso!"
echo
info "📊 Estatísticas do pacote:"
info "   📁 Pasta: $FOLDER_SIZE"
info "   📦 ZIP: $ZIP_SIZE"
echo
info "📁 Pasta criada: $BUILD_DIR/"
info "📦 Arquivo ZIP: ${BUILD_DIR}.zip"
echo
log "🚀 PRÓXIMOS PASSOS:"
echo -e "${YELLOW}"
echo "1. Faça upload do arquivo ZIP para seu cPanel"
echo "2. Extraia na pasta 'iagris'"
echo "3. Configure .env com dados do PostgreSQL"
echo "4. Execute: /opt/cpanel/ea-nodejs22/bin/node start-cpanel.js"
echo -e "${NC}"
echo
log "📖 Veja INSTRUCOES-CPANEL-COMPLETO.md para detalhes"