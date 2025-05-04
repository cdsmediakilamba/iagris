import { db } from "./db";
import { 
  users, farms, userFarms, userPermissions, animals, crops, inventory, tasks,
  UserRole, SystemModule, AccessLevel
} from "@shared/schema";
import { hashPassword } from "./auth";

// Função para limpar o banco de dados
async function cleanDatabase() {
  console.log("Limpando o banco de dados...");
  await db.delete(tasks);
  await db.delete(inventory);
  await db.delete(crops);
  await db.delete(animals);
  await db.delete(userPermissions);
  await db.delete(userFarms);
  await db.delete(farms);
  await db.delete(users);
  console.log("Banco de dados limpo com sucesso.");
}

// Função para criar usuários
async function createUsers() {
  console.log("Criando usuários...");
  
  const adminPassword = await hashPassword("admin123");
  const farmerPassword = await hashPassword("farmer123");
  const employeePassword = await hashPassword("employee123");
  const vetPassword = await hashPassword("vet123");
  const agronomistPassword = await hashPassword("agro123");
  
  // Criar usuários
  const [superAdmin] = await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    name: "Administrador Geral",
    email: "admin@iagris.com",
    role: UserRole.SUPER_ADMIN,
    language: "pt",
    farmId: null
  }).returning();
  
  const [farmAdmin] = await db.insert(users).values({
    username: "jsilva",
    password: farmerPassword,
    name: "João Silva",
    email: "joao@example.com",
    role: UserRole.FARM_ADMIN,
    language: "pt",
    farmId: null
  }).returning();
  
  const [employee] = await db.insert(users).values({
    username: "mluisa",
    password: employeePassword,
    name: "Maria Luisa",
    email: "mluisa@example.com",
    role: UserRole.EMPLOYEE,
    language: "pt",
    farmId: null
  }).returning();
  
  const [veterinarian] = await db.insert(users).values({
    username: "carlosvet",
    password: vetPassword,
    name: "Carlos Pereira",
    email: "carlos@example.com",
    role: UserRole.VETERINARIAN,
    language: "pt",
    farmId: null
  }).returning();
  
  const [agronomist] = await db.insert(users).values({
    username: "anagro",
    password: agronomistPassword,
    name: "Ana Santos",
    email: "ana@example.com",
    role: UserRole.AGRONOMIST,
    language: "pt",
    farmId: null
  }).returning();
  
  console.log("Usuários criados com sucesso.");
  return { superAdmin, farmAdmin, employee, veterinarian, agronomist };
}

// Função para criar fazendas
async function createFarms(superAdminId: number, farmAdminId: number) {
  console.log("Criando fazendas...");
  
  // Criar fazenda modelo
  const [farmModel] = await db.insert(farms).values({
    name: "Fazenda Modelo",
    location: "Luanda, Angola",
    size: 1000,
    createdBy: superAdminId,
    adminId: farmAdminId,
    description: "Uma fazenda modelo para demonstração do sistema",
    coordinates: "-8.8368,13.2343",
    type: "mixed"
  }).returning();
  
  // Criar fazenda de gado
  const [farmLivestock] = await db.insert(farms).values({
    name: "Fazenda Pecuária do Sul",
    location: "Huambo, Angola",
    size: 2500,
    createdBy: superAdminId,
    adminId: farmAdminId,
    description: "Fazenda de criação de gado no sul de Angola",
    coordinates: "-12.7761,15.7385",
    type: "livestock"
  }).returning();
  
  // Criar fazenda de plantação
  const [farmCrop] = await db.insert(farms).values({
    name: "Fazenda Agrícola do Norte",
    location: "Uíge, Angola",
    size: 1500,
    createdBy: superAdminId,
    adminId: farmAdminId,
    description: "Fazenda de plantações no norte de Angola",
    coordinates: "-7.6087,15.0613",
    type: "crop"
  }).returning();
  
  console.log("Fazendas criadas com sucesso.");
  return { farmModel, farmLivestock, farmCrop };
}

// Função para relacionar usuários e fazendas
async function createUserFarms(users: any, farms: any) {
  console.log("Criando relações entre usuários e fazendas...");
  
  // Adicionar usuários à Fazenda Modelo
  await db.insert(userFarms).values({
    userId: users.farmAdmin.id,
    farmId: farms.farmModel.id,
    role: "admin"
  });
  
  await db.insert(userFarms).values({
    userId: users.employee.id,
    farmId: farms.farmModel.id,
    role: "worker"
  });
  
  await db.insert(userFarms).values({
    userId: users.veterinarian.id,
    farmId: farms.farmModel.id,
    role: "specialist"
  });
  
  await db.insert(userFarms).values({
    userId: users.agronomist.id,
    farmId: farms.farmModel.id,
    role: "specialist"
  });
  
  // Adicionar usuários à Fazenda Pecuária
  await db.insert(userFarms).values({
    userId: users.farmAdmin.id,
    farmId: farms.farmLivestock.id,
    role: "admin"
  });
  
  await db.insert(userFarms).values({
    userId: users.veterinarian.id,
    farmId: farms.farmLivestock.id,
    role: "specialist"
  });
  
  // Adicionar usuários à Fazenda Agrícola
  await db.insert(userFarms).values({
    userId: users.farmAdmin.id,
    farmId: farms.farmCrop.id,
    role: "admin"
  });
  
  await db.insert(userFarms).values({
    userId: users.agronomist.id,
    farmId: farms.farmCrop.id,
    role: "specialist"
  });
  
  console.log("Relações entre usuários e fazendas criadas com sucesso.");
}

// Função para definir permissões de usuários
async function createUserPermissions(users: any, farms: any) {
  console.log("Configurando permissões dos usuários...");
  
  // Permissões do administrador da fazenda (tem acesso total a tudo)
  const modules = Object.values(SystemModule);
  
  for (const module of modules) {
    await db.insert(userPermissions).values({
      userId: users.farmAdmin.id,
      farmId: farms.farmModel.id,
      module,
      accessLevel: AccessLevel.FULL
    });
  }
  
  // Permissões do funcionário
  await db.insert(userPermissions).values({
    userId: users.employee.id,
    farmId: farms.farmModel.id,
    module: SystemModule.ANIMALS,
    accessLevel: AccessLevel.READ_ONLY
  });
  
  await db.insert(userPermissions).values({
    userId: users.employee.id,
    farmId: farms.farmModel.id,
    module: SystemModule.CROPS,
    accessLevel: AccessLevel.READ_ONLY
  });
  
  await db.insert(userPermissions).values({
    userId: users.employee.id,
    farmId: farms.farmModel.id,
    module: SystemModule.TASKS,
    accessLevel: AccessLevel.FULL
  });
  
  await db.insert(userPermissions).values({
    userId: users.employee.id,
    farmId: farms.farmModel.id,
    module: SystemModule.INVENTORY,
    accessLevel: AccessLevel.READ_ONLY
  });
  
  // Permissões do veterinário
  await db.insert(userPermissions).values({
    userId: users.veterinarian.id,
    farmId: farms.farmModel.id,
    module: SystemModule.ANIMALS,
    accessLevel: AccessLevel.FULL
  });
  
  await db.insert(userPermissions).values({
    userId: users.veterinarian.id,
    farmId: farms.farmModel.id,
    module: SystemModule.TASKS,
    accessLevel: AccessLevel.READ_ONLY
  });
  
  await db.insert(userPermissions).values({
    userId: users.veterinarian.id,
    farmId: farms.farmLivestock.id,
    module: SystemModule.ANIMALS,
    accessLevel: AccessLevel.FULL
  });
  
  // Permissões do agrônomo
  await db.insert(userPermissions).values({
    userId: users.agronomist.id,
    farmId: farms.farmModel.id,
    module: SystemModule.CROPS,
    accessLevel: AccessLevel.FULL
  });
  
  await db.insert(userPermissions).values({
    userId: users.agronomist.id,
    farmId: farms.farmModel.id,
    module: SystemModule.TASKS,
    accessLevel: AccessLevel.READ_ONLY
  });
  
  await db.insert(userPermissions).values({
    userId: users.agronomist.id,
    farmId: farms.farmCrop.id,
    module: SystemModule.CROPS,
    accessLevel: AccessLevel.FULL
  });
  
  console.log("Permissões dos usuários configuradas com sucesso.");
}

// Função para criar animais
async function createAnimals(farms: any) {
  console.log("Criando animais...");
  
  // Animais para a Fazenda Modelo
  const animalSpecies = ["Vaca", "Boi", "Galinha", "Ovelha", "Cabra"];
  const genders = ["macho", "fêmea"];
  const statuses = ["healthy", "sick", "quarantine", "treatment"];
  
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
  
  console.log("Animais criados com sucesso.");
}

// Função para criar plantações
async function createCrops(farms: any) {
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
  
  console.log("Plantações criadas com sucesso.");
}

// Função para criar itens de inventário
async function createInventoryItems(farms: any) {
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
  
  console.log("Itens de inventário criados com sucesso.");
}

// Função para criar tarefas
async function createTasks(users: any, farms: any) {
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
    
    // Definir datas aleatórias (algumas no passado, algumas no futuro)
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) - 10); // De 10 dias atrás até 20 dias no futuro
    
    // Escolher um usuário aleatório para atribuir a tarefa
    const userKeys = Object.keys(users).filter(key => key !== "superAdmin");
    const assignedUser = users[userKeys[Math.floor(Math.random() * userKeys.length)]];
    
    await db.insert(tasks).values({
      title: taskTitles[i],
      description: `Descrição detalhada da tarefa: ${taskTitles[i]}`,
      dueDate,
      status,
      priority,
      assignedTo: assignedUser.id,
      category,
      relatedId: null, // Poderia ser um ID de animal ou plantação relacionado
      farmId: farms.farmModel.id
    });
  }
  
  // Criar algumas tarefas pendentes específicas
  await db.insert(tasks).values({
    title: "Verificar condição dos animais doentes",
    description: "Realizar uma avaliação detalhada dos animais marcados como doentes e atualizar seus status.",
    dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 dias no futuro
    status: "pending",
    priority: "high",
    assignedTo: users.veterinarian.id,
    category: "animal",
    relatedId: null,
    farmId: farms.farmModel.id
  });
  
  await db.insert(tasks).values({
    title: "Comprar mais sementes de milho",
    description: "Estoque de sementes de milho está abaixo do mínimo. Realizar compra de mais unidades.",
    dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 dias no futuro
    status: "pending",
    priority: "medium",
    assignedTo: users.farmAdmin.id,
    category: "inventory",
    relatedId: null,
    farmId: farms.farmModel.id
  });
  
  await db.insert(tasks).values({
    title: "Preparar setor para novo plantio",
    description: "Preparar o solo do Setor B para o plantio de uma nova cultura.",
    dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 dias no futuro
    status: "pending",
    priority: "medium",
    assignedTo: users.agronomist.id,
    category: "crop",
    relatedId: null,
    farmId: farms.farmModel.id
  });
  
  console.log("Tarefas criadas com sucesso.");
}

// Função principal de seed
async function seedDatabase() {
  try {
    console.log("Iniciando a população do banco de dados...");
    
    // Limpar o banco de dados primeiro
    await cleanDatabase();
    
    // Criar os dados em sequência
    const users = await createUsers();
    const farms = await createFarms(users.superAdmin.id, users.farmAdmin.id);
    await createUserFarms(users, farms);
    await createUserPermissions(users, farms);
    await createAnimals(farms);
    await createCrops(farms);
    await createInventoryItems(farms);
    await createTasks(users, farms);
    
    console.log("Banco de dados populado com sucesso!");
  } catch (error) {
    console.error("Erro ao popular o banco de dados:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedDatabase();