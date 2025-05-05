import 'dotenv/config';
import fs from 'fs';
import { pool } from './server/db.js';

async function exportData() {
  console.log('Iniciando exportação do banco de dados...');
  
  // Lista de tabelas para exportar
  const tables = [
    'users',
    'farms',
    'user_farms',
    'user_permissions',
    'animals',
    'crops',
    'inventory',
    'tasks',
    'goals'
  ];
  
  let exportData = {};
  
  try {
    for (const table of tables) {
      console.log(`Exportando tabela: ${table}`);
      const result = await pool.query(`SELECT * FROM ${table}`);
      exportData[table] = result.rows;
    }
    
    // Escrever para um arquivo
    fs.writeFileSync('database_export.json', JSON.stringify(exportData, null, 2));
    
    // Criar SQL para importação
    let sqlOutput = '';
    
    // Adicionar comandos para limpar tabelas
    for (let i = tables.length - 1; i >= 0; i--) {
      sqlOutput += `DELETE FROM ${tables[i]};\n`;
    }
    
    sqlOutput += '\n';
    
    // Adicionar INSERT statements para cada tabela
    for (const table of tables) {
      const rows = exportData[table];
      if (rows.length > 0) {
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });
          
          sqlOutput += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlOutput += '\n';
      }
    }
    
    fs.writeFileSync('database_export.sql', sqlOutput);
    
    console.log('Exportação concluída com sucesso!');
    console.log('Arquivos gerados:');
    console.log('- database_export.json (Formato JSON)');
    console.log('- database_export.sql (Comandos SQL para importação)');
  } catch (error) {
    console.error('Erro durante a exportação:', error);
  } finally {
    await pool.end();
  }
}

exportData();