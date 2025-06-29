import { users, type User, type InsertUser } from "@shared/schema";
import { farms, type Farm, type InsertFarm } from "@shared/schema";
import { animals, type Animal, type InsertAnimal } from "@shared/schema";
import { species, type Species, type InsertSpecies } from "@shared/schema";
import { crops, type Crop, type InsertCrop } from "@shared/schema";
import { cropCosts, type CropCost, type InsertCropCost } from "@shared/schema";
import { inventory, type Inventory, type InsertInventory } from "@shared/schema";
import { inventoryTransactions, type InventoryTransaction, type InsertInventoryTransaction } from "@shared/schema";
import { tasks, type Task, type InsertTask } from "@shared/schema";
import { goals, type Goal, type InsertGoal } from "@shared/schema";
import { userFarms, type UserFarm, type InsertUserFarm } from "@shared/schema";
import { userPermissions, type UserPermission, type InsertUserPermission } from "@shared/schema";
import { animalVaccinations, type AnimalVaccination, type InsertAnimalVaccination } from "@shared/schema";
import { costs, type Cost, type InsertCost } from "@shared/schema";
import { removedAnimals, type RemovedAnimal, type InsertRemovedAnimal } from "@shared/schema";
import { UserRole, SystemModule, AccessLevel, GoalStatus, InventoryTransactionType, CostCategory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser?(id: number): Promise<boolean>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  
  // Animal Vaccination operations
  getAnimalVaccination(id: number): Promise<AnimalVaccination | undefined>;
  getAnimalVaccinationsByAnimal(animalId: number): Promise<AnimalVaccination[]>;
  getAnimalVaccinationsByFarm(farmId: number): Promise<AnimalVaccination[]>;
  createAnimalVaccination(vaccination: InsertAnimalVaccination): Promise<AnimalVaccination>;
  updateAnimalVaccination(id: number, vaccination: Partial<AnimalVaccination>): Promise<AnimalVaccination | undefined>;
  
  // Farm operations
  getFarm(id: number): Promise<Farm | undefined>;
  getAllFarms(): Promise<Farm[]>;
  getFarmsByCreator(creatorId: number): Promise<Farm[]>;
  getFarmsByAdmin(adminId: number): Promise<Farm[]>;
  getFarmsAccessibleByUser(userId: number): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, farm: Partial<Farm>): Promise<Farm | undefined>;
  
  // User-Farm operations
  assignUserToFarm(userFarm: InsertUserFarm): Promise<UserFarm>;
  removeUserFromFarm(userId: number, farmId: number): Promise<boolean>;
  getUserFarms(userId: number): Promise<UserFarm[]>;
  getFarmUsers(farmId: number): Promise<UserFarm[]>;
  
  // User-Permission operations
  getUserPermissions(userId: number, farmId: number): Promise<UserPermission[]>;
  setUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(id: number, permission: Partial<UserPermission>): Promise<UserPermission | undefined>;
  checkUserAccess(userId: number, farmId: number, module: SystemModule, requiredLevel: AccessLevel): Promise<boolean>;
  
  // Species operations
  getSpecies(id: number): Promise<Species | undefined>;
  getAllSpecies(): Promise<Species[]>;
  createSpecies(speciesData: InsertSpecies): Promise<Species>;
  updateSpecies(id: number, speciesData: Partial<Species>): Promise<Species | undefined>;
  
  // Animal operations
  getAnimal(id: number): Promise<Animal | undefined>;
  getAnimalsByFarm(farmId: number): Promise<Animal[]>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, animal: Partial<Animal>): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  generateAnimalRegistrationCode(speciesId: number, farmId: number): Promise<string>;
  
  // Animal Vaccination operations
  getAnimalVaccination(id: number): Promise<AnimalVaccination | undefined>;
  getAnimalVaccinationsByAnimal(animalId: number): Promise<AnimalVaccination[]>;
  getAnimalVaccinationsByFarm(farmId: number): Promise<AnimalVaccination[]>;
  createAnimalVaccination(vaccination: InsertAnimalVaccination): Promise<AnimalVaccination>;
  updateAnimalVaccination(id: number, vaccination: Partial<AnimalVaccination>): Promise<AnimalVaccination | undefined>;
  
  // Crop operations
  getCrop(id: number): Promise<Crop | undefined>;
  getCropsByFarm(farmId: number): Promise<Crop[]>;
  createCrop(crop: InsertCrop): Promise<Crop>;
  updateCrop(id: number, crop: Partial<Crop>): Promise<Crop | undefined>;
  
  // Crop Cost operations
  getCropCost(id: number): Promise<CropCost | undefined>;
  getCropCostsByCrop(cropId: number): Promise<CropCost[]>;
  getCropCostsByFarm(farmId: number): Promise<CropCost[]>;
  createCropCost(cropCost: InsertCropCost): Promise<CropCost>;
  updateCropCost(id: number, cropCost: Partial<CropCost>): Promise<CropCost | undefined>;
  deleteCropCost(id: number): Promise<boolean>;
  
  // Inventory operations
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  getInventoryByFarm(farmId: number): Promise<Inventory[]>;
  getCriticalInventory(farmId: number): Promise<Inventory[]>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<Inventory>): Promise<Inventory | undefined>;
  
  // Inventory Transaction operations
  getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined>;
  getInventoryTransactionsByItem(inventoryId: number): Promise<InventoryTransaction[]>;
  getInventoryTransactionsByFarm(farmId: number): Promise<InventoryTransaction[]>;
  getInventoryTransactionsByPeriod(farmId: number, startDate: Date, endDate: Date): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  registerInventoryEntry(inventoryId: number, quantity: number, userId: number, notes?: string, documentNumber?: string, unitPrice?: number): Promise<{transaction: InventoryTransaction, inventory: Inventory}>;
  registerInventoryWithdrawal(inventoryId: number, quantity: number, userId: number, notes?: string, destination?: string): Promise<{transaction: InventoryTransaction, inventory: Inventory}>;
  registerInventoryAdjustment(inventoryId: number, newQuantity: number, userId: number, notes?: string): Promise<{transaction: InventoryTransaction, inventory: Inventory}>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByFarm(farmId: number): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getPendingTasks(farmId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Goal operations
  getGoal(id: number): Promise<Goal | undefined>;
  getGoalsByFarm(farmId: number): Promise<Goal[]>;
  getGoalsByAssignee(userId: number): Promise<Goal[]>;
  getGoalsByStatus(farmId: number, status: GoalStatus): Promise<Goal[]>;
  getAllGoals(): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  
  // Cost operations
  getCost(id: number): Promise<Cost | undefined>;
  getCostsByFarm(farmId: number): Promise<Cost[]>;
  getCostsByCategory(farmId: number, category: string): Promise<Cost[]>;
  getCostsByPeriod(farmId: number, startDate: Date, endDate: Date): Promise<Cost[]>;
  createCost(cost: InsertCost): Promise<Cost>;
  updateCost(id: number, cost: Partial<Cost>): Promise<Cost | undefined>;
  deleteCost(id: number): Promise<boolean>;
  
  // Removed Animals operations
  removeAnimal(animalId: number, removalData: {
    removalReason: string;
    removalObservations?: string;
    removedBy: number;
    salePrice?: number;
    buyer?: string;
    transferDestination?: string;
  }): Promise<RemovedAnimal>;
  getRemovedAnimalsByFarm(farmId: number): Promise<RemovedAnimal[]>;
  getAllRemovedAnimals(): Promise<RemovedAnimal[]>;
  getRemovedAnimalsByReason(farmId: number, reason: string): Promise<RemovedAnimal[]>;
  getRemovedAnimal(id: number): Promise<RemovedAnimal | undefined>;
  
  // Calendar Events operations
  getCalendarEvent(id: number): Promise<import("@shared/schema").CalendarEvent | undefined>;
  getCalendarEventsByFarm(farmId: number): Promise<import("@shared/schema").CalendarEvent[]>;
  getCalendarEventsByDateRange(farmId: number, startDate: Date, endDate: Date): Promise<import("@shared/schema").CalendarEvent[]>;
  getCalendarEventsByCrop(farmId: number, cropId: number): Promise<import("@shared/schema").CalendarEvent[]>;
  createCalendarEvent(event: import("@shared/schema").InsertCalendarEvent): Promise<import("@shared/schema").CalendarEvent>;
  updateCalendarEvent(id: number, event: Partial<import("@shared/schema").CalendarEvent>): Promise<import("@shared/schema").CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any to avoid type issues with SessionStore
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private farms: Map<number, Farm>;
  private animals: Map<number, Animal>;
  private speciesItems: Map<number, Species>;
  private crops: Map<number, Crop>;
  private inventoryItems: Map<number, Inventory>;
  private inventoryTransactions: Map<number, InventoryTransaction>;
  private taskItems: Map<number, Task>;
  private goalItems: Map<number, Goal>;
  private userFarms: Map<number, UserFarm>;
  private userPermissions: Map<number, UserPermission>;
  private animalVaccinations: Map<number, AnimalVaccination>;
  private costItems: Map<number, Cost>;
  
  sessionStore: any; // Use any para evitar problemas com tipos
  
  // IDs for auto-increment
  private userId = 1;
  private farmId = 1;
  private animalId = 1;
  private speciesId = 1;
  private cropId = 1;
  private inventoryId = 1;
  private inventoryTransactionId = 1;
  private taskId = 1;
  private goalId = 1;
  private userFarmId = 1;
  private userPermissionId = 1;
  private vaccinationId = 1;
  private costId = 1;
  
  // Maps para acompanhar os contadores diários de registro animal
  private dailyAnimalCounters: Map<string, number> = new Map();

  constructor() {
    this.users = new Map();
    this.farms = new Map();
    this.animals = new Map();
    this.speciesItems = new Map();
    this.crops = new Map();
    this.inventoryItems = new Map();
    this.inventoryTransactions = new Map();
    this.taskItems = new Map();
    this.goalItems = new Map();
    this.userFarms = new Map();
    this.userPermissions = new Map();
    this.animalVaccinations = new Map();
    this.costItems = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
    
    // Chamar inicialização de dados
    this.initializeData();
  }
  
  // Método para criar uma espécie de forma síncrona
  private createSpeciesSync(insertSpecies: InsertSpecies): Species {
    const id = this.speciesId++;
    const species: Species = {
      ...insertSpecies,
      id,
      createdAt: new Date()
    };
    this.speciesItems.set(id, species);
    return species;
  }
  
  // Método para inicializar os dados (não asíncrono para o construtor)
  private initializeData() {
    try {
      // Criar espécies básicas
      this.createSpeciesSync({
        name: "Bovino",
        abbreviation: "BOI"
      });
      
      this.createSpeciesSync({
        name: "Suíno",
        abbreviation: "SUI"
      });
      
      this.createSpeciesSync({
        name: "Ovino",
        abbreviation: "OVI"
      });
      
      this.createSpeciesSync({
        name: "Caprino",
        abbreviation: "CAP"
      });
      
      this.createSpeciesSync({
        name: "Ave",
        abbreviation: "AVE"
      });
      
      // Create initial super admin user
      const adminUser = this.createUserSync({
        username: "admin",
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",  // "password" hashed with SHA-256
        name: "Administrador Geral",
        email: "admin@iagris.com",
        role: UserRole.SUPER_ADMIN,
        farmId: null // Super Admin não está vinculado a nenhuma fazenda específica
      });
      
      // Create a farm admin user
      const farmAdminUser = this.createUserSync({
        username: "farmadmin",
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",  // "password" hashed with SHA-256
        name: "Administrador de Fazenda",
        email: "farmadmin@iagris.com",
        role: UserRole.FARM_ADMIN,
        farmId: null
      });
      
      // Create a regular employee user
      const employeeUser = this.createUserSync({
        username: "employee",
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",  // "password" hashed with SHA-256
        name: "Funcionário Regular",
        email: "employee@iagris.com",
        role: UserRole.EMPLOYEE,
        farmId: null
      });
      
      // Create a sample farm
      const farm1 = this.createFarmSync({
        name: "Fazenda Modelo",
        location: "Luanda, Angola",
        size: 1000,
        createdBy: adminUser.id,
        adminId: farmAdminUser.id,
        description: "Uma fazenda modelo para demonstração do sistema",
        coordinates: "-8.8368,13.2343",
        type: "mixed"
      });
      
      // Log user e farm IDs
      console.log("Users created:", { adminUser, farmAdminUser, employeeUser });
      console.log("Farm created:", farm1);
      console.log("User IDs:", { adminId: adminUser.id, farmAdminId: farmAdminUser.id, employeeId: employeeUser.id, farmId: farm1.id });
      
      // Assign farm admin to the farm with admin role
      const farmAdminAssoc = this.assignUserToFarmSync({
        userId: farmAdminUser.id,
        farmId: farm1.id,
        role: "admin"
      });
      console.log("Created farm admin association:", farmAdminAssoc);
      
      // Assign employee to the farm with member role
      const employeeAssoc = this.assignUserToFarmSync({
        userId: employeeUser.id,
        farmId: farm1.id,
        role: "member"
      });
      console.log("Created employee association:", employeeAssoc);
      
      // Verificar as associações
      const allFarmUsers = Array.from(this.userFarms.values());
      console.log("All farm-user associations:", allFarmUsers);
      
      // Set different permissions for the employee
      this.setUserPermissionSync({
        userId: employeeUser.id,
        farmId: farm1.id,
        module: SystemModule.ANIMALS,
        accessLevel: AccessLevel.READ_ONLY
      });
      
      this.setUserPermissionSync({
        userId: employeeUser.id,
        farmId: farm1.id,
        module: SystemModule.CROPS,
        accessLevel: AccessLevel.FULL
      });
      
      this.setUserPermissionSync({
        userId: employeeUser.id,
        farmId: farm1.id,
        module: SystemModule.INVENTORY,
        accessLevel: AccessLevel.READ_ONLY
      });
      
      this.setUserPermissionSync({
        userId: employeeUser.id,
        farmId: farm1.id,
        module: SystemModule.TASKS,
        accessLevel: AccessLevel.FULL
      });
      
      // Add some sample animals to the farm
      // Usar espécie cadastrada (bovino) id=1
      const registrationCode1 = "BOI-20250507-0001"; // Código para exemplo (será gerado automaticamente em casos reais)
      this.createAnimalSync({
        farmId: farm1.id,
        registrationCode: registrationCode1,
        speciesId: 1, // Bovino
        name: "Touro Ferdinando",
        breed: "Angus",
        gender: "male",
        status: "active",
        birthDate: new Date("2022-05-15"),
        weight: 450,
        lastVaccineDate: new Date("2023-10-10")
      });
      
      const registrationCode2 = "BOI-20250507-0002"; // Código para exemplo (será gerado automaticamente em casos reais)
      this.createAnimalSync({
        farmId: farm1.id,
        registrationCode: registrationCode2,
        speciesId: 1, // Bovino
        name: "Vaca Mimosa",
        breed: "Nelore",
        gender: "female",
        status: "active",
        birthDate: new Date("2021-03-22"),
        weight: 380,
        lastVaccineDate: new Date("2023-10-10")
      });
      
      // Add some sample crops to the farm
      this.createCropSync({
        farmId: farm1.id,
        name: "Milho",
        sector: "Setor A",
        area: 50,
        status: "Em crescimento",
        plantingDate: new Date("2023-03-15"),
        expectedHarvestDate: new Date("2023-07-15")
      });
      
      this.createCropSync({
        farmId: farm1.id,
        name: "Feijão",
        sector: "Setor B",
        area: 30,
        status: "Em crescimento",
        plantingDate: new Date("2023-04-10"),
        expectedHarvestDate: new Date("2023-08-01")
      });
      
      // Add some inventory items
      this.createInventoryItemSync({
        farmId: farm1.id,
        name: "Ração para Bovinos",
        category: "Alimentação",
        quantity: "500",
        unit: "kg",
        minimumLevel: "100"
      });
      
      this.createInventoryItemSync({
        farmId: farm1.id,
        name: "Vacina Antirrábica",
        category: "Medicamentos",
        quantity: "50",
        unit: "doses",
        minimumLevel: "10"
      });
      
      // Add some tasks
      this.createTaskSync({
        farmId: farm1.id,
        title: "Alimentar os animais",
        category: "Rotina",
        dueDate: new Date(Date.now() + 86400000), // amanhã
        status: "pendente",
        description: "Realizar a alimentação diária dos bovinos",
        priority: "alta",
        assignedTo: employeeUser.id
      });
      
      this.createTaskSync({
        farmId: farm1.id,
        title: "Irrigar as plantações",
        category: "Rotina",
        dueDate: new Date(Date.now() + 86400000), // amanhã
        status: "pendente",
        description: "Realizar a irrigação das plantações de milho e feijão",
        priority: "média",
        assignedTo: employeeUser.id
      });
      
      // Add some sample goals
      this.createGoalSync({
        farmId: farm1.id,
        name: "Aumentar produção de milho",
        description: "Aumentar a produção de milho em 20% até o final da temporada",
        assignedTo: employeeUser.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 86400000), // 90 dias
        cropId: 1, // Milho
        targetValue: "20",
        unit: "percentage",
        status: GoalStatus.IN_PROGRESS,
        createdBy: farmAdminUser.id,
        notes: "Objetivo trimestral"
      });
      
      this.createGoalSync({
        farmId: farm1.id,
        name: "Plantação de feijão",
        description: "Plantar 10 hectares de feijão",
        assignedTo: employeeUser.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000), // 30 dias
        cropId: 2, // Feijão
        targetValue: "10",
        unit: "hectares",
        status: GoalStatus.PENDING,
        createdBy: farmAdminUser.id,
        notes: "Prioridade alta"
      });
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }
  
  // Versões síncronas dos métodos para inicialização
  private createUserSync(insertUser: InsertUser): User {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      role: insertUser.role ?? UserRole.EMPLOYEE
    };
    this.users.set(id, user);
    return user;
  }
  
  private createFarmSync(insertFarm: InsertFarm): Farm {
    const id = this.farmId++;
    const farm: Farm = { 
      ...insertFarm, 
      id, 
      createdAt: new Date(),
      size: insertFarm.size || null,
      createdBy: insertFarm.createdBy || null,
      adminId: insertFarm.adminId || null,
      description: insertFarm.description || null,
      coordinates: insertFarm.coordinates || null,
      type: insertFarm.type || null
    };
    this.farms.set(id, farm);
    return farm;
  }
  
  private assignUserToFarmSync(userFarm: InsertUserFarm): UserFarm {
    const id = this.userFarmId++;
    const role = userFarm.role || 'member';
    const newUserFarm: UserFarm = { ...userFarm, role, id, createdAt: new Date() };
    this.userFarms.set(id, newUserFarm);
    return newUserFarm;
  }
  
  private setUserPermissionSync(permission: InsertUserPermission): UserPermission {
    // Verificar se já existe uma permissão para esse usuário, módulo e fazenda
    const existingPermission = Array.from(this.userPermissions.values()).find(
      p => p.userId === permission.userId && 
           p.farmId === permission.farmId && 
           p.module === permission.module
    );
    
    if (existingPermission) {
      // Atualizar permissão existente
      existingPermission.accessLevel = permission.accessLevel;
      this.userPermissions.set(existingPermission.id, existingPermission);
      return existingPermission;
    } else {
      // Criar nova permissão
      const id = this.userPermissionId++;
      const newPermission: UserPermission = { ...permission, id, createdAt: new Date() };
      this.userPermissions.set(id, newPermission);
      return newPermission;
    }
  }
  
  private createAnimalSync(insertAnimal: InsertAnimal): Animal {
    const id = this.animalId++;
    const animal: Animal = { 
      ...insertAnimal, 
      id, 
      createdAt: new Date(),
      name: insertAnimal.name || null,
      status: insertAnimal.status || "active",
      birthDate: insertAnimal.birthDate || null,
      weight: insertAnimal.weight || null,
      lastVaccineDate: insertAnimal.lastVaccineDate || null,
      observations: insertAnimal.observations || null,
      fatherId: insertAnimal.fatherId || null,
      motherId: insertAnimal.motherId || null,
      registrationCode: insertAnimal.registrationCode
    };
    this.animals.set(id, animal);
    return animal;
  }
  
  private createCropSync(insertCrop: InsertCrop): Crop {
    const id = this.cropId++;
    const crop: Crop = { 
      ...insertCrop, 
      id, 
      createdAt: new Date(),
      status: insertCrop.status || "growing",
      plantingDate: insertCrop.plantingDate || null,
      expectedHarvestDate: insertCrop.expectedHarvestDate || null
    };
    this.crops.set(id, crop);
    return crop;
  }
  
  private createInventoryItemSync(insertItem: InsertInventory): Inventory {
    const id = this.inventoryId++;
    const item: Inventory = { 
      ...insertItem, 
      id, 
      createdAt: new Date(),
      minimumLevel: insertItem.minimumLevel || null
    };
    this.inventoryItems.set(id, item);
    return item;
  }
  
  private createTaskSync(insertTask: InsertTask): Task {
    const id = this.taskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      status: insertTask.status || "pending",
      priority: insertTask.priority || "medium",
      description: insertTask.description || null,
      assignedTo: insertTask.assignedTo || null,
      relatedId: insertTask.relatedId || null
    };
    this.taskItems.set(id, task);
    return task;
  }
  
  private createGoalSync(insertGoal: InsertGoal): Goal {
    const id = this.goalId++;
    const goal: Goal = {
      ...insertGoal,
      id,
      createdAt: new Date(),
      status: insertGoal.status || GoalStatus.PENDING,
      description: insertGoal.description || null,
      cropId: insertGoal.cropId || null,
      notes: insertGoal.notes || null,
      actualValue: "0",
      completionDate: null
    };
    this.goalItems.set(id, goal);
    return goal;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      // Garante que os valores obrigatórios estejam definidos
      role: insertUser.role ?? UserRole.EMPLOYEE
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Farm operations
  async getFarm(id: number): Promise<Farm | undefined> {
    return this.farms.get(id);
  }
  
  async getAllFarms(): Promise<Farm[]> {
    return Array.from(this.farms.values());
  }
  
  async getFarmsByCreator(creatorId: number): Promise<Farm[]> {
    return Array.from(this.farms.values()).filter(
      (farm) => farm.createdBy === creatorId
    );
  }
  
  async getFarmsByAdmin(adminId: number): Promise<Farm[]> {
    return Array.from(this.farms.values()).filter(
      (farm) => farm.adminId === adminId
    );
  }
  
  async getFarmsByOwner(userId: number): Promise<Farm[]> {
    // Considera o usuário como dono da fazenda se for o criador ou administrador
    return Array.from(this.farms.values()).filter(
      (farm) => farm.createdBy === userId || farm.adminId === userId
    );
  }
  
  async getFarmsAccessibleByUser(userId: number): Promise<Farm[]> {
    // Obtém o usuário
    const user = this.users.get(userId);
    if (!user) return [];
    
    // Super admin pode ver todas as fazendas
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.getAllFarms();
    }
    
    // Farm admin vê apenas as fazendas que administra
    if (user.role === UserRole.FARM_ADMIN) {
      return this.getFarmsByAdmin(userId);
    }
    
    // Outros usuários veem as fazendas às quais estão associados
    const userFarms = Array.from(this.userFarms.values())
      .filter(uf => uf.userId === userId)
      .map(uf => uf.farmId);
    
    return Array.from(this.farms.values())
      .filter(farm => userFarms.includes(farm.id));
  }
  
  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const id = this.farmId++;
    const farm: Farm = { 
      ...insertFarm, 
      id, 
      createdAt: new Date(),
      size: insertFarm.size || null
    };
    this.farms.set(id, farm);
    return farm;
  }
  
  async deleteFarm(id: number): Promise<boolean> {
    try {
      // Remove the farm
      const farmDeleted = this.farms.delete(id);
      
      if (farmDeleted) {
        // Remove all user-farm associations for this farm
        const userFarmsToDelete = Array.from(this.userFarms.entries())
          .filter(([_, userFarm]) => userFarm.farmId === id)
          .map(([key, _]) => key);
        
        userFarmsToDelete.forEach(key => this.userFarms.delete(key));
        
        // Remove all permissions for this farm
        const permissionsToDelete = Array.from(this.userPermissions.entries())
          .filter(([_, permission]) => permission.farmId === id)
          .map(([key, _]) => key);
        
        permissionsToDelete.forEach(key => this.userPermissions.delete(key));
        
        // Remove all farm-related data (animals, crops, inventory, etc.)
        const animalsToDelete = Array.from(this.animals.entries())
          .filter(([_, animal]) => animal.farmId === id)
          .map(([key, _]) => key);
        animalsToDelete.forEach(key => this.animals.delete(key));
        
        const cropsToDelete = Array.from(this.crops.entries())
          .filter(([_, crop]) => crop.farmId === id)
          .map(([key, _]) => key);
        cropsToDelete.forEach(key => this.crops.delete(key));
        
        const inventoryToDelete = Array.from(this.inventory.entries())
          .filter(([_, item]) => item.farmId === id)
          .map(([key, _]) => key);
        inventoryToDelete.forEach(key => this.inventory.delete(key));
        
        const tasksToDelete = Array.from(this.tasks.entries())
          .filter(([_, task]) => task.farmId === id)
          .map(([key, _]) => key);
        tasksToDelete.forEach(key => this.tasks.delete(key));
        
        const goalsToDelete = Array.from(this.goals.entries())
          .filter(([_, goal]) => goal.farmId === id)
          .map(([key, _]) => key);
        goalsToDelete.forEach(key => this.goals.delete(key));
        
        console.log(`Farm ${id} and all related data deleted successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error deleting farm:", error);
      return false;
    }
  }
  
  async updateFarm(id: number, farmData: Partial<Farm>): Promise<Farm | undefined> {
    const farm = this.farms.get(id);
    if (!farm) return undefined;
    
    const updatedFarm = { ...farm, ...farmData };
    this.farms.set(id, updatedFarm);
    return updatedFarm;
  }

  // Animal operations
  async getAnimal(id: number): Promise<Animal | undefined> {
    return this.animals.get(id);
  }
  
  async getAnimalsByFarm(farmId: number): Promise<Animal[]> {
    return Array.from(this.animals.values()).filter(
      (animal) => animal.farmId === farmId
    );
  }
  
  async createAnimal(insertAnimal: InsertAnimal): Promise<Animal> {
    const id = this.animalId++;
    const animal: Animal = { ...insertAnimal, id, createdAt: new Date() };
    this.animals.set(id, animal);
    return animal;
  }
  
  async updateAnimal(id: number, animalData: Partial<Animal>): Promise<Animal | undefined> {
    const animal = this.animals.get(id);
    if (!animal) return undefined;
    
    const updatedAnimal = { ...animal, ...animalData };
    this.animals.set(id, updatedAnimal);
    return updatedAnimal;
  }

  // Crop operations
  async getCrop(id: number): Promise<Crop | undefined> {
    return this.crops.get(id);
  }
  
  async getCropsByFarm(farmId: number): Promise<Crop[]> {
    return Array.from(this.crops.values()).filter(
      (crop) => crop.farmId === farmId
    );
  }
  
  async createCrop(insertCrop: InsertCrop): Promise<Crop> {
    const id = this.cropId++;
    const crop: Crop = { ...insertCrop, id, createdAt: new Date() };
    this.crops.set(id, crop);
    return crop;
  }
  
  async updateCrop(id: number, cropData: Partial<Crop>): Promise<Crop | undefined> {
    const crop = this.crops.get(id);
    if (!crop) return undefined;
    
    const updatedCrop = { ...crop, ...cropData };
    this.crops.set(id, updatedCrop);
    return updatedCrop;
  }

  // Inventory operations
  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async getInventoryByFarm(farmId: number): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values()).filter(
      (item) => item.farmId === farmId
    );
  }
  
  async getCriticalInventory(farmId: number): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values()).filter(
      (item) => item.farmId === farmId && 
                item.minimumLevel && 
                item.quantity <= item.minimumLevel
    );
  }
  
  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const id = this.inventoryId++;
    const item: Inventory = { ...insertItem, id, createdAt: new Date() };
    this.inventoryItems.set(id, item);
    return item;
  }
  
  async updateInventoryItem(id: number, itemData: Partial<Inventory>): Promise<Inventory | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // Inventory Transaction operations
  async getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined> {
    return this.inventoryTransactions.get(id);
  }
  
  async getInventoryTransactionsByItem(inventoryId: number): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values())
      .filter(transaction => transaction.inventoryId === inventoryId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getInventoryTransactionsByFarm(farmId: number): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values())
      .filter(transaction => transaction.farmId === farmId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getInventoryTransactionsByPeriod(farmId: number, startDate: Date, endDate: Date): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values())
      .filter(transaction => 
        transaction.farmId === farmId && 
        transaction.date >= startDate && 
        transaction.date <= endDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async createInventoryTransaction(transactionData: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const id = this.inventoryTransactionId++;
    const transaction: InventoryTransaction = {
      ...transactionData,
      id,
      createdAt: new Date(),
      date: transactionData.date || new Date()
    };
    this.inventoryTransactions.set(id, transaction);
    return transaction;
  }
  
  async registerInventoryEntry(
    inventoryId: number, 
    quantity: number, 
    userId: number, 
    notes?: string, 
    documentNumber?: string, 
    unitPrice?: number
  ): Promise<{transaction: InventoryTransaction, inventory: Inventory}> {
    // 1. Get the current inventory item
    const item = await this.getInventoryItem(inventoryId);
    if (!item) {
      throw new Error(`Inventory item with ID ${inventoryId} not found`);
    }
    
    // 2. Calculate new balance
    const previousBalance = Number(item.quantity);
    const newBalance = previousBalance + quantity;
    
    // 3. Update inventory item with new balance
    const updatedItem = await this.updateInventoryItem(inventoryId, {
      quantity: String(newBalance),
      lastUpdated: new Date()
    });
    
    if (!updatedItem) {
      throw new Error(`Failed to update inventory item with ID ${inventoryId}`);
    }
    
    // 4. Create transaction record
    const transaction = await this.createInventoryTransaction({
      inventoryId,
      type: InventoryTransactionType.IN,
      quantity: String(quantity),
      previousBalance: String(previousBalance),
      newBalance: String(newBalance),
      date: new Date(),
      documentNumber: documentNumber || null,
      userId,
      farmId: item.farmId,
      notes: notes || null,
      destinationOrSource: null,
      unitPrice: unitPrice ? String(unitPrice) : null,
      totalPrice: unitPrice ? String(quantity * unitPrice) : null,
      category: item.category
    });
    
    return { transaction, inventory: updatedItem };
  }
  
  async registerInventoryWithdrawal(
    inventoryId: number, 
    quantity: number, 
    userId: number, 
    notes?: string, 
    destination?: string
  ): Promise<{transaction: InventoryTransaction, inventory: Inventory}> {
    // 1. Get the current inventory item
    const item = await this.getInventoryItem(inventoryId);
    if (!item) {
      throw new Error(`Inventory item with ID ${inventoryId} not found`);
    }
    
    // 2. Calculate new balance
    const previousBalance = Number(item.quantity);
    
    if (previousBalance < quantity) {
      throw new Error(`Insufficient inventory. Current balance: ${previousBalance}, Requested: ${quantity}`);
    }
    
    const newBalance = previousBalance - quantity;
    
    // 3. Update inventory item with new balance
    const updatedItem = await this.updateInventoryItem(inventoryId, {
      quantity: String(newBalance),
      lastUpdated: new Date()
    });
    
    if (!updatedItem) {
      throw new Error(`Failed to update inventory item with ID ${inventoryId}`);
    }
    
    // 4. Create transaction record
    const transaction = await this.createInventoryTransaction({
      inventoryId,
      type: InventoryTransactionType.OUT,
      quantity: String(quantity),
      previousBalance: String(previousBalance),
      newBalance: String(newBalance),
      date: new Date(),
      documentNumber: null,
      userId,
      farmId: item.farmId,
      notes: notes || null,
      destinationOrSource: destination || null,
      unitPrice: null,
      totalPrice: null,
      category: item.category
    });
    
    return { transaction, inventory: updatedItem };
  }
  
  async registerInventoryAdjustment(
    inventoryId: number, 
    newQuantity: number, 
    userId: number, 
    notes?: string
  ): Promise<{transaction: InventoryTransaction, inventory: Inventory}> {
    // 1. Get the current inventory item
    const item = await this.getInventoryItem(inventoryId);
    if (!item) {
      throw new Error(`Inventory item with ID ${inventoryId} not found`);
    }
    
    // 2. Calculate adjustment
    const previousBalance = Number(item.quantity);
    const adjustmentQuantity = newQuantity - previousBalance;
    
    // 3. Update inventory item with new balance
    const updatedItem = await this.updateInventoryItem(inventoryId, {
      quantity: String(newQuantity),
      lastUpdated: new Date()
    });
    
    if (!updatedItem) {
      throw new Error(`Failed to update inventory item with ID ${inventoryId}`);
    }
    
    // 4. Create transaction record
    const transaction = await this.createInventoryTransaction({
      inventoryId,
      type: InventoryTransactionType.ADJUST,
      quantity: String(Math.abs(adjustmentQuantity)),
      previousBalance: String(previousBalance),
      newBalance: String(newQuantity),
      date: new Date(),
      documentNumber: null,
      userId,
      farmId: item.farmId,
      notes: notes || `Ajuste manual: ${adjustmentQuantity > 0 ? '+' : ''}${adjustmentQuantity} ${item.unit}`,
      destinationOrSource: null,
      unitPrice: null,
      totalPrice: null,
      category: item.category
    });
    
    return { transaction, inventory: updatedItem };
  }

  // User-Farm operations
  async assignUserToFarm(userFarm: InsertUserFarm): Promise<UserFarm> {
    const id = this.userFarmId++;
    // Certifique-se de que o campo role está definido
    const role = userFarm.role || 'member';
    const newUserFarm: UserFarm = { ...userFarm, role, id, createdAt: new Date() };
    this.userFarms.set(id, newUserFarm);
    return newUserFarm;
  }
  
  async removeUserFromFarm(userId: number, farmId: number): Promise<boolean> {
    const userFarm = Array.from(this.userFarms.values()).find(
      uf => uf.userId === userId && uf.farmId === farmId
    );
    
    if (!userFarm) return false;
    
    this.userFarms.delete(userFarm.id);
    
    // Também remover todas as permissões desse usuário nessa fazenda
    const permissionsToRemove = Array.from(this.userPermissions.values())
      .filter(p => p.userId === userId && p.farmId === farmId);
    
    for (const permission of permissionsToRemove) {
      this.userPermissions.delete(permission.id);
    }
    
    return true;
  }
  
  async getUserFarms(userId: number): Promise<UserFarm[]> {
    return Array.from(this.userFarms.values()).filter(
      uf => uf.userId === userId
    );
  }
  
  async getFarmUsers(farmId: number): Promise<UserFarm[]> {
    return Array.from(this.userFarms.values()).filter(
      uf => uf.farmId === farmId
    );
  }
  
  // User-Permission operations
  async getUserPermissions(userId: number, farmId: number): Promise<UserPermission[]> {
    return Array.from(this.userPermissions.values()).filter(
      p => p.userId === userId && p.farmId === farmId
    );
  }
  
  async getUserPermission(id: number): Promise<UserPermission | undefined> {
    return this.userPermissions.get(id);
  }
  
  async setUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    // Verificar se já existe uma permissão para esse usuário, módulo e fazenda
    const existingPermission = Array.from(this.userPermissions.values()).find(
      p => p.userId === permission.userId && 
           p.farmId === permission.farmId && 
           p.module === permission.module
    );
    
    if (existingPermission) {
      // Atualizar permissão existente
      existingPermission.accessLevel = permission.accessLevel;
      this.userPermissions.set(existingPermission.id, existingPermission);
      return existingPermission;
    } else {
      // Criar nova permissão
      const id = this.userPermissionId++;
      const newPermission: UserPermission = { ...permission, id, createdAt: new Date() };
      this.userPermissions.set(id, newPermission);
      return newPermission;
    }
  }
  
  async updateUserPermission(id: number, permission: Partial<UserPermission>): Promise<UserPermission | undefined> {
    const existingPermission = this.userPermissions.get(id);
    if (!existingPermission) return undefined;
    
    const updatedPermission = { ...existingPermission, ...permission };
    this.userPermissions.set(id, updatedPermission);
    return updatedPermission;
  }
  
  async checkUserAccess(userId: number, farmId: number, module: SystemModule, requiredLevel: AccessLevel): Promise<boolean> {
    // Super admin tem acesso completo a tudo
    const user = await this.getUser(userId);
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    
    // Verificar se o usuário é admin da fazenda
    const farm = await this.getFarm(farmId);
    if (farm?.adminId === userId) return true;
    
    // Verificar permissões específicas
    const permissions = await this.getUserPermissions(userId, farmId);
    const modulePermission = permissions.find(p => p.module === module);
    
    if (!modulePermission) return false;
    
    // Verificar o nível de acesso
    switch (requiredLevel) {
      case AccessLevel.FULL:
        return modulePermission.accessLevel === AccessLevel.FULL;
      case AccessLevel.READ_ONLY:
        return modulePermission.accessLevel === AccessLevel.FULL || 
               modulePermission.accessLevel === AccessLevel.READ_ONLY;
      case AccessLevel.NONE:
        return true; // Qualquer nível de acesso é suficiente para NONE
      default:
        return false;
    }
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.taskItems.get(id);
  }
  
  async getTasksByFarm(farmId: number): Promise<Task[]> {
    return Array.from(this.taskItems.values()).filter(
      (task) => task.farmId === farmId
    );
  }
  
  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.taskItems.values()).filter(
      (task) => task.assignedTo === userId
    );
  }
  
  async getPendingTasks(farmId: number): Promise<Task[]> {
    return Array.from(this.taskItems.values()).filter(
      (task) => task.farmId === farmId && task.status === "pending"
    ).sort((a, b) => {
      // Sort by due date (ascending)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const task: Task = { ...insertTask, id, createdAt: new Date() };
    this.taskItems.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.taskItems.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.taskItems.set(id, updatedTask);
    return updatedTask;
  }
  
  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goalItems.get(id);
  }
  
  async getGoalsByFarm(farmId: number): Promise<Goal[]> {
    return Array.from(this.goalItems.values()).filter(
      (goal) => goal.farmId === farmId
    );
  }
  
  async getGoalsByAssignee(userId: number): Promise<Goal[]> {
    return Array.from(this.goalItems.values()).filter(
      (goal) => goal.assignedTo === userId
    );
  }
  
  async getGoalsByStatus(farmId: number, status: GoalStatus): Promise<Goal[]> {
    return Array.from(this.goalItems.values()).filter(
      (goal) => goal.farmId === farmId && goal.status === status
    );
  }
  
  async getAllGoals(): Promise<Goal[]> {
    return Array.from(this.goalItems.values());
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const goal: Goal = {
      ...insertGoal,
      id,
      createdAt: new Date(),
      status: insertGoal.status || GoalStatus.PENDING,
      description: insertGoal.description || null,
      cropId: insertGoal.cropId || null,
      notes: insertGoal.notes || null,
      actualValue: "0",
      completionDate: null
    };
    this.goalItems.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goalItems.get(id);
    if (!goal) return undefined;
    
    // Se o status estiver sendo alterado para COMPLETED, definir a data de conclusão
    if (goalData.status === GoalStatus.COMPLETED && goal.status !== GoalStatus.COMPLETED) {
      goalData.completionDate = new Date();
    }
    
    const updatedGoal = { ...goal, ...goalData };
    this.goalItems.set(id, updatedGoal);
    return updatedGoal;
  }
  
  // Implementation of Species operations
  async getSpecies(id: number): Promise<Species | undefined> {
    return this.speciesItems.get(id);
  }
  
  async getAllSpecies(): Promise<Species[]> {
    return Array.from(this.speciesItems.values());
  }
  
  async createSpecies(speciesData: InsertSpecies): Promise<Species> {
    const id = this.speciesId++;
    const species: Species = {
      ...speciesData,
      id,
      createdAt: new Date()
    };
    this.speciesItems.set(id, species);
    return species;
  }
  
  async updateSpecies(id: number, speciesData: Partial<Species>): Promise<Species | undefined> {
    const species = this.speciesItems.get(id);
    if (!species) return undefined;
    
    const updatedSpecies = { ...species, ...speciesData };
    this.speciesItems.set(id, updatedSpecies);
    return updatedSpecies;
  }
  
  // Method to generate animal registration code
  async generateAnimalRegistrationCode(speciesId: number, farmId: number): Promise<string> {
    // Get the species abbreviation
    const species = await this.getSpecies(speciesId);
    if (!species) {
      throw new Error("Species not found");
    }
    
    const abbreviation = species.abbreviation;
    
    // Get current date in format YYYYMMDD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Get today's key for the counter
    const counterKey = `${abbreviation}-${dateString}-${farmId}`;
    
    // Get current count for today and increment
    const currentCount = this.dailyAnimalCounters.get(counterKey) || 0;
    const newCount = currentCount + 1;
    this.dailyAnimalCounters.set(counterKey, newCount);
    
    // Format the sequential number with leading zeros (4 digits)
    const sequentialNumber = String(newCount).padStart(4, '0');
    
    // Generate code in format [ABBREVIATION]-[YYYYMMDD]-[SEQUENTIAL]
    return `${abbreviation}-${dateString}-${sequentialNumber}`;
  }

  // Animal Vaccination methods
  async getAnimalVaccination(id: number): Promise<AnimalVaccination | undefined> {
    return this.animalVaccinations.get(id);
  }

  async getAnimalVaccinationsByAnimal(animalId: number): Promise<AnimalVaccination[]> {
    return Array.from(this.animalVaccinations.values())
      .filter(vaccination => vaccination.animalId === animalId);
  }

  async getAnimalVaccinationsByFarm(farmId: number): Promise<AnimalVaccination[]> {
    return Array.from(this.animalVaccinations.values())
      .filter(vaccination => vaccination.farmId === farmId);
  }

  async createAnimalVaccination(vaccination: InsertAnimalVaccination): Promise<AnimalVaccination> {
    const id = this.vaccinationId++;
    const newVaccination: AnimalVaccination = {
      ...vaccination,
      id,
      createdAt: new Date(),
      notes: vaccination.notes || null,
      batchNumber: vaccination.batchNumber || null,
      dosage: vaccination.dosage || null,
      nextScheduledDate: vaccination.nextScheduledDate || null
    };
    this.animalVaccinations.set(id, newVaccination);
    return newVaccination;
  }

  async updateAnimalVaccination(id: number, vaccinationData: Partial<AnimalVaccination>): Promise<AnimalVaccination | undefined> {
    const vaccination = this.animalVaccinations.get(id);
    if (!vaccination) return undefined;

    const updatedVaccination = { ...vaccination, ...vaccinationData };
    this.animalVaccinations.set(id, updatedVaccination);
    return updatedVaccination;
  }

  // Cost operations
  async getCost(id: number): Promise<Cost | undefined> {
    return this.costItems.get(id);
  }

  async getCostsByFarm(farmId: number): Promise<Cost[]> {
    return Array.from(this.costItems.values())
      .filter(cost => cost.farmId === farmId);
  }

  async getCostsByCategory(farmId: number, category: string): Promise<Cost[]> {
    return Array.from(this.costItems.values())
      .filter(cost => cost.farmId === farmId && cost.category === category);
  }

  async getCostsByPeriod(farmId: number, startDate: Date, endDate: Date): Promise<Cost[]> {
    return Array.from(this.costItems.values())
      .filter(cost => {
        return cost.farmId === farmId && 
               cost.date >= startDate && 
               cost.date <= endDate;
      });
  }

  async createCost(costData: InsertCost): Promise<Cost> {
    const id = this.costId++;
    const cost: Cost = {
      ...costData,
      id,
      createdAt: new Date()
    };
    this.costItems.set(id, cost);
    return cost;
  }

  async updateCost(id: number, costData: Partial<Cost>): Promise<Cost | undefined> {
    const cost = this.costItems.get(id);
    if (!cost) return undefined;

    const updatedCost = { ...cost, ...costData };
    this.costItems.set(id, updatedCost);
    return updatedCost;
  }

  async deleteCost(id: number): Promise<boolean> {
    if (!this.costItems.has(id)) return false;
    return this.costItems.delete(id);
  }
}

// Export a storage instance
import { DatabaseStorage } from "./storage-db";

// Usar armazenamento em banco de dados
export const storage = new DatabaseStorage();
