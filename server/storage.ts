import { users, type User, type InsertUser } from "@shared/schema";
import { farms, type Farm, type InsertFarm } from "@shared/schema";
import { animals, type Animal, type InsertAnimal } from "@shared/schema";
import { crops, type Crop, type InsertCrop } from "@shared/schema";
import { inventory, type Inventory, type InsertInventory } from "@shared/schema";
import { tasks, type Task, type InsertTask } from "@shared/schema";
import { userFarms, type UserFarm, type InsertUserFarm } from "@shared/schema";
import { userPermissions, type UserPermission, type InsertUserPermission } from "@shared/schema";
import { UserRole, SystemModule, AccessLevel } from "@shared/schema";
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
  getUsersByRole(role: UserRole): Promise<User[]>;
  
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
  
  // Animal operations
  getAnimal(id: number): Promise<Animal | undefined>;
  getAnimalsByFarm(farmId: number): Promise<Animal[]>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, animal: Partial<Animal>): Promise<Animal | undefined>;
  
  // Crop operations
  getCrop(id: number): Promise<Crop | undefined>;
  getCropsByFarm(farmId: number): Promise<Crop[]>;
  createCrop(crop: InsertCrop): Promise<Crop>;
  updateCrop(id: number, crop: Partial<Crop>): Promise<Crop | undefined>;
  
  // Inventory operations
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  getInventoryByFarm(farmId: number): Promise<Inventory[]>;
  getCriticalInventory(farmId: number): Promise<Inventory[]>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<Inventory>): Promise<Inventory | undefined>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByFarm(farmId: number): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getPendingTasks(farmId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private farms: Map<number, Farm>;
  private animals: Map<number, Animal>;
  private crops: Map<number, Crop>;
  private inventoryItems: Map<number, Inventory>;
  private taskItems: Map<number, Task>;
  private userFarms: Map<number, UserFarm>;
  private userPermissions: Map<number, UserPermission>;
  
  sessionStore: any; // Use any para evitar problemas com tipos
  
  // IDs for auto-increment
  private userId = 1;
  private farmId = 1;
  private animalId = 1;
  private cropId = 1;
  private inventoryId = 1;
  private taskId = 1;
  private userFarmId = 1;
  private userPermissionId = 1;

  constructor() {
    this.users = new Map();
    this.farms = new Map();
    this.animals = new Map();
    this.crops = new Map();
    this.inventoryItems = new Map();
    this.taskItems = new Map();
    this.userFarms = new Map();
    this.userPermissions = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
    
    // Create initial super admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$PeVI8WE.QI6g5.vXnONQ9ORNqGdBc9AYe9XVLLmUGDBssBZKcZBk2", // "password"
      name: "Administrador Geral",
      email: "admin@iagris.com",
      role: UserRole.SUPER_ADMIN,
      language: "pt",
      farmId: null // Super Admin não está vinculado a nenhuma fazenda específica
    });
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
      role: insertUser.role ?? UserRole.EMPLOYEE,
      language: insertUser.language ?? "pt"
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
}

// Export a storage instance
export const storage = new MemStorage();
