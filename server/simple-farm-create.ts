import { db } from "./db";
import { farms, userFarms, users, userPermissions, SystemModule, AccessLevel } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createFarmsAndAssignUsers() {
  try {
    // Primeiro vamos verificar se os usuários existem
    const usersData = await db.select().from(users);
    console.log("Usuários encontrados:", usersData.length);
    
    const farmAdmin = usersData.find(u => u.username === "farmadmin");
    const superAdmin = usersData.find(u => u.username === "superadmin");
    const manager = usersData.find(u => u.username === "manager");
    const employee = usersData.find(u => u.username === "employee");
    
    if (!farmAdmin || !superAdmin || !manager || !employee) {
      console.error("Alguns usuários não foram encontrados!");
      return;
    }
    
    console.log("Criando Fazenda Modelo...");
    // Criar fazenda de teste
    const [farm1] = await db.insert(farms).values({
      name: "Fazenda Modelo",
      location: "Luanda, Angola",
      size: 1000,
      createdBy: superAdmin.id,
      adminId: farmAdmin.id,
      description: "Fazenda principal para testes do sistema",
      coordinates: "-8.8368,13.2343",
      type: "mixed"
    }).returning();
    
    // Associar usuários à fazenda
    console.log("Associando usuários à fazenda...");
    
    // Farm Admin -> Admin da fazenda
    await db.insert(userFarms).values({
      userId: farmAdmin.id,
      farmId: farm1.id,
      role: "admin"
    });
    
    // Manager -> Gerente da fazenda
    await db.insert(userFarms).values({
      userId: manager.id,
      farmId: farm1.id,
      role: "manager"
    });
    
    // Employee -> Trabalhador da fazenda
    await db.insert(userFarms).values({
      userId: employee.id,
      farmId: farm1.id,
      role: "worker"
    });
    
    // Configurar permissões
    console.log("Configurando permissões...");
    
    // Farm Admin -> Permissão total
    await db.insert(userPermissions).values({
      userId: farmAdmin.id,
      farmId: farm1.id,
      module: SystemModule.GOALS,
      level: AccessLevel.MANAGE
    });
    
    // Manager -> Permissão para editar
    await db.insert(userPermissions).values({
      userId: manager.id,
      farmId: farm1.id,
      module: SystemModule.GOALS,
      level: AccessLevel.EDIT
    });
    
    // Employee -> Permissão para visualizar
    await db.insert(userPermissions).values({
      userId: employee.id,
      farmId: farm1.id,
      module: SystemModule.GOALS,
      level: AccessLevel.VIEW
    });
    
    console.log("Fazenda criada com sucesso!");
    console.log("ID da Fazenda:", farm1.id);
    console.log("Nome: Fazenda Modelo");
    console.log("Você pode acessar as metas em: /farms/" + farm1.id + "/goals");
    
  } catch (error) {
    console.error("Erro ao criar fazenda:", error);
  }
}

createFarmsAndAssignUsers().finally(() => process.exit(0));