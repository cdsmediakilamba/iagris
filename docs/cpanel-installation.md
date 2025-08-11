# Instalação do iAgris no cPanel

## Visão Geral

Este guia detalha como instalar o sistema iAgris em hospedagem compartilhada que utiliza cPanel. Como a hospedagem compartilhada tem limitações, algumas funcionalidades podem precisar de adaptações.

## Pré-requisitos

### Verificar Suporte do Provedor
Antes de iniciar, verifique se seu provedor de hospedagem suporta:

- **Node.js**: Versão 18+ (obrigatório)
- **PostgreSQL**: Ou pelo menos MySQL 8.0+ como alternativa
- **Acesso SSH**: Recomendado para instalação mais fácil
- **Acesso a cron jobs**: Para tarefas agendadas
- **Aumento de limites**: Memory limit, execution time

### Provedores Recomendados
Provedores que normalmente suportam Node.js no cPanel:
- Hostinger
- A2 Hosting  
- InMotion Hosting
- HostGator (planos superiores)
- SiteGround (planos Cloud)

## Método 1: Instalação via SSH (Recomendado)

### 1. Acesso via SSH

```bash
# Conectar via SSH (substitua pelos seus dados)
ssh usuario@seu-dominio.com

# Navegar para o diretório público
cd ~/public_html
```

### 2. Verificar Versão do Node.js

```bash
# Verificar versão do Node.js disponível
node --version
npm --version

# Se não estiver disponível ou versão antiga, solicite suporte do provedor
```

### 3. Download da Aplicação

```bash
# Criar diretório para a aplicação
mkdir iagris
cd iagris

# Baixar arquivos da aplicação (opções):

# Opção A: Via wget (se tiver arquivo zip)
wget https://github.com/seu-usuario/iagris/archive/main.zip
unzip main.zip
mv iagris-main/* .
rmdir iagris-main

# Opção B: Via git (se disponível)
git clone https://github.com/seu-usuario/iagris.git .

# Opção C: Upload via cPanel File Manager (veja método 2)
```

### 4. Instalação de Dependências

```bash
# Instalar dependências
npm install

# Se der erro de permissão, tente:
npm install --unsafe-perm=true --allow-root
```

### 5. Configuração do Banco de Dados

#### Opção A: PostgreSQL (se disponível)
```bash
# No cPanel, criar banco PostgreSQL
# Anotar: host, porta, usuário, senha, nome do banco
```

#### Opção B: MySQL (mais comum em cPanel)
```bash
# Criar banco MySQL no cPanel
# Será necessário adaptar o schema para MySQL
```

### 6. Configuração do Ambiente

```bash
# Criar arquivo de configuração
cp .env.example .env
nano .env
```

Configurar variáveis para hospedagem compartilhada:

```env
# Banco de dados (ajuste conforme seu provedor)
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
# ou para PostgreSQL:
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"

# Configuração da aplicação
NODE_ENV="production"
PORT=3000
SESSION_SECRET="sua_chave_secreta_forte"

# Configurações específicas para cPanel
CPANEL_MODE="true"
BASE_PATH="/iagris"
```

### 7. Adaptação do Schema (se usando MySQL)

Se seu provedor só oferece MySQL, será necessário criar um schema adaptado:

```bash
# Criar arquivo de schema MySQL
nano shared/schema-mysql.ts
```

### 8. Build da Aplicação

```bash
# Compilar aplicação
npm run build

# Verificar build
ls -la dist/
```

### 9. Configuração no cPanel

#### A. Node.js App (se disponível)
1. Acesse cPanel → "Node.js Apps" ou "Setup Node.js App"
2. Clique "Create Application"
3. Configurar:
   - **Node.js Version**: 18.x (mais recente disponível)
   - **Application Mode**: Production
   - **Application Root**: `iagris`
   - **Application URL**: `/iagris` ou domínio/subdomínio
   - **Application Startup File**: `dist/index.js`

#### B. Configurar Variáveis de Ambiente
Na seção "Environment Variables":
- Adicionar todas as variáveis do arquivo `.env`

### 10. Configuração de Domínio/Subdomínio

#### Opção A: Subdiretório
A aplicação ficará acessível em: `https://seusite.com/iagris`

#### Opção B: Subdomínio
1. No cPanel → "Subdomains"
2. Criar subdomínio: `iagris.seusite.com`
3. Apontar para pasta `iagris`

## Método 2: Instalação via cPanel File Manager

### 1. Preparar Arquivos Localmente

Em sua máquina local:

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/iagris.git
cd iagris

# Instalar dependências
npm install

# Build da aplicação
npm run build

# Criar arquivo zip para upload
zip -r iagris-cpanel.zip dist package.json .env.example
```

### 2. Upload via File Manager

1. Acesse cPanel → "File Manager"
2. Navegar para `public_html`
3. Criar pasta `iagris`
4. Fazer upload do arquivo `iagris-cpanel.zip`
5. Extrair arquivos
6. Configurar permissões (755 para pastas, 644 para arquivos)

### 3. Instalar Dependências via Terminal

No cPanel File Manager, se tiver opção "Terminal" ou via SSH:

```bash
cd ~/public_html/iagris
npm install --production
```

## Configuração do Banco de Dados MySQL

### 1. Criar Banco no cPanel

1. cPanel → "MySQL Databases"
2. Criar novo banco: `usuario_iagris`
3. Criar usuário MySQL com senha forte
4. Adicionar usuário ao banco com todos os privilégios

### 2. Schema MySQL Adaptado

Criar arquivo `shared/schema-mysql.ts` com adaptações:

```typescript
// Exemplo de adaptações necessárias para MySQL
import { mysqlTable, text, int, boolean, timestamp, json, decimal, date } from "drizzle-orm/mysql-core";

// Substituir serial() por int().primaryKey().autoincrement()
// Substituir jsonb por json
// Ajustar tipos de data/hora
```

### 3. Script de Migração MySQL

```bash
# Criar script específico para MySQL
nano scripts/mysql-setup.sql
```

## Configurações Específicas do cPanel

### 1. Arquivo .htaccess

Criar arquivo `.htaccess` na pasta da aplicação:

```apache
# .htaccess para aplicação Node.js no cPanel
RewriteEngine On

# Redirecionar todas as requests para a aplicação Node.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /cgi-bin/node.js/$1 [QSA,L]

# Cache para arquivos estáticos
<filesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 year"
</filesMatch>

# Compressão
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### 2. Configurar Cron Jobs

Para tarefas periódicas:

1. cPanel → "Cron Jobs"
2. Adicionar jobs necessários:

```bash
# Backup diário (exemplo)
0 2 * * * cd ~/public_html/iagris && npm run backup

# Limpeza de logs semanais
0 0 * * 0 cd ~/public_html/iagris && npm run cleanup
```

### 3. Configurar Redirects

Se quiser que o domínio principal redirecione para a aplicação:

cPanel → "Redirects":
- Tipo: Permanent (301)
- De: http://seusite.com
- Para: http://seusite.com/iagris

## Limitações e Considerações

### Limitações Comuns
- **Recursos Limitados**: CPU, RAM e processo limitados
- **Timeout**: Scripts podem ser interrompidos por timeout
- **Sem PM2**: Não é possível usar process managers
- **Reinicializações**: Aplicação pode ser reiniciada pelo provedor
- **Uploads**: Limites de tamanho de arquivo

### Otimizações para cPanel

1. **Reduzir Dependências**:
```bash
# Instalar apenas dependências de produção
npm install --production --no-optional
```

2. **Otimizar Build**:
```json
// No package.json, adicionar script otimizado
{
  "scripts": {
    "build:cpanel": "NODE_ENV=production vite build --mode production"
  }
}
```

3. **Cache Configurado**:
```javascript
// Configurar cache em memória limitado
const cache = new Map();
const MAX_CACHE_SIZE = 100; // Limite pequeno
```

## Monitoramento e Logs

### 1. Logs da Aplicação

```bash
# Configurar logs em arquivo
console.log = function(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('./logs/app.log', `${timestamp}: ${message}\n`);
};
```

### 2. Monitoramento via cPanel

1. cPanel → "Metrics" → "Resource Usage"
2. Monitorar uso de CPU, RAM e I/O
3. Configurar alertas se disponível

### 3. Health Check

Criar endpoint simples para verificar status:

```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

## Backup e Manutenção

### 1. Backup via cPanel

1. cPanel → "Backup" → "Full Backup"
2. Configurar backups automáticos
3. Baixar backups regularmente

### 2. Backup da Aplicação

```bash
# Script de backup personalizado
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz dist package.json .env logs/
```

## Solução de Problemas

### Problemas Comuns

1. **"Cannot find module"**:
   - Verificar se todas as dependências foram instaladas
   - Tentar reinstalar: `rm -rf node_modules && npm install`

2. **"Permission denied"**:
   - Verificar permissões dos arquivos (644) e pastas (755)
   - Usar File Manager do cPanel para ajustar

3. **"Port already in use"**:
   - cPanel pode gerenciar portas automaticamente
   - Não especificar porta fixa, usar `process.env.PORT`

4. **Timeout errors**:
   - Otimizar consultas de banco de dados
   - Implementar cache
   - Reduzir processamento pesado

5. **Memory limits**:
   - Reduzir uso de memória
   - Implementar garbage collection manual
   - Solicitar aumento de limites ao provedor

### Logs de Debug

```javascript
// Adicionar logs detalhados em modo debug
if (process.env.CPANEL_DEBUG === 'true') {
    console.log('[DEBUG]', message);
}
```

## Atualizações

Para atualizar a aplicação:

1. Fazer backup completo
2. Baixar nova versão
3. Fazer upload via File Manager
4. Reinstalar dependências se necessário
5. Aplicar migrações de banco
6. Reiniciar aplicação via cPanel

## Suporte Específico para cPanel

Se encontrar problemas específicos do cPanel:

1. Consultar documentação do seu provedor
2. Contatar suporte técnico do provedor
3. Verificar fóruns da comunidade do provedor
4. Considerar upgrade de plano se necessário

---

*Nota: Nem todos os provedores de cPanel suportam Node.js. Verifique antes da contratação.*