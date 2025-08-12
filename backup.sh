#!/bin/bash

# Script de backup para iAgris em produção (cPanel)
# Execute via cron job ou manualmente

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
MAX_BACKUPS=5

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Iniciando backup do iAgris - $DATE${NC}"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

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

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "dist" ]; then
    error "Execute este script no diretório raiz da aplicação iAgris"
    exit 1
fi

log "📁 Fazendo backup dos arquivos da aplicação..."

# Backup dos arquivos importantes
tar -czf $BACKUP_DIR/iagris_files_$DATE.tar.gz \
    dist/ \
    server/ \
    shared/ \
    photos/ \
    logs/ \
    package.json \
    package-lock.json \
    drizzle.config.ts \
    .env \
    .htaccess \
    2>/dev/null

if [ $? -eq 0 ]; then
    log "✅ Backup de arquivos criado: iagris_files_$DATE.tar.gz"
else
    error "Falha ao criar backup de arquivos"
fi

# Backup do banco de dados (se comando pg_dump estiver disponível)
if command -v pg_dump &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
    log "🗄️  Fazendo backup do banco de dados..."
    
    pg_dump "$DATABASE_URL" > $BACKUP_DIR/iagris_db_$DATE.sql 2>/dev/null
    
    if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/iagris_db_$DATE.sql" ]; then
        log "✅ Backup do banco criado: iagris_db_$DATE.sql"
    else
        warn "Não foi possível fazer backup do banco de dados"
        rm -f $BACKUP_DIR/iagris_db_$DATE.sql
    fi
else
    warn "pg_dump não disponível ou DATABASE_URL não configurado"
fi

# Backup das configurações do sistema
log "⚙️  Fazendo backup das configurações..."

# Criar arquivo com informações do sistema
cat > $BACKUP_DIR/system_info_$DATE.txt << EOF
# Backup do iAgris - $DATE

## Informações do Sistema
Data/Hora: $(date)
Hostname: $(hostname)
Usuario: $(whoami)
Diretorio: $(pwd)

## Versões
Node.js: $(node --version 2>/dev/null || echo "N/A")
NPM: $(npm --version 2>/dev/null || echo "N/A")

## Espaco em Disco
$(df -h . 2>/dev/null || echo "Informação não disponível")

## Arquivos da Aplicação
$(ls -la 2>/dev/null || echo "Listagem não disponível")

## Status dos Processos Node.js
$(ps aux | grep node | grep -v grep 2>/dev/null || echo "Nenhum processo Node.js encontrado")
EOF

log "✅ Informações do sistema salvas: system_info_$DATE.txt"

# Limpar backups antigos (manter apenas os mais recentes)
log "🧹 Limpando backups antigos..."

# Manter apenas os últimos MAX_BACKUPS arquivos
if [ "$(ls -1 $BACKUP_DIR/iagris_files_*.tar.gz 2>/dev/null | wc -l)" -gt "$MAX_BACKUPS" ]; then
    ls -t $BACKUP_DIR/iagris_files_*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    log "Backups de arquivos antigos removidos"
fi

if [ "$(ls -1 $BACKUP_DIR/iagris_db_*.sql 2>/dev/null | wc -l)" -gt "$MAX_BACKUPS" ]; then
    ls -t $BACKUP_DIR/iagris_db_*.sql | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    log "Backups de banco antigos removidos"
fi

if [ "$(ls -1 $BACKUP_DIR/system_info_*.txt 2>/dev/null | wc -l)" -gt "$MAX_BACKUPS" ]; then
    ls -t $BACKUP_DIR/system_info_*.txt | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    log "Arquivos de info do sistema antigos removidos"
fi

# Mostrar tamanho total dos backups
TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)
log "📊 Tamanho total dos backups: $TOTAL_SIZE"

# Listar backups existentes
log "📋 Backups disponíveis:"
ls -lah $BACKUP_DIR/ | grep -E "(files|db|system)" | while read line; do
    echo "   $line"
done

log "✅ Backup concluído com sucesso!"

# Log do backup para arquivo
echo "[$(date)] Backup executado com sucesso - $DATE" >> logs/backup.log 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Backup do iAgris finalizado!${NC}"
echo -e "📁 Localização: $(pwd)/$BACKUP_DIR/"
echo -e "🗂️  Arquivos: iagris_files_$DATE.tar.gz"
echo -e "💾 Banco: iagris_db_$DATE.sql (se disponível)"
echo -e "ℹ️  Info: system_info_$DATE.txt"