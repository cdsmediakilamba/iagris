# Backup e Recuperação - iAgris

## Visão Geral

Este documento detalha as estratégias, procedimentos e melhores práticas para backup e recuperação do sistema iAgris, garantindo a segurança e integridade dos dados em todas as situações.

## Estratégia de Backup

### Tipos de Backup

#### Backup Completo (Full Backup)
- **Conteúdo**: Todos os dados do sistema
- **Frequência**: Semanal
- **Tempo necessário**: 30-60 minutos (depende do volume)
- **Espaço necessário**: 100% do tamanho atual dos dados

#### Backup Incremental
- **Conteúdo**: Apenas dados alterados desde o último backup
- **Frequência**: Diário
- **Tempo necessário**: 5-15 minutos
- **Espaço necessário**: 10-20% do backup completo

#### Backup Diferencial
- **Conteúdo**: Dados alterados desde o último backup completo
- **Frequência**: A cada 3 dias
- **Tempo necessário**: 15-30 minutos
- **Espaço necessário**: 30-50% do backup completo

### Componentes Incluídos no Backup

#### Banco de Dados PostgreSQL
- **Tabelas de dados**: Todas as tabelas do schema público
- **Índices**: Definições de índices
- **Constraints**: Restrições e relacionamentos
- **Triggers**: Triggers e procedures
- **Usuários e permissões**: Definições de acesso

#### Arquivos da Aplicação
- **Código fonte**: Arquivos do backend e frontend
- **Configurações**: Arquivos .env e configurações
- **Uploads**: Fotos de animais e documentos
- **Logs**: Arquivos de log (últimos 30 dias)

#### Configurações do Sistema
- **Nginx**: Configurações do servidor web
- **SSL**: Certificados e chaves
- **Systemd**: Configurações de serviços
- **Cron jobs**: Tarefas agendadas

## Implementação de Backup

### Backup Automático com Script

#### Script Principal de Backup

```bash
#!/bin/bash
# /usr/local/bin/iagris-backup.sh

# Configurações
BACKUP_DIR="/var/backups/iagris"
LOG_FILE="/var/log/iagris-backup.log"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=12

# Configurações do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="iagris_prod"
DB_USER="iagris"
PGPASSWORD="$DB_PASSWORD"

# Configurações de destino
LOCAL_BACKUP_DIR="$BACKUP_DIR/local"
REMOTE_BACKUP_DIR="$BACKUP_DIR/remote"
S3_BUCKET="iagris-backups"
S3_REGION="us-east-1"

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo "$1"
}

# Função de backup do banco de dados
backup_database() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$LOCAL_BACKUP_DIR/db_${backup_type}_${timestamp}.sql.gz"
    
    log "Iniciando backup $backup_type do banco de dados..."
    
    mkdir -p "$LOCAL_BACKUP_DIR"
    
    # Backup com compressão
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        --no-password --verbose \
        | gzip > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "✅ Backup do banco concluído: $backup_file"
        echo "$backup_file"
    else
        log "❌ Erro no backup do banco"
        return 1
    fi
}

# Função de backup dos arquivos
backup_files() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$LOCAL_BACKUP_DIR/files_${timestamp}.tar.gz"
    
    log "Iniciando backup dos arquivos..."
    
    tar -czf "$backup_file" \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='*.log' \
        -C /var/www \
        iagris
    
    if [ $? -eq 0 ]; then
        log "✅ Backup dos arquivos concluído: $backup_file"
        echo "$backup_file"
    else
        log "❌ Erro no backup dos arquivos"
        return 1
    fi
}

# Função de backup completo
full_backup() {
    log "=== INICIANDO BACKUP COMPLETO ==="
    
    local db_backup=$(backup_database "full")
    local files_backup=$(backup_files)
    
    if [ ! -z "$db_backup" ] && [ ! -z "$files_backup" ]; then
        # Criar arquivo único com ambos os backups
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local full_backup_file="$LOCAL_BACKUP_DIR/iagris_full_${timestamp}.tar.gz"
        
        tar -czf "$full_backup_file" -C "$LOCAL_BACKUP_DIR" \
            $(basename "$db_backup") \
            $(basename "$files_backup")
        
        # Upload para S3 (se configurado)
        if command -v aws &> /dev/null; then
            aws s3 cp "$full_backup_file" "s3://$S3_BUCKET/full/" \
                --region $S3_REGION
            log "✅ Backup enviado para S3"
        fi
        
        log "✅ Backup completo finalizado: $full_backup_file"
    else
        log "❌ Erro no backup completo"
        return 1
    fi
}

# Função de backup incremental
incremental_backup() {
    log "=== INICIANDO BACKUP INCREMENTAL ==="
    
    # Backup apenas das tabelas com mudanças recentes
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$LOCAL_BACKUP_DIR/db_incremental_${timestamp}.sql.gz"
    
    # Query para identificar tabelas modificadas nas últimas 24h
    local modified_tables=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            SELECT DISTINCT tablename FROM pg_stat_user_tables 
            WHERE n_tup_ins + n_tup_upd + n_tup_del > 0
        )
    " | tr -d ' ')
    
    if [ ! -z "$modified_tables" ]; then
        pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
            --no-password --data-only \
            $(echo $modified_tables | sed 's/^/-t /' | tr '\n' ' ') \
            | gzip > "$backup_file"
        
        log "✅ Backup incremental concluído: $backup_file"
    else
        log "ℹ️ Nenhuma alteração detectada, backup incremental desnecessário"
    fi
}

# Função de limpeza de backups antigos
cleanup_old_backups() {
    log "Iniciando limpeza de backups antigos..."
    
    # Remover backups diários com mais de 30 dias
    find "$LOCAL_BACKUP_DIR" -name "db_incremental_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$LOCAL_BACKUP_DIR" -name "db_diferencial_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remover backups semanais com mais de 12 semanas
    find "$LOCAL_BACKUP_DIR" -name "iagris_full_*.tar.gz" -mtime +$(($RETENTION_WEEKS * 7)) -delete
    
    log "✅ Limpeza de backups concluída"
}

# Função principal
main() {
    local backup_type=${1:-"incremental"}
    
    case $backup_type in
        "full")
            full_backup
            ;;
        "incremental")
            incremental_backup
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Uso: $0 {full|incremental|cleanup}"
            exit 1
            ;;
    esac
    
    cleanup_old_backups
}

# Verificar dependências
if ! command -v pg_dump &> /dev/null; then
    log "❌ pg_dump não encontrado"
    exit 1
fi

if ! command -v gzip &> /dev/null; then
    log "❌ gzip não encontrado"
    exit 1
fi

# Executar função principal
main "$@"
```

#### Configuração do Cron

```bash
# Editar crontab
sudo crontab -e

# Adicionar tarefas de backup
# Backup incremental diário às 2h
0 2 * * * /usr/local/bin/iagris-backup.sh incremental

# Backup completo semanal aos domingos às 1h
0 1 * * 0 /usr/local/bin/iagris-backup.sh full

# Limpeza de backups antigos mensalmente
0 3 1 * * /usr/local/bin/iagris-backup.sh cleanup
```

### Backup para Nuvem

#### Configuração AWS S3

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure
# AWS Access Key ID: SUA_ACCESS_KEY
# AWS Secret Access Key: SUA_SECRET_KEY
# Default region: us-east-1
# Default output format: json

# Criar bucket para backups
aws s3 mb s3://iagris-backups

# Configurar lifecycle policy
cat > backup-lifecycle.json << 'EOF'
{
    "Rules": [
        {
            "ID": "iagris-backup-lifecycle",
            "Status": "Enabled",
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket iagris-backups \
    --lifecycle-configuration file://backup-lifecycle.json
```

#### Sync Automático para S3

```bash
# Script para sincronização com S3
cat > /usr/local/bin/sync-to-s3.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/iagris/local"
S3_BUCKET="iagris-backups"
LOG_FILE="/var/log/s3-sync.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo "$1"
}

# Sincronizar backups para S3
aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/server-$(hostname)/" \
    --delete \
    --storage-class STANDARD \
    --exclude "*.tmp" \
    --exclude "*.log"

if [ $? -eq 0 ]; then
    log "✅ Sincronização com S3 concluída"
else
    log "❌ Erro na sincronização com S3"
fi
EOF

chmod +x /usr/local/bin/sync-to-s3.sh

# Adicionar ao cron para executar após os backups
# 30 2 * * * /usr/local/bin/sync-to-s3.sh
```

#### Configuração Google Cloud Storage

```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Criar bucket
gsutil mb gs://iagris-backups

# Configurar lifecycle
cat > lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
      "condition": {"age": 30}
    },
    {
      "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
      "condition": {"age": 90}
    },
    {
      "action": {"type": "Delete"},
      "condition": {"age": 2555}
    }
  ]
}
EOF

gsutil lifecycle set lifecycle.json gs://iagris-backups

# Sync para Google Cloud
gsutil -m rsync -r -d /var/backups/iagris/local gs://iagris-backups/
```

## Procedimentos de Recuperação

### Recuperação de Banco de Dados

#### Recuperação Completa

```bash
#!/bin/bash
# Script de recuperação completa do banco

BACKUP_FILE="$1"
DB_NAME="iagris_prod"
DB_USER="iagris"
TEMP_DB="iagris_restore_temp"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo-backup.sql.gz>"
    exit 1
fi

echo "=== INICIANDO RECUPERAÇÃO COMPLETA ==="
echo "Arquivo: $BACKUP_FILE"
echo "ATENÇÃO: Esta operação irá sobrescrever todos os dados!"
read -p "Continuar? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operação cancelada"
    exit 0
fi

# Parar aplicação
echo "Parando aplicação..."
sudo systemctl stop iagris
sudo pm2 stop all

# Criar backup de segurança antes da restauração
echo "Criando backup de segurança..."
pg_dump -U $DB_USER $DB_NAME | gzip > "/tmp/backup_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"

# Criar banco temporário para teste
echo "Criando banco temporário para validação..."
dropdb -U postgres $TEMP_DB 2>/dev/null
createdb -U postgres $TEMP_DB

# Restaurar no banco temporário
echo "Restaurando backup no banco temporário..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -U $DB_USER $TEMP_DB
else
    psql -U $DB_USER $TEMP_DB < "$BACKUP_FILE"
fi

if [ $? -ne 0 ]; then
    echo "❌ Erro na restauração do backup"
    dropdb -U postgres $TEMP_DB
    exit 1
fi

# Validar integridade do backup
echo "Validando integridade dos dados..."
validation_result=$(psql -U $DB_USER $TEMP_DB -t -c "
    SELECT COUNT(*) FROM users;
    SELECT COUNT(*) FROM farms;
    SELECT COUNT(*) FROM animals;
")

echo "Registros encontrados no backup:"
echo "Usuários: $(echo $validation_result | awk '{print $1}')"
echo "Fazendas: $(echo $validation_result | awk '{print $2}')"
echo "Animais: $(echo $validation_result | awk '{print $3}')"

read -p "Os dados parecem corretos? (yes/no): " data_confirm

if [ "$data_confirm" != "yes" ]; then
    echo "Restauração cancelada"
    dropdb -U postgres $TEMP_DB
    exit 0
fi

# Renomear bancos
echo "Finalizando restauração..."
psql -U postgres -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname IN ('$DB_NAME', '${DB_NAME}_old');
"

psql -U postgres -c "ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_old;"
psql -U postgres -c "ALTER DATABASE $TEMP_DB RENAME TO $DB_NAME;"

# Atualizar permissões
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Reiniciar aplicação
echo "Reiniciando aplicação..."
sudo systemctl start iagris
sleep 5

# Verificar se aplicação iniciou corretamente
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Recuperação concluída com sucesso!"
    echo "Banco antigo mantido como: ${DB_NAME}_old"
    echo "Você pode removê-lo após confirmar que tudo está funcionando:"
    echo "dropdb -U postgres ${DB_NAME}_old"
else
    echo "❌ Erro ao reiniciar aplicação"
    echo "Verifique os logs: sudo journalctl -u iagris -f"
fi
```

#### Recuperação Seletiva

```bash
# Script para recuperar apenas tabelas específicas
#!/bin/bash

restore_table() {
    local backup_file="$1"
    local table_name="$2"
    local target_db="$3"
    
    echo "Restaurando tabela $table_name..."
    
    # Extrair apenas a tabela específica do backup
    if [[ $backup_file == *.gz ]]; then
        gunzip -c "$backup_file" | pg_restore --table=$table_name --data-only -U $DB_USER -d $target_db
    else
        pg_restore --table=$table_name --data-only -U $DB_USER -d $target_db "$backup_file"
    fi
}

# Exemplo de uso:
# restore_table "/path/to/backup.sql.gz" "animals" "iagris_prod"
```

### Recuperação de Arquivos

#### Recuperação de Uploads

```bash
#!/bin/bash
# Script para recuperar arquivos de upload

BACKUP_FILE="$1"
TARGET_DIR="/var/www/iagris/uploads"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo-backup-files.tar.gz>"
    exit 1
fi

echo "Recuperando arquivos de upload..."

# Fazer backup dos arquivos atuais
if [ -d "$TARGET_DIR" ]; then
    mv "$TARGET_DIR" "${TARGET_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

# Extrair arquivos do backup
mkdir -p "$TARGET_DIR"
tar -xzf "$BACKUP_FILE" -C "$TARGET_DIR" --strip-components=3 iagris/uploads/

# Ajustar permissões
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

echo "✅ Arquivos de upload recuperados"
```

#### Recuperação de Configurações

```bash
#!/bin/bash
# Script para recuperar configurações do sistema

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo-backup-files.tar.gz>"
    exit 1
fi

echo "Recuperando configurações..."

# Extrair arquivo .env
tar -xzf "$BACKUP_FILE" --to-stdout iagris/.env > /tmp/env_backup

# Comparar com arquivo atual
if [ -f "/var/www/iagris/.env" ]; then
    echo "Configuração atual:"
    cat /var/www/iagris/.env
    echo ""
    echo "Configuração do backup:"
    cat /tmp/env_backup
    echo ""
    
    read -p "Substituir configuração atual? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        cp /tmp/env_backup /var/www/iagris/.env
        echo "✅ Configuração restaurada"
    fi
else
    cp /tmp/env_backup /var/www/iagris/.env
    echo "✅ Configuração restaurada"
fi

rm /tmp/env_backup
```

## Testes de Recuperação

### Teste Mensal de Recuperação

```bash
#!/bin/bash
# Script para teste automático de recuperação

TEST_DB="iagris_test_restore"
LATEST_BACKUP=$(ls -t /var/backups/iagris/local/iagris_full_*.tar.gz | head -n1)
LOG_FILE="/var/log/recovery-test.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo "$1"
}

log "=== INICIANDO TESTE DE RECUPERAÇÃO ==="
log "Backup utilizado: $LATEST_BACKUP"

# Limpar teste anterior
dropdb -U postgres $TEST_DB 2>/dev/null

# Criar banco de teste
createdb -U postgres $TEST_DB

# Extrair e restaurar backup
tar -xzf "$LATEST_BACKUP" -O | gunzip -c | psql -U iagris $TEST_DB

if [ $? -eq 0 ]; then
    log "✅ Backup restaurado com sucesso no banco de teste"
    
    # Validar dados
    record_count=$(psql -U iagris $TEST_DB -t -c "
        SELECT 
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM farms) as farms,
            (SELECT COUNT(*) FROM animals) as animals;
    ")
    
    log "Registros no backup: $record_count"
    
    # Validar integridade referencial
    integrity_check=$(psql -U iagris $TEST_DB -t -c "
        SELECT COUNT(*) FROM animals a 
        LEFT JOIN farms f ON a.farm_id = f.id 
        WHERE f.id IS NULL;
    ")
    
    if [ "$integrity_check" -eq 0 ]; then
        log "✅ Integridade referencial OK"
    else
        log "❌ Problemas de integridade detectados: $integrity_check registros órfãos"
    fi
    
else
    log "❌ Erro na restauração do backup"
fi

# Limpar banco de teste
dropdb -U postgres $TEST_DB

log "=== TESTE DE RECUPERAÇÃO FINALIZADO ==="
```

### Cronograma de Testes

```bash
# Adicionar ao cron para execução mensal
# 0 4 1 * * /usr/local/bin/recovery-test.sh

# Teste semanal básico (apenas validação)
# 0 5 * * 1 /usr/local/bin/backup-validation.sh
```

## Monitoramento de Backup

### Script de Monitoramento

```bash
#!/bin/bash
# Monitoramento do status dos backups

BACKUP_DIR="/var/backups/iagris/local"
ALERT_EMAIL="admin@iagris.com"
LOG_FILE="/var/log/backup-monitor.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo "$1"
}

send_alert() {
    local subject="$1"
    local message="$2"
    
    echo "$message" | mail -s "$subject" $ALERT_EMAIL
    log "ALERTA ENVIADO: $subject"
}

check_recent_backup() {
    local backup_pattern="$1"
    local max_age_hours="$2"
    local backup_type="$3"
    
    latest_backup=$(find $BACKUP_DIR -name "$backup_pattern" -mtime -1 | sort | tail -n1)
    
    if [ -z "$latest_backup" ]; then
        send_alert "❌ Backup $backup_type em falta" "Nenhum backup $backup_type encontrado nas últimas $max_age_hours horas"
        return 1
    fi
    
    backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 3600 ))
    
    if [ $backup_age -gt $max_age_hours ]; then
        send_alert "⚠️ Backup $backup_type atrasado" "Último backup $backup_type realizado há $backup_age horas"
        return 1
    fi
    
    log "✅ Backup $backup_type OK (há $backup_age horas)"
    return 0
}

check_backup_size() {
    local backup_file="$1"
    local min_size_mb="$2"
    
    if [ ! -f "$backup_file" ]; then
        return 1
    fi
    
    file_size_mb=$(( $(stat -c%s "$backup_file") / 1024 / 1024 ))
    
    if [ $file_size_mb -lt $min_size_mb ]; then
        send_alert "⚠️ Backup pequeno demais" "Backup $backup_file tem apenas ${file_size_mb}MB (mínimo: ${min_size_mb}MB)"
        return 1
    fi
    
    log "✅ Tamanho do backup OK: ${file_size_mb}MB"
    return 0
}

check_disk_space() {
    local backup_dir="$1"
    local min_free_gb="$2"
    
    free_space_gb=$(df -BG "$backup_dir" | awk 'NR==2 {print $4}' | sed 's/G//')
    
    if [ $free_space_gb -lt $min_free_gb ]; then
        send_alert "⚠️ Espaço em disco baixo" "Apenas ${free_space_gb}GB livres em $backup_dir (mínimo: ${min_free_gb}GB)"
        return 1
    fi
    
    log "✅ Espaço em disco OK: ${free_space_gb}GB livres"
    return 0
}

# Executar verificações
log "=== INICIANDO MONITORAMENTO DE BACKUP ==="

# Verificar backup incremental (últimas 26 horas)
check_recent_backup "db_incremental_*.sql.gz" 26 "incremental"

# Verificar backup completo (última semana)
check_recent_backup "iagris_full_*.tar.gz" 168 "completo"

# Verificar tamanho mínimo do último backup completo
latest_full_backup=$(ls -t $BACKUP_DIR/iagris_full_*.tar.gz 2>/dev/null | head -n1)
check_backup_size "$latest_full_backup" 10

# Verificar espaço em disco (mínimo 5GB)
check_disk_space "$BACKUP_DIR" 5

log "=== MONITORAMENTO CONCLUÍDO ==="
```

## Documentação de Procedimentos

### Checklist de Recuperação

#### Antes da Recuperação
- [ ] Identificar causa do problema
- [ ] Avaliar extensão da perda de dados
- [ ] Localizar backup mais apropriado
- [ ] Notificar usuários sobre indisponibilidade
- [ ] Fazer backup do estado atual (se possível)

#### Durante a Recuperação
- [ ] Parar aplicação
- [ ] Validar backup antes da restauração
- [ ] Executar restauração em ambiente de teste
- [ ] Verificar integridade dos dados
- [ ] Aplicar restauração em produção
- [ ] Verificar funcionamento da aplicação

#### Após a Recuperação
- [ ] Monitorar logs por problemas
- [ ] Verificar funcionalidades críticas
- [ ] Notificar usuários sobre restauração
- [ ] Documentar incidente e lições aprendidas
- [ ] Revisar procedimentos de backup

### Contatos de Emergência

```yaml
Equipe de Suporte:
  - Administrador Principal: +244 XXX XXX XXX
  - Administrador Backup: +244 XXX XXX XXX
  - Suporte Técnico: suporte@iagris.com

Fornecedores:
  - Provedor de Hospedagem: [contato]
  - Provedor de Backup: [contato]
  - Suporte de Banco de Dados: [contato]

Escalação:
  - Nível 1: Administrador do Sistema
  - Nível 2: Equipe de Desenvolvimento
  - Nível 3: Fornecedor/Consultor Externo
```

### Registro de Incidentes

```
Template de Registro de Incidente:

Data/Hora: _______________
Descrição do Problema: _______________
Impacto: _______________
Tempo de Indisponibilidade: _______________
Causa Raiz: _______________
Ação Tomada: _______________
Backup Utilizado: _______________
Tempo de Recuperação: _______________
Lições Aprendidas: _______________
Ações Preventivas: _______________
```

---

*Este documento deve ser revisado e testado regularmente para garantir sua eficácia em situações reais de recuperação.*