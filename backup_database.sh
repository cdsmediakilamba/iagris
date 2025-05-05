#!/bin/bash

# Usar as variáveis de ambiente que foram adicionadas ao projeto
export PGPASSWORD="$PGPASSWORD"

echo "Iniciando backup do banco de dados..."

# Criar arquivo de backup usando pg_dump
pg_dump --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" --format=plain --file="database_backup.sql"

echo "Backup concluído e salvo em database_backup.sql"