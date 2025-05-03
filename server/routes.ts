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
      // Super admin pode ver todas as fazendas
      if (req.user.role === UserRole.SUPER_ADMIN) {
        const farms = await storage.getAllFarms();
        return res.json(farms);
      }
      
      const farms = await storage.getFarmsAccessibleByUser(req.user.id);
      res.json(farms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch farms" });
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
        const newAnimal = await storage.createAnimal({
          ...req.body,
          farmId,
        });
        res.status(201).json(newAnimal);
      } catch (error) {
        res.status(500).json({ message: "Failed to create animal" });
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Import hashPassword function from auth.ts
import { hashPassword } from "./auth";
