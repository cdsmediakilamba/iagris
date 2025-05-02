import { users, type User, type InsertUser } from "@shared/schema";
import { farms, type Farm, type InsertFarm } from "@shared/schema";
import { animals, type Animal, type InsertAnimal } from "@shared/schema";
import { crops, type Crop, type InsertCrop } from "@shared/schema";
import { inventory, type Inventory, type InsertInventory } from "@shared/schema";
import { tasks, type Task, type InsertTask } from "@shared/schema";
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
  
  // Farm operations
  getFarm(id: number): Promise<Farm | undefined>;
  getFarmsByOwner(ownerId: number): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, farm: Partial<Farm>): Promise<Farm | undefined>;
  
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
  
  sessionStore: session.SessionStore;
  
  // IDs for auto-increment
  private userId = 1;
  private farmId = 1;
  private animalId = 1;
  private cropId = 1;
  private inventoryId = 1;
  private taskId = 1;

  constructor() {
    this.users = new Map();
    this.farms = new Map();
    this.animals = new Map();
    this.crops = new Map();
    this.inventoryItems = new Map();
    this.taskItems = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
    
    // Create initial admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$PeVI8WE.QI6g5.vXnONQ9ORNqGdBc9AYe9XVLLmUGDBssBZKcZBk2", // "password"
      name: "Administrator",
      email: "admin@farmmanager.com",
      role: "admin",
      language: "pt"
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
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
  
  async getFarmsByOwner(ownerId: number): Promise<Farm[]> {
    return Array.from(this.farms.values()).filter(
      (farm) => farm.owner === ownerId
    );
  }
  
  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const id = this.farmId++;
    const farm: Farm = { ...insertFarm, id, createdAt: new Date() };
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
