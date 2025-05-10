import crypto from 'crypto';

// Função para gerar hash SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Hash armazenado no banco de dados para o usuário admin
const storedHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

// Lista de senhas comuns para testar
const commonPasswords = [
  'admin',
  'Admin',
  'password',
  'Password',
  'admin123',
  'Admin123',
  '123456',
  'senha',
  'Senha',
  'password123',
  'admin1234',
  'Administrator',
  'iagris',
  'Iagris',
  'iagris123',
  'Iagris123',
  'farmadmin',
  'FarmAdmin'
];

// Testar senhas comuns
console.log('Testando senhas comuns...\n');
for (const password of commonPasswords) {
  const hash = hashPassword(password);
  const match = hash === storedHash;
  console.log(`Senha: "${password}" => Hash: ${hash.substring(0, 10)}... => Corresponde: ${match ? 'SIM' : 'não'}`);
  
  if (match) {
    console.log(`\nSenha encontrada: "${password}"`);
    break;
  }
}