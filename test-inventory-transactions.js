// Script para testar a API de transações de inventário
const fetch = require('node-fetch');

async function login() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const cookies = response.headers.get('set-cookie');
    console.log('Login successful, cookies:', cookies);
    return cookies;
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
}

async function getTransactions(farmId, cookies) {
  try {
    console.log(`Fetching transactions for farm ID ${farmId}...`);
    const response = await fetch(`http://localhost:5000/api/farms/${farmId}/inventory/transactions`, {
      headers: {
        'Cookie': cookies,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch transactions: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`Received ${data.length} transactions`);
    
    if (data.length > 0) {
      console.log('First transaction:', data[0]);
      console.log('Properties of first transaction:', Object.keys(data[0]));
      
      // Check if we're getting farm objects or transaction objects
      if ('name' in data[0] && 'location' in data[0]) {
        console.error('ERROR: Received farm objects instead of transactions!');
      } else if ('type' in data[0] && 'quantity' in data[0]) {
        console.log('Received correct transaction objects ✓');
      }
    } else {
      console.log('No transactions found');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return null;
  }
}

async function testQueryBuilding(farmId) {
  // Test how the queryKey is constructed
  console.log('\nTest Query Key Construction:');
  console.log(`Farm ID: ${farmId}`);
  const queryKey = ['/api/farms', farmId, 'inventory/transactions'];
  console.log('Query Key Array:', queryKey);
  console.log('First element (URL base):', queryKey[0]);
  
  // In the fetch implementation, it uses the first element as the URL
  // This is incorrect for parameterized URLs
  console.log('What would be fetched:', queryKey[0]);
  
  // Correct URL construction would be:
  const correctUrl = `/api/farms/${farmId}/inventory/transactions`;
  console.log('Correct URL to fetch:', correctUrl);
}

async function main() {
  const cookies = await login();
  if (!cookies) {
    console.error('Failed to login, cannot proceed with tests');
    return;
  }
  
  // Test with a valid farm ID
  const farmId = 6;
  await getTransactions(farmId, cookies);
  
  // Test how the query key is built
  await testQueryBuilding(farmId);
}

main();