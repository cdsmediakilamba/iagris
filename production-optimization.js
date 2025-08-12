/**
 * Otimizações para ambiente de produção em cPanel
 * Adicione este código no início do server/index.ts
 */

// Configurações para ambiente compartilhado
if (process.env.NODE_ENV === 'production' && process.env.CPANEL_MODE === 'true') {
  
  // Limitar uso de memória
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
  
  // Configurar garbage collection mais agressivo
  if (global.gc) {
    setInterval(() => {
      global.gc();
    }, 30000); // A cada 30 segundos
  }
  
  // Configurar timeouts mais baixos
  process.env.CONNECT_TIMEOUT = '10000';
  process.env.SOCKET_TIMEOUT = '30000';
  
  // Cache em memória limitado para reduzir consultas ao banco
  global.cache = new Map();
  global.MAX_CACHE_SIZE = 100;
  
  global.setCache = function(key, value, ttl = 300000) { // 5 minutos padrão
    if (global.cache.size >= global.MAX_CACHE_SIZE) {
      const firstKey = global.cache.keys().next().value;
      global.cache.delete(firstKey);
    }
    global.cache.set(key, { 
      value, 
      timestamp: Date.now(),
      ttl
    });
  };
  
  global.getCache = function(key) {
    const item = global.cache.get(key);
    if (item && (Date.now() - item.timestamp) < item.ttl) {
      return item.value;
    }
    global.cache.delete(key);
    return null;
  };
  
  // Sistema de logs para arquivo
  const fs = require('fs');
  const path = require('path');
  
  function logToFile(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}] ${message}\n`;
    
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    try {
      fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
    } catch (err) {
      // Falha silenciosa se não conseguir escrever log
    }
  }
  
  // Interceptar console.log em produção
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = (...args) => {
    logToFile('INFO', args.join(' '));
    originalLog(...args);
  };
  
  console.error = (...args) => {
    logToFile('ERROR', args.join(' '));
    originalError(...args);
  };
  
  console.warn = (...args) => {
    logToFile('WARN', args.join(' '));
    originalWarn(...args);
  };
  
  // Cleanup de logs antigos (manter apenas últimos 7 dias)
  setInterval(() => {
    const logDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logDir)) {
      try {
        const files = fs.readdirSync(logDir);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        files.forEach(file => {
          const filePath = path.join(logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < sevenDaysAgo) {
            fs.unlinkSync(filePath);
          }
        });
      } catch (err) {
        // Falha silenciosa
      }
    }
  }, 24 * 60 * 60 * 1000); // A cada 24 horas
  
  console.log('✅ Otimizações para cPanel ativadas');
}

module.exports = {
  setCache: global.setCache,
  getCache: global.getCache
};