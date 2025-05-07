import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { UserRole, SystemModule, AccessLevel } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Define middleware for role and module access checking
  const { checkRole, checkModuleAccess } = app.locals;

  // Farm routes
  app.get("/api/farms", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      console.log("User requesting farms:", req.user);
      // Super admin pode ver todas as fazendas
      if (req.user.role === UserRole.SUPER_ADMIN) {
        console.log("User is SUPER_ADMIN, getting all farms");
        const farms = await storage.getAllFarms();
        console.log("All farms:", farms);
        return res.json(farms);
      }
      
      console.log("Getting farms accessible by user:", req.user.id);
      const farms = await storage.getFarmsAccessibleByUser(req.user.id);
      console.log("Accessible farms:", farms);
      res.json(farms);
    } catch (error) {
      console.error("Error fetching farms:", error);
      res.status(500).json({ message: "Failed to fetch farms" });
    }
  });
  
  // Rota para obter detalhes de uma fazenda específica
  app.get("/api/farms/:farmId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      
      // Obter a fazenda
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Verificar se o usuário tem acesso a esta fazenda
      if (req.user.role === UserRole.SUPER_ADMIN) {
        // Super admin tem acesso a todas as fazendas
        return res.json(farm);
      }
      
      // Para outros usuários, verificar permissões
      const farms = await storage.getFarmsAccessibleByUser(req.user.id);
      const hasAccess = farms.some(f => f.id === farmId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have permission to access this farm" });
      }
      
      res.json(farm);
    } catch (error) {
      console.error("Error fetching farm:", error);
      res.status(500).json({ message: "Failed to fetch farm details" });
    }
  });

  app.post("/api/farms", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const newFarm = await storage.createFarm({
        ...req.body,
        owner: req.user.id,
      });
      res.status(201).json(newFarm);
    } catch (error) {
      res.status(500).json({ message: "Failed to create farm" });
    }
  });

  // Farm Users route
  app.get("/api/farms/:farmId/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log("Farm users request received for farmId:", req.params.farmId);
      const farmId = parseInt(req.params.farmId, 10);
      
      // Super admin e farm admin podem ver todos os usuários
      if (req.user && req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.FARM_ADMIN) {
        // Verificar se o usuário tem permissão para ver os usuários desta fazenda
        const hasAccess = await storage.checkUserAccess(
          req.user.id, 
          farmId, 
          SystemModule.ADMINISTRATION, 
          AccessLevel.READ_ONLY
        );
        
        if (!hasAccess) {
          console.log("User does not have permission to view farm users");
          return res.status(403).json({ message: "Not authorized to view farm users" });
        }
      }
      
      console.log("Getting user relations for farm:", farmId);
      const farmUserRelations = await storage.getFarmUsers(farmId);
      console.log("Farm user relations (length " + farmUserRelations.length + "):", farmUserRelations);
      
      // Para cada relação, obtemos os detalhes completos do usuário
      const users = [];
      for (const relation of farmUserRelations) {
        console.log("Getting details for user ID:", relation.userId);
        const user = await storage.getUser(relation.userId);
        if (user) {
          const userWithRole = {
            ...user,
            farmRole: relation.role,
            userId: user.id // Adicionando userId como alias para id para compatibilidade
          };
          console.log("Adding user to response:", userWithRole);
          users.push(userWithRole);
        }
      }
      
      console.log("Returning users:", users);
      res.json(users);
    } catch (error) {
      console.error("Error fetching farm users:", error);
      res.status(500).json({ message: "Failed to fetch farm users" });
    }
  });

  // Animal routes
  app.get("/api/farms/:farmId/animals", 
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const animals = await storage.getAnimalsByFarm(farmId);
        res.json(animals);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch animals" });
      }
    }
  );

  app.post("/api/farms/:farmId/animals", 
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        console.log("Creating animal with data:", { ...req.body, farmId });
        const newAnimal = await storage.createAnimal({
          ...req.body,
          farmId,
        });
        res.status(201).json(newAnimal);
      } catch (error) {
        console.error("Error creating animal:", error);
        res.status(500).json({ 
          message: "Failed to create animal", 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  // Crop routes
  app.get("/api/farms/:farmId/crops", 
    checkModuleAccess(SystemModule.CROPS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const crops = await storage.getCropsByFarm(farmId);
        res.json(crops);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch crops" });
      }
    }
  );

  app.post("/api/farms/:farmId/crops", 
    checkModuleAccess(SystemModule.CROPS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const newCrop = await storage.createCrop({
          ...req.body,
          farmId,
        });
        res.status(201).json(newCrop);
      } catch (error) {
        res.status(500).json({ message: "Failed to create crop" });
      }
    }
  );

  // Inventory routes
  app.get("/api/farms/:farmId/inventory", 
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const inventory = await storage.getInventoryByFarm(farmId);
        res.json(inventory);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch inventory" });
      }
    }
  );

  app.get("/api/farms/:farmId/inventory/critical", 
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const criticalItems = await storage.getCriticalInventory(farmId);
        res.json(criticalItems);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch critical inventory" });
      }
    }
  );

  app.post("/api/farms/:farmId/inventory", 
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const newItem = await storage.createInventoryItem({
          ...req.body,
          farmId,
        });
        res.status(201).json(newItem);
      } catch (error) {
        res.status(500).json({ message: "Failed to create inventory item" });
      }
    }
  );
  
  // Inventory Transaction routes
  app.get("/api/farms/:farmId/inventory/transactions", 
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        
        // Optional query parameters for date filtering
        const { startDate, endDate } = req.query;
        
        let transactions;
        if (startDate && endDate) {
          transactions = await storage.getInventoryTransactionsByPeriod(
            farmId, 
            new Date(startDate as string), 
            new Date(endDate as string)
          );
        } else {
          transactions = await storage.getInventoryTransactionsByFarm(farmId);
        }
        
        res.json(transactions);
      } catch (error) {
        console.error("Error fetching inventory transactions:", error);
        res.status(500).json({ message: "Failed to fetch inventory transactions" });
      }
    }
  );
  
  app.get("/api/inventory/:itemId/transactions", 
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.itemId, 10);
        
        // First, get the inventory item to check if user has access to the farm
        const item = await storage.getInventoryItem(itemId);
        if (!item) {
          return res.status(404).json({ message: "Inventory item not found" });
        }
        
        // Check if user has access to this farm's inventory
        const hasAccess = await storage.checkUserAccess(
          req.user!.id, 
          item.farmId, 
          SystemModule.INVENTORY, 
          AccessLevel.READ_ONLY
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Not authorized to view inventory transactions" });
        }
        
        const transactions = await storage.getInventoryTransactionsByItem(itemId);
        res.json(transactions);
      } catch (error) {
        console.error("Error fetching item transactions:", error);
        res.status(500).json({ message: "Failed to fetch inventory item transactions" });
      }
    }
  );
  
  // Route for entry transactions (add to inventory)
  app.post("/api/inventory/:itemId/entry",
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.FULL),
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.itemId, 10);
        const { quantity, notes, documentNumber, unitPrice } = req.body;
        
        if (!quantity || quantity <= 0) {
          return res.status(400).json({ message: "Valid quantity is required" });
        }
        
        const result = await storage.registerInventoryEntry(
          itemId,
          Number(quantity),
          req.user!.id,
          notes,
          documentNumber,
          unitPrice ? Number(unitPrice) : undefined
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error("Error registering inventory entry:", error);
        res.status(500).json({ 
          message: "Failed to register inventory entry", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  );
  
  // Route for withdrawal transactions (remove from inventory)
  app.post("/api/inventory/:itemId/withdrawal",
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.FULL),
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.itemId, 10);
        const { quantity, notes, destination } = req.body;
        
        if (!quantity || quantity <= 0) {
          return res.status(400).json({ message: "Valid quantity is required" });
        }
        
        const result = await storage.registerInventoryWithdrawal(
          itemId,
          Number(quantity),
          req.user!.id,
          notes,
          destination
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error("Error registering inventory withdrawal:", error);
        res.status(500).json({ 
          message: "Failed to register inventory withdrawal", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  );
  
  // Route for inventory adjustments
  app.post("/api/inventory/:itemId/adjustment",
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.FULL),
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.itemId, 10);
        const { newQuantity, notes } = req.body;
        
        if (newQuantity === undefined || newQuantity < 0) {
          return res.status(400).json({ message: "Valid new quantity is required" });
        }
        
        const result = await storage.registerInventoryAdjustment(
          itemId,
          Number(newQuantity),
          req.user!.id,
          notes
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error("Error adjusting inventory:", error);
        res.status(500).json({ 
          message: "Failed to adjust inventory", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  );

  // Task routes
  app.get("/api/farms/:farmId/tasks", 
    checkModuleAccess(SystemModule.TASKS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const tasks = await storage.getTasksByFarm(farmId);
        res.json(tasks);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch tasks" });
      }
    }
  );

  app.get("/api/farms/:farmId/tasks/pending", 
    checkModuleAccess(SystemModule.TASKS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const pendingTasks = await storage.getPendingTasks(farmId);
        res.json(pendingTasks);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending tasks" });
      }
    }
  );

  app.post("/api/farms/:farmId/tasks", 
    checkModuleAccess(SystemModule.TASKS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const newTask = await storage.createTask({
          ...req.body,
          farmId,
        });
        res.status(201).json(newTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  );

  app.patch("/api/tasks/:taskId", 
    async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      try {
        // First, we need to get the task to determine its farm
        const taskId = parseInt(req.params.taskId, 10);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        // Check if user has permission to update tasks on this farm
        const hasAccess = await storage.checkUserAccess(
          req.user!.id, 
          task.farmId, 
          SystemModule.TASKS, 
          AccessLevel.FULL
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to update tasks" });
        }
        
        // Update the task
        const updatedTask = await storage.updateTask(taskId, req.body);
        res.json(updatedTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  );

  // User management routes (admin only)
  app.get("/api/users", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      let users = [];
      
      if (req.user.role === UserRole.SUPER_ADMIN) {
        // Super admin can see all users
        // This would be implemented with a getAllUsers method in a production app
        // For now using a simple loop as placeholder
        const usersPromises = Array.from(Array(20).keys()).map(id => {
          return storage.getUser(id);
        });
        
        const resolvedUsers = await Promise.all(usersPromises);
        users = resolvedUsers.filter(Boolean);
      } else if (req.user.role === UserRole.FARM_ADMIN) {
        // Farm admins can only see users from their farms
        const userFarms = await storage.getUserFarms(req.user.id);
        const farmIds = userFarms.map(uf => uf.farmId);
        
        // Get all users for each farm
        const userPromises = [];
        for (const farmId of farmIds) {
          const farmUsers = await storage.getFarmUsers(farmId);
          for (const farmUser of farmUsers) {
            userPromises.push(storage.getUser(farmUser.userId));
          }
        }
        
        const resolvedUsers = await Promise.all(userPromises);
        // Remove duplicates by user ID
        const userMap = new Map();
        resolvedUsers.filter(Boolean).forEach(user => {
          if (user) userMap.set(user.id, user);
        });
        users = Array.from(userMap.values());
      }
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Validation for role assignment
      if (req.user.role === UserRole.FARM_ADMIN && req.body.role === UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: "Farm administrators cannot create super admin accounts" });
      }

      const newUser = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // If the user creating is a farm admin, automatically assign the new user to their farm
      if (req.user.role === UserRole.FARM_ADMIN && req.body.farmId) {
        // First check if the farm admin has access to this farm
        const userFarms = await storage.getUserFarms(req.user.id);
        const hasFarmAccess = userFarms.some(uf => uf.farmId === req.body.farmId);
        
        if (!hasFarmAccess) {
          return res.status(403).json({ message: "You don't have access to assign users to this farm" });
        }
        
        // Assign the new user to the farm
        await storage.assignUserToFarm({
          userId: newUser.id,
          farmId: req.body.farmId,
          role: req.body.farmRole || 'member'
        });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Farm-User association routes
  // Rota para verificar as associações de usuários a fazendas
  app.get("/api/user/farms", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      console.log("Get user farms for user:", req.user.id);
      const userFarms = await storage.getUserFarms(req.user.id);
      console.log("User farms:", userFarms);
      res.json(userFarms);
    } catch (error) {
      console.error("Error fetching user farms:", error);
      res.status(500).json({ message: "Failed to fetch user farms" });
    }
  });
  
  app.post("/api/farms/:farmId/users", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Check if the current user has admin access to this farm
      if (req.user.role === UserRole.FARM_ADMIN) {
        const userFarms = await storage.getUserFarms(req.user.id);
        const hasFarmAccess = userFarms.some(uf => uf.farmId === farmId);
        
        if (!hasFarmAccess) {
          return res.status(403).json({ message: "You don't have admin access to this farm" });
        }
      }
      
      // Check if the user exists
      const user = await storage.getUser(req.body.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already assigned to this farm
      const userFarms = await storage.getUserFarms(req.body.userId);
      const alreadyAssigned = userFarms.some(uf => uf.farmId === farmId);
      
      if (alreadyAssigned) {
        return res.status(400).json({ message: "User is already assigned to this farm" });
      }
      
      // Assign the user to the farm
      const userFarm = await storage.assignUserToFarm({
        userId: req.body.userId,
        farmId,
        role: req.body.role || 'member'
      });
      
      res.status(201).json(userFarm);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign user to farm" });
    }
  });
  
  app.delete("/api/farms/:farmId/users/:userId", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const userId = parseInt(req.params.userId, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Check if the current user has admin access to this farm
      if (req.user.role === UserRole.FARM_ADMIN) {
        const userFarms = await storage.getUserFarms(req.user.id);
        const hasFarmAccess = userFarms.some(uf => uf.farmId === farmId);
        
        if (!hasFarmAccess) {
          return res.status(403).json({ message: "You don't have admin access to this farm" });
        }
      }
      
      // Check if the user exists and is assigned to the farm
      const userFarms = await storage.getUserFarms(userId);
      const isAssigned = userFarms.some(uf => uf.farmId === farmId);
      
      if (!isAssigned) {
        return res.status(404).json({ message: "User is not assigned to this farm" });
      }
      
      // Don't allow removing the original farm admin/creator
      if (farm.adminId === userId || farm.createdBy === userId) {
        return res.status(403).json({ message: "Cannot remove the farm admin or creator" });
      }
      
      // Remove the user from the farm
      const removed = await storage.removeUserFromFarm(userId, farmId);
      
      if (removed) {
        res.status(200).json({ message: "User removed from farm" });
      } else {
        res.status(500).json({ message: "Failed to remove user from farm" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process request" });
    }
  });
  
  // User permissions routes
  app.get("/api/farms/:farmId/users/:userId/permissions", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const userId = parseInt(req.params.userId, 10);
      
      // Check if the current user has admin access to this farm
      if (req.user.role === UserRole.FARM_ADMIN) {
        const userFarms = await storage.getUserFarms(req.user.id);
        const hasFarmAccess = userFarms.some(uf => uf.farmId === farmId);
        
        if (!hasFarmAccess) {
          return res.status(403).json({ message: "You don't have admin access to this farm" });
        }
      }
      
      // Get the user's permissions for this farm
      const permissions = await storage.getUserPermissions(userId, farmId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });
  
  app.post("/api/permissions", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const { userId, farmId, module, accessLevel } = req.body;
      
      // Check if the current user has admin access to this farm
      if (req.user.role === UserRole.FARM_ADMIN) {
        const userFarms = await storage.getUserFarms(req.user.id);
        const hasFarmAccess = userFarms.some(uf => uf.farmId === farmId);
        
        if (!hasFarmAccess) {
          return res.status(403).json({ message: "You don't have admin access to this farm" });
        }
      }
      
      // Check if the user is assigned to the farm
      const userFarms = await storage.getUserFarms(userId);
      const isAssigned = userFarms.some(uf => uf.farmId === farmId);
      
      if (!isAssigned) {
        return res.status(400).json({ message: "User is not assigned to this farm" });
      }
      
      // Create or update the permission
      const permission = await storage.setUserPermission({
        userId,
        farmId,
        module,
        accessLevel
      });
      
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ message: "Failed to set permission" });
    }
  });
  
  app.patch("/api/permissions/:id", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const permissionId = parseInt(req.params.id, 10);
      const { accessLevel } = req.body;
      
      // Get the existing permission
      const existingPermission = await storage.getUserPermission(permissionId);
      
      if (!existingPermission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      // Check if the current user has admin access to this farm
      if (req.user.role === UserRole.FARM_ADMIN) {
        const userFarms = await storage.getUserFarms(req.user.id);
        const hasFarmAccess = userFarms.some(uf => uf.farmId === existingPermission.farmId);
        
        if (!hasFarmAccess) {
          return res.status(403).json({ message: "You don't have admin access to this farm" });
        }
      }
      
      // Update the permission
      const updatedPermission = await storage.updateUserPermission(permissionId, { accessLevel });
      
      if (updatedPermission) {
        res.json(updatedPermission);
      } else {
        res.status(404).json({ message: "Permission not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  // Goal routes
  app.get("/api/farms/:farmId/goals", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const farmId = parseInt(req.params.farmId);
      
      try {
        const goals = await storage.getGoalsByFarm(farmId);
        res.json(goals);
      } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ message: "Failed to fetch goals" });
      }
    }
  );
  
  app.get("/api/farms/:farmId/goals/status/:status", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const farmId = parseInt(req.params.farmId);
      const status = req.params.status;
      
      try {
        const goals = await storage.getGoalsByStatus(farmId, status);
        res.json(goals);
      } catch (error) {
        console.error("Error fetching goals by status:", error);
        res.status(500).json({ message: "Failed to fetch goals by status" });
      }
    }
  );
  
  app.get("/api/users/:userId/goals", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Users can only see their own goals unless they are admins
      if (userId !== req.user.id && 
          req.user.role !== UserRole.SUPER_ADMIN && 
          req.user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to view these goals" });
      }
      
      try {
        const goals = await storage.getGoalsByAssignee(userId);
        res.json(goals);
      } catch (error) {
        console.error("Error fetching user goals:", error);
        res.status(500).json({ message: "Failed to fetch user goals" });
      }
    }
  );
  
  app.post("/api/farms/:farmId/goals", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      try {
        const farmId = parseInt(req.params.farmId);
        
        console.log("Request body:", req.body);
        
        // Definir datas padrão
        let startDate = new Date();
        let endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 dias a partir de hoje
        
        // Tentar usar as datas do cliente
        try {
          if (req.body.startDate) {
            const tempStartDate = new Date(req.body.startDate);
            if (!isNaN(tempStartDate.getTime())) {
              startDate = tempStartDate;
            }
          }
          
          if (req.body.endDate) {
            const tempEndDate = new Date(req.body.endDate);
            if (!isNaN(tempEndDate.getTime())) {
              endDate = tempEndDate;
            }
          }
        } catch (err) {
          console.error("Error parsing dates:", err);
        }
        
        // Criar um objeto simples com todos os campos necessários explicitamente definidos
        const goalData = {
          name: req.body.name,
          description: req.body.description || null,
          assignedTo: parseInt(req.body.assignedTo),
          farmId: farmId,
          createdBy: req.user.id,
          status: req.body.status || 'pending',
          unit: req.body.unit || 'units',
          notes: req.body.notes || null,
          cropId: null,
          targetValue: 0,
          actualValue: 0,
          startDate: startDate,
          endDate: endDate,
          completionDate: null
        };
        
        // Tratar valores numéricos
        if (req.body.targetValue) {
          goalData.targetValue = typeof req.body.targetValue === 'string' 
            ? parseFloat(req.body.targetValue) 
            : req.body.targetValue;
        }
        
        // Check if user has permission to create goals on this farm
        const hasPermission = await storage.checkUserAccess(
          req.user.id,
          farmId,
          SystemModule.GOALS, 
          AccessLevel.MANAGE
        );
        
        if (!hasPermission) {
          return res.status(403).json({ message: "You don't have permission to create goals" });
        }
        
        console.log("Creating goal with data:", goalData);
        
        const goal = await storage.createGoal(goalData);
        console.log("Goal created successfully:", goal);
        res.status(201).json(goal);
      } catch (error) {
        console.error("Error creating goal:", error);
        res.status(500).json({ message: "Failed to create goal" });
      }
    }
  );
  
  app.patch("/api/goals/:goalId", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const goalId = parseInt(req.params.goalId);
      
      try {
        // Get the goal to check permissions
        const goal = await storage.getGoal(goalId);
        if (!goal) return res.status(404).json({ message: "Goal not found" });
        
        // Check if user has permission to update goals on this farm
        const hasPermission = await storage.checkUserAccess(
          req.user.id,
          goal.farmId,
          SystemModule.GOALS,
          AccessLevel.EDIT
        );
        
        if (!hasPermission) {
          return res.status(403).json({ message: "You don't have permission to update goals" });
        }
        
        console.log("Update request body:", req.body);
        
        // Criar objeto de atualização mais simples e direto
        const updateData: any = {};
        
        // Copiar campos string básicos diretamente
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.status !== undefined) updateData.status = req.body.status;
        if (req.body.unit !== undefined) updateData.unit = req.body.unit;
        if (req.body.notes !== undefined) updateData.notes = req.body.notes;
        
        // Converter e copiar valores numéricos
        if (req.body.assignedTo !== undefined) {
          updateData.assignedTo = parseInt(req.body.assignedTo);
        }
        
        if (req.body.targetValue !== undefined) {
          updateData.targetValue = typeof req.body.targetValue === 'string'
            ? parseFloat(req.body.targetValue)
            : req.body.targetValue;
        }
        
        if (req.body.actualValue !== undefined) {
          updateData.actualValue = typeof req.body.actualValue === 'string'
            ? parseFloat(req.body.actualValue)
            : req.body.actualValue;
        }
        
        // Processar datas
        if (req.body.startDate !== undefined) {
          try {
            updateData.startDate = new Date(req.body.startDate);
            if (isNaN(updateData.startDate.getTime())) {
              updateData.startDate = new Date();
            }
          } catch (err) {
            updateData.startDate = new Date();
          }
        }
        
        if (req.body.endDate !== undefined) {
          try {
            updateData.endDate = new Date(req.body.endDate);
            if (isNaN(updateData.endDate.getTime())) {
              const future = new Date();
              future.setDate(future.getDate() + 30);
              updateData.endDate = future;
            }
          } catch (err) {
            const future = new Date();
            future.setDate(future.getDate() + 30);
            updateData.endDate = future;
          }
        }
        
        if (req.body.completionDate !== undefined) {
          try {
            updateData.completionDate = req.body.completionDate
              ? new Date(req.body.completionDate)
              : null;
              
            if (updateData.completionDate && isNaN(updateData.completionDate.getTime())) {
              updateData.completionDate = null;
            }
          } catch (err) {
            updateData.completionDate = null;
          }
        }
        
        console.log("Updating goal with data:", updateData);
        
        // Update the goal
        const updatedGoal = await storage.updateGoal(goalId, updateData);
        console.log("Goal updated successfully:", updatedGoal);
        res.json(updatedGoal);
      } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ message: "Failed to update goal" });
      }
    }
  );

  // Species routes
  app.get("/api/species", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const allSpecies = await storage.getAllSpecies();
      res.json(allSpecies);
    } catch (error) {
      console.error("Error fetching species:", error);
      res.status(500).json({ message: "Failed to fetch species" });
    }
  });

  app.get("/api/species/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const speciesId = parseInt(req.params.id, 10);
      const species = await storage.getSpecies(speciesId);
      
      if (!species) {
        return res.status(404).json({ message: "Species not found" });
      }
      
      res.json(species);
    } catch (error) {
      console.error("Error fetching species:", error);
      res.status(500).json({ message: "Failed to fetch species" });
    }
  });

  app.post("/api/species", 
    checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), 
    async (req, res) => {
      try {
        const newSpecies = await storage.createSpecies(req.body);
        res.status(201).json(newSpecies);
      } catch (error) {
        console.error("Error creating species:", error);
        res.status(500).json({ message: "Failed to create species" });
      }
    }
  );

  app.patch("/api/species/:id", 
    checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), 
    async (req, res) => {
      try {
        const speciesId = parseInt(req.params.id, 10);
        
        // Check if species exists
        const species = await storage.getSpecies(speciesId);
        if (!species) {
          return res.status(404).json({ message: "Species not found" });
        }
        
        // Update species
        const updatedSpecies = await storage.updateSpecies(speciesId, req.body);
        res.json(updatedSpecies);
      } catch (error) {
        console.error("Error updating species:", error);
        res.status(500).json({ message: "Failed to update species" });
      }
    }
  );

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Import hashPassword function from auth.ts
import { hashPassword } from "./auth";
