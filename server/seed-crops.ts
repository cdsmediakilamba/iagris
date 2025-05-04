import { db } from "./db";
import { crops } from "@shared/schema";

/**
 * Script para adicionar plantações ao banco de dados
 */

// Fazendas existentes e suas IDs
const farms = {
  farmModel: { id: 6 },
  farmCrop: { id: 8 },
  farmFruit: { id: 9 }
};

// Função para criar plantações
async function createCrops() {
  console.log("Criando plantações...");
  
  // Plantações para a Fazenda Modelo
  const cropNames = ["Milho", "Feijão", "Mandioca", "Batata", "Cana-de-açúcar"];
  const statuses = ["planting", "growing", "ready", "harvested"];
  
  for (let i = 0; i < 10; i++) {
    const name = cropNames[Math.floor(Math.random() * cropNames.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const plantingDate = new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000); // 0-120 dias atrás
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 90 + Math.floor(Math.random() * 30)); // 90-120 dias após o plantio
    
    await db.insert(crops).values({
      name,
      sector: `Setor ${String.fromCharCode(65 + i % 5)}`, // Setor A, B, C, D, E
      area: Math.floor(Math.random() * 50) + 10,
      plantingDate,
      expectedHarvestDate,
      status,
      farmId: farms.farmModel.id
    });
  }
  
  // Plantações para a Fazenda Agrícola
  const cropNamesAgricultural = ["Café", "Amendoim", "Algodão", "Arroz", "Soja"];
  
  for (let i = 0; i < 15; i++) {
    const name = cropNamesAgricultural[Math.floor(Math.random() * cropNamesAgricultural.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const plantingDate = new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000); // 0-120 dias atrás
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 90 + Math.floor(Math.random() * 30)); // 90-120 dias após o plantio
    
    await db.insert(crops).values({
      name,
      sector: `Setor ${String.fromCharCode(65 + i % 8)}`, // Setor A-H
      area: Math.floor(Math.random() * 100) + 50,
      plantingDate,
      expectedHarvestDate,
      status,
      farmId: farms.farmCrop.id
    });
  }
  
  // Plantações para o Pomar Tropical
  const fruitNames = ["Manga", "Abacaxi", "Banana", "Goiaba", "Papaia", "Maracujá", "Coco"];
  
  for (let i = 0; i < 7; i++) {
    const name = fruitNames[i];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const plantingDate = new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000); // 0-365 dias atrás
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 180 + Math.floor(Math.random() * 90)); // 180-270 dias após o plantio
    
    await db.insert(crops).values({
      name,
      sector: `Setor ${String.fromCharCode(65 + i)}`, // Setor A-G
      area: Math.floor(Math.random() * 30) + 20,
      plantingDate,
      expectedHarvestDate,
      status,
      farmId: farms.farmFruit.id
    });
  }
  
  console.log("Plantações criadas com sucesso.");
}

// Função principal
async function seedCrops() {
  try {
    console.log("Iniciando adição de plantações ao banco de dados...");
    await createCrops();
    console.log("Plantações adicionadas com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar plantações:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedCrops();