import { db } from "./db";
import { tasks } from "@shared/schema";

/**
 * Script para adicionar tarefas ao banco de dados
 */

// Usuários existentes e suas IDs
const users = {
  superAdmin: { id: 10 },
  farmAdmin: { id: 11 },
  employee: { id: 12 },
  veterinarian: { id: 13 },
  agronomist: { id: 14 },
  manager: { id: 15 },
  consultant: { id: 16 }
};

// Fazendas existentes e suas IDs
const farms = {
  farmModel: { id: 6 },
  farmLivestock: { id: 7 },
  farmCrop: { id: 8 },
  farmFruit: { id: 9 },
  farmPoultry: { id: 10 }
};

// Função para criar tarefas
async function createTasks() {
  console.log("Criando tarefas...");
  
  // Categorias e prioridades
  const categories = ["animal", "crop", "inventory", "general"];
  const priorities = ["high", "medium", "low"];
  const statuses = ["pending", "in_progress", "completed", "canceled"];
  
  // Tarefas para a Fazenda Modelo
  const taskTitles = [
    "Vacinação dos animais", "Alimentação do gado", "Plantio de milho",
    "Fertilização do setor A", "Contagem de inventário", "Manutenção de equipamentos",
    "Colheita de feijão", "Limpeza dos estábulos", "Monitoramento de pragas",
    "Reparo da cerca norte"
  ];
  
  const today = new Date();
  
  for (let i = 0; i < taskTitles.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Distribuir tarefas no tempo: algumas no passado, algumas hoje, algumas no futuro
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 10); // -10 a +20 dias
    
    // Atribuir a um usuário aleatório (ou deixar null para 20% das tarefas)
    const randomAssignment = Math.random();
    let assignedTo;
    
    if (randomAssignment < 0.2) {
      assignedTo = null;
    } else if (randomAssignment < 0.4) {
      assignedTo = users.employee.id;
    } else if (randomAssignment < 0.6) {
      assignedTo = users.veterinarian.id;
    } else if (randomAssignment < 0.8) {
      assignedTo = users.agronomist.id;
    } else {
      assignedTo = users.manager.id;
    }
    
    await db.insert(tasks).values({
      title: taskTitles[i],
      description: `Detalhes para a tarefa: ${taskTitles[i]}`,
      dueDate,
      status,
      priority,
      assignedTo,
      category,
      relatedId: null,
      farmId: farms.farmModel.id
    });
  }
  
  // Tarefas para a Fazenda Pecuária
  const livestockTasks = [
    "Vacinação anual", "Rotação de pasto", "Verificação de cercas",
    "Manutenção do curral", "Compra de suplementos", "Exame de saúde animal",
    "Treinamento de funcionários", "Instalação de comedouros"
  ];
  
  for (let i = 0; i < livestockTasks.length; i++) {
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 5); // -5 a +25 dias
    
    // Atribuir principalmente ao veterinário ou funcionário
    const assignedTo = Math.random() < 0.6 ? 
      users.veterinarian.id : 
      (Math.random() < 0.7 ? users.employee.id : null);
    
    await db.insert(tasks).values({
      title: livestockTasks[i],
      description: `Tarefa relacionada à pecuária: ${livestockTasks[i]}`,
      dueDate,
      status,
      priority,
      assignedTo,
      category: "animal",
      relatedId: null,
      farmId: farms.farmLivestock.id
    });
  }
  
  // Tarefas para a Fazenda Agrícola
  const cropTasks = [
    "Preparação do solo", "Aplicação de pesticidas", "Irrigação",
    "Colheita de arroz", "Controle de plantas daninhas", "Análise de solo",
    "Compra de sementes", "Avaliação de crescimento"
  ];
  
  for (let i = 0; i < cropTasks.length; i++) {
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + Math.floor(Math.random() * 45) - 15); // -15 a +30 dias
    
    // Atribuir principalmente ao agrônomo
    const assignedTo = Math.random() < 0.7 ? 
      users.agronomist.id : 
      (Math.random() < 0.5 ? users.manager.id : null);
    
    await db.insert(tasks).values({
      title: cropTasks[i],
      description: `Tarefa relacionada às plantações: ${cropTasks[i]}`,
      dueDate,
      status,
      priority,
      assignedTo,
      category: "crop",
      relatedId: null,
      farmId: farms.farmCrop.id
    });
  }
  
  // Tarefas para o Pomar Tropical
  const fruitTasks = [
    "Podas de formação", "Aplicação de fertilizantes", "Controle de insetos",
    "Colheita de manga", "Análise de frutos", "Instalação de sistema de irrigação",
    "Plantio de novas mudas", "Avaliação de qualidade dos frutos"
  ];
  
  for (let i = 0; i < fruitTasks.length; i++) {
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = i < 3 ? "pending" : statuses[Math.floor(Math.random() * statuses.length)]; // Garantir algumas tarefas pendentes
    
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + Math.floor(Math.random() * 20)); // 0 a +20 dias (principalmente futuras)
    
    // Atribuir ao agrônomo ou consultor
    const assignedTo = Math.random() < 0.6 ? 
      users.agronomist.id : 
      (Math.random() < 0.7 ? users.consultant.id : null);
    
    await db.insert(tasks).values({
      title: fruitTasks[i],
      description: `Tarefa para o pomar: ${fruitTasks[i]}`,
      dueDate,
      status,
      priority,
      assignedTo,
      category: "crop",
      relatedId: null,
      farmId: farms.farmFruit.id
    });
  }
  
  // Tarefas para a Granja Aviária
  const poultryTasks = [
    "Limpeza dos galpões", "Vacinação das aves", "Verificação de bebedouros",
    "Controle de temperatura", "Coleta de ovos", "Monitoramento sanitário",
    "Manutenção de equipamentos", "Separação de aves para venda"
  ];
  
  for (let i = 0; i < poultryTasks.length; i++) {
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = i < 4 ? "pending" : (i < 6 ? "in_progress" : "completed"); // Distribuição controlada de status
    
    const dueDate = new Date(today);
    // Criar algumas tarefas para hoje
    if (i < 3) {
      // Hoje
    } else {
      dueDate.setDate(today.getDate() + Math.floor(Math.random() * 10) - 2); // -2 a +8 dias
    }
    
    // Atribuir ao veterinário ou funcionário
    const assignedTo = Math.random() < 0.5 ? 
      users.veterinarian.id : users.employee.id;
    
    await db.insert(tasks).values({
      title: poultryTasks[i],
      description: `Tarefa para a granja: ${poultryTasks[i]}`,
      dueDate,
      status,
      priority,
      assignedTo,
      category: "animal",
      relatedId: null,
      farmId: farms.farmPoultry.id
    });
  }
  
  // Adicionar tarefas específicas para hoje e amanhã para alimentar o calendário
  const urgentTaskTitles = [
    "Reunião de equipe", "Entrega de relatório mensal", "Manutenção emergencial",
    "Inspeção de qualidade", "Visita técnica", "Pagamento de fornecedores"
  ];
  
  for (let i = 0; i < urgentTaskTitles.length; i++) {
    const farmId = Object.values(farms)[i % 5].id;
    const priority = "high";
    const status = "pending";
    
    const dueDate = new Date(today);
    if (i % 2 === 0) {
      // Hoje
    } else {
      // Amanhã
      dueDate.setDate(today.getDate() + 1);
    }
    
    // Distribuir entre os usuários
    const userIds = [
      users.farmAdmin.id,
      users.employee.id,
      users.veterinarian.id,
      users.agronomist.id,
      users.manager.id,
      users.consultant.id
    ];
    
    const assignedTo = userIds[i % userIds.length];
    
    await db.insert(tasks).values({
      title: urgentTaskTitles[i],
      description: `Tarefa urgente: ${urgentTaskTitles[i]}`,
      dueDate,
      status,
      priority,
      assignedTo,
      category: "general",
      relatedId: null,
      farmId
    });
  }
  
  console.log("Tarefas criadas com sucesso.");
}

// Função principal
async function seedTasks() {
  try {
    console.log("Iniciando adição de tarefas ao banco de dados...");
    await createTasks();
    console.log("Tarefas adicionadas com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar tarefas:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedTasks();