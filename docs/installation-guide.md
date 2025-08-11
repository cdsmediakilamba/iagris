# Guia de Instalação do iAgris

## Visão Geral

Este guia fornece instruções detalhadas para instalar o sistema iAgris em diferentes ambientes, desde servidores dedicados até hospedagem compartilhada com cPanel.

## Pré-requisitos

### Requisitos de Sistema
- **Sistema Operacional**: Linux (Ubuntu 20.04+, CentOS 8+), Windows Server 2019+, ou macOS 10.15+
- **CPU**: Mínimo 1 vCPU, recomendado 2+ vCPUs
- **RAM**: Mínimo 1 GB, recomendado 2 GB+
- **Armazenamento**: Mínimo 5 GB de espaço livre
- **Conexão com Internet**: Para download de dependências e atualizações

### Software Necessário
- **Node.js**: Versão 18.0 ou superior
- **npm**: Versão 8 ou superior (incluído com Node.js)
- **PostgreSQL**: Versão 13 ou superior
- **Git**: Para controle de versão

## Instalação em Servidor Ubuntu/Debian

### 1. Atualização do Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalação do Node.js

#### Opção A: Via NodeSource Repository (Recomendado)
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

#### Opção B: Via NVM (Node Version Manager)
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js
nvm install 18
nvm use 18
nvm alias default 18
```

### 3. Instalação do PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar e habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar usuário PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sua_senha_segura';"

# Criar banco de dados para o iAgris
sudo -u postgres createdb iagris
```

### 4. Configuração do PostgreSQL

```bash
# Editar arquivo de configuração
sudo nano /etc/postgresql/13/main/postgresql.conf

# Alterar as seguintes configurações:
# listen_addresses = '*'
# max_connections = 100

# Editar arquivo de autenticação
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Adicionar linha para conexões locais:
# local   all   all   md5
# host    all   all   127.0.0.1/32   md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 5. Download e Configuração do iAgris

```bash
# Criar diretório para a aplicação
sudo mkdir -p /var/www/iagris
cd /var/www/iagris

# Clonar o repositório (substitua pela URL do seu repositório)
git clone https://github.com/seu-usuario/iagris.git .

# Definir permissões
sudo chown -R $USER:$USER /var/www/iagris

# Instalar dependências
npm install
```

### 6. Configuração de Ambiente

```bash
# Criar arquivo de configuração
cp .env.example .env
nano .env
```

Configurar as seguintes variáveis no arquivo `.env`:

```env
# Configuração do Banco de Dados
DATABASE_URL="postgresql://postgres:sua_senha_segura@localhost:5432/iagris"

# Configuração da Sessão
SESSION_SECRET="gere_uma_chave_secreta_muito_forte_aqui"

# Configuração do Servidor
NODE_ENV="production"
PORT=5000

# Configuração de Emails (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu_email@gmail.com"
SMTP_PASS="sua_senha_de_app"

# API Keys externas (opcional)
OPENWEATHER_API_KEY="sua_chave_api_openweather"
```

### 7. Configuração do Banco de Dados

```bash
# Executar migrações
npm run db:push

# Executar seeds (dados iniciais)
npm run db:seed
```

### 8. Build da Aplicação

```bash
# Compilar aplicação para produção
npm run build

# Verificar se a build foi bem-sucedida
ls -la dist/
```

### 9. Configuração do PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

Conteúdo do `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'iagris',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Criar diretório de logs
mkdir logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar com o sistema
pm2 startup
pm2 save
```

### 10. Configuração do Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração do site
sudo nano /etc/nginx/sites-available/iagris
```

Conteúdo do arquivo de configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Logs
    access_log /var/log/nginx/iagris.access.log;
    error_log /var/log/nginx/iagris.error.log;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:5000;
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

    # Servir arquivos estáticos diretamente
    location /photos {
        alias /var/www/iagris/photos;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

```bash
# Habilitar site e reiniciar Nginx
sudo ln -s /etc/nginx/sites-available/iagris /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 11. Configuração de SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

### 12. Configuração de Firewall

```bash
# Configurar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar status
sudo ufw status
```

## Instalação em CentOS/RHEL

### 1. Atualização e Preparação

```bash
sudo dnf update -y
sudo dnf install -y curl wget git
```

### 2. Instalação do Node.js

```bash
# Adicionar repositório NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Instalar Node.js
sudo dnf install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalação do PostgreSQL

```bash
# Instalar PostgreSQL
sudo dnf install -y postgresql postgresql-server postgresql-contrib

# Inicializar banco de dados
sudo postgresql-setup --initdb

# Iniciar e habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar senha do usuário postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sua_senha_segura';"
```

### 4. Configuração do SELinux (se habilitado)

```bash
# Verificar status do SELinux
sestatus

# Configurar políticas para aplicação web
sudo setsebool -P httpd_can_network_connect on
sudo setsebool -P httpd_can_network_relay on
```

*Continue com os passos 5-12 similares ao Ubuntu, adaptando os comandos conforme necessário.*

## Instalação em Windows Server

### 1. Instalação do Node.js

1. Acesse https://nodejs.org/
2. Baixe o instalador Windows (.msi) da versão LTS
3. Execute o instalador como Administrador
4. Siga o assistente de instalação
5. Verifique a instalação no PowerShell:
   ```powershell
   node --version
   npm --version
   ```

### 2. Instalação do PostgreSQL

1. Acesse https://www.postgresql.org/download/windows/
2. Baixe o instalador oficial
3. Execute como Administrador
4. Configure senha para o usuário postgres
5. Anote a porta (padrão: 5432)

### 3. Configuração da Aplicação

```powershell
# Criar diretório
mkdir C:\inetpub\iagris
cd C:\inetpub\iagris

# Clonar repositório
git clone https://github.com/seu-usuario/iagris.git .

# Instalar dependências
npm install

# Configurar ambiente
copy .env.example .env
notepad .env
```

### 4. Configuração como Serviço Windows

Instalar node-windows:
```powershell
npm install -g node-windows
```

Criar script de serviço (`service.js`):
```javascript
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'iAgris Farm Management',
  description: 'Sistema de Gestão Agrícola iAgris',
  script: 'C:\\inetpub\\iagris\\dist\\index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function() {
  svc.start();
});

svc.install();
```

```powershell
# Instalar serviço
node service.js
```

### 5. Configuração do IIS (Opcional)

Se preferir usar IIS como proxy reverso, instale o módulo ARR e configure um site para fazer proxy para localhost:5000.

## Verificação da Instalação

### 1. Teste de Conectividade

```bash
# Testar conexão com banco de dados
npm run db:check

# Testar aplicação
npm start
```

### 2. Verificação dos Serviços

```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Verificar status da aplicação (PM2)
pm2 status

# Verificar logs
pm2 logs iagris
```

### 3. Teste via Navegador

1. Acesse http://seu-servidor:5000 ou https://seu-dominio.com
2. Verifique se a página de login carrega corretamente
3. Faça login com as credenciais padrão:
   - Usuário: `admin`
   - Senha: `admin123`

## Solução de Problemas Comuns

### Erro de Conexão com Banco de Dados

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão manual
psql -h localhost -U postgres -d iagris
```

### Erro de Permissões

```bash
# Corrigir permissões dos arquivos
sudo chown -R www-data:www-data /var/www/iagris
sudo chmod -R 755 /var/www/iagris
```

### Aplicação não Inicia

```bash
# Verificar logs de erro
pm2 logs iagris --err

# Verificar dependências
npm list --depth=0
```

### Problemas de Performance

1. Verificar recursos do servidor (CPU, RAM, Disco)
2. Otimizar configurações do PostgreSQL
3. Configurar cache no Nginx
4. Monitorar com `htop`, `iotop`, etc.

## Próximos Passos

Após a instalação bem-sucedida:

1. **[Configurar Backup](./backup-recovery.md)** - Implementar estratégias de backup
2. **[Configurar Monitoramento](./monitoring.md)** - Setup de monitoramento e alertas  
3. **[Ler Manual de Usuário](./user-manual.md)** - Aprender a usar o sistema
4. **[Configurar Usuários](./admin-guide.md)** - Criar usuários e definir permissões

## Suporte

Para suporte técnico:
- Consulte a [FAQ](./faq.md)
- Verifique os logs da aplicação
- Entre em contato com a equipe de suporte técnico