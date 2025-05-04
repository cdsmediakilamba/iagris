import { db } from "./db";
import { animals } from "@shared/schema";

/**
 * Script para adicionar apenas animais ao banco de dados
 */

// Fazendas existentes e suas IDs
const farms = {
  farmModel: { id: 6 },
  farmLivestock: { id: 7 },
  farmPoultry: { id: 10 }
};

// Função para criar animais
async function createAnimals() {
  console.log("Criando animais...");
  
  // Animais para a Fazenda Modelo
  const animalSpecies = ["Vaca", "Boi", "Galinha", "Ovelha", "Cabra"];
  const genders = ["macho", "fêmea"];
  const statuses = ["healthy", "sick", "quarantine", "treatment", "pregnant"];
  
  for (let i = 0; i < 25; i++) {
    const species = animalSpecies[Math.floor(Math.random() * animalSpecies.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Math.floor(Math.random() * 5) - 1);
    
    await db.insert(animals).values({
      identificationCode: `A${1000 + i}`,
      species,
      breed: `Raça de ${species}`,
      gender,
      birthDate,
      weight: Math.floor(Math.random() * 500) + 50,
      farmId: farms.farmModel.id,
      status,
      lastVaccineDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000) // 0-90 dias atrás
    });
  }
  
  // Animais para a Fazenda Pecuária
  for (let i = 0; i < 25; i++) {
    const species = ["Vaca", "Boi"][Math.floor(Math.random() * 2)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Math.floor(Math.random() * 5) - 1);
    
    await db.insert(animals).values({
      identificationCode: `B${2000 + i}`,
      species,
      breed: species === "Vaca" ? "Leiteira Holstein" : "Angus",
      gender,
      birthDate,
      weight: Math.floor(Math.random() * 500) + 200,
      farmId: farms.farmLivestock.id,
      status,
      lastVaccineDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000) // 0-90 dias atrás
    });
  }
  
  // Animais para a Granja Aviária
  const poultryBreeds = ["Leghorn", "Rhode Island Red", "Plymouth Rock", "Ameraucana", "Orpington"];
  
  for (let i = 0; i < 20; i++) {
    const breed = poultryBreeds[Math.floor(Math.random() * poultryBreeds.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const status = statuses[Math.floor(Math.random() * 3)]; // Primeiros 3 status apenas
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - Math.floor(Math.random() * 12)); // 0-12 meses atrás
    
    await db.insert(animals).values({
      identificationCode: `P${3000 + i}`,
      species: "Galinha",
      breed,
      gender,
      birthDate,
      weight: Math.floor(Math.random() * 3) + 1, // 1-4 kg
      farmId: farms.farmPoultry.id,
      status,
      lastVaccineDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // 0-30 dias atrás
    });
  }
  
  console.log("Animais criados com sucesso.");
}

// Função principal
async function seedAnimals() {
  try {
    console.log("Iniciando adição de animais ao banco de dados...");
    await createAnimals();
    console.log("Animais adicionados com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar animais:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o seed
seedAnimals();