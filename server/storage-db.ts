import { 
  users, farms, userFarms, userPermissions, animals, species, crops, inventory, inventoryTransactions, tasks, goals, animalVaccinations, costs,
  type User, type InsertUser, type Farm, type InsertFarm, 
  type UserFarm, type InsertUserFarm, type UserPermission, type InsertUserPermission,
  type Animal, type InsertAnimal, type Species, type InsertSpecies, type Crop, type InsertCrop, 
  type Inventory, type InsertInventory, type InventoryTransaction, type InsertInventoryTransaction,
  type Task, type InsertTask, type Goal, type InsertGoal, type AnimalVaccination, type InsertAnimalVaccination,
  type Cost, type InsertCost
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, asc, between, isNotNull, gt, lt, gte, lte } from "drizzle-orm";
import { UserRole, SystemModule, AccessLevel, GoalStatus, InventoryTransactionType } from "@shared/schema";
import session from "express-session";
import pg from "pg";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    const PgSession = ConnectPgSimple(session);
    this.sessionStore = new PgSession({
      pool: pool as pg.Pool,
      tableName: 'session',
      createTableIfMissing: true
    });
    
    // Inicializar as espécies básicas
    setTimeout(() => {
      this.initializeSpecies().catch(err => {
        console.error("Erro ao inicializar espécies:", err);
      });
    }, 1000); // Pequeno delay para garantir que o banco de dados esteja pronto
  }
  
  // Método para inicializar as espécies básicas no banco de dados
  async initializeSpecies(): Promise<void> {
    // Verificar se já existem espécies cadastradas
    const existingSpecies = await this.getAllSpecies();
    if (existingSpecies.length > 0) {
      return; // Não inicializar novamente se já existem espécies
    }
    
    // Espécies básicas para inicialização
    const defaultSpecies = [
      { name: "Bovino", abbreviation: "BOI" },
      { name: "Suíno", abbreviation: "SUI" },
      { name: "Caprino", abbreviation: "CAP" },
      { name: "Ovino", abbreviation: "OVI" },
      { name: "Aves", abbreviation: "AVE" },
      { name: "Equino", abbreviation: "EQU" }
    ];
    
    // Inserir as espécies no banco de dados
    for (const species of defaultSpecies) {
      await this.createSpecies(species);
    }
    
    console.log("Espécies básicas inicializadas com sucesso.");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Farm operations
  async getFarm(id: number): Promise<Farm | undefined> {
    const [farm] = await db.select().from(farms).where(eq(farms.id, id));
    return farm || undefined;
  }

  async getAllFarms(): Promise<Farm[]> {
    return await db.select().from(farms);
  }

  async getFarmsByCreator(creatorId: number): Promise<Farm[]> {
    return await db.select().from(farms).where(eq(farms.createdBy, creatorId));
  }

  async getFarmsByAdmin(adminId: number): Promise<Farm[]> {
    return await db.select().from(farms).where(eq(farms.adminId, adminId));
  }

  async getFarmsByOwner(userId: number): Promise<Farm[]> {
    return await db
      .select()
      .from(farms)
      .where(
        eq(farms.createdBy, userId) || eq(farms.adminId, userId)
      );
  }

  async getFarmsAccessibleByUser(userId: number): Promise<Farm[]> {
    // Get user first
    const user = await this.getUser(userId);
    if (!user) return [];

    // Super admin can see all farms
    if (user.role === UserRole.SUPER_ADMIN) {
      return await this.getAllFarms();
    }

    // Farm admin can see farms they administer
    if (user.role === UserRole.FARM_ADMIN) {
      return await this.getFarmsByAdmin(userId);
    }

    // Other users see farms they are associated with
    const userFarmsResults = await db
      .select()
      .from(userFarms)
      .where(eq(userFarms.userId, userId));

    if (userFarmsResults.length === 0) return [];

    const farmIds = userFarmsResults.map(uf => uf.farmId);
    if (farmIds.length === 0) return [];

    // Use multiple OR conditions since .in() isn't available
    const accessibleFarms = await db
      .select()
      .from(farms)
      .where(farmIds.map(id => eq(farms.id, id)).reduce((prev, curr) => prev || curr));

    return accessibleFarms;
  }

  async createFarm(farmData: InsertFarm): Promise<Farm> {
    const [farm] = await db.insert(farms).values(farmData).returning();
    return farm;
  }

  async updateFarm(id: number, farmData: Partial<Farm>): Promise<Farm | undefined> {
    const [updatedFarm] = await db
      .update(farms)
      .set(farmData)
      .where(eq(farms.id, id))
      .returning();
    return updatedFarm || undefined;
  }

  // Animal operations
  async getAnimal(id: number): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(eq(animals.id, id));
    return animal || undefined;
  }

  async getAnimalsByFarm(farmId: number): Promise<Animal[]> {
    return await db.select().from(animals).where(eq(animals.farmId, farmId));
  }

  async createAnimal(animalData: InsertAnimal): Promise<Animal> {
    // Gerar o código de registro para o animal
    const registrationCode = await this.generateAnimalRegistrationCode(animalData.speciesId, animalData.farmId);
    
    // Processa a data de nascimento
    let processedData = { ...animalData };
    if (typeof processedData.birthDate === 'string') {
      processedData.birthDate = new Date(processedData.birthDate);
    }
    
    // Processa a data da última vacina
    if (typeof processedData.lastVaccineDate === 'string') {
      processedData.lastVaccineDate = new Date(processedData.lastVaccineDate);
    }
    
    console.log("Processed animal data:", processedData);
    
    // Inserir o animal com o código de registro gerado
    const [animal] = await db.insert(animals).values({
      ...processedData,
      registrationCode
    }).returning();
    
    return animal;
  }

  async updateAnimal(id: number, animalData: Partial<Animal>): Promise<Animal | undefined> {
    const [updatedAnimal] = await db
      .update(animals)
      .set(animalData)
      .where(eq(animals.id, id))
      .returning();
    return updatedAnimal || undefined;
  }

  // Crop operations
  async getCrop(id: number): Promise<Crop | undefined> {
    const [crop] = await db.select().from(crops).where(eq(crops.id, id));
    return crop || undefined;
  }

  async getCropsByFarm(farmId: number): Promise<Crop[]> {
    return await db.select().from(crops).where(eq(crops.farmId, farmId));
  }

  async createCrop(cropData: InsertCrop): Promise<Crop> {
    const [crop] = await db.insert(crops).values(cropData).returning();
    return crop;
  }

  async updateCrop(id: number, cropData: Partial<Crop>): Promise<Crop | undefined> {
    const [updatedCrop] = await db
      .update(crops)
      .set(cropData)
      .where(eq(crops.id, id))
      .returning();
    return updatedCrop || undefined;
  }

  // Inventory operations
  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async getInventoryByFarm(farmId: number): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.farmId, farmId));
  }

  async getCriticalInventory(farmId: number): Promise<Inventory[]> {
    // Fetch all inventory items for the farm
    const items = await db
      .select()
      .from(inventory)
      .where(eq(inventory.farmId, farmId));
    
    // Filter in JS to find critical items
    return items.filter(item => 
      item.minimumLevel !== null && 
      item.quantity <= item.minimumLevel
    );
  }

  async createInventoryItem(itemData: InsertInventory): Promise<Inventory> {
    try {
      console.log("Creating inventory item with data:", itemData);
      const [item] = await db.insert(inventory).values(itemData).returning();
      console.log("Created inventory item:", item);
      return item;
    } catch (error) {
      console.error("Error in createInventoryItem:", error);
      throw error;
    }
  }

  async updateInventoryItem(id: number, itemData: Partial<Inventory>): Promise<Inventory | undefined> {
    const [updatedItem] = await db
      .update(inventory)
      .set(itemData)
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem || undefined;
  }
  
  // Inventory Transaction operations
  async getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.id, id));
    return transaction || undefined;
  }
  
  async getInventoryTransactionsByItem(inventoryId: number): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.inventoryId, inventoryId))
      .orderBy(desc(inventoryTransactions.date));
  }
  
  async getInventoryTransactionsByFarm(farmId: number): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.farmId, farmId))
      .orderBy(desc(inventoryTransactions.date));
  }
  
  async getInventoryTransactionsByPeriod(farmId: number, startDate: Date, endDate: Date): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(
        and(
          eq(inventoryTransactions.farmId, farmId),
          gte(inventoryTransactions.date, startDate),
          lte(inventoryTransactions.date, endDate)
        )
      )
      .orderBy(desc(inventoryTransactions.date));
  }
  
  async createInventoryTransaction(transactionData: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [transaction] = await db
      .insert(inventoryTransactions)
      .values(transactionData)
      .returning();
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
  async assignUserToFarm(userFarmData: InsertUserFarm): Promise<UserFarm> {
    const [userFarm] = await db
      .insert(userFarms)
      .values(userFarmData)
      .returning();
    return userFarm;
  }

  async removeUserFromFarm(userId: number, farmId: number): Promise<boolean> {
    const result = await db
      .delete(userFarms)
      .where(
        and(
          eq(userFarms.userId, userId),
          eq(userFarms.farmId, farmId)
        )
      );
    
    // Also remove all permissions for this user in this farm
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.farmId, farmId)
        )
      );
    
    return true;
  }

  async getUserFarms(userId: number): Promise<UserFarm[]> {
    return await db
      .select()
      .from(userFarms)
      .where(eq(userFarms.userId, userId));
  }

  async getFarmUsers(farmId: number): Promise<UserFarm[]> {
    return await db
      .select()
      .from(userFarms)
      .where(eq(userFarms.farmId, farmId));
  }

  // User-Permission operations
  async getUserPermissions(userId: number, farmId: number): Promise<UserPermission[]> {
    return await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.farmId, farmId)
        )
      );
  }

  async setUserPermission(permissionData: InsertUserPermission): Promise<UserPermission> {
    // Check if permission already exists
    const [existingPermission] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, permissionData.userId),
          eq(userPermissions.farmId, permissionData.farmId),
          eq(userPermissions.module, permissionData.module)
        )
      );
    
    if (existingPermission) {
      // Update existing permission
      const [updatedPermission] = await db
        .update(userPermissions)
        .set({ accessLevel: permissionData.accessLevel })
        .where(eq(userPermissions.id, existingPermission.id))
        .returning();
      return updatedPermission;
    } else {
      // Create new permission
      const [newPermission] = await db
        .insert(userPermissions)
        .values(permissionData)
        .returning();
      return newPermission;
    }
  }

  async updateUserPermission(id: number, permissionData: Partial<UserPermission>): Promise<UserPermission | undefined> {
    const [updatedPermission] = await db
      .update(userPermissions)
      .set(permissionData)
      .where(eq(userPermissions.id, id))
      .returning();
    return updatedPermission || undefined;
  }

  async checkUserAccess(userId: number, farmId: number, module: SystemModule, requiredLevel: AccessLevel): Promise<boolean> {
    // Get user first
    const user = await this.getUser(userId);
    if (!user) return false;

    // Super admins have full access to everything
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Farm admin has full access to their farms
    if (user.role === UserRole.FARM_ADMIN) {
      const farm = await this.getFarm(farmId);
      if (farm && farm.adminId === userId) return true;
    }

    // Check specific module permissions
    const [permission] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.farmId, farmId),
          eq(userPermissions.module, module)
        )
      );

    if (!permission) return false;

    // Check if the user has sufficient access level
    switch (requiredLevel) {
      case AccessLevel.NONE:
        return true; // Any level is sufficient for NONE
      case AccessLevel.READ_ONLY:
        return permission.accessLevel === AccessLevel.READ_ONLY || 
               permission.accessLevel === AccessLevel.FULL;
      case AccessLevel.FULL:
        return permission.accessLevel === AccessLevel.FULL;
      default:
        return false;
    }
  }

  // Species operations
  async getSpecies(id: number): Promise<Species | undefined> {
    const [speciesItem] = await db.select().from(species).where(eq(species.id, id));
    return speciesItem || undefined;
  }
  
  async getAllSpecies(): Promise<Species[]> {
    return await db.select().from(species);
  }
  
  async createSpecies(speciesData: InsertSpecies): Promise<Species> {
    const [newSpecies] = await db.insert(species).values(speciesData).returning();
    return newSpecies;
  }
  
  async updateSpecies(id: number, speciesData: Partial<Species>): Promise<Species | undefined> {
    const [updatedSpecies] = await db
      .update(species)
      .set(speciesData)
      .where(eq(species.id, id))
      .returning();
    return updatedSpecies || undefined;
  }
  
  // Método para gerar código de registro de animal
  async generateAnimalRegistrationCode(speciesId: number, farmId: number): Promise<string> {
    // Obter a espécie pelo ID
    const speciesItem = await this.getSpecies(speciesId);
    if (!speciesItem) {
      throw new Error("Espécie não encontrada");
    }
    
    const abbreviation = speciesItem.abbreviation;
    
    // Obter data atual no formato YYYYMMDD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Consultar banco de dados para obter o último número sequencial para esta espécie, data e fazenda
    const pattern = `${abbreviation}-${dateString}-%`;
    
    // Buscar todos os animais da mesma espécie registrados na mesma data e fazenda
    const animalsWithSimilarCode = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.farmId, farmId),
          eq(animals.speciesId, speciesId)
        )
      );
    
    // Filtrar animais cujo código começa com o padrão e encontrar o maior número sequencial
    const regex = new RegExp(`^${abbreviation}-${dateString}-([0-9]{4})$`);
    let maxSequential = 0;
    
    // Para cada animal com pattern similar, extrair o número sequencial e encontrar o maior
    for (const animal of animalsWithSimilarCode) {
      if (!animal.registrationCode) continue;
      
      const match = animal.registrationCode.match(regex);
      if (match && match[1]) {
        const sequentialNumber = parseInt(match[1], 10);
        if (sequentialNumber > maxSequential) {
          maxSequential = sequentialNumber;
        }
      }
    }
    
    // Incrementar o contador e formatar com zeros à esquerda
    const newSequential = maxSequential + 1;
    const sequentialFormatted = String(newSequential).padStart(4, '0');
    
    // Gerar código no formato [ABREVIAÇÃO]-[YYYYMMDD]-[SEQUENCIAL]
    return `${abbreviation}-${dateString}-${sequentialFormatted}`;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByFarm(farmId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.farmId, farmId))
      .orderBy(desc(tasks.dueDate));
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.dueDate));
  }

  async getPendingTasks(farmId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.farmId, farmId),
          eq(tasks.status, 'pending')
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async getGoalsByFarm(farmId: number): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.farmId, farmId))
      .orderBy(desc(goals.endDate));
  }

  async getGoalsByAssignee(userId: number): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.assignedTo, userId))
      .orderBy(desc(goals.endDate));
  }

  async getGoalsByStatus(farmId: number, status: GoalStatus): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.farmId, farmId),
          eq(goals.status, status)
        )
      )
      .orderBy(desc(goals.endDate));
  }
  
  async getAllGoals(): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .orderBy(desc(goals.endDate));
  }

  async createGoal(goalData: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values(goalData).returning();
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    // Se o status estiver sendo alterado para COMPLETED, definir a data de conclusão
    if (goalData.status === GoalStatus.COMPLETED) {
      const [goal] = await db.select().from(goals).where(eq(goals.id, id));
      if (goal && goal.status !== GoalStatus.COMPLETED) {
        goalData.completionDate = new Date();
      }
    }

    const [updatedGoal] = await db
      .update(goals)
      .set(goalData)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  // Animal Vaccination operations
  async getAnimalVaccination(id: number): Promise<AnimalVaccination | undefined> {
    const [vaccination] = await db
      .select()
      .from(animalVaccinations)
      .where(eq(animalVaccinations.id, id));
    return vaccination || undefined;
  }

  async getAnimalVaccinationsByAnimal(animalId: number): Promise<AnimalVaccination[]> {
    return await db
      .select()
      .from(animalVaccinations)
      .where(eq(animalVaccinations.animalId, animalId))
      .orderBy(desc(animalVaccinations.applicationDate));
  }

  async getAnimalVaccinationsByFarm(farmId: number): Promise<AnimalVaccination[]> {
    return await db
      .select()
      .from(animalVaccinations)
      .where(eq(animalVaccinations.farmId, farmId))
      .orderBy(desc(animalVaccinations.applicationDate));
  }

  async createAnimalVaccination(vaccinationData: InsertAnimalVaccination): Promise<AnimalVaccination> {
    // Processa a data de aplicação
    let processedData = { ...vaccinationData };
    if (typeof processedData.applicationDate === 'string') {
      processedData.applicationDate = new Date(processedData.applicationDate);
    }
    
    // Processa a data de expiração se existir
    if (processedData.expirationDate && typeof processedData.expirationDate === 'string') {
      processedData.expirationDate = new Date(processedData.expirationDate);
    }
    
    // Processa a data da próxima aplicação se existir
    if (processedData.nextApplicationDate && typeof processedData.nextApplicationDate === 'string') {
      processedData.nextApplicationDate = new Date(processedData.nextApplicationDate);
    }
    
    // Inserir o registro de vacinação
    const [vaccination] = await db
      .insert(animalVaccinations)
      .values(processedData)
      .returning();
    
    // Atualizar a data da última vacina no animal
    await db
      .update(animals)
      .set({ lastVaccineDate: processedData.applicationDate })
      .where(eq(animals.id, processedData.animalId));
    
    return vaccination;
  }

  async updateAnimalVaccination(id: number, vaccinationData: Partial<AnimalVaccination>): Promise<AnimalVaccination | undefined> {
    // Processa a data de aplicação se existir
    if (vaccinationData.applicationDate && typeof vaccinationData.applicationDate === 'string') {
      vaccinationData.applicationDate = new Date(vaccinationData.applicationDate);
    }
    
    // Processa a data de expiração se existir
    if (vaccinationData.expirationDate && typeof vaccinationData.expirationDate === 'string') {
      vaccinationData.expirationDate = new Date(vaccinationData.expirationDate);
    }
    
    // Processa a data da próxima aplicação se existir
    if (vaccinationData.nextApplicationDate && typeof vaccinationData.nextApplicationDate === 'string') {
      vaccinationData.nextApplicationDate = new Date(vaccinationData.nextApplicationDate);
    }
    
    const [updatedVaccination] = await db
      .update(animalVaccinations)
      .set(vaccinationData)
      .where(eq(animalVaccinations.id, id))
      .returning();
    
    // Se a data de aplicação foi alterada, atualizar a data da última vacina no animal
    if (updatedVaccination && vaccinationData.applicationDate) {
      await db
        .update(animals)
        .set({ lastVaccineDate: vaccinationData.applicationDate })
        .where(eq(animals.id, updatedVaccination.animalId));
    }
    
    return updatedVaccination || undefined;
  }

  // Cost operations
  async getCost(id: number): Promise<Cost | undefined> {
    const [cost] = await db
      .select()
      .from(costs)
      .where(eq(costs.id, id));
    return cost || undefined;
  }

  async getCostsByFarm(farmId: number): Promise<Cost[]> {
    return await db
      .select()
      .from(costs)
      .where(eq(costs.farmId, farmId))
      .orderBy(desc(costs.date));
  }

  async getCostsByCategory(farmId: number, category: string): Promise<Cost[]> {
    return await db
      .select()
      .from(costs)
      .where(and(
        eq(costs.farmId, farmId),
        eq(costs.category, category)
      ))
      .orderBy(desc(costs.date));
  }

  async getCostsByPeriod(farmId: number, startDate: Date, endDate: Date): Promise<Cost[]> {
    return await db
      .select()
      .from(costs)
      .where(and(
        eq(costs.farmId, farmId),
        gte(costs.date, startDate),
        lte(costs.date, endDate)
      ))
      .orderBy(desc(costs.date));
  }

  async createCost(costData: InsertCost): Promise<Cost> {
    // Process date if it's a string
    let processedData = { ...costData };
    if (typeof processedData.date === 'string') {
      processedData.date = new Date(processedData.date);
    }

    const [cost] = await db
      .insert(costs)
      .values(processedData)
      .returning();
    
    return cost;
  }

  async updateCost(id: number, costData: Partial<Cost>): Promise<Cost | undefined> {
    // Process date if it's a string
    if (costData.date && typeof costData.date === 'string') {
      costData.date = new Date(costData.date);
    }

    const [updatedCost] = await db
      .update(costs)
      .set(costData)
      .where(eq(costs.id, id))
      .returning();
    
    return updatedCost || undefined;
  }

  async deleteCost(id: number): Promise<boolean> {
    const result = await db
      .delete(costs)
      .where(eq(costs.id, id));
    
    return result.rowCount > 0;
  }
}