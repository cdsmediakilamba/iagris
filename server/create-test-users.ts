import { db } from "./db";
import { users, UserRole } from "@shared/schema";
import { hashPassword } from "./auth";

async function createTestUsers() {
  try {
    console.log("Criando usuários de teste...");
    
    // Senha padrão para todos os usuários de teste
    const password = await hashPassword("teste123");
    
    // Super Admin
    const [superAdmin] = await db.insert(users).values({
      username: "superadmin",
      password,
      name: "Super Administrador",
      email: "superadmin@teste.com",
      role: UserRole.SUPER_ADMIN,
      language: "pt",
      farmId: null
    }).returning();
    
    // Farm Admin
    const [farmAdmin] = await db.insert(users).values({
      username: "farmadmin",
      password,
      name: "Administrador de Fazenda",
      email: "farmadmin@teste.com",
      role: UserRole.FARM_ADMIN,
      language: "pt",
      farmId: null
    }).returning();
    
    // Manager
    const [manager] = await db.insert(users).values({
      username: "manager",
      password,
      name: "Gerente",
      email: "manager@teste.com",
      role: UserRole.MANAGER,
      language: "pt",
      farmId: null
    }).returning();
    
    // Employee
    const [employee] = await db.insert(users).values({
      username: "employee",
      password,
      name: "Funcionário",
      email: "employee@teste.com",
      role: UserRole.EMPLOYEE,
      language: "pt",
      farmId: null
    }).returning();
    
    console.log("Usuários de teste criados com sucesso!");
    console.log("-----------------------------------");
    console.log("Detalhes dos usuários criados:");
    console.log("-----------------------------------");
    console.log("Super Admin:");
    console.log("Username: superadmin");
    console.log("Senha: teste123");
    console.log("-----------------------------------");
    console.log("Farm Admin:");
    console.log("Username: farmadmin");
    console.log("Senha: teste123");
    console.log("-----------------------------------");
    console.log("Manager:");
    console.log("Username: manager");
    console.log("Senha: teste123");
    console.log("-----------------------------------");
    console.log("Employee:");
    console.log("Username: employee");
    console.log("Senha: teste123");
    console.log("-----------------------------------");
    
  } catch (error) {
    console.error("Erro ao criar usuários de teste:", error);
  } finally {
    process.exit(0);
  }
}

createTestUsers();