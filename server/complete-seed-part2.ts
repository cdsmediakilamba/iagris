import { db } from "./db";
import { 
  animals, crops, inventory, tasks,
  SystemModule, AccessLevel
} from "@shared/schema";

/**
 * Script para adicionar dados restantes às tabelas que estão vazias
 * Assume que usuários e fazendas já foram criados
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

// Função para criar animais
async function createAnimals() {
  console.log("Criando animais...");
  
  // Animais para a Fazenda Modelo
  const animalSpecies = ["Vaca", "Boi", "Galinha", "Ovelha", "Cabra"];
  const genders = ["macho", "fêmea"];
  const statuses = ["healthy", "sick", "quarantine", "treatment", "pregnant"];
  
  for (let i = 0; i < 25; i++) {
    const species = animalSpecies[Math.floor(Math.random() * animalSpecies.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Math.floor(Math.random() * 5) - 1);
    
    await db.insert(animals).values({
      identificationCode: `A${1000 + i}`,
      species,
      breed: `Raça de ${species}`,
      gender,
      birthDate,
      weight: Math.floor(Math.random() * 500) + 50,
      farmId: farms.farmModel.id,
      status,
      lastVaccineDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000) // 0-90 dias atrás
    });
  }
  
  // Animais para a Fazenda Pecuária
  for (let i = 0; i < 50; i++) {
    const species = ["Vaca", "Boi"][Math.floor(Math.random() * 2)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Math.floor(Math.random() * 5) - 1);
    
    await db.insert(animals).values({
      identificationCode: `B${2000 + i}`,
      species,
      breed: species === "Vaca" ? "Leiteira Holstein" : "Angus",
      gender,
      birthDate,
      weight: Math.floor(Math.random() * 500) + 200,
      farmId: farms.farmLivestock.id,
      status,
      lastVaccineDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000) // 0-90 dias atrás
    });
  }
  
  // Animais para a Granja Aviária
  const poultryBreeds = ["Leghorn", "Rhode Island Red", "Plymouth Rock", "Ameraucana", "Orpington"];
  
  for (let i = 0; i < 100; i++) {
    const breed = poultryBreeds[Math.floor(Math.random() * poultryBreeds.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const status = statuses[Math.floor(Math.random() * 3)]; // Primeiros 3 status apenas
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - Math.floor(Math.random() * 12)); // 0-12 meses atrás
    
    await db.insert(animals).values({
      identificationCode: `P${3000 + i}`,
      species: "Galinha",
      breed,
      gender,
      birthDate,
      weight: Math.floor(Math.random() * 3) + 1, // 1-4 kg
      farmId: farms.farmPoultry.id,
      status,
      lastVaccineDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // 0-30 dias atrás
    });
  }
  
  console.log("Animais criados com sucesso.");
}

// Função para criar plantações
async function createCrops() {
  console.log("Criando plantações...");
  
  // Plantações para a Fazenda Modelo
  const cropNames = ["Milho", "Feijão", "Mandioca", "Batata", "Cana-de-açúcar"];
  const statuses = ["planting", "growing", "ready", "harvested"];
  
  for (let i = 0; i < 10; i++) {
    const name = cropNames[Math.floor(Math.random() * cropNames.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const plantingDate = new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000); // 0-120 dias atrás
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 90 + Math.floor(Math.random() * 30)); // 90-120 dias após o plantio
    
    await db.insert(crops).values({
      name,
      sector: `Setor ${String.fromCharCode(65 + i % 5)}`, // Setor A, B, C, D, E
      area: Math.floor(Math.random() * 50) + 10,
      plantingDate,
      expectedHarvestDate,
      status,
      farmId: farms.farmModel.id
    });
  }
  
  // Plantações para a Fazenda Agrícola
  const cropNamesAgricultural = ["Café", "Amendoim", "Algodão", "Arroz", "Soja"];
  
  for (let i = 0; i < 15; i++) {
    const name = cropNamesAgricultural[Math.floor(Math.random() * cropNamesAgricultural.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const plantingDate = new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000); // 0-120 dias atrás
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 90 + Math.floor(Math.random() * 30)); // 90-120 dias após o plantio
    
    await db.insert(crops).values({
      name,
      sector: `Setor ${String.fromCharCode(65 + i % 8)}`, // Setor A-H
      area: Math.floor(Math.random() * 100) + 50,
      plantingDate,
      expectedHarvestDate,
      status,
      farmId: farms.farmCrop.id
    });
  }
  
  // Plantações para o Pomar Tropical
  const fruitNames = ["Manga", "Abacaxi", "Banana", "Goiaba", "Papaia", "Maracujá", "Coco"];
  
  for (let i = 0; i < 7; i++) {
    const name = fruitNames[i];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const plantingDate = new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000); // 0-365 dias atrás
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 180 + Math.floor(Math.random() * 90)); // 180-270 dias após o plantio
    
    await db.insert(crops).values({
      name,
      sector: `Setor ${String.fromCharCode(65 + i)}`, // Setor A-G
      area: Math.floor(Math.random() * 30) + 20,
      plantingDate,
      expectedHarvestDate,
      status,
      farmId: farms.farmFruit.id
    });
  }
  
  console.log("Plantações criadas com sucesso.");
}

// Função para criar itens de inventário
async function createInventoryItems() {
  console.log("Criando itens de inventário...");
  
  // Categorias e unidades
  const categories = ["feed", "medicine", "seeds", "fertilizer", "equipment", "tools"];
  const units = ["kg", "l", "bags", "units", "boxes"];
  
  // Itens para a Fazenda Modelo
  const itemNames = [
    "Ração animal", "Vacina geral", "Sementes de milho", "Fertilizante NPK", 
    "Ferramentas manuais", "Antibiótico", "Sementes de feijão", "Pesticida",
    "Equipamento de irrigação", "Suplemento alimentar"
  ];
  
  for (let i = 0; i < itemNames.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 1000) + 10;
    const minimumLevel = Math.floor(quantity * 0.2); // 20% do estoque atual
    
    await db.insert(inventory).values({
      name: itemNames[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmModel.id
    });
  }
  
  // Adicionar alguns itens abaixo do nível mínimo
  await db.insert(inventory).values({
    name: "Remédio para parasitas",
    category: "medicine",
    quantity: 5,
    unit: "boxes",
    minimumLevel: 10,
    farmId: farms.farmModel.id
  });
  
  await db.insert(inventory).values({
    name: "Semente de alta produtividade",
    category: "seeds",
    quantity: 8,
    unit: "bags",
    minimumLevel: 15,
    farmId: farms.farmModel.id
  });
  
  // Itens para a Fazenda Pecuária
  const livestockItems = [
    "Ração bovina", "Vacina contra febre aftosa", "Suplemento mineral",
    "Medicamento antibiótico", "Equipamento de ordenha", "Sal mineral",
    "Vermífugo"
  ];
  
  for (let i = 0; i < livestockItems.length; i++) {
    const category = categories[Math.floor(Math.random() * 3)]; // Apenas feed, medicine, equipment
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 1000) + 50;
    const minimumLevel = Math.floor(quantity * 0.15); // 15% do estoque atual
    
    await db.insert(inventory).values({
      name: livestockItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmLivestock.id
    });
  }
  
  // Itens para a Fazenda Agrícola
  const cropItems = [
    "Semente de café", "Fertilizante orgânico", "Fertilizante químico",
    "Inseticida natural", "Herbicida", "Equipamento de irrigação",
    "Ferramentas de colheita", "Semente de algodão"
  ];
  
  for (let i = 0; i < cropItems.length; i++) {
    const category = categories.slice(2, 6)[Math.floor(Math.random() * 4)]; // Apenas seeds, fertilizer, equipment, tools
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 1000) + 50;
    const minimumLevel = Math.floor(quantity * 0.1); // 10% do estoque atual
    
    await db.insert(inventory).values({
      name: cropItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmCrop.id
    });
  }
  
  // Itens para o Pomar Tropical
  const fruitItems = [
    "Adubo para frutíferas", "Inseticida orgânico", "Kit de poda",
    "Sistema de irrigação por gotejamento", "Ferramentas de colheita",
    "Caixas para frutas", "Fertilizante foliar"
  ];
  
  for (let i = 0; i < fruitItems.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 500) + 30;
    const minimumLevel = Math.floor(quantity * 0.2); // 20% do estoque atual
    
    await db.insert(inventory).values({
      name: fruitItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmFruit.id
    });
  }
  
  // Itens para a Granja Aviária
  const poultryItems = [
    "Ração para aves", "Vacina para Newcastle", "Medicamento antibiótico",
    "Vitamina para aves", "Bebedouros", "Comedouros",
    "Equipamento de iluminação", "Desinfetante"
  ];
  
  for (let i = 0; i < poultryItems.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 500) + 50;
    const minimumLevel = Math.floor(quantity * 0.25); // 25% do estoque atual
    
    await db.insert(inventory).values({
      name: poultryItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmPoultry.id
    });
  }
  
  console.log("Itens de inventário criados com sucesso.");
}

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

// Função principal para popular o banco de dados
async function seedDatabase() {
  try {
    console.log("Iniciando a população do banco de dados (Parte 2)...");
    
    // Criar os dados em sequência
    await createAnimals();
    await createCrops();
    await createInventoryItems();
    await createTasks();
    
    console.log("Parte 2 do seed concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao popular o banco de dados (Parte 2):", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedDatabase();