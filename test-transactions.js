import fetch from 'node-fetch';
import fs from 'fs';

async function login() {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin',
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const cookies = response.headers.raw()['set-cookie'];
  if (cookies) {
    const sessionCookie = cookies.find(c => c.startsWith('connect.sid='));
    if (sessionCookie) {
      return sessionCookie;
    }
  }
  
  console.log('Response headers:', response.headers.raw());
  throw new Error('Could not extract session cookie');
}

async function getTransactions(farmId, cookie) {
  const response = await fetch(`http://localhost:5000/api/farms/${farmId}/inventory/transactions`, {
    method: 'GET',
    headers: {
      'Cookie': cookie,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getInventory(farmId, cookie) {
  const response = await fetch(`http://localhost:5000/api/farms/${farmId}/inventory`, {
    method: 'GET',
    headers: {
      'Cookie': cookie,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log('Logging in...');
    const cookie = await login();
    console.log('Logged in successfully');
    console.log('Cookie:', cookie);

    console.log('Fetching inventory for farm 6...');
    const inventory = await getInventory(6, cookie);
    console.log('Inventory items:', inventory.length);
    console.log('First inventory item:', inventory[0]);

    console.log('Fetching transactions for farm 6...');
    const transactions = await getTransactions(6, cookie);
    console.log('Transactions count:', transactions.length);
    if (transactions.length > 0) {
      console.log('First transaction:', transactions[0]);
    } else {
      console.log('No transactions found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();