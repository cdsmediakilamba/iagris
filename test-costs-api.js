import fetch from 'node-fetch';

// URL base para a API
const API_URL = 'http://localhost:5000';

// Credenciais para login
const CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // Senha correta encontrada
};

// ID de uma fazenda para testes
const FARM_ID = 6; // Use um ID de fazenda que existe no sistema

// Função para fazer login e obter o cookie de sessão
async function login() {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(CREDENTIALS),
      redirect: 'manual'
    });
    
    if (response.status !== 200 && response.status !== 302) {
      console.error('Erro ao fazer login:', await response.json());
      return null;
    }
    
    const cookies = response.headers.raw()['set-cookie'];
    return cookies;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return null;
  }
}

// Função para obter uma lista de custos de uma fazenda
async function getCosts(farmId, cookies) {
  try {
    const response = await fetch(`${API_URL}/api/farms/${farmId}/costs`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (response.status !== 200) {
      console.error('Erro ao obter custos:', await response.json());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao obter custos:', error);
    return null;
  }
}

// Função para criar um novo custo
async function createCost(farmId, costData, cookies) {
  try {
    const response = await fetch(`${API_URL}/api/farms/${farmId}/costs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(costData)
    });
    
    if (response.status !== 201) {
      console.error('Erro ao criar custo:', await response.json());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar custo:', error);
    return null;
  }
}

// Função para atualizar um custo existente
async function updateCost(costId, costData, cookies) {
  try {
    const response = await fetch(`${API_URL}/api/costs/${costId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(costData)
    });
    
    if (response.status !== 200) {
      console.error('Erro ao atualizar custo:', await response.json());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar custo:', error);
    return null;
  }
}

// Função para excluir um custo
async function deleteCost(costId, cookies) {
  try {
    const response = await fetch(`${API_URL}/api/costs/${costId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookies
      }
    });
    
    if (response.status !== 204) {
      console.error('Erro ao excluir custo:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir custo:', error);
    return false;
  }
}

// Função para testar o filtro por categoria
async function getCostsByCategory(farmId, category, cookies) {
  try {
    const response = await fetch(`${API_URL}/api/farms/${farmId}/costs?category=${category}`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (response.status !== 200) {
      console.error('Erro ao obter custos por categoria:', await response.json());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao obter custos por categoria:', error);
    return null;
  }
}

// Função para testar o filtro por período
async function getCostsByPeriod(farmId, startDate, endDate, cookies) {
  try {
    const response = await fetch(
      `${API_URL}/api/farms/${farmId}/costs?startDate=${startDate}&endDate=${endDate}`, 
      {
        headers: {
          'Cookie': cookies
        }
      }
    );
    
    if (response.status !== 200) {
      console.error('Erro ao obter custos por período:', await response.json());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao obter custos por período:', error);
    return null;
  }
}

// Função principal para executar os testes
async function runTests() {
  console.log('Iniciando testes do sistema de custos...');
  
  // 1. Fazer login
  console.log('\n1. Fazendo login...');
  const cookies = await login();
  if (!cookies) {
    console.error('Não foi possível fazer login. Encerrando testes.');
    return;
  }
  console.log('Login bem-sucedido!');
  
  // 2. Obter lista inicial de custos
  console.log('\n2. Obtendo lista inicial de custos...');
  const initialCosts = await getCosts(FARM_ID, cookies);
  console.log(`Encontrados ${initialCosts ? initialCosts.length : 0} custos iniciais.`);
  console.log(initialCosts);
  
  // 3. Criar um novo custo
  console.log('\n3. Criando um novo custo...');
  const newCostData = {
    description: 'Combustível para tratores',
    amount: '500.00',
    date: new Date().toISOString(),
    category: 'fuel',
    supplier: 'Posto de Gasolina Central',
    paymentMethod: 'Cartão de Crédito',
    notes: 'Abastecimento mensal'
  };
  
  const newCost = await createCost(FARM_ID, newCostData, cookies);
  if (!newCost) {
    console.error('Não foi possível criar um novo custo. Encerrando testes.');
    return;
  }
  console.log('Novo custo criado com sucesso!');
  console.log(newCost);
  
  // 4. Atualizar o custo criado
  console.log('\n4. Atualizando o custo...');
  const updateData = {
    amount: '550.00',
    notes: 'Abastecimento mensal atualizado'
  };
  
  const updatedCost = await updateCost(newCost.id, updateData, cookies);
  if (!updatedCost) {
    console.error('Não foi possível atualizar o custo. Continuando testes.');
  } else {
    console.log('Custo atualizado com sucesso!');
    console.log(updatedCost);
  }
  
  // 5. Criar mais alguns custos com categorias diferentes para testar filtros
  console.log('\n5. Criando custos adicionais para testar filtros...');
  
  const additionalCosts = [
    {
      description: 'Fertilizantes para plantação de milho',
      amount: '1200.00',
      date: new Date().toISOString(),
      category: 'fertilizer',
      supplier: 'Agro Suprimentos',
      paymentMethod: 'Transferência Bancária',
      notes: 'Compra trimestral'
    },
    {
      description: 'Manutenção de equipamentos',
      amount: '800.00',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
      category: 'maintenance',
      supplier: 'Oficina Técnica Rural',
      paymentMethod: 'Dinheiro',
      notes: 'Revisão preventiva'
    }
  ];
  
  for (const costData of additionalCosts) {
    const cost = await createCost(FARM_ID, costData, cookies);
    if (cost) {
      console.log(`Custo adicional criado: ${cost.description}`);
    }
  }
  
  // 6. Testar filtro por categoria
  console.log('\n6. Testando filtro por categoria (fuel)...');
  const fuelCosts = await getCostsByCategory(FARM_ID, 'fuel', cookies);
  console.log(`Encontrados ${fuelCosts ? fuelCosts.length : 0} custos na categoria 'fuel'.`);
  console.log(fuelCosts);
  
  // 7. Testar filtro por período
  console.log('\n7. Testando filtro por período (últimos 30 dias)...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString();
  
  const recentCosts = await getCostsByPeriod(FARM_ID, thirtyDaysAgo, today, cookies);
  console.log(`Encontrados ${recentCosts ? recentCosts.length : 0} custos nos últimos 30 dias.`);
  console.log(recentCosts);
  
  // 8. Excluir o custo criado (limpeza)
  if (newCost && newCost.id) {
    console.log('\n8. Excluindo o custo criado para limpeza...');
    const deleted = await deleteCost(newCost.id, cookies);
    if (deleted) {
      console.log('Custo excluído com sucesso!');
    } else {
      console.error('Não foi possível excluir o custo.');
    }
  }
  
  console.log('\nTestes concluídos!');
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro durante a execução dos testes:', error);
});