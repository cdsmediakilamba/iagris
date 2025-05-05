// Script para gerar uma exportação SQL (CommonJS)
const { exec } = require('child_process');
const fs = require('fs');

// Tabelas a serem exportadas
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

// Função para executar comando SQL e salvar resultado
function executeSqlAndSave(table) {
  return new Promise((resolve, reject) => {
    const command = `psql "${process.env.DATABASE_URL}" -c "SELECT * FROM ${table}" -t -A -F, > ${table}_export.csv`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao exportar tabela ${table}: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Tabela ${table} exportada com sucesso para ${table}_export.csv`);
      resolve();
    });
  });
}

async function exportTables() {
  console.log('Iniciando exportação de tabelas...');
  
  for (const table of tables) {
    try {
      await executeSqlAndSave(table);
    } catch (error) {
      console.error(`Falha ao exportar tabela ${table}`);
    }
  }
  
  console.log('Exportação concluída!');
}

exportTables();