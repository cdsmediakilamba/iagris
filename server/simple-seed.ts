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

// Função para criar dados essenciais
async function createBasicData() {
  console.log("Criando dados básicos...");
  
  // Criar admin
  const adminPassword = await hashPassword("admin123");
  const [superAdmin] = await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    name: "Administrador Geral",
    email: "admin@iagris.com",
    role: UserRole.SUPER_ADMIN,
    language: "pt",
    farmId: null
  }).returning();
  
  // Criar farm admin
  const farmerPassword = await hashPassword("farmer123");
  const [farmAdmin] = await db.insert(users).values({
    username: "jsilva",
    password: farmerPassword,
    name: "João Silva",
    email: "joao@example.com",
    role: UserRole.FARM_ADMIN,
    language: "pt",
    farmId: null
  }).returning();
  
  // Criar fazenda
  const [farmModel] = await db.insert(farms).values({
    name: "Fazenda Modelo",
    location: "Luanda, Angola",
    size: 1000,
    createdBy: superAdmin.id,
    adminId: farmAdmin.id,
    description: "Uma fazenda modelo para demonstração do sistema",
    coordinates: "-8.8368,13.2343",
    type: "mixed"
  }).returning();
  
  // Relacionar usuário e fazenda
  await db.insert(userFarms).values({
    userId: farmAdmin.id,
    farmId: farmModel.id,
    role: "admin"
  });
  
  // Criar alguns animais
  await db.insert(animals).values({
    identificationCode: "A1001",
    species: "Vaca",
    breed: "Leiteira",
    gender: "fêmea",
    birthDate: new Date(2023, 1, 15),
    weight: 450,
    farmId: farmModel.id,
    status: "healthy",
    lastVaccineDate: new Date(2024, 2, 10)
  });
  
  await db.insert(animals).values({
    identificationCode: "A1002",
    species: "Boi",
    breed: "Angus",
    gender: "macho",
    birthDate: new Date(2022, 5, 20),
    weight: 520,
    farmId: farmModel.id,
    status: "healthy",
    lastVaccineDate: new Date(2024, 3, 5)
  });
  
  // Criar plantação
  await db.insert(crops).values({
    name: "Milho",
    sector: "Setor A",
    area: 25,
    plantingDate: new Date(2024, 1, 10),
    expectedHarvestDate: new Date(2024, 5, 10),
    status: "growing",
    farmId: farmModel.id
  });
  
  // Criar itens de inventário
  await db.insert(inventory).values({
    name: "Ração animal",
    category: "feed",
    quantity: 500,
    unit: "kg",
    minimumLevel: 100,
    farmId: farmModel.id
  });
  
  await db.insert(inventory).values({
    name: "Vacina geral",
    category: "medicine",
    quantity: 5,
    unit: "boxes",
    minimumLevel: 10,
    farmId: farmModel.id
  });
  
  // Criar tarefas
  const today = new Date();
  const twoDaysLater = new Date(today);
  twoDaysLater.setDate(today.getDate() + 2);
  
  await db.insert(tasks).values({
    title: "Vacinação dos animais",
    description: "Aplicar vacina em todos os animais da Fazenda Modelo",
    dueDate: twoDaysLater,
    status: "pending",
    priority: "high",
    assignedTo: farmAdmin.id,
    category: "animal",
    relatedId: null,
    farmId: farmModel.id
  });
  
  console.log("Dados básicos criados com sucesso!");
  return { superAdmin, farmAdmin, farmModel };
}

// Função principal de seed
async function seedDatabase() {
  try {
    console.log("Iniciando a população do banco de dados...");
    
    // Limpar o banco de dados primeiro
    await cleanDatabase();
    
    // Criar dados básicos
    await createBasicData();
    
    console.log("Banco de dados populado com sucesso!");
  } catch (error) {
    console.error("Erro ao popular o banco de dados:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedDatabase();