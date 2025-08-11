# Configuração do Ambiente - iAgris

## Visão Geral

Este documento detalha como configurar corretamente todas as variáveis de ambiente e dependências necessárias para executar o sistema iAgris em diferentes ambientes.

## Estrutura de Configuração

### Arquivos de Ambiente

O sistema utiliza diferentes arquivos para cada ambiente:

```
.env.example          # Template com todas as variáveis disponíveis
.env.development      # Configurações para desenvolvimento local
.env.staging          # Configurações para ambiente de teste/staging
.env.production       # Configurações para ambiente de produção
```

### Precedência de Configuração

1. **Variáveis do sistema** (mais alta prioridade)
2. **Arquivo .env específico** (.env.production, .env.development)
3. **Arquivo .env genérico**
4. **Valores padrão** (definidos no código)

## Variáveis de Ambiente

### Configurações Essenciais

#### DATABASE_URL
**Obrigatória** - String de conexão com o banco de dados PostgreSQL.

```bash
# Formato: postgresql://usuario:senha@host:porta/nome_do_banco
DATABASE_URL="postgresql://iagris:senha123@localhost:5432/iagris"

# Para SSL (produção)
DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"

# Neon Database (exemplo)
DATABASE_URL="postgresql://usuario:senha@ep-exemplo.us-east-1.aws.neon.tech/iagris?sslmode=require"
```

#### NODE_ENV
**Obrigatória** - Define o ambiente de execução.

```bash
NODE_ENV="development"    # Desenvolvimento local
NODE_ENV="staging"        # Ambiente de teste
NODE_ENV="production"     # Ambiente de produção
```

#### SESSION_SECRET
**Obrigatória** - Chave secreta para assinatura de sessões.

```bash
# Deve ser uma string aleatória de pelo menos 32 caracteres
SESSION_SECRET="gere-uma-chave-super-secreta-e-aleatoria-aqui-com-64-caracteres"

# Gerar chave segura:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### PORT
**Opcional** - Porta em que a aplicação irá executar.

```bash
PORT=5000              # Desenvolvimento (padrão)
PORT=3000              # Produção comum
PORT=8080              # Heroku, Google Cloud
```

### Configurações de Banco de Dados

#### PostgreSQL Avançado

```bash
# Pool de conexões
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Timeout de queries
DB_QUERY_TIMEOUT=30000

# SSL (produção)
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_CERT="/path/to/ca-certificate.crt"
```

#### Backup e Recuperação

```bash
# Configurações de backup automático
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"          # Diário às 2h
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET="iagris-backups"
BACKUP_S3_REGION="us-east-1"
```

### Configurações de Logs

#### Níveis de Log

```bash
LOG_LEVEL="info"           # production
LOG_LEVEL="debug"          # development
LOG_LEVEL="error"          # minimal logging

# Formato de logs
LOG_FORMAT="json"          # Estruturado (produção)
LOG_FORMAT="simple"        # Texto simples (desenvolvimento)

# Destino dos logs
LOG_FILE="/var/log/iagris/app.log"
LOG_MAX_SIZE="10m"
LOG_MAX_FILES=5
```

#### Logs Específicos

```bash
# Log de auditoria
AUDIT_LOG_ENABLED=true
AUDIT_LOG_FILE="/var/log/iagris/audit.log"

# Log de performance
PERFORMANCE_LOG_ENABLED=true
SLOW_QUERY_THRESHOLD=1000    # ms

# Log de segurança
SECURITY_LOG_ENABLED=true
FAILED_LOGIN_THRESHOLD=5
```

### Configurações de Upload e Arquivos

#### Uploads de Imagens

```bash
# Diretório de uploads
UPLOAD_DIR="./uploads"              # Desenvolvimento
UPLOAD_DIR="/var/www/iagris/uploads" # Produção

# Limites de upload
MAX_FILE_SIZE=10485760      # 10MB em bytes
MAX_FILES_PER_REQUEST=5
ALLOWED_EXTENSIONS="jpg,jpeg,png,pdf,doc,docx"

# URLs públicas
UPLOAD_BASE_URL="https://seu-dominio.com/uploads"
CDN_BASE_URL="https://cdn.seu-dominio.com"
```

#### Processamento de Imagens

```bash
# Redimensionamento automático
IMAGE_RESIZE_ENABLED=true
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080
IMAGE_QUALITY=85

# Thumbnails
THUMBNAIL_ENABLED=true
THUMBNAIL_WIDTH=300
THUMBNAIL_HEIGHT=300
```

### Configurações de Email

#### SMTP Básico

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false           # true para porta 465
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# Configurações do remetente
MAIL_FROM="noreply@iagris.com"
MAIL_FROM_NAME="Sistema iAgris"
```

#### Provedores Específicos

**Gmail:**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
# Usar senha de app, não senha normal
```

**Outlook/Hotmail:**
```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_SECURE=false
```

**SendGrid:**
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="sua-api-key-sendgrid"
```

**Amazon SES:**
```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT=587
SMTP_USER="sua-access-key"
SMTP_PASS="sua-secret-key"
```

### APIs Externas

#### OpenWeather API

```bash
OPENWEATHER_API_KEY="sua-chave-api-openweather"
OPENWEATHER_UNITS="metric"     # Celsius
OPENWEATHER_LANG="pt"          # Português
```

#### Google Maps API

```bash
GOOGLE_MAPS_API_KEY="sua-chave-google-maps"
GOOGLE_MAPS_REGION="AO"        # Angola
```

#### APIs de Pagamento

**Stripe:**
```bash
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**PayPal:**
```bash
PAYPAL_CLIENT_ID="sua-client-id"
PAYPAL_CLIENT_SECRET="sua-client-secret"
PAYPAL_ENVIRONMENT="sandbox"    # ou "production"
```

### Configurações de Segurança

#### Autenticação e Sessão

```bash
# Configurações de sessão
SESSION_NAME="iagris.sid"
SESSION_MAX_AGE=86400000       # 24 horas em ms
SESSION_SECURE=true            # Apenas HTTPS (produção)
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE="strict"

# Rate limiting
RATE_LIMIT_WINDOW=900000       # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESS=true
```

#### CORS e Headers de Segurança

```bash
# CORS
CORS_ORIGIN="https://seu-dominio.com"
CORS_CREDENTIALS=true

# Headers de segurança
SECURITY_HEADERS_ENABLED=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true
```

#### Criptografia

```bash
# Algoritmo de hash para senhas
PASSWORD_HASH_ALGORITHM="sha256"
PASSWORD_SALT_ROUNDS=12

# Chaves de criptografia
ENCRYPTION_KEY="chave-de-32-caracteres-para-criptografia"
JWT_SECRET="chave-secreta-para-jwt-tokens"
```

### Configurações de Performance

#### Cache

```bash
# Redis (se disponível)
REDIS_URL="redis://localhost:6379"
REDIS_PREFIX="iagris:"
REDIS_TTL=3600                 # 1 hora

# Cache em memória
MEMORY_CACHE_ENABLED=true
MEMORY_CACHE_MAX_SIZE=100      # MB
MEMORY_CACHE_TTL=300           # 5 minutos
```

#### Otimizações

```bash
# Pool de threads para operações assíncronas
UV_THREADPOOL_SIZE=16

# Garbage Collector
NODE_OPTIONS="--max-old-space-size=4096"

# Keep-alive de conexões HTTP
HTTP_KEEP_ALIVE=true
HTTP_TIMEOUT=30000
```

### Configurações de Monitoramento

#### Health Checks

```bash
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_DB=true
HEALTH_CHECK_REDIS=true
HEALTH_CHECK_EXTERNAL_APIS=false
```

#### Métricas

```bash
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH="/metrics"

# Integração com serviços de monitoramento
SENTRY_DSN="https://sua-sentry-dsn@sentry.io/projeto"
NEW_RELIC_LICENSE_KEY="sua-chave-new-relic"
```

### Configurações por Ambiente

#### Desenvolvimento Local

```bash
# .env.development
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iagris_dev"
SESSION_SECRET="chave-de-desenvolvimento-nao-segura"
PORT=5000
LOG_LEVEL=debug
LOG_FORMAT=simple

# Desabilitar em desenvolvimento
SECURITY_HEADERS_ENABLED=false
SESSION_SECURE=false
CORS_ORIGIN="http://localhost:5000"

# Mock de APIs externas
MOCK_EXTERNAL_APIS=true
OPENWEATHER_API_KEY="mock"
```

#### Staging/Teste

```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL="postgresql://user:pass@staging-db:5432/iagris_staging"
SESSION_SECRET="chave-secreta-staging-diferente-da-producao"
PORT=3000
LOG_LEVEL=info

# URLs de staging
UPLOAD_BASE_URL="https://staging.iagris.com/uploads"
CORS_ORIGIN="https://staging.iagris.com"

# Configurações de teste
TEST_USER_ENABLED=true
TEST_DATA_SEEDING=true
```

#### Produção

```bash
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/iagris_prod?sslmode=require"
SESSION_SECRET="chave-super-secreta-de-producao-64-chars-minimo"
PORT=3000
LOG_LEVEL=info
LOG_FORMAT=json

# Configurações de segurança máxima
SESSION_SECURE=true
SECURITY_HEADERS_ENABLED=true
RATE_LIMIT_ENABLED=true

# URLs de produção
UPLOAD_BASE_URL="https://iagris.com/uploads"
CDN_BASE_URL="https://cdn.iagris.com"
CORS_ORIGIN="https://iagris.com"

# Monitoramento habilitado
METRICS_ENABLED=true
SENTRY_DSN="https://sua-sentry-dsn@sentry.io/projeto"
```

## Configuração Específica por Servidor

### Docker/Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - PORT=3000
    env_file:
      - .env.production
```

### Heroku

```bash
# Configurar via CLI
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET="sua-chave-secreta"
heroku config:set LOG_LEVEL=info

# Ou via arquivo Procfile
web: NODE_ENV=production npm start
```

### AWS Elastic Beanstalk

```json
{
  "option_settings": [
    {
      "namespace": "aws:elasticbeanstalk:application:environment",
      "option_name": "NODE_ENV",
      "value": "production"
    },
    {
      "namespace": "aws:elasticbeanstalk:application:environment",
      "option_name": "DATABASE_URL",
      "value": "postgresql://..."
    }
  ]
}
```

### Google Cloud Run

```yaml
# cloudbuild.yaml
apiVersion: serving.knative.dev/v1
kind: Service
spec:
  template:
    spec:
      containers:
      - image: gcr.io/projeto/iagris
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: url
```

## Validação de Configuração

### Script de Validação

```javascript
// scripts/validate-env.js
const requiredVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'SESSION_SECRET'
];

const optionalVars = [
  'PORT',
  'LOG_LEVEL',
  'SMTP_HOST'
];

console.log('Validando configurações de ambiente...');

// Verificar variáveis obrigatórias
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Variável obrigatória não encontrada: ${varName}`);
    process.exit(1);
  }
  console.log(`✅ ${varName}: definida`);
}

// Verificar variáveis opcionais
for (const varName of optionalVars) {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`⚠️  ${varName}: usando valor padrão`);
  }
}

// Validar DATABASE_URL
try {
  const url = new URL(process.env.DATABASE_URL);
  console.log(`✅ DATABASE_URL: protocolo ${url.protocol}, host ${url.hostname}`);
} catch (error) {
  console.error(`❌ DATABASE_URL inválida: ${error.message}`);
  process.exit(1);
}

// Validar SESSION_SECRET
if (process.env.SESSION_SECRET.length < 32) {
  console.error('❌ SESSION_SECRET deve ter pelo menos 32 caracteres');
  process.exit(1);
}

console.log('✅ Todas as configurações são válidas!');
```

```bash
# Executar validação
node scripts/validate-env.js
```

### Health Check de Configuração

```javascript
// Endpoint para verificar configuração
app.get('/health/config', (req, res) => {
  const config = {
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    port: process.env.PORT || 5000,
    logLevel: process.env.LOG_LEVEL || 'info',
    timestamp: new Date().toISOString()
  };
  
  res.json(config);
});
```

## Segurança das Configurações

### Boas Práticas

1. **Nunca commitar arquivos .env** no controle de versão
2. **Usar valores diferentes** para cada ambiente
3. **Rotacionar chaves secretas** periodicamente
4. **Usar gestores de segredos** em produção (AWS Secrets Manager, Azure Key Vault, etc.)
5. **Limitar acesso** aos arquivos de configuração

### Gestão de Segredos

#### AWS Secrets Manager

```javascript
// utils/secrets.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1'
});

async function getSecret(secretName) {
  try {
    const result = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise();
    
    return JSON.parse(result.SecretString);
  } catch (error) {
    console.error(`Erro ao buscar segredo ${secretName}:`, error);
    throw error;
  }
}

module.exports = { getSecret };
```

#### HashiCorp Vault

```javascript
// utils/vault.js
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN
});

async function getSecret(path) {
  try {
    const result = await vault.read(path);
    return result.data.data;
  } catch (error) {
    console.error(`Erro ao buscar segredo do Vault: ${path}`, error);
    throw error;
  }
}

module.exports = { getSecret };
```

## Troubleshooting

### Problemas Comuns

1. **"Cannot connect to database"**
   - Verificar se DATABASE_URL está correta
   - Testar conexão manualmente: `psql $DATABASE_URL`

2. **"Session secret required"**
   - Verificar se SESSION_SECRET está definida
   - Verificar se tem pelo menos 32 caracteres

3. **"Port already in use"**
   - Verificar se PORT está definida corretamente
   - Verificar se outra aplicação está usando a porta

4. **"CORS error"**
   - Verificar configuração de CORS_ORIGIN
   - Verificar se protocolo (http/https) está correto

### Debug de Configuração

```javascript
// utils/debug-config.js
function debugConfig() {
  console.log('=== DEBUG CONFIGURAÇÃO ===');
  
  const sensitiveVars = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
  
  Object.keys(process.env)
    .sort()
    .forEach(key => {
      const value = process.env[key];
      const isSensitive = sensitiveVars.some(sensitive => 
        key.toUpperCase().includes(sensitive)
      );
      
      if (isSensitive) {
        console.log(`${key}: [REDACTED]`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    
  console.log('=== FIM DEBUG ===');
}

// Chamar apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  debugConfig();
}
```

---

*Mantenha este documento atualizado conforme novas configurações são adicionadas ao sistema.*