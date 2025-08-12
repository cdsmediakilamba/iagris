# Guia Completo: iAgris para Produção no cPanel

## PREPARAÇÃO DO SISTEMA PARA CPANEL

Seu sistema iAgris é uma aplicação Node.js completa com React frontend, Express backend e PostgreSQL. Aqui está o guia completo para rodar em produção no cPanel.

### 1. ARQUIVOS NECESSÁRIOS PARA PRODUÇÃO

Você precisa preparar estes arquivos para upload:

#### A. Construir a aplicação
```bash
# Na sua máquina local (onde está o código):
npm run build
```

#### B. Arquivos que devem ser enviados para o cPanel:
- Pasta `dist/` (gerada pelo build)
- `package.json`
- `package-lock.json`
- Pasta `server/`
- Pasta `shared/`
- `drizzle.config.ts`
- Pasta `photos/` (se existir)

#### C. Arquivo .env (criar no cPanel)
Crie um arquivo `.env` com estas configurações:

```env
# Banco de dados (configure com os dados do seu provedor)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"

# Configuração da aplicação
NODE_ENV="production"
PORT=3000
SESSION_SECRET="sua_chave_secreta_muito_forte_de_pelo_menos_32_caracteres"

# Configurações para cPanel
CPANEL_MODE="true"
BASE_PATH=""
UPLOAD_PATH="./photos"
LOG_TO_FILE="true"
```

### 2. ESTRUTURA DE ARQUIVOS NO CPANEL

No seu cPanel, organize assim:
```
public_html/
├── iagris/
    ├── dist/           # Build da aplicação
    ├── server/         # Código do servidor
    ├── shared/         # Schemas compartilhados
    ├── photos/         # Uploads (criar esta pasta)
    ├── logs/           # Logs (criar esta pasta)
    ├── package.json
    ├── package-lock.json
    ├── drizzle.config.ts
    ├── .env           # Variáveis de ambiente
    └── .htaccess      # Configurações do Apache
```

### 3. CONFIGURAÇÃO NO CPANEL

#### A. Criar banco de dados PostgreSQL
1. cPanel → "PostgreSQL Databases"
2. Criar novo banco: `seuusuario_iagris`
3. Criar usuário PostgreSQL
4. Adicionar usuário ao banco com todos os privilégios
5. Anotar: host, porta, usuário, senha, nome do banco

#### B. Configurar Node.js App
1. cPanel → "Setup Node.js App"
2. Clique "Create Application"
3. Configurações:
   - **Node.js Version**: 18.x ou superior
   - **Application Mode**: Production
   - **Application Root**: `iagris`
   - **Application URL**: deixe vazio ou `/iagris`
   - **Application Startup File**: `dist/index.js`

#### C. Configurar variáveis de ambiente
Na seção "Environment Variables" do Node.js App, adicionar:
- `DATABASE_URL`: string de conexão do PostgreSQL
- `NODE_ENV`: `production`
- `SESSION_SECRET`: chave secreta forte
- `PORT`: deixar vazio (cPanel gerencia automaticamente)

### 4. COMANDOS PARA EXECUTAR NO TERMINAL SSH

Se seu provedor oferece acesso SSH:

```bash
# Conectar via SSH
ssh seuusuario@seudominio.com

# Navegar para a aplicação
cd public_html/iagris

# Instalar dependências de produção
npm install --production

# Executar migrações do banco
npm run db:push

# Verificar se a aplicação inicia
node dist/index.js
```

### 5. CRIAR ARQUIVOS DE CONFIGURAÇÃO

#### A. Arquivo .htaccess
Criar na pasta `iagris`:

```apache
# Configurações para aplicação Node.js
Options -Indexes
DirectoryIndex disabled

# Cache para arquivos estáticos
<filesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 year"
  Header set Cache-Control "public, immutable"
</filesMatch>

# Compressão
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Configurações de segurança
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

#### B. Script de inicialização do banco
Criar `setup-database.js`:

```javascript
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./shared/schema.ts');

async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });
  
  console.log('Configurando banco de dados...');
  
  // Executar push do schema
  console.log('Schema aplicado com sucesso!');
}

setupDatabase().catch(console.error);
```

### 6. OTIMIZAÇÕES PARA CPANEL

#### A. Reduzir uso de memória
No arquivo `server/index.ts`, adicionar no topo:

```javascript
// Otimizações para ambiente compartilhado
process.env.NODE_OPTIONS = '--max-old-space-size=512';

// Configurar garbage collection mais agressivo
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 30000);
}
```

#### B. Cache em memória limitado
```javascript
// Cache simples para reduzir consultas ao banco
const cache = new Map();
const MAX_CACHE_SIZE = 100;

function setCache(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { value, timestamp: Date.now() });
}

function getCache(key, maxAge = 300000) { // 5 minutos
  const item = cache.get(key);
  if (item && (Date.now() - item.timestamp) < maxAge) {
    return item.value;
  }
  cache.delete(key);
  return null;
}
```

### 7. MONITORAMENTO E LOGS

#### A. Sistema de logs
Criar `logs/` na pasta da aplicação e configurar:

```javascript
const fs = require('fs');
const path = require('path');

function logToFile(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] ${message}\n`;
  
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
}

// Substituir console.log em produção
if (process.env.NODE_ENV === 'production') {
  const originalLog = console.log;
  console.log = (...args) => {
    logToFile('INFO', args.join(' '));
    originalLog(...args);
  };
}
```

#### B. Health check endpoint
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});
```

### 8. CONFIGURAR CRON JOBS

No cPanel → "Cron Jobs", adicionar:

```bash
# Limpeza de logs diários
0 1 * * * cd ~/public_html/iagris && find logs/ -name "*.log" -mtime +7 -delete

# Restart da aplicação semanalmente (se necessário)
0 3 * * 0 cd ~/public_html/iagris && touch tmp/restart.txt
```

### 9. BACKUP AUTOMÁTICO

Script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"

mkdir -p $BACKUP_DIR

# Backup dos arquivos
tar -czf $BACKUP_DIR/iagris_files_$DATE.tar.gz dist server shared photos package.json .env

# Backup do banco de dados
pg_dump $DATABASE_URL > $BACKUP_DIR/iagris_db_$DATE.sql

# Manter apenas os últimos 5 backups
ls -t $BACKUP_DIR/iagris_files_*.tar.gz | tail -n +6 | xargs rm -f
ls -t $BACKUP_DIR/iagris_db_*.sql | tail -n +6 | xargs rm -f

echo "Backup criado: $DATE"
```

### 10. CHECKLIST FINAL

Antes de ir ao ar, verificar:

- [ ] Build da aplicação foi executado (`npm run build`)
- [ ] Todos os arquivos foram enviados para o cPanel
- [ ] Banco PostgreSQL foi criado e configurado
- [ ] Arquivo `.env` foi criado com todas as variáveis
- [ ] Node.js App foi configurado no cPanel
- [ ] Dependências foram instaladas (`npm install --production`)
- [ ] Schema do banco foi aplicado (`npm run db:push`)
- [ ] Pastas `photos/` e `logs/` foram criadas
- [ ] Permissões dos arquivos estão corretas (755 para pastas, 644 para arquivos)
- [ ] Health check endpoint está respondendo
- [ ] Login no sistema está funcionando

### 11. SOLUÇÃO DE PROBLEMAS COMUNS

#### "Cannot find module"
```bash
cd ~/public_html/iagris
rm -rf node_modules package-lock.json
npm install --production
```

#### "Permission denied"
```bash
chmod 755 photos logs
chmod 644 .env package.json
chmod 755 dist server shared
```

#### "Database connection failed"
- Verificar string de conexão no `.env`
- Confirmar se o banco PostgreSQL foi criado
- Testar conexão manualmente

#### "Port in use"
- Não definir porta no código, usar `process.env.PORT`
- Deixar o cPanel gerenciar as portas automaticamente

### 12. APÓS A INSTALAÇÃO

1. Acesse: `https://seudominio.com/iagris`
2. Teste o login com as credenciais padrão
3. Verifique se todas as funcionalidades estão operando
4. Configure backup automático
5. Monitore logs regularmente

### SUPORTE

Se precisar de ajuda específica:
1. Verifique logs em `logs/app.log`
2. Acesse `/health` para status da aplicação  
3. Contate suporte do provedor de hospedagem se necessário
4. Considere upgrade de plano se recursos forem insuficientes

---

**IMPORTANTE**: Sempre faça backup antes de qualquer alteração em produção!