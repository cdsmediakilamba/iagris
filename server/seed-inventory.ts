import { db } from "./db";
import { inventory } from "@shared/schema";

/**
 * Script para adicionar itens de inventário ao banco de dados
 */

// Fazendas existentes e suas IDs
const farms = {
  farmModel: { id: 6 },
  farmLivestock: { id: 7 },
  farmCrop: { id: 8 },
  farmFruit: { id: 9 },
  farmPoultry: { id: 10 }
};

// Função para criar itens de inventário
async function createInventoryItems() {
  console.log("Criando itens de inventário...");
  
  // Categorias e unidades
  const categories = ["feed", "medicine", "seeds", "fertilizer", "equipment", "tools"];
  const units = ["kg", "l", "bags", "units", "boxes"];
  
  // Itens para a Fazenda Modelo
  const itemNames = [
    "Ração animal", "Vacina geral", "Sementes de milho", "Fertilizante NPK", 
    "Ferramentas manuais", "Antibiótico", "Sementes de feijão", "Pesticida",
    "Equipamento de irrigação", "Suplemento alimentar"
  ];
  
  for (let i = 0; i < itemNames.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 1000) + 10;
    const minimumLevel = Math.floor(quantity * 0.2); // 20% do estoque atual
    
    await db.insert(inventory).values({
      name: itemNames[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmModel.id
    });
  }
  
  // Adicionar alguns itens abaixo do nível mínimo
  await db.insert(inventory).values({
    name: "Remédio para parasitas",
    category: "medicine",
    quantity: 5,
    unit: "boxes",
    minimumLevel: 10,
    farmId: farms.farmModel.id
  });
  
  await db.insert(inventory).values({
    name: "Semente de alta produtividade",
    category: "seeds",
    quantity: 8,
    unit: "bags",
    minimumLevel: 15,
    farmId: farms.farmModel.id
  });
  
  // Itens para a Fazenda Pecuária
  const livestockItems = [
    "Ração bovina", "Vacina contra febre aftosa", "Suplemento mineral",
    "Medicamento antibiótico", "Equipamento de ordenha", "Sal mineral",
    "Vermífugo"
  ];
  
  for (let i = 0; i < livestockItems.length; i++) {
    const category = categories[Math.floor(Math.random() * 3)]; // Apenas feed, medicine, equipment
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 1000) + 50;
    const minimumLevel = Math.floor(quantity * 0.15); // 15% do estoque atual
    
    await db.insert(inventory).values({
      name: livestockItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmLivestock.id
    });
  }
  
  // Itens para a Fazenda Agrícola
  const cropItems = [
    "Semente de café", "Fertilizante orgânico", "Fertilizante químico",
    "Inseticida natural", "Herbicida", "Equipamento de irrigação",
    "Ferramentas de colheita", "Semente de algodão"
  ];
  
  for (let i = 0; i < cropItems.length; i++) {
    const category = categories.slice(2, 6)[Math.floor(Math.random() * 4)]; // Apenas seeds, fertilizer, equipment, tools
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 1000) + 50;
    const minimumLevel = Math.floor(quantity * 0.1); // 10% do estoque atual
    
    await db.insert(inventory).values({
      name: cropItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmCrop.id
    });
  }
  
  // Itens para o Pomar Tropical
  const fruitItems = [
    "Adubo para frutíferas", "Inseticida orgânico", "Kit de poda",
    "Sistema de irrigação por gotejamento", "Ferramentas de colheita",
    "Caixas para frutas", "Fertilizante foliar"
  ];
  
  for (let i = 0; i < fruitItems.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 500) + 30;
    const minimumLevel = Math.floor(quantity * 0.2); // 20% do estoque atual
    
    await db.insert(inventory).values({
      name: fruitItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmFruit.id
    });
  }
  
  // Itens para a Granja Aviária
  const poultryItems = [
    "Ração para aves", "Vacina para Newcastle", "Medicamento antibiótico",
    "Vitamina para aves", "Bebedouros", "Comedouros",
    "Equipamento de iluminação", "Desinfetante"
  ];
  
  for (let i = 0; i < poultryItems.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = Math.floor(Math.random() * 500) + 50;
    const minimumLevel = Math.floor(quantity * 0.25); // 25% do estoque atual
    
    await db.insert(inventory).values({
      name: poultryItems[i],
      category,
      quantity,
      unit,
      minimumLevel,
      farmId: farms.farmPoultry.id
    });
  }
  
  console.log("Itens de inventário criados com sucesso.");
}

// Função principal
async function seedInventory() {
  try {
    console.log("Iniciando adição de itens de inventário ao banco de dados...");
    await createInventoryItems();
    console.log("Itens de inventário adicionados com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar itens de inventário:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedInventory();