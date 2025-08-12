# INSTRUÇÕES COMPLETAS: iAgris no cPanel

## RESUMO EXECUTIVO

Seu sistema iAgris foi preparado para produção no cPanel. Siga estas etapas na ordem:

### 1. PREPARE NA SUA MÁQUINA LOCAL
```bash
# Execute o script de build
./build-for-cpanel.sh
```

### 2. UPLOAD PARA CPANEL
- Faça upload do conteúdo da pasta gerada para `public_html/iagris/`
- Ou envie o arquivo ZIP e extraia no cPanel

### 3. CONFIGURE NO CPANEL

#### A. Criar banco PostgreSQL
1. cPanel → "PostgreSQL Databases"
2. Criar banco: `seuusuario_iagris`
3. Criar usuário e dar permissões
4. Anotar: host, porta, usuário, senha

#### B. Configurar arquivo .env
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
NODE_ENV="production"
SESSION_SECRET="chave_secreta_muito_forte_de_32_caracteres"
CPANEL_MODE="true"
```

#### C. Configurar Node.js App
1. cPanel → "Setup Node.js App"
2. Create Application:
   - **Application Root**: `iagris`
   - **Startup File**: `dist/index.js`
   - **Node.js Version**: 18.x+
3. Adicionar variáveis de ambiente do .env

### 4. INSTALAR VIA SSH (Recomendado)
```bash
ssh usuario@seudominio.com
cd public_html/iagris
./install-cpanel.sh
```

### 5. VERIFICAR FUNCIONAMENTO
- Acesse: `https://seudominio.com/iagris`
- Status: `https://seudominio.com/iagris/health`
- Login padrão: admin / (verificar credenciais_admin.md)

## ARQUIVOS CRIADOS PARA PRODUÇÃO

| Arquivo | Descrição |
|---------|-----------|
| `.htaccess` | Configurações Apache |
| `env.example` | Template de configuração |
| `setup-database.js` | Script de teste do banco |
| `backup.sh` | Script de backup automático |
| `install-cpanel.sh` | Instalação automatizada |
| `build-for-cpanel.sh` | Build para produção |
| `production-setup.md` | Guia detalhado |

## COMANDOS ÚTEIS

```bash
# Testar aplicação
node dist/index.js

# Aplicar schema do banco
npm run db:push

# Backup
./backup.sh

# Ver logs
tail -f logs/app.log

# Reinstalar dependências
rm -rf node_modules && npm install --production
```

## MONITORAMENTO

### Health Check
```
GET /health
```
Retorna status da aplicação, memória, uptime, etc.

### Logs
- `logs/app.log` - Logs da aplicação
- `logs/backup.log` - Logs de backup

### Backup Automático
Configure cron job:
```bash
0 2 * * * cd ~/public_html/iagris && ./backup.sh
```

## SOLUÇÃO DE PROBLEMAS

### "Cannot find module"
```bash
cd ~/public_html/iagris
npm install --production
```

### "Database connection failed"
- Verificar DATABASE_URL no .env
- Testar: `node setup-database.js`

### "Permission denied"
```bash
chmod 755 photos logs backups
chmod 644 .env package.json
```

### Aplicação não inicia
- Verificar logs em `logs/app.log`
- Verificar se porta está livre
- Reiniciar via cPanel Node.js App

## OTIMIZAÇÕES INCLUÍDAS

- Cache em memória limitado
- Garbage collection otimizado
- Logs para arquivo
- Compressão GZIP
- Cache de arquivos estáticos
- Configurações de segurança

## BACKUP E MANUTENÇÃO

### Backup Manual
```bash
./backup.sh
```

### Restore de Backup
```bash
# Extrair arquivos
tar -xzf backups/iagris_files_YYYYMMDD_HHMMSS.tar.gz

# Restaurar banco (se necessário)
psql $DATABASE_URL < backups/iagris_db_YYYYMMDD_HHMMSS.sql
```

### Atualização do Sistema
1. Fazer backup completo
2. Preparar nova versão com `build-for-cpanel.sh`
3. Fazer upload dos novos arquivos
4. Executar `npm run db:push` se necessário
5. Reiniciar aplicação via cPanel

## RECURSOS DO SISTEMA

### Funcionalidades Principais
- Gestão de fazendas
- Controle de animais
- Gestão de plantações
- Controle de inventário
- Gestão de funcionários
- Relatórios financeiros
- Sistema de tarefas
- Controle de metas

### Tecnologias
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + Shadcn/UI
- **Autenticação**: Passport.js com sessões

### Roles de Usuário
- Super Admin
- Farm Admin
- Manager
- Employee
- Veterinarian
- Agronomist
- Consultant

## CONTATO E SUPORTE

Para problemas específicos:
1. Verificar logs em `logs/app.log`
2. Acessar `/health` para status
3. Contatar suporte do provedor de hospedagem
4. Verificar documentação em `docs/`

---

**IMPORTANTE**: Sempre faça backup antes de qualquer alteração em produção!

Data de preparação: $(date)
Versão do sistema: v1.0 (Produção)