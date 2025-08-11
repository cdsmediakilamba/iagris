# Configuração do Banco de Dados - iAgris

## Visão Geral

Este documento detalha como configurar, migrar e manter o banco de dados PostgreSQL do sistema iAgris, incluindo configurações para diferentes ambientes e procedimentos de backup.

## Requisitos

### Versões Suportadas
- **PostgreSQL**: 13.0 ou superior (recomendado: 15.x)
- **Extensões**: uuid-ossp, pgcrypto (opcionais)

### Recursos Mínimos
- **RAM**: 1 GB mínimo, 4 GB recomendado
- **Armazenamento**: 10 GB mínimo, SSD recomendado
- **CPU**: 1 vCPU mínimo, 2+ vCPUs recomendado

## Instalação do PostgreSQL

### Ubuntu/Debian

```bash
# Atualizar repositórios
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar e habilitar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### CentOS/RHEL

```bash
# Instalar repositório oficial do PostgreSQL
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Instalar PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15

# Inicializar banco
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Iniciar e habilitar
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15
```

### Windows

1. Baixar instalador do [PostgreSQL.org](https://www.postgresql.org/download/windows/)
2. Executar como Administrador
3. Seguir o assistente de instalação
4. Anotar a senha do usuário postgres
5. Configurar PATH do Windows se necessário

### macOS

```bash
# Usando Homebrew
brew install postgresql@15

# Iniciar serviço
brew services start postgresql@15

# Ou usando MacPorts
sudo port install postgresql15-server
```

### Docker

```bash
# Executar PostgreSQL em container
docker run --name iagris-postgres \
  -e POSTGRES_DB=iagris \
  -e POSTGRES_USER=iagris \
  -e POSTGRES_PASSWORD=senha_segura \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15-alpine

# Verificar se está rodando
docker ps
```

## Configuração Inicial

### 1. Configuração do Usuário PostgreSQL

```bash
# Acessar como usuário postgres
sudo -u postgres psql

# Alterar senha do usuário postgres
ALTER USER postgres PASSWORD 'senha_super_segura';

# Sair do psql
\q
```

### 2. Criação do Banco para iAgris

```bash
# Conectar como postgres
sudo -u postgres psql

# Criar usuário para aplicação
CREATE USER iagris WITH PASSWORD 'senha_do_iagris';

# Criar banco de dados
CREATE DATABASE iagris_dev OWNER iagris;
CREATE DATABASE iagris_staging OWNER iagris;
CREATE DATABASE iagris_prod OWNER iagris;

# Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE iagris_dev TO iagris;
GRANT ALL PRIVILEGES ON DATABASE iagris_staging TO iagris;
GRANT ALL PRIVILEGES ON DATABASE iagris_prod TO iagris;

# Verificar bancos criados
\l

# Sair
\q
```

### 3. Configuração de Acesso

#### Editar postgresql.conf

```bash
# Localizar arquivo de configuração
sudo find /etc -name "postgresql.conf" 2>/dev/null

# Editar arquivo (Ubuntu/Debian)
sudo nano /etc/postgresql/15/main/postgresql.conf

# Editar arquivo (CentOS/RHEL)
sudo nano /var/lib/pgsql/15/data/postgresql.conf
```

**Configurações importantes:**

```ini
# Conexões
listen_addresses = 'localhost'          # ou '*' para acesso remoto
port = 5432
max_connections = 100

# Memória
shared_buffers = 256MB                  # 25% da RAM disponível
effective_cache_size = 1GB              # 50-75% da RAM total
work_mem = 4MB
maintenance_work_mem = 64MB

# Logs
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = 1000      # Log queries > 1 segundo

# Checkpoint
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Performance
random_page_cost = 1.1                 # Para SSDs
effective_io_concurrency = 200
```

#### Editar pg_hba.conf

```bash
# Editar arquivo de autenticação
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

**Configurações de acesso:**

```ini
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# "local" is for Unix domain socket connections only
local   all             all                                     md5

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5

# IPv6 local connections:
host    all             all             ::1/128                 md5

# Para acesso remoto específico (substitua 192.168.1.0/24 pela sua rede)
host    iagris_prod     iagris          192.168.1.0/24          md5

# Para aplicação no mesmo servidor
host    iagris_dev      iagris          127.0.0.1/32            md5
host    iagris_staging  iagris          127.0.0.1/32            md5
host    iagris_prod     iagris          127.0.0.1/32            md5
```

### 4. Reiniciar PostgreSQL

```bash
# Ubuntu/Debian
sudo systemctl restart postgresql

# CentOS/RHEL
sudo systemctl restart postgresql-15

# Verificar status
sudo systemctl status postgresql
```

## Schema do Banco de Dados

### Estrutura Principal

O sistema iAgris utiliza o Drizzle ORM para gerenciar o schema. A estrutura principal inclui:

#### Tabelas Principais

```sql
-- Usuários do sistema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'employee',
    farm_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fazendas
CREATE TABLE farms (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    size INTEGER,
    created_by INTEGER,
    admin_id INTEGER,
    description TEXT,
    coordinates VARCHAR,
    type VARCHAR DEFAULT 'mixed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Espécies de animais
CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    code_prefix VARCHAR(3) NOT NULL,
    auto_generate_code BOOLEAN DEFAULT true,
    farm_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Animais
CREATE TABLE animals (
    id SERIAL PRIMARY KEY,
    registration_code VARCHAR NOT NULL,
    name VARCHAR,
    species_id INTEGER NOT NULL,
    breed VARCHAR,
    sex VARCHAR,
    birth_date DATE,
    weight DECIMAL,
    status VARCHAR DEFAULT 'active',
    health_status VARCHAR DEFAULT 'Saudável',
    location VARCHAR,
    mother_id INTEGER,
    father_id INTEGER,
    farm_id INTEGER NOT NULL,
    created_by INTEGER,
    removed_at TIMESTAMP,
    removal_reason TEXT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cultivos
CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    crop_type VARCHAR NOT NULL,
    variety VARCHAR,
    area DECIMAL NOT NULL,
    planting_date DATE,
    expected_harvest DATE,
    actual_harvest DATE,
    status VARCHAR DEFAULT 'planned',
    location VARCHAR,
    estimated_yield DECIMAL,
    actual_yield DECIMAL,
    soil_type VARCHAR,
    irrigation_type VARCHAR,
    observations TEXT,
    farm_id INTEGER NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventário
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    unit VARCHAR NOT NULL,
    current_stock DECIMAL DEFAULT 0,
    min_stock DECIMAL DEFAULT 0,
    max_stock DECIMAL,
    unit_cost DECIMAL,
    supplier VARCHAR,
    location VARCHAR,
    expiration_date DATE,
    farm_id INTEGER NOT NULL,
    created_by INTEGER,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Funcionários
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    position VARCHAR NOT NULL,
    contact VARCHAR,
    email VARCHAR,
    hire_date DATE NOT NULL,
    salary DECIMAL,
    status VARCHAR DEFAULT 'active',
    department VARCHAR,
    farm_id INTEGER NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Custos
CREATE TABLE costs (
    id SERIAL PRIMARY KEY,
    description VARCHAR NOT NULL,
    amount DECIMAL NOT NULL,
    category VARCHAR NOT NULL,
    date DATE NOT NULL,
    related_area VARCHAR,
    related_id INTEGER,
    notes TEXT,
    farm_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Índices Importantes

```sql
-- Índices para performance
CREATE INDEX idx_animals_farm_id ON animals(farm_id);
CREATE INDEX idx_animals_species_id ON animals(species_id);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_registration_code ON animals(registration_code);

CREATE INDEX idx_crops_farm_id ON crops(farm_id);
CREATE INDEX idx_crops_status ON crops(status);
CREATE INDEX idx_crops_planting_date ON crops(planting_date);

CREATE INDEX idx_inventory_farm_id ON inventory(farm_id);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_current_stock ON inventory(current_stock);

CREATE INDEX idx_costs_farm_id ON costs(farm_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_costs_category ON costs(category);

CREATE INDEX idx_employees_farm_id ON employees(farm_id);
CREATE INDEX idx_employees_status ON employees(status);

-- Índices compostos
CREATE INDEX idx_animals_farm_status ON animals(farm_id, status);
CREATE INDEX idx_costs_farm_date ON costs(farm_id, date);
CREATE INDEX idx_inventory_farm_stock ON inventory(farm_id, current_stock);
```

## Migrações com Drizzle

### Configuração do Drizzle

O arquivo `drizzle.config.ts` já está configurado:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Executando Migrações

```bash
# Gerar migrações (quando houver mudanças no schema)
npm run db:generate

# Aplicar migrações ao banco
npm run db:push

# Aplicar migrações com confirmação
npm run db:migrate

# Verificar status das migrações
npm run db:check
```

### Scripts de Migração Manual

#### Criação Inicial do Schema

```bash
# Criar script de migração inicial
cat > migrations/0001_initial_schema.sql << 'EOF'
-- Migração inicial do iAgris
-- Versão: 1.0.0
-- Data: 2025-08-11

BEGIN;

-- Criar tabelas principais
-- (SQL das tabelas aqui)

-- Inserir dados iniciais
INSERT INTO species (name, code_prefix, farm_id) VALUES
('Bovino', 'BOV', 1),
('Suíno', 'SUI', 1),
('Caprino', 'CAP', 1),
('Ovino', 'OVI', 1),
('Aves', 'AVE', 1);

COMMIT;
EOF
```

#### Aplicar Migração Manual

```bash
# Executar migração
psql -h localhost -U iagris -d iagris_dev -f migrations/0001_initial_schema.sql

# Verificar se foi aplicada
psql -h localhost -U iagris -d iagris_dev -c "\dt"
```

## Seeding (Dados Iniciais)

### Script de Seed Básico

```javascript
// scripts/seed.js
const { Pool } = require('pg');
const bcrypt = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedDatabase() {
  console.log('Iniciando seed do banco de dados...');
  
  try {
    // Criar usuário admin
    const adminPassword = bcrypt.createHash('sha256').update('admin123').digest('hex');
    
    await pool.query(`
      INSERT INTO users (username, password, name, email, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', adminPassword, 'Administrador Geral', 'admin@iagris.com', 'super_admin']);
    
    // Criar fazenda modelo
    const farmResult = await pool.query(`
      INSERT INTO farms (name, location, size, description, coordinates, type, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      'Fazenda Modelo',
      'Luanda, Angola',
      1000,
      'Uma fazenda modelo para demonstração do sistema',
      '-8.8368,13.2343',
      'mixed'
    ]);
    
    const farmId = farmResult.rows[0]?.id || 1;
    
    // Criar espécies de animais
    const species = [
      ['Bovino', 'BOV'],
      ['Suíno', 'SUI'],
      ['Caprino', 'CAP'],
      ['Ovino', 'OVI'],
      ['Aves', 'AVE']
    ];
    
    for (const [name, prefix] of species) {
      await pool.query(`
        INSERT INTO species (name, code_prefix, farm_id)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [name, prefix, farmId]);
    }
    
    // Criar categorias de inventário
    const inventoryItems = [
      ['Ração Bovina', 'Ração', 'kg', 500, 100, 1000, 2.50, 'Depósito A'],
      ['Vacina Febre Aftosa', 'Medicamento', 'doses', 50, 10, 100, 15.00, 'Geladeira Veterinária'],
      ['Fertilizante NPK', 'Fertilizante', 'kg', 200, 50, 500, 3.75, 'Depósito B']
    ];
    
    for (const [name, category, unit, current, min, max, cost, location] of inventoryItems) {
      await pool.query(`
        INSERT INTO inventory (name, category, unit, current_stock, min_stock, max_stock, unit_cost, location, farm_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
        ON CONFLICT DO NOTHING
      `, [name, category, unit, current, min, max, cost, location, farmId]);
    }
    
    console.log('✅ Seed do banco de dados concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar seed se script for chamado diretamente
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };
```

```bash
# Executar seed
node scripts/seed.js
```

## Backup e Recuperação

### Backup Manual

```bash
# Backup completo do banco
pg_dump -h localhost -U iagris -d iagris_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup apenas do schema
pg_dump -h localhost -U iagris -d iagris_prod --schema-only > schema_backup.sql

# Backup apenas dos dados
pg_dump -h localhost -U iagris -d iagris_prod --data-only > data_backup.sql

# Backup comprimido
pg_dump -h localhost -U iagris -d iagris_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Backup Automatizado

```bash
# Script de backup automatizado
cat > /usr/local/bin/iagris-backup.sh << 'EOF'
#!/bin/bash

# Configurações
DB_HOST="localhost"
DB_USER="iagris"
DB_NAME="iagris_prod"
BACKUP_DIR="/var/backups/iagris"
RETENTION_DAYS=30

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/iagris_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Executar backup
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso: $BACKUP_FILE"
    
    # Remover backups antigos
    find "$BACKUP_DIR" -name "iagris_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "🧹 Backups antigos removidos"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi
EOF

# Tornar executável
chmod +x /usr/local/bin/iagris-backup.sh

# Adicionar ao crontab para execução diária às 2h
echo "0 2 * * * /usr/local/bin/iagris-backup.sh" | crontab -
```

### Recuperação de Backup

```bash
# Restaurar backup completo
psql -h localhost -U iagris -d iagris_prod < backup_20250811_020000.sql

# Restaurar backup comprimido
gunzip -c backup_20250811_020000.sql.gz | psql -h localhost -U iagris -d iagris_prod

# Restaurar criando novo banco
createdb -h localhost -U postgres iagris_restored
psql -h localhost -U postgres -d iagris_restored < backup_20250811_020000.sql
```

## Monitoramento e Manutenção

### Queries de Monitoramento

```sql
-- Verificar tamanho dos bancos
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database 
WHERE datname LIKE 'iagris%';

-- Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar queries lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Verificar conexões ativas
SELECT 
    datname,
    state,
    count(*) 
FROM pg_stat_activity 
GROUP BY datname, state;

-- Verificar locks
SELECT 
    t.relname,
    l.locktype,
    page,
    virtualtransaction,
    pid,
    mode,
    granted
FROM pg_locks l, pg_stat_all_tables t
WHERE l.relation = t.relid
ORDER BY relation ASC;
```

### Manutenção Regular

```sql
-- Atualizar estatísticas
ANALYZE;

-- Vacuum completo (executar durante baixo uso)
VACUUM FULL;

-- Vacuum regular (pode executar durante operação normal)
VACUUM;

-- Reindexar tabelas importantes
REINDEX TABLE animals;
REINDEX TABLE crops;
REINDEX TABLE inventory;
REINDEX TABLE costs;

-- Verificar e reparar corrupção
SELECT * FROM pg_check_table('animals');
```

### Script de Manutenção Automatizada

```bash
# Script de manutenção semanal
cat > /usr/local/bin/iagris-maintenance.sh << 'EOF'
#!/bin/bash

DB_HOST="localhost"
DB_USER="iagris"
DB_NAME="iagris_prod"

echo "Iniciando manutenção do banco iAgris..."

# Vacuum e analyze
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM ANALYZE;"

# Reindexar tabelas principais
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "REINDEX TABLE animals;"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "REINDEX TABLE crops;"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "REINDEX TABLE inventory;"

echo "✅ Manutenção concluída"
EOF

chmod +x /usr/local/bin/iagris-maintenance.sh

# Executar semanalmente aos domingos às 3h
echo "0 3 * * 0 /usr/local/bin/iagris-maintenance.sh" | crontab -
```

## Otimização de Performance

### Configurações Avançadas

```ini
# postgresql.conf - Otimizações para produção

# Memória
shared_buffers = 1GB                    # 25% da RAM
effective_cache_size = 3GB              # 75% da RAM
work_mem = 64MB
maintenance_work_mem = 256MB
autovacuum_work_mem = 256MB

# Checkpoints
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB

# Logs de performance
log_min_duration_statement = 1000      # Log queries > 1s
log_checkpoints = on
log_lock_waits = on
log_temp_files = 10MB

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
```

### Índices Adicionais para Performance

```sql
-- Índices parciais para dados ativos
CREATE INDEX idx_animals_active ON animals(farm_id, species_id) WHERE status = 'active';
CREATE INDEX idx_crops_active ON crops(farm_id, status) WHERE status IN ('planted', 'growing');

-- Índices para buscas por data
CREATE INDEX idx_costs_recent ON costs(farm_id, date) WHERE date >= CURRENT_DATE - INTERVAL '1 year';
CREATE INDEX idx_animals_birth_year ON animals(EXTRACT(year FROM birth_date));

-- Índices para relatórios
CREATE INDEX idx_inventory_low_stock ON inventory(farm_id) WHERE current_stock <= min_stock;
CREATE INDEX idx_animals_vaccination_due ON animals(id) WHERE status = 'active';
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão recusada**
   ```bash
   # Verificar se PostgreSQL está rodando
   sudo systemctl status postgresql
   
   # Verificar porta
   sudo netstat -tlnp | grep :5432
   ```

2. **Erro de autenticação**
   ```bash
   # Verificar configuração pg_hba.conf
   sudo cat /etc/postgresql/15/main/pg_hba.conf
   
   # Testar conexão
   psql -h localhost -U iagris -d iagris_dev
   ```

3. **Erro de permissões**
   ```sql
   -- Verificar privilégios
   \du iagris
   
   -- Conceder privilégios se necessário
   GRANT ALL PRIVILEGES ON DATABASE iagris_prod TO iagris;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO iagris;
   ```

4. **Performance lenta**
   ```sql
   -- Verificar queries lentas
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   
   -- Verificar bloqueios
   SELECT * FROM pg_locks WHERE NOT granted;
   ```

### Logs de Debug

```bash
# Habilitar logs detalhados
sudo nano /etc/postgresql/15/main/postgresql.conf

# Adicionar:
log_statement = 'all'
log_min_duration_statement = 0
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Monitorar logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

*Esta documentação deve ser mantida atualizada conforme mudanças na estrutura do banco de dados.*