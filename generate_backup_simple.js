import { pool } from './server/db.js';
import fs from 'fs';

async function exportTables() {
  try {
    // Obter todas as tabelas
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log("Tabelas encontradas:", tables);
    
    let fullSql = '';
    
    // Para cada tabela
    for (const table of tables) {
      console.log(`Exportando tabela: ${table}`);
      
      // Obter todas as linhas da tabela
      const dataResult = await pool.query(`SELECT * FROM "${table}"`);
      const rows = dataResult.rows;
      
      // Adicionar comandos SQL para criar tabela
      fullSql += `\\echo 'Exportando tabela ${table}'\n`;
      fullSql += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
      
      // Obter a estrutura da tabela
      const structureResult = await pool.query(`
        SELECT pg_catalog.pg_get_tabledef('"${table}"'::regclass);
      `);
      const createTableSql = structureResult.rows[0].pg_get_tabledef;
      fullSql += createTableSql + ';\n\n';
      
      // Se houver dados, gerar INSERTs
      if (rows.length > 0) {
        for (const row of rows) {
          const columns = Object.keys(row).join('", "');
          const values = Object.values(row).map(val => 
            val === null ? 'NULL' : 
            typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : 
            val instanceof Date ? `'${val.toISOString()}'` : val
          ).join(', ');
          
          fullSql += `INSERT INTO "${table}" ("${columns}") VALUES (${values});\n`;
        }
        fullSql += '\n';
      }
    }
    
    // Salvar o SQL em um arquivo
    fs.writeFileSync('backup_database.sql', fullSql);
    console.log('Backup salvo em backup_database.sql');
    
  } catch (error) {
    console.error('Erro ao exportar tabelas:', error);
  } finally {
    await pool.end();
  }
}

exportTables();