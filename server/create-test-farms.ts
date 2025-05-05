import { db } from "./db";
import { farms, userFarms, userPermissions, SystemModule, AccessLevel, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createTestFarms() {
  try {
    console.log("Criando fazendas de teste...");
    
    // Obter IDs dos usuários criados anteriormente
    const [superAdmin] = await db.select().from(users).where(eq(users.username, "superadmin"));
    const [farmAdmin] = await db.select().from(users).where(eq(users.username, "farmadmin"));
    const [manager] = await db.select().from(users).where(eq(users.username, "manager"));
    const [employee] = await db.select().from(users).where(eq(users.username, "employee"));

    // Criar Fazenda de Teste 1
    const [farm1] = await db.insert(farms).values({
      name: "Fazenda Principal",
      location: "Luanda, Angola",
      size: 1000,
      createdBy: superAdmin.id,
      adminId: farmAdmin.id,
      description: "Fazenda principal para testes do sistema",
      coordinates: "-8.8368,13.2343",
      type: "mixed"
    }).returning();
    
    // Criar Fazenda de Teste 2
    const [farm2] = await db.insert(farms).values({
      name: "Fazenda de Gado Sul",
      location: "Benguela, Angola",
      size: 2500,
      createdBy: superAdmin.id,
      adminId: farmAdmin.id,
      description: "Fazenda especializada em gado",
      coordinates: "-12.5823,13.4073",
      type: "livestock"
    }).returning();

    // Associar usuários às fazendas
    // Farm Admin -> Fazenda Principal
    await db.insert(userFarms).values({
      userId: farmAdmin.id,
      farmId: farm1.id,
      role: "admin"
    });
    
    // Farm Admin -> Fazenda de Gado Sul
    await db.insert(userFarms).values({
      userId: farmAdmin.id,
      farmId: farm2.id,
      role: "admin"
    });
    
    // Manager -> Fazenda Principal
    await db.insert(userFarms).values({
      userId: manager.id,
      farmId: farm1.id,
      role: "manager"
    });
    
    // Employee -> Fazenda Principal
    await db.insert(userFarms).values({
      userId: employee.id,
      farmId: farm1.id,
      role: "worker"
    });

    // Configurar permissões para usuários
    // Farm Admin -> Permissão total sobre Metas
    await db.insert(userPermissions).values({
      userId: farmAdmin.id,
      farmId: farm1.id,
      module: SystemModule.GOALS,
      level: AccessLevel.MANAGE
    });
    
    await db.insert(userPermissions).values({
      userId: farmAdmin.id,
      farmId: farm2.id,
      module: SystemModule.GOALS,
      level: AccessLevel.MANAGE
    });
    
    // Manager -> Permissão para editar Metas
    await db.insert(userPermissions).values({
      userId: manager.id,
      farmId: farm1.id,
      module: SystemModule.GOALS,
      level: AccessLevel.EDIT
    });
    
    // Employee -> Permissão para visualizar Metas
    await db.insert(userPermissions).values({
      userId: employee.id,
      farmId: farm1.id,
      module: SystemModule.GOALS,
      level: AccessLevel.VIEW
    });
    
    console.log("Fazendas de teste criadas com sucesso!");
    console.log("-----------------------------------");
    console.log("Detalhes das fazendas criadas:");
    console.log("-----------------------------------");
    console.log("Fazenda 1:");
    console.log("Nome: Fazenda Principal");
    console.log("ID: " + farm1.id);
    console.log("-----------------------------------");
    console.log("Fazenda 2:");
    console.log("Nome: Fazenda de Gado Sul");
    console.log("ID: " + farm2.id);
    console.log("-----------------------------------");
    
  } catch (error) {
    console.error("Erro ao criar fazendas de teste:", error);
  } finally {
    process.exit(0);
  }
}

createTestFarms();