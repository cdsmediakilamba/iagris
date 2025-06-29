import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define tipos de transação de inventário
export enum InventoryTransactionType {
  IN = "in",      // Entrada no estoque
  OUT = "out",    // Saída do estoque
  ADJUST = "adjust" // Ajuste de inventário
}

// Define user roles for the system
export enum UserRole {
  SUPER_ADMIN = "super_admin", // Administrator geral do sistema
  FARM_ADMIN = "farm_admin",   // Administrador de uma fazenda específica
  MANAGER = "manager",         // Gerente com permissões amplas
  EMPLOYEE = "employee",       // Funcionário regular
  VETERINARIAN = "veterinarian",
  AGRONOMIST = "agronomist",
  CONSULTANT = "consultant"
}

// Define levels of access for modules
export enum AccessLevel {
  FULL = "full",               // Acesso completo
  READ_ONLY = "read_only",     // Somente leitura
  NONE = "none",               // Sem acesso
  MANAGE = "manage",           // Gerenciar (criar, editar, excluir)
  EDIT = "edit",               // Editar (editar apenas)
  VIEW = "view"                // Visualizar (somente leitura)
}

// Define system modules
export enum SystemModule {
  ANIMALS = "animals",
  CROPS = "crops",
  INVENTORY = "inventory",
  TASKS = "tasks",
  EMPLOYEES = "employees",
  FINANCIAL = "financial",
  REPORTS = "reports",
  GOALS = "goals",
  COSTS = "costs", // Novo módulo de custos
  ADMINISTRATION = "administration" // Módulo para administração do sistema
}

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default(UserRole.EMPLOYEE),
  farmId: integer("farm_id"), // NULL para super_admin (pode ver todas as fazendas)
  createdAt: timestamp("created_at").defaultNow(),
});

// Farm table schema
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  size: integer("size"), // Tamanho em hectares (opcional)
  createdBy: integer("created_by"), // ID do usuário admin que criou a fazenda
  adminId: integer("admin_id"), // ID do usuário administrador da fazenda
  description: text("description"), // Descrição da fazenda
  coordinates: text("coordinates"), // Coordenadas geográficas
  type: text("type"), // Tipo de fazenda (crops, livestock, mixed)
  createdAt: timestamp("created_at").defaultNow(),
});

// Relação entre usuários e fazendas (muitos para muitos)
export const userFarms = pgTable("user_farms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  farmId: integer("farm_id").notNull(),
  role: text("role").notNull().default("member"), // Papel do usuário na fazenda: admin, manager, worker, visitor, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Permissões de acesso aos módulos para cada usuário em cada fazenda
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  farmId: integer("farm_id").notNull(),
  module: text("module").notNull(), // Usar o enum SystemModule
  accessLevel: text("access_level").notNull(), // Usar o enum AccessLevel
  createdAt: timestamp("created_at").defaultNow(),
});

// Species table schema
export const species = pgTable("species", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Animal table schema
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  registrationCode: text("registration_code").notNull().unique(), // Formatted as [ABREVIAÇÃO_DA_ESPÉCIE]-[DATA]-[SEQUENCIAL_DIÁRIO]
  name: text("name"), // Nome ou identificação (opcional)
  speciesId: integer("species_id").notNull(), // FK para tabela de espécies
  breed: text("breed").notNull(),
  gender: text("gender").notNull(),
  birthDate: timestamp("birth_date"),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  farmId: integer("farm_id").notNull(),
  status: text("status").notNull().default("active"), // active, slaughtered, dead, sold, transferred
  observations: text("observations"),
  fatherId: integer("father_id"), // FK opcional para o animal pai
  motherId: integer("mother_id"), // FK opcional para o animal mãe
  lastVaccineDate: timestamp("last_vaccine_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Crop table schema
export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  area: integer("area").notNull(), // In hectares
  plantingDate: timestamp("planting_date"),
  expectedHarvestDate: timestamp("expected_harvest_date"),
  status: text("status").notNull().default("growing"),
  farmId: integer("farm_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory table schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // feed, medicine, seeds, fertilizer, etc.
  quantity: decimal("quantity").notNull(), // Alterado para decimal para ter maior precisão
  unit: text("unit").notNull(), // kg, liters, bags, etc.
  farmId: integer("farm_id").notNull(),
  minimumLevel: decimal("minimum_level"),
  lastUpdated: timestamp("last_updated").defaultNow(), // Data da última atualização
  price: decimal("price"), // Preço unitário (opcional)
  supplier: text("supplier"), // Fornecedor (opcional)
  location: text("location"), // Localização dentro da fazenda (opcional)
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de transações de inventário
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").notNull(), // Referência ao item de inventário
  type: text("type").notNull(), // "in", "out", "adjust"
  quantity: decimal("quantity").notNull(), // Quantidade da transação
  previousBalance: decimal("previous_balance").notNull(), // Saldo anterior
  newBalance: decimal("new_balance").notNull(), // Novo saldo após a transação
  date: timestamp("date").defaultNow().notNull(), // Data da transação
  documentNumber: text("document_number"), // Número do documento (nota fiscal, requisição, etc.)
  userId: integer("user_id").notNull(), // Usuário que realizou a transação
  farmId: integer("farm_id").notNull(), // Fazenda relacionada
  notes: text("notes"), // Observações
  destinationOrSource: text("destination_or_source"), // Destino ou origem do material
  unitPrice: decimal("unit_price"), // Preço unitário (para entrada)
  totalPrice: decimal("total_price"), // Preço total da transação
  category: text("category"), // Categoria da transação (ex: compra, transferência, consumo)
  createdAt: timestamp("created_at").defaultNow(),
});

// Task table schema 
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to"), // User ID
  category: text("category").notNull(), // animal, crop, inventory, general
  relatedId: integer("related_id"), // Animal ID, Crop ID, etc.
  farmId: integer("farm_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define goal/target status
export enum GoalStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  PARTIAL = "partial",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

// Define units of measurement for goals
export enum GoalUnit {
  HECTARES = "hectares",
  METERS = "meters",
  UNITS = "units",
  KILOGRAMS = "kilograms",
  LITERS = "liters",
  PERCENTAGE = "percentage"
}

// Goals/Targets table schema
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").notNull(), // User ID
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  cropId: integer("crop_id"), // Optional: related crop for this goal
  targetValue: decimal("target_value").notNull(), // The target numeric value
  actualValue: decimal("actual_value").default("0"), // The current achieved value
  unit: text("unit").notNull(), // Unit of measurement (hectares, meters, units, etc.)
  status: text("status").notNull().default(GoalStatus.PENDING),
  completionDate: timestamp("completion_date"), // Date when the goal was completed
  farmId: integer("farm_id").notNull(),
  createdBy: integer("created_by").notNull(), // User ID of who created this goal
  notes: text("notes"), // Additional notes or comments
  createdAt: timestamp("created_at").defaultNow(),
});

// Define o status das vacinas para animais
export enum VaccinationStatus {
  SCHEDULED = "scheduled",  // Agendada
  COMPLETED = "completed",  // Concluída
  MISSED = "missed",        // Não realizada
  CANCELLED = "cancelled"   // Cancelada
}

// Define motivos de remoção de animais
export enum AnimalRemovalReason {
  SOLD = "sold",                   // Vendido
  DIED = "died",                   // Morreu
  LOST = "lost",                   // Extraviado/Perdido
  SLAUGHTERED = "slaughtered",     // Abatido
  TRANSFERRED = "transferred",     // Transferido
  STOLEN = "stolen",               // Roubado
  OTHER = "other"                  // Outro motivo
}

// Define categorias de custos
export enum CostCategory {
  SUPPLIES = "supplies",           // Suprimentos
  EQUIPMENT = "equipment",         // Equipamentos
  MAINTENANCE = "maintenance",     // Manutenção
  LABOR = "labor",                 // Mão de obra
  FEED = "feed",                   // Alimentação animal
  FERTILIZER = "fertilizer",       // Fertilizantes
  SEEDS = "seeds",                 // Sementes
  PESTICIDES = "pesticides",       // Pesticidas
  FUEL = "fuel",                   // Combustível
  UTILITIES = "utilities",         // Serviços públicos (água, luz, etc)
  VETERINARY = "veterinary",       // Serviços veterinários
  TAXES = "taxes",                 // Impostos e taxas
  LAND = "land",                   // Terreno/aluguel
  TRANSPORTATION = "transportation", // Transporte
  MARKETING = "marketing",         // Marketing e vendas
  INSURANCE = "insurance",         // Seguros
  OTHER = "other"                  // Outros
}

// Costs table schema - Sistema de custos
export const costs = pgTable("costs", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),        // Descrição do custo
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor do custo
  date: timestamp("date").notNull(),                 // Data do custo
  category: text("category").notNull(),              // Categoria do custo (usar enum CostCategory)
  farmId: integer("farm_id").notNull(),              // Fazenda relacionada
  paymentMethod: text("payment_method"),             // Método de pagamento
  documentNumber: text("document_number"),           // Número do documento fiscal
  supplier: text("supplier"),                        // Fornecedor
  notes: text("notes"),                              // Observações adicionais
  relatedArea: text("related_area"),                 // Área relacionada (animais, culturas, etc)
  relatedId: integer("related_id"),                  // ID relacionado (ID do animal, cultura, etc)
  createdBy: integer("created_by").notNull(),        // Usuário que registrou o custo
  createdAt: timestamp("created_at").defaultNow(),   // Data de criação do registro
});

// Animal Vaccination table schema - Registro de vacinações dos animais
export const animalVaccinations = pgTable("animal_vaccinations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull(), // FK para o animal
  vaccineName: text("vaccine_name").notNull(), // Nome da vacina
  applicationDate: timestamp("application_date").notNull(), // Data de aplicação
  doseNumber: integer("dose_number"), // Número da dose (1ª, 2ª, etc)
  batchNumber: text("batch_number"), // Número do lote da vacina
  // Campo expirationDate removido para corresponder à tabela física
  // Campo applicationSite removido para corresponder à tabela física
  status: text("status").notNull().default(VaccinationStatus.COMPLETED), // Status da vacinação
  nextApplicationDate: timestamp("next_application_date"), // Data da próxima aplicação
  appliedBy: integer("applied_by"), // Usuário que aplicou a vacina (veterinário ou funcionário)
  farmId: integer("farm_id").notNull(), // Fazenda relacionada
  notes: text("notes"), // Observações
  createdAt: timestamp("created_at").defaultNow(),
});

// Removed Animals History table schema - Histórico de animais removidos/excluídos
export const removedAnimals = pgTable("removed_animals", {
  id: serial("id").primaryKey(),
  // Dados originais do animal
  originalAnimalId: integer("original_animal_id").notNull(), // ID original do animal
  registrationCode: text("registration_code").notNull(), // Código de registro
  name: text("name"), // Nome do animal
  speciesId: integer("species_id").notNull(), // Espécie
  breed: text("breed").notNull(), // Raça
  gender: text("gender").notNull(), // Gênero
  birthDate: timestamp("birth_date"), // Data de nascimento
  weight: decimal("weight", { precision: 10, scale: 2 }), // Peso
  farmId: integer("farm_id").notNull(), // Fazenda
  originalStatus: text("original_status").notNull(), // Status original antes da remoção
  originalObservations: text("original_observations"), // Observações originais
  fatherId: integer("father_id"), // Pai
  motherId: integer("mother_id"), // Mãe
  lastVaccineDate: timestamp("last_vaccine_date"), // Última vacina
  originalCreatedAt: timestamp("original_created_at").notNull(), // Data de criação original
  
  // Dados da remoção
  removalReason: text("removal_reason").notNull(), // Motivo da remoção (usar enum AnimalRemovalReason)
  removalDate: timestamp("removal_date").notNull().defaultNow(), // Data da remoção
  removalObservations: text("removal_observations"), // Observações sobre a remoção
  removedBy: integer("removed_by").notNull(), // Usuário que removeu
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), // Preço de venda (se vendido)
  buyer: text("buyer"), // Comprador (se vendido)
  transferDestination: text("transfer_destination"), // Destino da transferência (se transferido)
  createdAt: timestamp("created_at").defaultNow(), // Data de criação do registro de remoção
});

// Define blood types for temporary employees
export enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-"
}

// Temporary Employees table schema - Funcionários temporários
export const temporaryEmployees = pgTable("temporary_employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome
  contact: text("contact").notNull(), // Contacto
  birthDate: date("birth_date").notNull(), // Data de nascimento
  workSector: text("work_sector").notNull(), // Setor de trabalho
  startDate: date("start_date").notNull(), // Data início trabalho
  endDate: date("end_date").notNull(), // Data término trabalho
  photo: text("photo"), // Foto (caminho/URL da imagem)
  nationality: text("nationality").notNull(), // Nacionalidade
  preExistingDiseases: text("pre_existing_diseases"), // Doenças pré-existentes (opcional)
  bloodType: text("blood_type"), // Tipo sanguíneo (opcional)
  farmId: integer("farm_id").notNull(), // Fazenda relacionada
  createdBy: integer("created_by").notNull(), // Usuário que cadastrou
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
  createdAt: true,
});

export const insertUserFarmSchema = createInsertSchema(userFarms).omit({
  id: true,
  createdAt: true,
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
});

export const insertSpeciesSchema = createInsertSchema(species).omit({
  id: true,
  createdAt: true,
});

export const insertAnimalSchema = createInsertSchema(animals).omit({
  id: true,
  createdAt: true,
  registrationCode: true, // This will be generated on the server
});

export const insertCropSchema = createInsertSchema(crops).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true, 
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  actualValue: true,
  completionDate: true,
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertAnimalVaccinationSchema = createInsertSchema(animalVaccinations).omit({
  id: true,
  createdAt: true,
});

export const insertCostSchema = createInsertSchema(costs).omit({
  id: true,
  createdAt: true,
});

export const insertRemovedAnimalSchema = createInsertSchema(removedAnimals).omit({
  id: true,
  createdAt: true,
});

export const insertTemporaryEmployeeSchema = createInsertSchema(temporaryEmployees).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;

export type InsertUserFarm = z.infer<typeof insertUserFarmSchema>;
export type UserFarm = typeof userFarms.$inferSelect;

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

export type InsertSpecies = z.infer<typeof insertSpeciesSchema>;
export type Species = typeof species.$inferSelect;

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;

export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertAnimalVaccination = z.infer<typeof insertAnimalVaccinationSchema>;
export type AnimalVaccination = typeof animalVaccinations.$inferSelect;

export type InsertCost = z.infer<typeof insertCostSchema>;
export type Cost = typeof costs.$inferSelect;

export type InsertRemovedAnimal = z.infer<typeof insertRemovedAnimalSchema>;
export type RemovedAnimal = typeof removedAnimals.$inferSelect;

export type InsertTemporaryEmployee = z.infer<typeof insertTemporaryEmployeeSchema>;
export type TemporaryEmployee = typeof temporaryEmployees.$inferSelect;
