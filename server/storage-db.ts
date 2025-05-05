import { 
  users, farms, userFarms, userPermissions, animals, crops, inventory, tasks, goals,
  type User, type InsertUser, type Farm, type InsertFarm, 
  type UserFarm, type InsertUserFarm, type UserPermission, type InsertUserPermission,
  type Animal, type InsertAnimal, type Crop, type InsertCrop, 
  type Inventory, type InsertInventory, type Task, type InsertTask,
  type Goal, type InsertGoal
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { UserRole, SystemModule, AccessLevel, GoalStatus } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  sessionStore: any;

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
    const [animal] = await db.insert(animals).values(animalData).returning();
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
    const [item] = await db.insert(inventory).values(itemData).returning();
    return item;
  }

  async updateInventoryItem(id: number, itemData: Partial<Inventory>): Promise<Inventory | undefined> {
    const [updatedItem] = await db
      .update(inventory)
      .set(itemData)
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem || undefined;
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
}