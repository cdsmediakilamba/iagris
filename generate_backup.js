import { pool } from './server/db.js';
import fs from 'fs';

// Função para obter todas as tabelas do banco de dados
async function getTables() {
  const result = await pool.query(`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  `);
  return result.rows.map(row => row.tablename);
}

// Função para gerar o SQL CREATE TABLE para uma tabela
async function getTableCreateSQL(tableName) {
  const result = await pool.query(`
    SELECT 
      pg_get_tabledef('"${tableName}"'::regclass) as create_table
  `);
  return result.rows[0].create_table;
}

// Função para obter os dados de uma tabela
async function getTableData(tableName) {
  let sql = '';
  // Obter dados
  const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
  if (dataResult.rows.length > 0) {
    // Adicionar comandos INSERT
    const columns = Object.keys(dataResult.rows[0]).join(', ');
    
    dataResult.rows.forEach(row => {
      const values = Object.values(row).map(value => {
        if (value === null) return 'NULL';
        if (typeof value === 'string') {
          // Escapar aspas simples
          const escaped = value.replace(/'/g, "''");
          return `'${escaped}'`;
        }
        if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        }
        return value;
      }).join(', ');
      
      sql += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
    });
    sql += '\n';
  }
  
  return sql;
}

// Função principal para gerar o backup
async function generateBackup() {
  try {
    let backupSQL = '-- Backup do banco de dados gerado em ' + new Date().toISOString() + '\n\n';
    
    // Desativar restrições de chave estrangeira durante o backup
    backupSQL += '-- Desativando restrições de chave estrangeira\n';
    backupSQL += 'SET CONSTRAINTS ALL DEFERRED;\n\n';
    
    // Obter todas as tabelas
    const tables = await getTables();
    console.log('Tabelas encontradas:', tables);
    
    // Gerar SQL para criação das tabelas e seus dados
    for (const tableName of tables) {
      console.log(`Processando tabela: ${tableName}`);
      
      // Adicionar DROP TABLE IF EXISTS
      backupSQL += `-- Tabela: ${tableName}\n`;
      backupSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      
      // Adicionar CREATE TABLE
      try {
        const createSQL = await getTableCreateSQL(tableName);
        backupSQL += createSQL + ';\n\n';
      } catch (err) {
        console.error(`Erro ao obter definição da tabela ${tableName}:`, err);
        continue;
      }
    }
    
    // Gerar SQL para inserção de dados
    backupSQL += '\n-- Inserindo dados nas tabelas\n';
    for (const tableName of tables) {
      console.log(`Inserindo dados na tabela: ${tableName}`);
      try {
        const dataSQL = await getTableData(tableName);
        if (dataSQL) {
          backupSQL += `-- Dados da tabela: ${tableName}\n`;
          backupSQL += dataSQL;
        }
      } catch (err) {
        console.error(`Erro ao obter dados da tabela ${tableName}:`, err);
      }
    }
    
    // Reativar restrições de chave estrangeira após o backup
    backupSQL += '\n-- Reativando restrições de chave estrangeira\n';
    backupSQL += 'SET CONSTRAINTS ALL IMMEDIATE;\n\n';
    
    // Escrever o SQL em um arquivo
    fs.writeFileSync('database_backup.sql', backupSQL);
    console.log('Backup SQL gerado com sucesso em database_backup.sql');
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    return false;
  } finally {
    // Fechar a conexão com o banco de dados
    await pool.end();
  }
}

// Executar o backup
generateBackup();