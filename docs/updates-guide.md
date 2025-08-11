# Guia de Atualizações - iAgris

## Visão Geral

Este documento detalha os procedimentos para atualização do sistema iAgris, incluindo planejamento, execução segura e rollback quando necessário. Seguir estes procedimentos garante que as atualizações sejam aplicadas de forma segura e confiável.

## Tipos de Atualizações

### Classificação por Impacto

#### Patch Updates (x.x.X)
- **Conteúdo**: Correções de bugs, atualizações de segurança
- **Impacto**: Baixo
- **Downtime**: Mínimo (< 5 minutos)
- **Frequência**: Conforme necessário
- **Aprovação**: Administrador do Sistema

#### Minor Updates (x.X.x)
- **Conteúdo**: Novas funcionalidades, melhorias
- **Impacto**: Médio
- **Downtime**: Moderado (10-30 minutos)
- **Frequência**: Mensal/Bimestral
- **Aprovação**: Administrador + Stakeholders

#### Major Updates (X.x.x)
- **Conteúdo**: Mudanças arquiteturais, breaking changes
- **Impacto**: Alto
- **Downtime**: Alto (30-120 minutos)
- **Frequência**: Anual/Semestral
- **Aprovação**: Todas as partes interessadas

### Classificação por Urgência

#### Critical (Segurança)
- **Tempo**: Aplicar em 24-48h
- **Teste**: Teste mínimo obrigatório
- **Janela**: Qualquer horário
- **Comunicação**: Imediata

#### High (Bug crítico)
- **Tempo**: Aplicar em 1 semana
- **Teste**: Teste completo em staging
- **Janela**: Horário de menor uso
- **Comunicação**: 24h de antecedência

#### Medium (Funcionalidade)
- **Tempo**: Aplicar em 2-4 semanas
- **Teste**: Teste completo + UAT
- **Janela**: Janela de manutenção planejada
- **Comunicação**: 1 semana de antecedência

#### Low (Melhoria)
- **Tempo**: Aplicar quando conveniente
- **Teste**: Teste completo + UAT
- **Janela**: Janela de manutenção planejada
- **Comunicação**: 2 semanas de antecedência

## Processo de Atualização

### Fase 1: Planejamento

#### Checklist de Planejamento

```yaml
Análise de Impacto:
  - [ ] Identificar mudanças incluídas na atualização
  - [ ] Avaliar impacto em funcionalidades existentes
  - [ ] Verificar compatibilidade com versões anteriores
  - [ ] Identificar dependências afetadas

Recursos Necessários:
  - [ ] Tempo estimado para atualização
  - [ ] Recursos humanos necessários
  - [ ] Janela de manutenção requerida
  - [ ] Ferramentas e scripts necessários

Comunicação:
  - [ ] Notificar stakeholders sobre a atualização
  - [ ] Agendar janela de manutenção
  - [ ] Preparar comunicação para usuários
  - [ ] Definir plano de comunicação durante a atualização

Preparação:
  - [ ] Backup completo do sistema
  - [ ] Preparar ambiente de teste
  - [ ] Validar scripts de atualização
  - [ ] Preparar scripts de rollback
```

#### Cronograma Padrão

```
T-14 dias: Planejamento e análise de impacto
T-7 dias:  Teste em ambiente de staging
T-3 dias:  Aprovação final e comunicação aos usuários
T-1 dia:   Backup e preparação final
T-0:       Execução da atualização
T+1 dia:   Monitoramento pós-atualização
T+7 dias:  Avaliação de sucesso
```

### Fase 2: Teste em Staging

#### Configuração do Ambiente de Staging

```bash
#!/bin/bash
# Script para preparar ambiente de staging

PROD_DB="iagris_prod"
STAGING_DB="iagris_staging"
STAGING_DIR="/var/www/iagris-staging"

echo "=== PREPARANDO AMBIENTE DE STAGING ==="

# 1. Parar aplicação de staging
sudo systemctl stop iagris-staging

# 2. Backup da base atual de staging
pg_dump -U iagris $STAGING_DB | gzip > "/tmp/staging_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# 3. Copiar dados de produção para staging
echo "Copiando dados de produção..."
pg_dump -U iagris $PROD_DB | psql -U iagris $STAGING_DB

# 4. Backup do código atual de staging
tar -czf "/tmp/staging_code_$(date +%Y%m%d_%H%M%S).tar.gz" -C /var/www iagris-staging

# 5. Copiar código de produção para staging
rsync -av --exclude='node_modules' --exclude='.git' /var/www/iagris/ $STAGING_DIR/

# 6. Configurar ambiente de staging
cp $STAGING_DIR/.env.example $STAGING_DIR/.env.staging
sed -i 's/iagris_prod/iagris_staging/g' $STAGING_DIR/.env.staging
sed -i 's/NODE_ENV=production/NODE_ENV=staging/g' $STAGING_DIR/.env.staging

# 7. Instalar dependências
cd $STAGING_DIR
npm ci

# 8. Aplicar a nova versão
git checkout tags/v$NEW_VERSION

# 9. Instalar novas dependências se houver
npm ci

# 10. Aplicar migrations se houver
npm run db:push

# 11. Build da aplicação
npm run build

# 12. Iniciar aplicação de staging
sudo systemctl start iagris-staging

echo "✅ Ambiente de staging preparado"
echo "Acesse: https://staging.iagris.com"
```

#### Plano de Testes

```yaml
Testes Funcionais:
  - [ ] Login e autenticação
  - [ ] Navegação entre páginas
  - [ ] CRUD de animais
  - [ ] CRUD de cultivos
  - [ ] Gestão de inventário
  - [ ] Relatórios principais
  - [ ] Upload de imagens
  - [ ] Exportação de dados

Testes de Performance:
  - [ ] Tempo de carregamento de páginas
  - [ ] Tempo de resposta da API
  - [ ] Carga com múltiplos usuários
  - [ ] Queries de banco de dados

Testes de Compatibilidade:
  - [ ] Navegadores diferentes
  - [ ] Dispositivos móveis
  - [ ] Tamanhos de tela diferentes

Testes de Dados:
  - [ ] Integridade dos dados migrados
  - [ ] Validação de relacionamentos
  - [ ] Backup e restauração
```

### Fase 3: Execução da Atualização

#### Script Principal de Atualização

```bash
#!/bin/bash
# Script principal de atualização do iAgris

set -e  # Parar em caso de erro

# Configurações
NEW_VERSION="$1"
BACKUP_DIR="/var/backups/iagris/updates"
APP_DIR="/var/www/iagris"
LOG_FILE="/var/log/iagris-update.log"

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Função de rollback em caso de erro
rollback() {
    log "❌ ERRO DETECTADO - Iniciando rollback"
    
    # Parar aplicação
    sudo systemctl stop iagris
    
    # Restaurar código
    if [ -f "$BACKUP_DIR/code_backup.tar.gz" ]; then
        log "Restaurando código anterior..."
        rm -rf $APP_DIR
        tar -xzf "$BACKUP_DIR/code_backup.tar.gz" -C /var/www/
    fi
    
    # Restaurar banco
    if [ -f "$BACKUP_DIR/db_backup.sql.gz" ]; then
        log "Restaurando banco de dados..."
        gunzip -c "$BACKUP_DIR/db_backup.sql.gz" | psql -U iagris iagris_prod
    fi
    
    # Reiniciar aplicação
    sudo systemctl start iagris
    
    log "❌ Rollback concluído"
    exit 1
}

# Configurar trap para rollback automático
trap rollback ERR

# Validações iniciais
if [ -z "$NEW_VERSION" ]; then
    log "❌ Versão não especificada"
    echo "Uso: $0 <versão>"
    exit 1
fi

if [ ! -d "$APP_DIR" ]; then
    log "❌ Diretório da aplicação não encontrado: $APP_DIR"
    exit 1
fi

log "=== INICIANDO ATUALIZAÇÃO PARA VERSÃO $NEW_VERSION ==="

# 1. Criar diretório de backup
mkdir -p $BACKUP_DIR
log "✅ Diretório de backup criado"

# 2. Backup do código atual
log "📦 Criando backup do código..."
tar -czf "$BACKUP_DIR/code_backup.tar.gz" -C /var/www iagris
log "✅ Backup do código concluído"

# 3. Backup do banco de dados
log "📦 Criando backup do banco de dados..."
pg_dump -U iagris iagris_prod | gzip > "$BACKUP_DIR/db_backup.sql.gz"
log "✅ Backup do banco concluído"

# 4. Ativar modo de manutenção
log "🔧 Ativando modo de manutenção..."
touch $APP_DIR/maintenance.flag
sudo systemctl stop iagris
log "✅ Modo de manutenção ativado"

# 5. Atualizar código
log "📥 Baixando nova versão..."
cd $APP_DIR
git fetch --tags
git checkout tags/v$NEW_VERSION
log "✅ Código atualizado para versão $NEW_VERSION"

# 6. Instalar dependências
log "📦 Instalando dependências..."
npm ci --production
log "✅ Dependências instaladas"

# 7. Aplicar migrações de banco
log "🗄️ Aplicando migrações de banco..."
npm run db:push
log "✅ Migrações aplicadas"

# 8. Build da aplicação
log "🔨 Compilando aplicação..."
npm run build
log "✅ Build concluído"

# 9. Validação básica
log "✅ Executando validação básica..."
if [ ! -f "dist/index.js" ]; then
    log "❌ Arquivo principal não encontrado após build"
    exit 1
fi

# Verificar se package.json tem a versão correta
package_version=$(node -p "require('./package.json').version")
if [ "$package_version" != "$NEW_VERSION" ]; then
    log "⚠️ Aviso: Versão no package.json ($package_version) diferente da solicitada ($NEW_VERSION)"
fi

log "✅ Validação básica passou"

# 10. Iniciar aplicação
log "🚀 Iniciando aplicação..."
sudo systemctl start iagris

# 11. Aguardar inicialização
log "⏳ Aguardando inicialização..."
sleep 10

# 12. Verificar se aplicação está respondendo
log "🔍 Verificando health check..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log "✅ Aplicação está respondendo"
        break
    fi
    
    if [ $i -eq 30 ]; then
        log "❌ Aplicação não está respondendo após 30 tentativas"
        exit 1
    fi
    
    sleep 2
done

# 13. Desativar modo de manutenção
log "🔧 Desativando modo de manutenção..."
rm -f $APP_DIR/maintenance.flag
log "✅ Modo de manutenção desativado"

# 14. Verificação final
log "🔍 Executando verificação final..."

# Testar endpoints principais
endpoints=("/health" "/api/user" "/")
for endpoint in "${endpoints[@]}"; do
    if curl -f "http://localhost:5000$endpoint" > /dev/null 2>&1; then
        log "✅ Endpoint $endpoint OK"
    else
        log "❌ Endpoint $endpoint com problema"
        exit 1
    fi
done

# 15. Limpeza
log "🧹 Limpando arquivos temporários..."
npm prune --production
log "✅ Limpeza concluída"

log "🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!"
log "Versão atual: $NEW_VERSION"
log "Logs disponíveis em: $LOG_FILE"

# Remover trap de rollback
trap - ERR

# Enviar notificação de sucesso
if command -v mail &> /dev/null; then
    echo "Atualização do iAgris para versão $NEW_VERSION concluída com sucesso!" | \
    mail -s "✅ Atualização iAgris Concluída" admin@iagris.com
fi
```

#### Execução da Atualização

```bash
# Dar permissão de execução
chmod +x /usr/local/bin/iagris-update.sh

# Executar atualização
sudo /usr/local/bin/iagris-update.sh v1.2.0

# Monitorar logs em tempo real
tail -f /var/log/iagris-update.log
```

### Fase 4: Verificação Pós-Atualização

#### Script de Verificação

```bash
#!/bin/bash
# Script de verificação pós-atualização

APP_DIR="/var/www/iagris"
LOG_FILE="/var/log/iagris-verification.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "=== INICIANDO VERIFICAÇÃO PÓS-ATUALIZAÇÃO ==="

# 1. Verificar se aplicação está rodando
if systemctl is-active --quiet iagris; then
    log "✅ Serviço iAgris está ativo"
else
    log "❌ Serviço iAgris não está ativo"
    exit 1
fi

# 2. Verificar health check
response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json http://localhost:5000/health)
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    status=$(jq -r '.status' /tmp/health_response.json 2>/dev/null || echo "unknown")
    if [ "$status" = "healthy" ]; then
        log "✅ Health check passou"
    else
        log "❌ Health check falhou - Status: $status"
    fi
else
    log "❌ Health check falhou - HTTP $http_code"
fi

# 3. Verificar conectividade com banco
if psql -U iagris -d iagris_prod -c "SELECT 1;" > /dev/null 2>&1; then
    log "✅ Conectividade com banco OK"
else
    log "❌ Problema de conectividade com banco"
fi

# 4. Verificar logs de erro
error_count=$(tail -n 100 /var/log/iagris/error.log | grep -c "ERROR" || echo "0")
if [ "$error_count" -lt 5 ]; then
    log "✅ Poucos erros nos logs ($error_count)"
else
    log "⚠️ Muitos erros nos logs ($error_count)"
fi

# 5. Verificar uso de recursos
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
memory_usage=$(free | grep Mem | awk '{printf("%.1f", ($3/$2) * 100.0)}')

log "📊 Uso de CPU: ${cpu_usage}%"
log "📊 Uso de Memória: ${memory_usage}%"

if (( $(echo "$cpu_usage < 80" | bc -l) )); then
    log "✅ Uso de CPU OK"
else
    log "⚠️ Alto uso de CPU"
fi

if (( $(echo "$memory_usage < 85" | bc -l) )); then
    log "✅ Uso de memória OK"
else
    log "⚠️ Alto uso de memória"
fi

# 6. Testar funcionalidades principais
log "🔍 Testando funcionalidades principais..."

# Teste de login
login_response=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    http://localhost:5000/auth/login)

if echo "$login_response" | grep -q "user"; then
    log "✅ Login funcionando"
else
    log "❌ Problema no login"
fi

# Teste de listagem de fazendas
farms_response=$(curl -s -H "Cookie: $(echo "$login_response" | grep -o 'connect.sid=[^;]*')" \
    http://localhost:5000/api/farms)

if echo "$farms_response" | grep -q "\["; then
    log "✅ API de fazendas funcionando"
else
    log "❌ Problema na API de fazendas"
fi

log "=== VERIFICAÇÃO CONCLUÍDA ==="
```

## Rollback de Atualizações

### Script de Rollback Automático

```bash
#!/bin/bash
# Script de rollback automático

BACKUP_DIR="/var/backups/iagris/updates"
APP_DIR="/var/www/iagris"
LOG_FILE="/var/log/iagris-rollback.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "=== INICIANDO ROLLBACK ==="

# Confirmar intenção
echo "⚠️  ATENÇÃO: Esta operação irá reverter o sistema para a versão anterior"
echo "Backup utilizado: $BACKUP_DIR"
read -p "Continuar com o rollback? (sim/nao): " confirm

if [ "$confirm" != "sim" ]; then
    log "❌ Rollback cancelado pelo usuário"
    exit 0
fi

# 1. Parar aplicação
log "🛑 Parando aplicação..."
sudo systemctl stop iagris
touch $APP_DIR/maintenance.flag
log "✅ Aplicação parada"

# 2. Verificar se backups existem
if [ ! -f "$BACKUP_DIR/code_backup.tar.gz" ]; then
    log "❌ Backup de código não encontrado"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/db_backup.sql.gz" ]; then
    log "❌ Backup de banco não encontrado"
    exit 1
fi

# 3. Backup da versão atual (por segurança)
log "📦 Criando backup da versão atual..."
tar -czf "$BACKUP_DIR/current_version_$(date +%Y%m%d_%H%M%S).tar.gz" -C /var/www iagris
log "✅ Backup da versão atual criado"

# 4. Restaurar código
log "📥 Restaurando código anterior..."
rm -rf $APP_DIR
tar -xzf "$BACKUP_DIR/code_backup.tar.gz" -C /var/www/
log "✅ Código restaurado"

# 5. Restaurar banco de dados
log "🗄️ Restaurando banco de dados..."

# Criar backup da base atual antes do rollback
pg_dump -U iagris iagris_prod | gzip > "$BACKUP_DIR/current_db_$(date +%Y%m%d_%H%M%S).sql.gz"

# Terminar conexões ativas
psql -U postgres -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = 'iagris_prod' AND pid <> pg_backend_pid();
"

# Restaurar backup
gunzip -c "$BACKUP_DIR/db_backup.sql.gz" | psql -U iagris iagris_prod
log "✅ Banco de dados restaurado"

# 6. Reinstalar dependências
log "📦 Instalando dependências..."
cd $APP_DIR
npm ci --production
log "✅ Dependências instaladas"

# 7. Build da aplicação
log "🔨 Compilando aplicação..."
npm run build
log "✅ Build concluído"

# 8. Iniciar aplicação
log "🚀 Iniciando aplicação..."
sudo systemctl start iagris
sleep 10

# 9. Verificar se está funcionando
log "🔍 Verificando funcionamento..."
for i in {1..15}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log "✅ Aplicação está respondendo"
        break
    fi
    
    if [ $i -eq 15 ]; then
        log "❌ Aplicação não está respondendo"
        exit 1
    fi
    
    sleep 2
done

# 10. Desativar modo de manutenção
rm -f $APP_DIR/maintenance.flag
log "✅ Modo de manutenção desativado"

log "🔄 ROLLBACK CONCLUÍDO COM SUCESSO!"

# Notificar equipe
if command -v mail &> /dev/null; then
    echo "Rollback do iAgris executado com sucesso. Sistema restaurado para versão anterior." | \
    mail -s "🔄 Rollback iAgris Executado" admin@iagris.com
fi
```

### Rollback Manual de Banco de Dados

```bash
#!/bin/bash
# Rollback específico do banco de dados

BACKUP_FILE="$1"
TARGET_DB="iagris_prod"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo-backup.sql.gz>"
    echo "Backups disponíveis:"
    ls -la /var/backups/iagris/updates/db_backup*.sql.gz
    exit 1
fi

echo "⚠️  ATENÇÃO: Esta operação irá sobrescrever o banco de dados atual"
echo "Backup: $BACKUP_FILE"
echo "Banco: $TARGET_DB"
read -p "Continuar? (sim/nao): " confirm

if [ "$confirm" != "sim" ]; then
    echo "Operação cancelada"
    exit 0
fi

# Parar aplicação
sudo systemctl stop iagris

# Backup de segurança
pg_dump -U iagris $TARGET_DB | gzip > "/tmp/emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Restaurar banco
echo "Restaurando banco de dados..."
gunzip -c "$BACKUP_FILE" | psql -U iagris $TARGET_DB

# Reiniciar aplicação
sudo systemctl start iagris

echo "✅ Rollback do banco de dados concluído"
```

## Comunicação com Usuários

### Templates de Comunicação

#### Notificação de Manutenção Programada

```
Assunto: [iAgris] Manutenção Programada - [Data]

Prezados usuários,

Informamos que será realizada uma manutenção programada no sistema iAgris:

📅 Data: [DATA]
🕐 Horário: [HORÁRIO INÍCIO] às [HORÁRIO FIM] 
⏱️ Duração estimada: [DURAÇÃO]
🔧 Tipo: Atualização do sistema v[VERSÃO]

Durante este período, o sistema ficará indisponível. 

Melhorias incluídas nesta atualização:
• [MELHORIA 1]
• [MELHORIA 2]
• [CORREÇÃO 1]

Recomendações:
• Salve todos os dados antes do horário de início
• Evite iniciar processos longos próximo ao horário
• Faça logout do sistema antes da manutenção

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
Equipe iAgris
```

#### Notificação de Início de Manutenção

```
Assunto: [iAgris] Manutenção Iniciada

A manutenção programada foi iniciada.

O sistema está temporariamente indisponível.
Tempo estimado: [DURAÇÃO]

Atualizações serão enviadas conforme necessário.

Equipe iAgris
```

#### Notificação de Manutenção Concluída

```
Assunto: [iAgris] Sistema Atualizado - Versão [VERSÃO]

A manutenção foi concluída com sucesso!

✅ Sistema atualizado para versão [VERSÃO]
✅ Todas as funcionalidades estão operacionais
✅ Dados preservados integralmente

Novidades desta versão:
• [NOVA FUNCIONALIDADE 1]
• [MELHORIA 1]
• [CORREÇÃO 1]

O sistema já está disponível no endereço habitual.

Em caso de problemas, entre em contato imediatamente.

Equipe iAgris
```

### Canais de Comunicação

#### Email
- **Lista geral**: Todos os usuários
- **Lista administrativa**: Administradores e gerentes
- **Lista técnica**: Equipe de TI

#### WhatsApp/SMS
- **Alertas críticos**: Apenas para situações emergenciais
- **Grupos específicos**: Por fazenda ou região

#### Sistema iAgris
- **Banner de manutenção**: Aviso no topo da tela
- **Notificações internas**: Sistema de notificações

## Automação de Atualizações

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/update.yml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event.release.prerelease == false
    
    steps:
      - name: Notify start
        uses: ./.github/actions/notify
        with:
          message: "🚀 Iniciando deploy da versão ${{ github.event.release.tag_name }}"
      
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          ref: ${{ github.event.release.tag_name }}
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            /usr/local/bin/iagris-update.sh ${{ github.event.release.tag_name }}
      
      - name: Verify deployment
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            /usr/local/bin/iagris-verify.sh
      
      - name: Notify success
        if: success()
        uses: ./.github/actions/notify
        with:
          message: "✅ Deploy da versão ${{ github.event.release.tag_name }} concluído"
      
      - name: Notify failure
        if: failure()
        uses: ./.github/actions/notify
        with:
          message: "❌ Falha no deploy da versão ${{ github.event.release.tag_name }}"
      
      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            /usr/local/bin/iagris-rollback.sh
```

### Atualizações Automáticas de Segurança

```bash
#!/bin/bash
# Script para atualizações automáticas de segurança

LOG_FILE="/var/log/security-updates.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

check_security_updates() {
    cd /var/www/iagris
    
    # Verificar vulnerabilidades npm
    npm_vulns=$(npm audit --audit-level high 2>/dev/null | grep "found" | grep "high\|critical" || echo "")
    
    if [ ! -z "$npm_vulns" ]; then
        log "⚠️ Vulnerabilidades detectadas: $npm_vulns"
        
        # Tentar correção automática
        npm audit fix --force
        
        if [ $? -eq 0 ]; then
            log "✅ Vulnerabilidades corrigidas automaticamente"
            
            # Rebuild e restart
            npm run build
            sudo systemctl restart iagris
            
            # Notificar equipe
            echo "Vulnerabilidades de segurança corrigidas automaticamente no iAgris" | \
            mail -s "🔒 Correções de Segurança Aplicadas" admin@iagris.com
        else
            log "❌ Falha na correção automática"
            
            # Notificar para intervenção manual
            echo "Vulnerabilidades detectadas no iAgris que requerem intervenção manual: $npm_vulns" | \
            mail -s "🚨 Ação Manual Necessária - Segurança" admin@iagris.com
        fi
    else
        log "✅ Nenhuma vulnerabilidade detectada"
    fi
}

# Executar verificação
check_security_updates

# Agendar no cron para execução diária
# 0 4 * * * /usr/local/bin/security-updates.sh
```

## Documentação de Mudanças

### Changelog

```markdown
# Changelog - iAgris

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-08-15

### Added
- Nova funcionalidade de relatórios avançados
- Suporte para múltiplas fazendas por usuário
- Dashboard de métricas em tempo real

### Changed
- Interface de gestão de animais melhorada
- Performance de carregamento de dados otimizada
- Sistema de notificações redesenhado

### Fixed
- Correção no cálculo de custos por cultivo
- Problema de timeout em relatórios grandes
- Bug na sincronização de dados offline

### Security
- Atualização de dependências com vulnerabilidades
- Melhoria na validação de inputs
- Fortalecimento da autenticação

## [1.1.5] - 2025-08-01

### Fixed
- Correção crítica na exportação de relatórios
- Bug no cadastro de funcionários temporários

### Security
- Patch de segurança para dependência npm

## [1.1.4] - 2025-07-20

### Changed
- Melhoria na interface de mobile
- Otimização de queries do banco de dados

### Fixed
- Correção no filtro de animais por espécie
- Problema de layout em telas pequenas
```

### Release Notes

```markdown
# Release Notes - iAgris v1.2.0

## Destaques desta Versão

### 🚀 Novas Funcionalidades

#### Relatórios Avançados
- Novos relatórios com gráficos interativos
- Exportação em múltiplos formatos (PDF, Excel, CSV)
- Agendamento automático de relatórios

#### Múltiplas Fazendas
- Usuários podem agora ter acesso a múltiplas fazendas
- Seletor de fazenda no cabeçalho
- Permissões granulares por fazenda

#### Dashboard em Tempo Real
- Métricas atualizadas automaticamente
- Alertas visuais para situações críticas
- Widgets personalizáveis

### 💡 Melhorias

- **Performance**: Carregamento 40% mais rápido
- **Interface**: Design modernizado e mais intuitivo
- **Mobile**: Experiência otimizada para dispositivos móveis

### 🔧 Correções

- Resolvido problema de timeout em relatórios grandes
- Corrigido cálculo de custos por cultivo
- Fixado bug na sincronização offline

### 🔒 Segurança

- Atualizadas todas as dependências
- Melhorada validação de dados de entrada
- Fortalecido sistema de autenticação

## Instruções de Atualização

### Para Administradores

1. A atualização será aplicada durante a janela de manutenção programada
2. Tempo estimado de indisponibilidade: 30 minutos
3. Todos os dados serão preservados
4. Backup automático será criado antes da atualização

### Para Usuários

1. Façam logout antes da manutenção
2. Limpem o cache do navegador após a atualização
3. Novas funcionalidades estarão disponíveis imediatamente
4. Manual atualizado disponível na seção de ajuda

## Problemas Conhecidos

- Relatórios muito grandes (>10MB) podem demorar para gerar
- Safari em iOS pode apresentar problemas com upload de imagens
- Funcionalidade offline limitada em alguns navegadores antigos

## Suporte

Em caso de problemas após a atualização:
- Consulte a [FAQ](docs/faq.md)
- Entre em contato: suporte@iagris.com
- Chat online disponível das 8h às 18h
```

---

*Este guia deve ser seguido rigorosamente para garantir atualizações seguras e bem-sucedidas do sistema iAgris.*