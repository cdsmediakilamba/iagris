import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  NONE = "none"                // Sem acesso
}

// Define system modules
export enum SystemModule {
  ANIMALS = "animals",
  CROPS = "crops",
  INVENTORY = "inventory",
  TASKS = "tasks",
  EMPLOYEES = "employees",
  FINANCIAL = "financial",
  REPORTS = "reports"
}

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default(UserRole.EMPLOYEE),
  language: text("language").notNull().default("pt"),
  farmId: integer("farm_id"), // NULL para super_admin (pode ver todas as fazendas)
  createdAt: timestamp("created_at").defaultNow(),
});

// Farm table schema
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  size: integer("size"), // Tamanho em hectares (opcional)
  createdBy: integer("created_by").notNull(), // ID do usuário admin que criou a fazenda
  adminId: integer("admin_id").notNull(), // ID do usuário administrador da fazenda
  createdAt: timestamp("created_at").defaultNow(),
});

// Relação entre usuários e fazendas (muitos para muitos)
export const userFarms = pgTable("user_farms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  farmId: integer("farm_id").notNull(),
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

// Animal table schema
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  identificationCode: text("identification_code").notNull(),
  species: text("species").notNull(),
  breed: text("breed").notNull(),
  gender: text("gender").notNull(),
  birthDate: timestamp("birth_date"),
  weight: integer("weight"),
  farmId: integer("farm_id").notNull(),
  status: text("status").notNull().default("healthy"),
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
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // kg, liters, bags, etc.
  farmId: integer("farm_id").notNull(),
  minimumLevel: integer("minimum_level"),
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

export const insertAnimalSchema = createInsertSchema(animals).omit({
  id: true,
  createdAt: true,
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

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;

export type InsertUserFarm = z.infer<typeof insertUserFarmSchema>;
export type UserFarm = typeof userFarms.$inferSelect;

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;

export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
