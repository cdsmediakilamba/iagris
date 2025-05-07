import { db } from "./db";
import { animals, farms, species } from "@shared/schema";
import { eq } from "drizzle-orm";
import { DatabaseStorage } from "./storage-db";

/**
 * Script para adicionar animais com o modelo de dados atualizado para todas as fazendas
 */

// Instanciar o storage para utilizar a função de geração de código de registro
const dbStorage = new DatabaseStorage();

// Array de nomes para animais
const animalNames = [
  "Aurora", "Bonito", "Cristal", "Diamante", "Estrela", "Floco", "Gigante", "Hera",
  "Índigo", "Jade", "Kilo", "Luna", "Marte", "Neve", "Ônix", "Prata", "Quasar",
  "Rubí", "Sol", "Trovão", "Urano", "Vento", "Xerife", "Yara", "Zafiro"
];

// Array de raças por tipo de espécie
const breedsBySpecies: Record<number, string[]> = {
  // Bovinos (1)
  1: [
    "Angus", "Nelore", "Brahman", "Gir", "Holandesa", "Jersey", "Charolês",
    "Hereford", "Simental", "Guzerá", "Senepol", "Limousin"
  ],
  // Suínos (2)
  2: [
    "Duroc", "Large White", "Landrace", "Hampshire", "Pietrain", "Wessex",
    "Tamworth", "Mangalica", "Meishan", "Poland China"
  ],
  // Caprinos (3)
  3: [
    "Boer", "Saanen", "Alpina", "Toggenburg", "Anglo-Nubiana", "Anglonubiana",
    "Murciana", "Angorá"
  ],
  // Ovinos (4)
  4: [
    "Merino", "Suffolk", "Dorper", "Santa Inês", "Texel", "Lacaune",
    "Corriedale", "Romney Marsh", "Dorset"
  ],
  // Aves (5)
  5: [
    "Leghorn", "Rhode Island Red", "Plymouth Rock", "Orpington", "Brahma",
    "Sussex", "Wyandotte", "Marans", "Silkie", "Faverolles"
  ],
  // Equinos (6)
  6: [
    "Quarto de Milha", "Puro Sangue Inglês", "Árabe", "Appaloosa", "Mangalarga Marchador",
    "Crioulo", "Andaluz", "Lusitano", "Friesian", "Pônei Shetland"
  ],
  // Peixes (7)
  7: [
    "Tilápia", "Carpa", "Tambaqui", "Pacu", "Pintado", "Matrinxã",
    "Pirarucu", "Tucunaré", "Dourado", "Lambari"
  ]
};

// Observações por espécie
const observationsBySpecies: Record<number, string[]> = {
  // Bovinos
  1: [
    "Animal em bom estado sanitário", 
    "Animal adquirido em leilão", 
    "Destinado à reprodução", 
    "Animal para abate em 3 meses", 
    "Excelente produtor de leite",
    "Reprodutor premiado"
  ],
  // Suínos
  2: [
    "Leitão em desenvolvimento", 
    "Porca reprodutora", 
    "Macho reprodutor", 
    "Animal para engorda",
    "Reprodutor de alta genética"
  ],
  // Caprinos
  3: [
    "Cabra leiteira", 
    "Bode reprodutor", 
    "Filhote em desenvolvimento", 
    "Produção de queijo",
    "Vendedor em 6 meses"
  ],
  // Ovinos
  4: [
    "Animal para produção de lã", 
    "Ovelha reprodutora", 
    "Carneiro reprodutor", 
    "Cordeiro para abate",
    "Ovino de exposição"
  ],
  // Aves
  5: [
    "Galinha poedeira", 
    "Galo reprodutor", 
    "Frango para corte", 
    "Ave ornamental",
    "Matriz reprodutora"
  ],
  // Equinos
  6: [
    "Cavalo de trabalho", 
    "Égua reprodutora", 
    "Potro em treinamento", 
    "Animal para competição",
    "Equino para lazer"
  ],
  // Peixes
  7: [
    "Lote de alevinos", 
    "Matriz reprodutora", 
    "Peixe adulto para engorda", 
    "Reprodutor selecionado",
    "Lote de juvenis"
  ]
};

// Status por espécie
const animalStatus = [
  "healthy", "sick", "treatment", "quarantine", "pregnant", "needsAttention"
];

// Função para selecionar um item aleatório de um array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Função para gerar um peso aleatório de acordo com a espécie
function generateWeight(speciesId: number): number {
  switch (speciesId) {
    case 1: // Bovinos
      return parseFloat((Math.random() * 500 + 200).toFixed(2)); // 200-700kg
    case 2: // Suínos
      return parseFloat((Math.random() * 200 + 50).toFixed(2)); // 50-250kg
    case 3: // Caprinos
      return parseFloat((Math.random() * 50 + 20).toFixed(2)); // 20-70kg
    case 4: // Ovinos
      return parseFloat((Math.random() * 50 + 30).toFixed(2)); // 30-80kg
    case 5: // Aves
      return parseFloat((Math.random() * 3 + 0.5).toFixed(2)); // 0.5-3.5kg
    case 6: // Equinos
      return parseFloat((Math.random() * 300 + 200).toFixed(2)); // 200-500kg
    case 7: // Peixes
      return parseFloat((Math.random() * 5 + 0.2).toFixed(2)); // 0.2-5.2kg
    default:
      return parseFloat((Math.random() * 100 + 50).toFixed(2)); // 50-150kg
  }
}

// Função para criar animais para uma fazenda específica
async function createAnimalsForFarm(farmId: number, farmType: string) {
  console.log(`Criando animais para a fazenda ID ${farmId} (tipo: ${farmType})...`);
  
  // Determinar quais espécies são apropriadas para o tipo de fazenda
  let appropriateSpecies: number[] = [];
  
  if (farmType === 'livestock' || farmType === 'mixed') {
    // Fazendas de criação animal ou mistas: podem ter bovinos, suínos, caprinos, ovinos e equinos
    appropriateSpecies = [1, 2, 3, 4, 6];
  }
  
  if (farmType === 'crop' || farmType === 'mixed') {
    // Fazendas agrícolas podem ter uma pequena quantidade de animais de trabalho (equinos)
    // e talvez algumas galinhas para produção de ovos
    if (farmType === 'crop') {
      appropriateSpecies = [5, 6];
    }
    
    // Fazendas mistas já incluem as espécies acima
  }
  
  // Adicionar peixes apenas para alguns tipos específicos de fazendas (20% de chance)
  if (Math.random() < 0.2) {
    appropriateSpecies.push(7);
  }
  
  // Número de animais a serem criados depende do tipo da fazenda
  let numAnimals = 0;
  if (farmType === 'livestock') {
    numAnimals = Math.floor(Math.random() * 20) + 30; // 30-50 animais
  } else if (farmType === 'mixed') {
    numAnimals = Math.floor(Math.random() * 15) + 15; // 15-30 animais
  } else {
    numAnimals = Math.floor(Math.random() * 5) + 5; // 5-10 animais
  }
  
  console.log(`Adicionando ${numAnimals} animais para a fazenda ID ${farmId}...`);
  
  // Criar os animais
  for (let i = 0; i < numAnimals; i++) {
    // Escolher uma espécie apropriada para essa fazenda
    const speciesId = randomItem(appropriateSpecies);
    
    // Escolher um gênero
    const gender = randomItem(['male', 'female']);
    
    // Escolher uma raça apropriada para a espécie
    const breed = randomItem(breedsBySpecies[speciesId] || ["Comum"]);
    
    // Gerar uma data de nascimento
    const birthDate = new Date();
    // Idade depende da espécie
    let ageInMonths: number;
    
    switch (speciesId) {
      case 5: // Aves
        ageInMonths = Math.floor(Math.random() * 24) + 1; // 1-24 meses
        break;
      case 7: // Peixes
        ageInMonths = Math.floor(Math.random() * 24) + 1; // 1-24 meses
        break;
      default:
        ageInMonths = Math.floor(Math.random() * 60) + 1; // 1-60 meses
    }
    
    birthDate.setMonth(birthDate.getMonth() - ageInMonths);
    
    // Escolher um status
    // Fêmeas podem estar grávidas, machos não
    let status = randomItem(
      gender === 'female' ? animalStatus : animalStatus.filter(s => s !== 'pregnant')
    );
    
    // Peso baseado na espécie
    const weight = generateWeight(speciesId);
    
    // Data da última vacinação
    const lastVaccineDate = new Date();
    lastVaccineDate.setDate(lastVaccineDate.getDate() - Math.floor(Math.random() * 180)); // 0-180 dias atrás
    
    // Escolher um nome
    const name = randomItem(animalNames);
    
    // Escolher uma observação
    const observations = randomItem(observationsBySpecies[speciesId] || ["Animal saudável"]);
    
    // Gerar o código de registro usando o storage do sistema
    let speciesObj = await db.select().from(species).where(eq(species.id, speciesId)).limit(1);
    if (!speciesObj || speciesObj.length === 0) {
      throw new Error(`Espécie com ID ${speciesId} não encontrada`);
    }
    
    // Gerar um código de registro padrão
    const registrationCode = await dbStorage.generateAnimalRegistrationCode(speciesId, farmId);
    
    // Inserir o animal no banco de dados
    await db.insert(animals).values({
      name,
      registrationCode,
      speciesId,
      breed,
      gender,
      birthDate,
      weight,
      farmId,
      status,
      observations,
      lastVaccineDate
    });
    
    console.log(`Animal criado: ${registrationCode} - ${name} (${breed})`);
  }
}

// Função principal para adicionar animais a todas as fazendas
async function seedNewAnimals() {
  try {
    console.log("Iniciando adição de novos animais ao banco de dados...");
    
    // Buscar todas as fazendas
    const allFarms = await db.select().from(farms);
    
    // Adicionar animais para cada fazenda
    for (const farm of allFarms) {
      await createAnimalsForFarm(farm.id, farm.type || 'mixed');
    }
    
    console.log("Animais adicionados com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar animais:", error);
  } finally {
    console.log("Processo finalizado.");
  }
}

// Função principal
async function main() {
  try {
    console.log("Iniciando seed de novos animais...");
    await seedNewAnimals();
    console.log("Seed de novos animais concluído com sucesso!");
  } catch (error) {
    console.error("Erro no processo:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o script
main();