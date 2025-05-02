import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { UserRole } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Define middleware for role checking
  const { checkRole } = app.locals;

  // Farm routes
  app.get("/api/farms", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farms = await storage.getFarmsByOwner(req.user.id);
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
  app.get("/api/farms/:farmId/animals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const animals = await storage.getAnimalsByFarm(farmId);
      res.json(animals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch animals" });
    }
  });

  app.post("/api/farms/:farmId/animals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
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
  });

  // Crop routes
  app.get("/api/farms/:farmId/crops", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const crops = await storage.getCropsByFarm(farmId);
      res.json(crops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crops" });
    }
  });

  app.post("/api/farms/:farmId/crops", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
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
  });

  // Inventory routes
  app.get("/api/farms/:farmId/inventory", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const inventory = await storage.getInventoryByFarm(farmId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/farms/:farmId/inventory/critical", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const criticalItems = await storage.getCriticalInventory(farmId);
      res.json(criticalItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch critical inventory" });
    }
  });

  app.post("/api/farms/:farmId/inventory", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
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
  });

  // Task routes
  app.get("/api/farms/:farmId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const tasks = await storage.getTasksByFarm(farmId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/farms/:farmId/tasks/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const pendingTasks = await storage.getPendingTasks(farmId);
      res.json(pendingTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending tasks" });
    }
  });

  app.post("/api/farms/:farmId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
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
  });

  app.patch("/api/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      // This is a placeholder since we don't have a method to get all users in our storage
      // In a real app, you would implement this in the storage class
      const users = Array.from(Array(10).keys()).map(id => {
        return storage.getUser(id);
      });
      
      const resolvedUsers = await Promise.all(users);
      const filteredUsers = resolvedUsers.filter(Boolean);
      
      // Remove passwords from response
      const sanitizedUsers = filteredUsers.map(user => {
        if (!user) return null;
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Import hashPassword function from auth.ts
import { hashPassword } from "./auth";
