import { pool } from './server/db.js';
import fs from 'fs';

async function exportData() {
  try {
    // Obter todas as tabelas
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `);
    const tables = tablesResult.rows.map(row => row.tablename);
    
    console.log('Tabelas encontradas:', tables);
    
    let sql = '';
    
    // Para cada tabela
    for (const table of tables) {
      console.log(`Exportando tabela ${table}...`);
      
      // Obter dados da tabela
      const dataResult = await pool.query(`SELECT * FROM "${table}"`);
      
      if (dataResult.rows.length > 0) {
        sql += `-- Dados da tabela: ${table}\n`;
        sql += `DELETE FROM "${table}";\n`;
        
        // Gerar declarações INSERT
        for (const row of dataResult.rows) {
          const columns = Object.keys(row).map(col => `"${col}"`).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          }).join(', ');
          
          sql += `INSERT INTO "${table}" (${columns}) VALUES (${values});\n`;
        }
        
        sql += '\n';
      }
    }
    
    // Escrever arquivo SQL
    fs.writeFileSync('dados_backup.sql', sql);
    console.log('Arquivo SQL gerado com sucesso: dados_backup.sql');
    
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
  } finally {
    // Fechar conexão com o banco de dados
    await pool.end();
  }
}

exportData();