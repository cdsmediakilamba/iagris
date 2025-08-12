# 🚀 INSTRUÇÕES FINAIS - iAgris no cPanel

## SOLUÇÃO COMPLETA CRIADA!

Agora você tem **2 opções** para preparar o iAgris:

### ✅ **OPÇÃO 1: PACOTE COMPLETO (RECOMENDADO)**
**Use quando quiser o mínimo de trabalho no cPanel**

```bash
# Windows:
build-cpanel-complete.bat

# Linux/Mac:
./build-cpanel-complete.sh
```

**O que inclui:**
- ✅ Aplicação compilada
- ✅ **TODAS as dependências (node_modules)**
- ✅ Scripts prontos para cPanel
- ✅ Configurações otimizadas
- ✅ ZIP pronto para upload

**No cPanel você só precisa:**
1. Extrair o ZIP
2. Configurar `.env`
3. Executar: `/opt/cpanel/ea-nodejs22/bin/node start-cpanel.js`

---

### ⚡ **OPÇÃO 2: PACOTE BÁSICO**
**Use se preferir instalar dependências no cPanel**

```bash
# Linux/Mac:
./build-for-cpanel.sh

# Windows: Use WSL ou Git Bash
```

---

## 📋 PASSOS NO CPANEL (Para ambas opções):

### 1. **Upload e Extração**
- Faça upload do ZIP para `public_html/`
- Extraia na pasta `iagris`

### 2. **Configurar PostgreSQL**
- cPanel → "PostgreSQL Databases"
- Criar banco: `seuusuario_iagris`
- Criar usuário com senha forte
- Dar permissões ALL

### 3. **Configurar .env**
```bash
cp .env.cpanel-template .env
```

Edite com seus dados:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/seuusuario_iagris"
SESSION_SECRET="sua_chave_secreta_forte_de_32_caracteres"
```

### 4. **Iniciar Aplicação**

**Método A - Node.js App (Mais Fácil):**
- cPanel → "Setup Node.js App"
- Application Root: `iagris`
- Startup File: `start-cpanel.js`
- Node.js Version: 22.x

**Método B - Terminal/SSH:**
```bash
cd public_html/iagris
/opt/cpanel/ea-nodejs22/bin/node start-cpanel.js
```

### 5. **Verificar**
- Aplicação: `https://seudominio.com/iagris`
- Status: `https://seudominio.com/iagris/health`
- Login: admin / (ver credenciais_admin.md)

---

## 🔧 COMANDOS ÚTEIS NO CPANEL:

```bash
# Aplicar schema do banco
/opt/cpanel/ea-nodejs22/bin/node node_modules/.bin/drizzle-kit push

# Backup
./backup.sh

# Ver logs
tail -f logs/app.log

# Testar banco
/opt/cpanel/ea-nodejs22/bin/node setup-database.js
```

---

## 📦 ARQUIVOS CRIADOS:

| Arquivo | Descrição |
|---------|-----------|
| `build-cpanel-complete.sh/.bat` | **Pacote COMPLETO com node_modules** |
| `build-for-cpanel.sh` | Pacote básico |
| `start-cpanel.js` | Script de inicialização para cPanel |
| `.env.cpanel-template` | Template de configuração |
| `INSTRUCOES-CPANEL-COMPLETO.md` | Documentação detalhada |

---

## 🎯 RECOMENDAÇÃO:

**Use `build-cpanel-complete.sh/.bat`** - é a solução mais completa e fácil!

O ZIP será maior (pode passar de 100MB), mas no cPanel você só precisa:
1. Extrair
2. Configurar .env  
3. Executar

Sem instalações, sem npm install, sem complicações!

---

## 🆘 SUPORTE:

Se algo não funcionar:
1. Verificar logs em `logs/app.log`
2. Testar status em `/health`
3. Verificar configuração do banco
4. Conferir permissões dos arquivos

**Data:** $(date)
**Versão:** iAgris v1.0 - cPanel Ready