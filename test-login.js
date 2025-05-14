import fetch from 'node-fetch';

async function testLogin() {
  console.log("Testando login com admin/admin...");
  
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    const data = await response.text();
    console.log('Resposta:', data);
    
    if (response.ok) {
      console.log('Login bem-sucedido!');
      
      // Verificar o cookie da sessão
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        console.log('Cookies recebidos:', cookies);
      } else {
        console.log('Nenhum cookie foi definido!');
      }
    } else {
      console.log('Falha no login:', response.status, data);
    }
    
  } catch (error) {
    console.error('Erro ao executar o login:', error);
  }
}

testLogin();