# Guia de Deploy - iAgris

## Visão Geral

Este guia detalha os procedimentos para implantação do sistema iAgris em ambiente de produção, incluindo configurações de segurança, otimizações de performance e monitoramento.

## Preparação para Deploy

### 1. Checklist Pré-Deploy

**Código e Dependências:**
- [ ] Código testado e validado
- [ ] Todas as dependências atualizadas
- [ ] Vulnerabilidades de segurança verificadas
- [ ] Build de produção gerado sem erros
- [ ] Testes unitários executados com sucesso

**Banco de Dados:**
- [ ] Backup completo do banco atual
- [ ] Migrações testadas em ambiente similar
- [ ] Scripts de rollback preparados
- [ ] Performance das queries validada

**Infraestrutura:**
- [ ] Servidor configurado e testado
- [ ] Certificados SSL válidos
- [ ] DNS configurado corretamente
- [ ] Firewall e segurança configurados

**Configurações:**
- [ ] Variáveis de ambiente definidas
- [ ] Arquivos de configuração preparados
- [ ] Logs configurados adequadamente
- [ ] Monitoramento configurado

### 2. Ambientes de Deploy

#### Ambiente de Staging
Usado para testes finais antes da produção:
```bash
# Configurações de staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/iagris_staging
REDIS_URL=redis://staging-redis:6379
LOG_LEVEL=debug
```

#### Ambiente de Produção
Configurações otimizadas para produção:
```bash
# Configurações de produção
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/iagris_prod
REDIS_URL=redis://prod-redis:6379
LOG_LEVEL=info
```

## Deploy em Servidor Dedicado/VPS

### 1. Preparação do Servidor

#### Sistema Ubuntu 22.04
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
sudo apt install -y curl git nginx postgresql redis-server

# Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### Configuração de Usuário
```bash
# Criar usuário para aplicação
sudo adduser iagris
sudo usermod -aG sudo iagris

# Configurar chaves SSH
sudo mkdir -p /home/iagris/.ssh
sudo cp ~/.ssh/authorized_keys /home/iagris/.ssh/
sudo chown -R iagris:iagris /home/iagris/.ssh
sudo chmod 700 /home/iagris/.ssh
sudo chmod 600 /home/iagris/.ssh/authorized_keys
```

### 2. Instalação Node.js

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 3. Configuração PostgreSQL

```bash
# Configurar PostgreSQL
sudo -u postgres psql << EOF
CREATE USER iagris WITH PASSWORD 'senha_super_segura';
CREATE DATABASE iagris_prod OWNER iagris;
GRANT ALL PRIVILEGES ON DATABASE iagris_prod TO iagris;
\q
EOF

# Configurar acesso remoto (se necessário)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Alterar: listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Adicionar: host iagris_prod iagris 127.0.0.1/32 md5

sudo systemctl restart postgresql
```

### 4. Deploy da Aplicação

#### Preparação dos Diretórios
```bash
# Criar estrutura de diretórios
sudo mkdir -p /var/www/iagris
sudo chown iagris:iagris /var/www/iagris

# Criar diretórios de logs
sudo mkdir -p /var/log/iagris
sudo chown iagris:iagris /var/log/iagris

# Criar diretório para uploads
sudo mkdir -p /var/www/iagris/uploads
sudo chmod 755 /var/www/iagris/uploads
```

#### Deploy do Código
```bash
# Mudar para usuário da aplicação
sudo su - iagris

# Navegar para diretório da aplicação
cd /var/www/iagris

# Clonar repositório (ou fazer upload)
git clone https://github.com/seu-usuario/iagris.git .

# Instalar dependências de produção
npm ci --only=production

# Configurar variáveis de ambiente
cp .env.example .env.production
nano .env.production
```

#### Configuração do .env.production
```env
# Configuração do Banco de Dados
DATABASE_URL="postgresql://iagris:senha_super_segura@localhost:5432/iagris_prod"

# Configuração da Aplicação
NODE_ENV="production"
PORT=3000
SESSION_SECRET="chave_super_secreta_aleatoria_64_caracteres"

# Configuração de Logs
LOG_LEVEL="info"
LOG_FILE="/var/log/iagris/app.log"

# Configuração de Upload
UPLOAD_DIR="/var/www/iagris/uploads"
MAX_FILE_SIZE="10485760"

# Configuração de Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# APIs Externas
OPENWEATHER_API_KEY="sua-chave-api"

# Configurações de Segurança
COOKIE_SECURE=true
TRUST_PROXY=true
```

#### Build da Aplicação
```bash
# Gerar build de produção
npm run build

# Verificar build
ls -la dist/

# Configurar banco de dados
npm run db:push
```

### 5. Configuração PM2

```bash
# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'iagris-prod',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/iagris/err.log',
    out_file: '/var/log/iagris/out.log',
    log_file: '/var/log/iagris/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
```

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar com o sistema
pm2 startup
# Executar o comando sugerido pelo PM2
```

### 6. Configuração Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/iagris
```

```nginx
# Configuração para iAgris
upstream iagris_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Logs
    access_log /var/log/nginx/iagris.access.log;
    error_log /var/log/nginx/iagris.error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Main location
    location / {
        proxy_pass http://iagris_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /uploads {
        alias /var/www/iagris/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security - Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|config|sql|bak)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/iagris /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 7. Configuração SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Deploy com Docker

### 1. Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S iagris -u 1001

# Copy built application
COPY --from=builder --chown=iagris:nodejs /app/dist ./dist
COPY --from=builder --chown=iagris:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=iagris:nodejs /app/package*.json ./

# Create directories
RUN mkdir -p /app/uploads && chown iagris:nodejs /app/uploads
RUN mkdir -p /app/logs && chown iagris:nodejs /app/logs

USER iagris

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://iagris:password@postgres:5432/iagris_prod
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    volumes:
      - uploads_data:/app/uploads
      - logs_data:/app/logs
    depends_on:
      - postgres
      - redis
    networks:
      - iagris_network

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: iagris_prod
      POSTGRES_USER: iagris
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - iagris_network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - iagris_network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - certbot_certs:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    depends_on:
      - app
    networks:
      - iagris_network

volumes:
  postgres_data:
  redis_data:
  uploads_data:
  logs_data:
  certbot_certs:
  certbot_www:

networks:
  iagris_network:
    driver: bridge
```

### 3. Deploy com Docker

```bash
# Build e start
docker-compose up -d --build

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app

# Executar migrações
docker-compose exec app npm run db:push
```

## Deploy na AWS

### 1. Usando Elastic Beanstalk

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar aplicação
eb init iagris --platform node.js

# Criar ambiente
eb create production

# Deploy
eb deploy
```

### 2. Usando ECS com Fargate

```yaml
# docker-compose.yml para ECS
version: '3.8'
services:
  app:
    image: seu-ecr-repo/iagris:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    logging:
      driver: awslogs
      options:
        awslogs-group: /ecs/iagris
        awslogs-region: us-east-1
        awslogs-stream-prefix: ecs
```

## Deploy no Heroku

### 1. Preparação

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login no Heroku
heroku login

# Criar aplicação
heroku create iagris-prod
```

### 2. Configuração

```bash
# Adicionar addon PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configurar variáveis de ambiente
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=sua-chave-secreta

# Configurar buildpack
heroku buildpacks:set heroku/nodejs
```

### 3. Deploy

```bash
# Deploy via Git
git push heroku main

# Executar migrações
heroku run npm run db:push

# Ver logs
heroku logs --tail
```

## Verificação de Deploy

### 1. Health Check

```bash
# Script de verificação
#!/bin/bash
echo "Verificando deploy do iAgris..."

# Verificar aplicação
curl -f http://localhost:3000/health || exit 1

# Verificar banco de dados
npm run db:check || exit 1

# Verificar PM2
pm2 list | grep iagris || exit 1

echo "Deploy verificado com sucesso!"
```

### 2. Testes de Carga

```bash
# Instalar ferramenta de teste
npm install -g autocannon

# Teste básico
autocannon -c 10 -d 30 http://localhost:3000

# Teste de login
autocannon -c 5 -d 60 -m POST -H 'content-type=application/json' -b '{"username":"test","password":"test"}' http://localhost:3000/auth/login
```

### 3. Monitoramento

```bash
# Verificar recursos do sistema
htop
iotop
netstat -tlnp

# Verificar logs
tail -f /var/log/iagris/app.log
tail -f /var/log/nginx/iagris.access.log

# Verificar PM2
pm2 monit
pm2 logs
```

## Procedimentos de Rollback

### 1. Rollback de Código

```bash
# Usando Git
git revert HEAD
npm run build
pm2 restart iagris-prod

# Usando backup
cp -r /backup/iagris-v1.0.0/* /var/www/iagris/
pm2 restart iagris-prod
```

### 2. Rollback de Banco

```bash
# Restaurar backup
pg_restore -d iagris_prod /backup/database-backup.sql

# Ou reverter migrações específicas
npm run db:rollback
```

### 3. Rollback Completo

```bash
#!/bin/bash
# Script de rollback completo

echo "Iniciando rollback..."

# Parar aplicação
pm2 stop iagris-prod

# Restaurar código
cp -r /backup/iagris-last-stable/* /var/www/iagris/

# Restaurar banco
pg_restore -d iagris_prod /backup/db-last-stable.sql

# Reiniciar aplicação
pm2 start iagris-prod

echo "Rollback concluído!"
```

## Configurações de Segurança

### 1. Firewall

```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install fail2ban

# Configurar
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

### 3. Logs de Auditoria

```bash
# Configurar rsyslog para auditoria
echo "*.* @@logs.papertrailapp.com:12345" | sudo tee -a /etc/rsyslog.conf
sudo systemctl restart rsyslog
```

## Otimizações de Performance

### 1. Configuração PostgreSQL

```postgresql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 2. Configuração Nginx

```nginx
# nginx.conf optimizations
worker_processes auto;
worker_connections 1024;

client_max_body_size 10M;
client_body_timeout 60;
client_header_timeout 60;
keepalive_timeout 65;
send_timeout 60;

gzip_comp_level 6;
gzip_min_length 1000;
```

### 3. Configuração Node.js

```javascript
// PM2 optimization
module.exports = {
  apps: [{
    name: 'iagris-prod',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    node_args: [
      '--max-old-space-size=4096',
      '--optimize-for-size'
    ],
    env: {
      UV_THREADPOOL_SIZE: 16,
      NODE_ENV: 'production'
    }
  }]
};
```

## Automação de Deploy

### 1. GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            cd /var/www/iagris
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart iagris-prod
```

### 2. Webhook de Deploy

```javascript
// webhook-deploy.js
const express = require('express');
const { execSync } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhook/deploy', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  // Verificar assinatura
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  if (signature !== `sha256=${expected}`) {
    return res.status(401).send('Unauthorized');
  }
  
  try {
    // Executar deploy
    execSync('cd /var/www/iagris && ./scripts/deploy.sh', {
      stdio: 'inherit'
    });
    
    res.status(200).send('Deploy successful');
  } catch (error) {
    res.status(500).send('Deploy failed');
  }
});

app.listen(9000, () => {
  console.log('Webhook server listening on port 9000');
});
```

## Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia**:
   ```bash
   # Verificar logs
   pm2 logs iagris-prod
   
   # Verificar configurações
   node -e "console.log(process.env)"
   ```

2. **Erro de conexão com banco**:
   ```bash
   # Testar conexão
   psql -h localhost -U iagris -d iagris_prod
   
   # Verificar configurações
   sudo systemctl status postgresql
   ```

3. **Nginx 502 Bad Gateway**:
   ```bash
   # Verificar se aplicação está rodando
   pm2 status
   
   # Testar conexão direta
   curl http://localhost:3000
   ```

4. **Performance lenta**:
   ```bash
   # Monitorar recursos
   htop
   iotop
   
   # Verificar queries lentas
   sudo -u postgres psql -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

---

*Este guia deve ser adaptado conforme as especificidades do seu ambiente de produção.*