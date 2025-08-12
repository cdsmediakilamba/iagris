#!/usr/bin/env node

/**
 * Script para configurar o banco de dados PostgreSQL em produção (cPanel)
 * Execute este script após configurar as variáveis de ambiente
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './shared/schema.js';

// Carregar variáveis de ambiente
config();

async function setupDatabase() {
  try {
    console.log('🔧 Iniciando configuração do banco de dados...');
    
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está configurado no arquivo .env');
    }
    
    console.log('📡 Conectando ao banco de dados...');
    
    // Conectar ao banco
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar a conexão fazendo uma consulta simples
    console.log('🧪 Testando conexão...');
    await sql`SELECT NOW() as current_time`;
    console.log('✅ Teste de conexão passou!');
    
    console.log('📊 Configuração do banco concluída com sucesso!');
    console.log('');
    console.log('⚠️  PRÓXIMOS PASSOS:');
    console.log('1. Execute: npm run db:push');
    console.log('2. Inicie a aplicação: node dist/index.js');
    console.log('3. Acesse: https://seudominio.com/iagris');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error.message);
    
    if (error.message.includes('connect')) {
      console.log('');
      console.log('🔍 DICAS PARA RESOLVER PROBLEMAS DE CONEXÃO:');
      console.log('1. Verifique se DATABASE_URL está correto no arquivo .env');
      console.log('2. Confirme se o banco PostgreSQL foi criado no cPanel');
      console.log('3. Verifique se o usuário tem permissões no banco');
      console.log('4. Teste a string de conexão manualmente');
    }
    
    process.exit(1);
  }
}

// Executar configuração
setupDatabase();