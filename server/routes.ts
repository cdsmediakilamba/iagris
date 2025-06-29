import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { UserRole, SystemModule, AccessLevel } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Helper function to check if a user has access to a farm
async function hasAccessToFarm(user: any, farmId: number): Promise<boolean> {
  // Super admin has access to all farms
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Farm admin or user assigned to this farm
  const userFarms = await storage.getUserFarms(user.id);
  return userFarms.some(uf => uf.farmId === farmId);
}

// Helper function to check if a user has permission to modify farm data (for a specific module)
async function hasAccessToModify(user: any, farmId: number, module: SystemModule): Promise<boolean> {
  // Super admin has full access to all modules
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Check if user is a farm admin for this farm
  const userFarms = await storage.getUserFarms(user.id);
  const hasFarmAdminAccess = userFarms.some(uf => uf.farmId === farmId && uf.role === 'admin');
  
  if (hasFarmAdminAccess) {
    return true;
  }
  
  // Check specific module permission
  const permissions = await storage.getUserPermissions(user.id, farmId);
  const modulePermission = permissions.find(p => p.module === module);
  
  if (modulePermission && (
    modulePermission.accessLevel === AccessLevel.FULL || 
    modulePermission.accessLevel === AccessLevel.MANAGE || 
    modulePermission.accessLevel === AccessLevel.EDIT
  )) {
    return true;
  }
  
  return false;
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const name = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    cb(null, `${name}-${timestamp}${extension}`);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Weather API endpoint
  app.get("/api/weather/key", (req, res) => {
    // Return the OpenWeather API key from environment variables
    res.json({ key: process.env.OPENWEATHER_API_KEY });
  });
  
  // Define middleware for role and module access checking
  const { checkRole, checkModuleAccess } = app.locals;
  
  // Simple authentication middleware
  const checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

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

  // Delete farm route
  app.delete("/api/farms/:farmId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const farmId = parseInt(req.params.farmId, 10);
      
      // Get the farm to check permissions
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Only super admin or farm owner/admin can delete a farm
      if (req.user.role !== UserRole.SUPER_ADMIN && 
          farm.createdBy !== req.user.id && 
          farm.adminId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this farm" });
      }
      
      // Delete the farm
      const deleted = await storage.deleteFarm(farmId);
      
      if (deleted) {
        res.status(200).json({ message: "Farm deleted successfully", success: true });
      } else {
        res.status(500).json({ message: "Failed to delete farm" });
      }
    } catch (error) {
      console.error("Error deleting farm:", error);
      res.status(500).json({ message: "Failed to delete farm" });
    }
  });

  // All Users route (for task/goal assignment)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log("Fetching all users for selection");
      
      // Only super admins and farm admins can see all users
      if (req.user && req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "Not authorized to view users" });
      }
      
      const allUsers = await storage.getUsersByRole(UserRole.EMPLOYEE);
      const adminUsers = await storage.getUsersByRole(UserRole.FARM_ADMIN);
      const superAdmins = await storage.getUsersByRole(UserRole.SUPER_ADMIN);
      const managers = await storage.getUsersByRole(UserRole.MANAGER);
      const veterinarians = await storage.getUsersByRole(UserRole.VETERINARIAN);
      const agronomists = await storage.getUsersByRole(UserRole.AGRONOMIST);
      
      // Combine all users and format for selection with farm assignments
      const allUsersList = [...allUsers, ...adminUsers, ...superAdmins, ...managers, ...veterinarians, ...agronomists];
      const users = await Promise.all(allUsersList.map(async user => {
        // Get user's farm assignments
        const farmAssignments = await storage.getUserFarms(user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username,
          farmAssignments: farmAssignments
        };
      }));
      
      console.log(`Returning ${users.length} users for selection`);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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

  // Photo upload route
  app.post("/api/upload-photo", checkAuth, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo foi enviado" });
      }

      // Return the photo path relative to the photos directory
      const photoPath = `/photos/${req.file.filename}`;
      
      res.json({ 
        message: "Foto enviada com sucesso",
        photoPath: photoPath,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Erro no upload da foto:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Animal routes
  app.get("/api/farms/:farmId/animals", 
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        console.log("Getting animals for farm:", farmId);
        const animals = await storage.getAnimalsByFarm(farmId);
        console.log("Retrieved animals:", animals);
        console.log("Number of animals found:", animals.length);
        res.json(animals);
      } catch (error) {
        console.error("Error fetching animals:", error);
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
  
  // Get a single animal by ID
  app.get("/api/animals/:animalId",
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.READ_ONLY),
    async (req, res) => {
      try {
        const animalId = parseInt(req.params.animalId, 10);
        const animal = await storage.getAnimal(animalId);
        
        if (!animal) {
          return res.status(404).json({ message: "Animal not found" });
        }
        
        // Check if user has permission to view this animal's data
        const hasAccess = await storage.checkUserAccess(
          req.user.id,
          animal.farmId,
          SystemModule.ANIMALS,
          AccessLevel.READ_ONLY
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to view this animal" });
        }
        
        res.json(animal);
      } catch (error) {
        console.error("Error fetching animal:", error);
        res.status(500).json({ message: "Failed to fetch animal details" });
      }
    }
  );

  // Update animal route
  app.patch("/api/farms/:farmId/animals/:animalId", 
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const animalId = parseInt(req.params.animalId, 10);
        
        // First, get the animal to check permissions
        const animal = await storage.getAnimal(animalId);
        if (!animal) {
          return res.status(404).json({ message: "Animal not found" });
        }
        
        // Check if animal belongs to the specified farm
        if (animal.farmId !== farmId) {
          return res.status(400).json({ message: "Animal does not belong to this farm" });
        }
        
        // Check if user has permission to update animals on this farm
        const hasAccess = await storage.checkUserAccess(
          req.user.id,
          farmId,
          SystemModule.ANIMALS,
          AccessLevel.FULL
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to update animals" });
        }
        
        console.log("Updating animal with data:", req.body);
        const updatedAnimal = await storage.updateAnimal(animalId, req.body);
        
        if (!updatedAnimal) {
          return res.status(404).json({ message: "Failed to update animal" });
        }
        
        res.json(updatedAnimal);
      } catch (error) {
        console.error("Error updating animal:", error);
        res.status(500).json({ 
          message: "Failed to update animal", 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  // Delete animal route
  app.delete("/api/farms/:farmId/animals/:animalId", 
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const animalId = parseInt(req.params.animalId, 10);
        
        // First, get the animal to check permissions
        const animal = await storage.getAnimal(animalId);
        if (!animal) {
          return res.status(404).json({ message: "Animal not found" });
        }
        
        // Check if animal belongs to the specified farm
        if (animal.farmId !== farmId) {
          return res.status(400).json({ message: "Animal does not belong to this farm" });
        }
        
        // Check if user has permission to delete animals on this farm
        const hasAccess = await storage.checkUserAccess(
          req.user.id,
          farmId,
          SystemModule.ANIMALS,
          AccessLevel.FULL
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to delete animals" });
        }
        
        console.log("Deleting animal:", animalId);
        const success = await storage.deleteAnimal(animalId);
        
        if (!success) {
          return res.status(404).json({ message: "Failed to delete animal" });
        }
        
        res.status(200).json({ message: "Animal deleted successfully", success: true });
      } catch (error) {
        console.error("Error deleting animal:", error);
        res.status(500).json({ 
          message: "Failed to delete animal", 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  // Animal Vaccination routes
  app.get("/api/animals/:animalId/vaccinations",
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.READ_ONLY),
    async (req, res) => {
      try {
        const animalId = parseInt(req.params.animalId, 10);
        
        // First, get the animal to check permissions
        const animal = await storage.getAnimal(animalId);
        if (!animal) {
          return res.status(404).json({ message: "Animal not found" });
        }
        
        // Check if user has permission to view this animal's data
        const hasAccess = await storage.checkUserAccess(
          req.user.id,
          animal.farmId,
          SystemModule.ANIMALS,
          AccessLevel.READ_ONLY
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to view this animal's vaccinations" });
        }
        
        const vaccinations = await storage.getAnimalVaccinationsByAnimal(animalId);
        res.json(vaccinations);
      } catch (error) {
        console.error("Error fetching animal vaccinations:", error);
        res.status(500).json({ message: "Failed to fetch animal vaccinations" });
      }
    }
  );
  
  app.get("/api/farms/:farmId/vaccinations",
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.READ_ONLY),
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const vaccinations = await storage.getAnimalVaccinationsByFarm(farmId);
        res.json(vaccinations);
      } catch (error) {
        console.error("Error fetching farm vaccinations:", error);
        res.status(500).json({ message: "Failed to fetch farm vaccinations" });
      }
    }
  );
  
  app.post("/api/animals/:animalId/vaccinations",
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.FULL),
    async (req, res) => {
      try {
        const animalId = parseInt(req.params.animalId, 10);
        
        // First, get the animal to check permissions and get farmId
        const animal = await storage.getAnimal(animalId);
        if (!animal) {
          return res.status(404).json({ message: "Animal not found" });
        }
        
        // Check if user has permission to add vaccinations
        const hasAccess = await storage.checkUserAccess(
          req.user.id,
          animal.farmId,
          SystemModule.ANIMALS,
          AccessLevel.FULL
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to add vaccinations" });
        }
        
        // Create the vaccination record
        const newVaccination = await storage.createAnimalVaccination({
          ...req.body,
          animalId,
          farmId: animal.farmId,
          appliedBy: req.body.appliedBy || req.user.id // Use the specified user or default to current user
        });
        
        res.status(201).json(newVaccination);
      } catch (error) {
        console.error("Error creating vaccination record:", error);
        res.status(500).json({ message: "Failed to create vaccination record" });
      }
    }
  );
  
  app.patch("/api/vaccinations/:vaccinationId",
    checkModuleAccess(SystemModule.ANIMALS, AccessLevel.FULL),
    async (req, res) => {
      try {
        const vaccinationId = parseInt(req.params.vaccinationId, 10);
        
        // Get the vaccination to check permissions
        const vaccination = await storage.getAnimalVaccination(vaccinationId);
        if (!vaccination) {
          return res.status(404).json({ message: "Vaccination record not found" });
        }
        
        // Check if user has permission to update vaccinations
        const hasAccess = await storage.checkUserAccess(
          req.user.id,
          vaccination.farmId,
          SystemModule.ANIMALS,
          AccessLevel.FULL
        );
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to update vaccination records" });
        }
        
        // Update the vaccination record
        const updatedVaccination = await storage.updateAnimalVaccination(vaccinationId, req.body);
        
        if (!updatedVaccination) {
          return res.status(404).json({ message: "Failed to update vaccination record" });
        }
        
        res.json(updatedVaccination);
      } catch (error) {
        console.error("Error updating vaccination record:", error);
        res.status(500).json({ message: "Failed to update vaccination record" });
      }
    }
  );

  // Crop routes
  app.get("/api/farms/:farmId/crops", 
    checkModuleAccess(SystemModule.CROPS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const { status, sector, search } = req.query;
        
        // Obter todas as plantações da fazenda
        let crops = await storage.getCropsByFarm(farmId);
        
        // Filtrar por status se especificado
        if (status) {
          crops = crops.filter(crop => crop.status === status);
        }
        
        // Filtrar por setor se especificado
        if (sector) {
          crops = crops.filter(crop => crop.sector === sector);
        }
        
        // Filtrar por texto de busca se especificado
        if (search) {
          const searchTerm = search.toString().toLowerCase();
          crops = crops.filter(crop => 
            crop.name.toLowerCase().includes(searchTerm) || 
            crop.sector.toLowerCase().includes(searchTerm)
          );
        }
        
        res.json(crops);
      } catch (error) {
        console.error("Erro ao buscar plantações:", error);
        res.status(500).json({ message: "Failed to fetch crops" });
      }
    }
  );
  
  // Obter uma plantação específica
  app.get("/api/farms/:farmId/crops/:cropId", 
    checkModuleAccess(SystemModule.CROPS, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const cropId = parseInt(req.params.cropId, 10);
        
        const crop = await storage.getCrop(cropId);
        
        if (!crop) {
          return res.status(404).json({ message: "Plantação não encontrada" });
        }
        
        // Verificar se a plantação pertence à fazenda especificada
        if (crop.farmId !== farmId) {
          return res.status(403).json({ message: "Plantação não pertence à fazenda especificada" });
        }
        
        res.json(crop);
      } catch (error) {
        console.error("Erro ao buscar plantação:", error);
        res.status(500).json({ message: "Falha ao buscar detalhes da plantação" });
      }
    }
  );
  
  // Atualizar uma plantação específica
  app.patch("/api/farms/:farmId/crops/:cropId", 
    checkModuleAccess(SystemModule.CROPS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const cropId = parseInt(req.params.cropId, 10);
        
        // Verificar se a plantação existe
        const crop = await storage.getCrop(cropId);
        if (!crop) {
          return res.status(404).json({ message: "Plantação não encontrada" });
        }
        
        // Verificar se a plantação pertence à fazenda especificada
        if (crop.farmId !== farmId) {
          return res.status(403).json({ message: "Plantação não pertence à fazenda especificada" });
        }
        
        // Validar os dados enviados
        if (req.body.area !== undefined) {
          const area = Number(req.body.area);
          if (isNaN(area) || area <= 0) {
            return res.status(400).json({ message: "Área deve ser um número positivo" });
          }
          req.body.area = area;
        }
        
        // Validar status se fornecido
        const validStatuses = ['growing', 'harvested', 'finished', 'waiting'];
        if (req.body.status && !validStatuses.includes(req.body.status)) {
          return res.status(400).json({ 
            message: "Status inválido", 
            validStatuses 
          });
        }
        
        // Processar datas se fornecidas
        if (req.body.plantingDate) {
          try {
            req.body.plantingDate = new Date(req.body.plantingDate);
          } catch (e) {
            return res.status(400).json({ message: "Data de plantio inválida" });
          }
        }
        
        if (req.body.expectedHarvestDate) {
          try {
            req.body.expectedHarvestDate = new Date(req.body.expectedHarvestDate);
          } catch (e) {
            return res.status(400).json({ message: "Data esperada de colheita inválida" });
          }
        }
        
        // Atualizar a plantação
        const updatedCrop = await storage.updateCrop(cropId, req.body);
        
        res.json(updatedCrop);
      } catch (error) {
        console.error("Erro ao atualizar plantação:", error);
        res.status(500).json({ 
          message: "Falha ao atualizar plantação",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  app.post("/api/farms/:farmId/crops", 
    checkModuleAccess(SystemModule.CROPS, AccessLevel.FULL), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        
        // Log detalhes da requisição para diagnóstico
        console.log("Creating crop with data:", { 
          body: req.body,
          farmId 
        });
        
        // Garantir que os campos obrigatórios estão presentes
        if (!req.body.name || !req.body.sector || req.body.area === undefined) {
          return res.status(400).json({ 
            message: "Campos obrigatórios ausentes", 
            requiredFields: ["name", "sector", "area"] 
          });
        }
        
        // Garantir que a área é um número
        const area = Number(req.body.area);
        if (isNaN(area) || area <= 0) {
          return res.status(400).json({ 
            message: "Área deve ser um número positivo" 
          });
        }
        
        // Validar status se fornecido
        const validStatuses = ['growing', 'harvested', 'finished', 'waiting'];
        if (req.body.status && !validStatuses.includes(req.body.status)) {
          return res.status(400).json({ 
            message: "Status inválido", 
            validStatuses 
          });
        }
        
        // Criar a plantação com dados validados
        const cropData = {
          name: req.body.name,
          sector: req.body.sector,
          area: area,
          status: req.body.status || "growing",
          farmId: farmId,
          plantingDate: req.body.plantingDate ? new Date(req.body.plantingDate) : new Date(),
          expectedHarvestDate: req.body.expectedHarvestDate ? new Date(req.body.expectedHarvestDate) : null,
        };
        
        console.log("Sending validated crop data to storage:", cropData);
        const newCrop = await storage.createCrop(cropData);
        
        console.log("Crop created successfully:", newCrop);
        res.status(201).json(newCrop);
      } catch (error) {
        console.error("Error creating crop:", error);
        res.status(500).json({ 
          message: "Failed to create crop", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  );

  // Inventory routes
  app.get("/api/farms/:farmId/inventory", 
    checkModuleAccess(SystemModule.INVENTORY, AccessLevel.READ_ONLY), 
    async (req, res) => {
      try {
        const farmId = parseInt(req.params.farmId, 10);
        console.log(`Buscando inventário para fazenda: ${farmId}`);
        const inventory = await storage.getInventoryByFarm(farmId);
        console.log(`Inventário recuperado: ${inventory.length} itens`);
        console.log(inventory);
        res.json(inventory);
      } catch (error) {
        console.error("Erro ao buscar inventário:", error);
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
        
        console.log("Inventory item being created:", {
          ...req.body,
          farmId,
        });
        
        const newItem = await storage.createInventoryItem({
          ...req.body,
          farmId,
        });
        res.status(201).json(newItem);
      } catch (error) {
        console.error("Error creating inventory item:", error);
        res.status(500).json({ message: "Falha ao criar item de inventário" });
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
        
        console.log(`Encontradas ${transactions.length} transações para farmId ${farmId}:`, 
          transactions.length > 0 ? transactions[0] : 'Nenhuma transação');
        
        // Verificação detalhada dos dados
        if (transactions.length > 0) {
          console.log("Tipo de dado retornado:", transactions[0].constructor.name);
          console.log("Propriedades da primeira transação:", Object.keys(transactions[0]));
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
        const { quantity, notes, documentNumber, unitPrice, farmId } = req.body;
        
        if (!quantity || quantity <= 0) {
          return res.status(400).json({ message: "Valid quantity is required" });
        }
        
        const item = await storage.getInventoryItem(itemId);
        if (!item) {
          return res.status(404).json({ message: "Inventory item not found" });
        }
        
        // Verificar se farmId foi fornecido e se combina com o farmId do item
        if (farmId && item.farmId !== farmId) {
          return res.status(400).json({ message: "Farm ID does not match item's farm" });
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
      console.log("=== EXECUTING /api/users endpoint ===");
      let users = [];
      
      if (req.user.role === UserRole.SUPER_ADMIN) {
        // Super admin can see all users - try to get users up to ID 100 to cover all created users
        const usersPromises = Array.from(Array(100).keys()).map(id => {
          return storage.getUser(id + 1); // Start from ID 1
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
      
      // Remove passwords from response and include farm assignments
      const sanitizedUsers = await Promise.all(users.map(async user => {
        const { password, ...userWithoutPassword } = user;
        // Get user's farm assignments
        const userFarms = await storage.getUserFarms(user.id);
        console.log(`User ${user.name} (ID: ${user.id}) farm assignments:`, userFarms);
        return {
          ...userWithoutPassword,
          farmAssignments: userFarms
        };
      }));
      
      console.log('Sample user with farm assignments:', sanitizedUsers[0]);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      console.log("Creating user with data:", req.body);
      
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
      
      console.log("User created successfully:", newUser.id);
      
      // If farmId is provided, assign the new user to the farm
      if (req.body.farmId) {
        // Assign the new user to the farm
        await storage.assignUserToFarm({
          userId: newUser.id,
          farmId: req.body.farmId,
          role: req.body.farmRole || 'member'
        });
        console.log("User assigned to farm:", req.body.farmId);
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  // Update user
  app.patch("/api/users/:id", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent users from editing themselves if it would remove their admin privileges
      if (userId === req.user.id && req.body.role && req.body.role !== req.user.role) {
        return res.status(403).json({ message: "Cannot change your own role" });
      }

      // Farm admins cannot modify super admins or create super admins
      if (req.user.role === UserRole.FARM_ADMIN) {
        if (existingUser.role === UserRole.SUPER_ADMIN) {
          return res.status(403).json({ message: "Farm administrators cannot modify super admin accounts" });
        }
        if (req.body.role === UserRole.SUPER_ADMIN) {
          return res.status(403).json({ message: "Farm administrators cannot assign super admin role" });
        }
      }

      // Hash password if it's being updated
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      // Handle farm assignment changes
      const newFarmId = updateData.farmId;
      const oldFarmId = existingUser.farmId;

      // Update the user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle user-farm relationship changes
      if (newFarmId !== oldFarmId) {
        // Remove from old farm if existed
        if (oldFarmId) {
          await storage.removeUserFromFarm(userId, oldFarmId);
        }

        // Add to new farm if specified
        if (newFarmId) {
          // Check if farm exists
          const farm = await storage.getFarm(newFarmId);
          if (farm) {
            // Check if user is not already assigned to this farm
            const existingUserFarms = await storage.getUserFarms(userId);
            const alreadyAssigned = existingUserFarms.some(uf => uf.farmId === newFarmId);
            
            if (!alreadyAssigned) {
              // Determine the role in the farm based on user's system role
              let farmRole = "member";
              if (updatedUser.role === "farm_admin") {
                farmRole = "admin";
              } else if (updatedUser.role === "manager") {
                farmRole = "manager";
              } else if (updatedUser.role === "employee") {
                farmRole = "worker";
              } else if (updatedUser.role === "veterinarian" || updatedUser.role === "agronomist") {
                farmRole = "specialist";
              }

              await storage.assignUserToFarm({
                userId: userId,
                farmId: newFarmId,
                role: farmRole
              });
            }
          }
        }
      }

      // Don't send password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", checkRole([UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent users from deleting themselves
      if (userId === req.user.id) {
        return res.status(403).json({ message: "Cannot delete your own account" });
      }

      // Farm admins cannot delete super admins
      if (req.user.role === UserRole.FARM_ADMIN && existingUser.role === UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: "Farm administrators cannot delete super admin accounts" });
      }

      // Note: In a production system, you might want to soft delete or archive users
      // instead of hard deleting them to preserve data integrity
      
      // For now, we'll just remove the user from the users table
      // In a real implementation, you'd want to handle related data cleanup
      const deleted = await storage.deleteUser?.(userId);
      
      if (deleted) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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
  
  // Nova rota para obter todas as metas
  app.get("/api/goals", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.user as any;
      
      try {
        // Para super admins, retornar todas as metas
        if (user.role === UserRole.SUPER_ADMIN) {
          const goals = await storage.getAllGoals();
          return res.json(goals);
        }
        
        // Para outros usuários, buscar apenas metas das fazendas a que têm acesso
        const farms = await storage.getFarmsAccessibleByUser(user.id);
        const farmIds = farms.map(farm => farm.id);
        
        if (farmIds.length === 0) {
          return res.json([]);
        }
        
        // Buscar todas as metas e filtrar por fazendas acessíveis
        const allGoals = await storage.getAllGoals();
        const accessibleGoals = allGoals.filter(goal => farmIds.includes(goal.farmId));
        
        res.json(accessibleGoals);
      } catch (error) {
        console.error("Error fetching all goals:", error);
        res.status(500).json({ message: "Failed to fetch goals" });
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

  // COSTS MANAGEMENT ROUTES
  // Get all costs for a farm
  app.get("/api/farms/:farmId/costs", (req, res, next) => {
    checkAuth(req, res, next);
  }, async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Check if the user has access to this farm
      if (!await hasAccessToFarm(req.user, farmId)) {
        return res.status(403).json({ message: "You don't have access to this farm" });
      }
      
      // Parse query parameters for filtering
      const { category, startDate, endDate } = req.query;
      
      let costs;
      
      if (category && typeof category === 'string') {
        // Filter by category
        costs = await storage.getCostsByCategory(farmId, category);
      } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        // Filter by date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        costs = await storage.getCostsByPeriod(farmId, start, end);
      } else {
        // Get all costs for the farm
        costs = await storage.getCostsByFarm(farmId);
      }
      
      res.json(costs);
    } catch (error) {
      console.error("Error fetching farm costs:", error);
      res.status(500).json({ message: "Failed to fetch farm costs" });
    }
  });
  
  // Get a specific cost by ID
  app.get("/api/costs/:id", (req, res, next) => {
    checkAuth(req, res, next);
  }, async (req, res) => {
    try {
      const costId = parseInt(req.params.id, 10);
      
      const cost = await storage.getCost(costId);
      if (!cost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      // Check if the user has access to the farm this cost belongs to
      if (!await hasAccessToFarm(req.user, cost.farmId)) {
        return res.status(403).json({ message: "You don't have access to this cost" });
      }
      
      res.json(cost);
    } catch (error) {
      console.error("Error fetching cost:", error);
      res.status(500).json({ message: "Failed to fetch cost" });
    }
  });
  
  // Get a specific cost by ID
  app.get("/api/farms/:farmId/costs/:id", (req, res, next) => {
    checkAuth(req, res, next);
  }, async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const costId = parseInt(req.params.id, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Check if the user has access to this farm
      if (!await hasAccessToFarm(req.user, farmId)) {
        return res.status(403).json({ message: "You don't have access to this farm" });
      }
      
      // Get the cost
      const cost = await storage.getCost(costId);
      if (!cost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      // Verify the cost belongs to the specified farm
      if (cost.farmId !== farmId) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      res.json(cost);
    } catch (error) {
      console.error("Error fetching cost:", error);
      res.status(500).json({ message: "Failed to fetch cost" });
    }
  });

  // Create a new cost
  app.post("/api/farms/:farmId/costs", (req, res, next) => {
    checkAuth(req, res, next);
  }, async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Check if the user has access to modify this farm
      if (!await hasAccessToModify(req.user, farmId, SystemModule.COSTS)) {
        return res.status(403).json({ message: "You don't have permission to add costs to this farm" });
      }
      
      // Prepare cost data
      const costData = {
        ...req.body,
        farmId,
        createdBy: req.user.id
      };
      
      // Create the cost
      const newCost = await storage.createCost(costData);
      
      res.status(201).json(newCost);
    } catch (error) {
      console.error("Error creating cost:", error);
      res.status(500).json({ message: "Failed to create cost" });
    }
  });
  
  // Update a cost
  app.patch("/api/farms/:farmId/costs/:id", (req, res, next) => {
    checkAuth(req, res, next);
  }, async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const costId = parseInt(req.params.id, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Get the existing cost
      const existingCost = await storage.getCost(costId);
      if (!existingCost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      // Verify the cost belongs to the specified farm
      if (existingCost.farmId !== farmId) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      // Check if the user has access to modify this cost
      if (!await hasAccessToModify(req.user, farmId, SystemModule.COSTS)) {
        return res.status(403).json({ message: "You don't have permission to update this cost" });
      }
      
      // Update the cost
      const updatedCost = await storage.updateCost(costId, req.body);
      
      res.json(updatedCost);
    } catch (error) {
      console.error("Error updating cost:", error);
      res.status(500).json({ message: "Failed to update cost" });
    }
  });
  
  // Delete a cost
  app.delete("/api/farms/:farmId/costs/:id", (req, res, next) => {
    checkAuth(req, res, next);
  }, async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      const costId = parseInt(req.params.id, 10);
      
      // Ensure the farm exists
      const farm = await storage.getFarm(farmId);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Get the existing cost
      const existingCost = await storage.getCost(costId);
      if (!existingCost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      // Verify the cost belongs to the specified farm
      if (existingCost.farmId !== farmId) {
        return res.status(404).json({ message: "Cost not found" });
      }
      
      // Check if the user has access to delete this cost
      if (!await hasAccessToModify(req.user, farmId, SystemModule.COSTS)) {
        return res.status(403).json({ message: "You don't have permission to delete this cost" });
      }
      
      // Delete the cost
      const deleted = await storage.deleteCost(costId);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete the cost" });
      }
    } catch (error) {
      console.error("Error deleting cost:", error);
      res.status(500).json({ message: "Failed to delete cost" });
    }
  });

  // ======= REMOVED ANIMALS ROUTES =======
  
  // Remove an animal (delete with history tracking)
  app.delete("/api/animals/:animalId/remove", checkAuth, async (req, res) => {
      try {
        const animalId = parseInt(req.params.animalId, 10);
        
        // Validate required fields
        if (!req.body.removalReason) {
          return res.status(400).json({ message: "removalReason is required" });
        }
        
        // Get the animal to check farm access
        const animal = await storage.getAnimal(animalId);
        if (!animal) {
          return res.status(404).json({ message: "Animal not found" });
        }
        
        // Check if user has access to this farm
        if (!await hasAccessToFarm(req.user, animal.farmId)) {
          return res.status(403).json({ message: "You don't have permission to remove animals from this farm" });
        }
        
        const removalData = {
          removalReason: req.body.removalReason,
          removalObservations: req.body.removalObservations || null,
          removedBy: req.user.id,
          salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : undefined,
          buyer: req.body.buyer || null,
          transferDestination: req.body.transferDestination || null
        };
        
        const removedAnimal = await storage.removeAnimal(animalId, removalData);
        res.status(200).json(removedAnimal);
      } catch (error) {
        console.error("Error removing animal:", error);
        res.status(500).json({ message: "Failed to remove animal" });
      }
    }
  );
  
  // Get all removed animals (for super admin and cross-farm view)
  app.get("/api/removed-animals", checkAuth, async (req, res) => {
    try {
      let removedAnimals;
      
      if (req.user.role === 'super_admin') {
        // Super admin can see all removed animals
        removedAnimals = await storage.getAllRemovedAnimals();
      } else {
        // Regular users can only see animals from their accessible farms
        const userFarms = await storage.getFarmsAccessibleByUser(req.user.id);
        const farmIds = userFarms.map(farm => farm.id);
        
        if (farmIds.length === 0) {
          return res.json([]);
        }
        
        // Get removed animals from all accessible farms
        const allRemovedAnimals = await storage.getAllRemovedAnimals();
        removedAnimals = allRemovedAnimals.filter(animal => 
          farmIds.includes(animal.farmId)
        );
      }
      
      res.json(removedAnimals);
    } catch (error) {
      console.error("Error fetching removed animals:", error);
      res.status(500).json({ message: "Failed to fetch removed animals" });
    }
  });

  // Get removed animals by farm
  app.get("/api/farms/:farmId/removed-animals", checkAuth, async (req, res) => {
    try {
      const farmId = parseInt(req.params.farmId, 10);
      
      // Check if user has access to this farm
      if (!await hasAccessToFarm(req.user, farmId)) {
        return res.status(403).json({ message: "You don't have access to this farm" });
      }
      
      const removedAnimals = await storage.getRemovedAnimalsByFarm(farmId);
      res.json(removedAnimals);
    } catch (error) {
      console.error("Error fetching removed animals:", error);
      res.status(500).json({ message: "Failed to fetch removed animals" });
    }
  });
  
  // Get removed animals by reason
  app.get("/api/farms/:farmId/removed-animals/reason/:reason", 
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      try {
        const farmId = parseInt(req.params.farmId, 10);
        const reason = req.params.reason;
        
        // Check if user has access to this farm
        if (!await hasAccessToFarm(req.user, farmId)) {
          return res.status(403).json({ message: "You don't have access to this farm" });
        }
        
        const removedAnimals = await storage.getRemovedAnimalsByReason(farmId, reason);
        res.json(removedAnimals);
      } catch (error) {
        console.error("Error fetching removed animals by reason:", error);
        res.status(500).json({ message: "Failed to fetch removed animals" });
      }
    }
  );

  // ======================
  // TEMPORARY EMPLOYEES ROUTES
  // ======================

  // Get all temporary employees (for super admin) or by farm
  app.get("/api/temporary-employees", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      const farmId = req.query.farmId ? parseInt(req.query.farmId as string) : null;

      // Only Super Admin and Farm Admin can access temporary employees
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to view temporary employees" });
      }

      let employees;

      if (user.role === UserRole.SUPER_ADMIN) {
        if (farmId) {
          employees = await storage.getTemporaryEmployeesByFarm(farmId);
        } else {
          employees = await storage.getAllTemporaryEmployees();
        }
      } else {
        // Farm admin - only their farm
        const userFarms = await storage.getUserFarms(user.id);
        if (userFarms.length === 0) {
          return res.status(403).json({ message: "No farms assigned" });
        }
        
        const targetFarmId = farmId || userFarms[0].farmId;
        const hasAccess = userFarms.some(uf => uf.farmId === targetFarmId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to this farm" });
        }
        
        employees = await storage.getTemporaryEmployeesByFarm(targetFarmId);
      }

      res.json(employees);
    } catch (error) {
      console.error("Error fetching temporary employees:", error);
      res.status(500).json({ message: "Failed to fetch temporary employees" });
    }
  });

  // Get a specific temporary employee
  app.get("/api/temporary-employees/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      const employeeId = parseInt(req.params.id);

      // Only Super Admin and Farm Admin can access
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to view temporary employees" });
      }

      const employee = await storage.getTemporaryEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check farm access for farm admin
      if (user.role === UserRole.FARM_ADMIN) {
        if (!await hasAccessToFarm(user, employee.farmId)) {
          return res.status(403).json({ message: "You don't have access to this employee" });
        }
      }

      res.json(employee);
    } catch (error) {
      console.error("Error fetching temporary employee:", error);
      res.status(500).json({ message: "Failed to fetch temporary employee" });
    }
  });

  // Create a new temporary employee
  app.post("/api/temporary-employees", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;

      // Only Super Admin and Farm Admin can create
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to create temporary employees" });
      }

      const employeeData = {
        ...req.body,
        createdBy: user.id
      };

      // Check farm access for farm admin
      if (user.role === UserRole.FARM_ADMIN) {
        if (!await hasAccessToFarm(user, employeeData.farmId)) {
          return res.status(403).json({ message: "You don't have access to this farm" });
        }
      }

      const employee = await storage.createTemporaryEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating temporary employee:", error);
      res.status(500).json({ message: "Failed to create temporary employee" });
    }
  });

  // Update a temporary employee
  app.patch("/api/temporary-employees/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      const employeeId = parseInt(req.params.id);

      // Only Super Admin and Farm Admin can update
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to update temporary employees" });
      }

      const existingEmployee = await storage.getTemporaryEmployee(employeeId);
      
      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check farm access for farm admin
      if (user.role === UserRole.FARM_ADMIN) {
        if (!await hasAccessToFarm(user, existingEmployee.farmId)) {
          return res.status(403).json({ message: "You don't have access to this employee" });
        }
      }

      const employee = await storage.updateTemporaryEmployee(employeeId, req.body);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error updating temporary employee:", error);
      res.status(500).json({ message: "Failed to update temporary employee" });
    }
  });

  // Delete a temporary employee
  app.delete("/api/temporary-employees/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      const employeeId = parseInt(req.params.id);

      // Only Super Admin and Farm Admin can delete
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to delete temporary employees" });
      }

      const existingEmployee = await storage.getTemporaryEmployee(employeeId);
      
      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check farm access for farm admin
      if (user.role === UserRole.FARM_ADMIN) {
        if (!await hasAccessToFarm(user, existingEmployee.farmId)) {
          return res.status(403).json({ message: "You don't have access to this employee" });
        }
      }

      const success = await storage.deleteTemporaryEmployee(employeeId);
      
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting temporary employee:", error);
      res.status(500).json({ message: "Failed to delete temporary employee" });
    }
  });

  // Get employees with expiring contracts
  app.get("/api/temporary-employees/expiring/:farmId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      const farmId = parseInt(req.params.farmId);
      const daysThreshold = req.query.days ? parseInt(req.query.days as string) : 30;

      // Only Super Admin and Farm Admin can access
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FARM_ADMIN) {
        return res.status(403).json({ message: "You don't have permission to view temporary employees" });
      }

      // Check farm access
      if (!await hasAccessToFarm(user, farmId)) {
        return res.status(403).json({ message: "You don't have access to this farm" });
      }

      const expiringEmployees = await storage.getExpiringContracts(farmId, daysThreshold);
      res.json(expiringEmployees);
    } catch (error) {
      console.error("Error fetching expiring contracts:", error);
      res.status(500).json({ message: "Failed to fetch expiring contracts" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Import hashPassword function from auth.ts
import { hashPassword } from "./auth";
