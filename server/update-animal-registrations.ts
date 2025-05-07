import { db } from "./db";
import { animals, species } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Este script atualiza os animais existentes adicionando códigos de registro padronizados
 * e vinculando-os às espécies corretas na tabela de espécies.
 */

// Mapeamento de nomes de espécies antigos para IDs de espécies atuais
const speciesMapping: Record<string, number> = {
  "Vaca": 1, // Bovino
  "Boi": 1,  // Bovino
  "Galinha": 5, // Aves
  "Ovelha": 4, // Ovino
  "Cabra": 3,  // Caprino
};

// Função utilitária para gerar códigos de registro no formato [ABREVIAÇÃO_DA_ESPÉCIE]-[DATA]-[SEQUENCIAL]
function generateRegistrationCode(speciesAbbr: string, counter: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const sequential = String(counter).padStart(4, '0');
  return `${speciesAbbr}-${dateStr}-${sequential}`;
}

// Função para encontrar o maior contador atual para cada espécie
async function getCurrentCounters(): Promise<Record<string, number>> {
  const counters: Record<string, number> = {};
  
  // Buscar todos os códigos de registro existentes
  const result = await db.execute(
    `SELECT registration_code FROM animals WHERE registration_code IS NOT NULL AND registration_code != ''`
  );
  
  // Para cada código, extrair a abreviação da espécie e o contador
  for (const row of result.rows) {
    const code = row.registration_code;
    if (!code) continue;
    
    // Extrair os componentes do código (formato: ABBR-YYYYMMDD-NNNN)
    const parts = code.split('-');
    if (parts.length !== 3) continue;
    
    const [abbr, dateStr, seqStr] = parts;
    const seq = parseInt(seqStr, 10);
    
    // Atualizar o contador máximo para esta abreviação
    if (!counters[abbr] || seq > counters[abbr]) {
      counters[abbr] = seq;
    }
  }
  
  return counters;
}

// Função para atualizar os registros de animais
async function updateAnimalRegistrations() {
  try {
    console.log("Atualizando registros de animais...");
    
    // Buscar todos os animais que não têm registration_code ou species_id
    const result = await db.execute(
      `SELECT * FROM animals WHERE registration_code IS NULL OR registration_code = ''`
    );
    
    // Converter o resultado para um array de animais
    const animalsToUpdate = result.rows as any[];
    
    console.log(`Encontrados ${animalsToUpdate.length} animais para atualizar.`);
    
    // Buscar todas as espécies para obter as abreviações
    const allSpecies = await db.select().from(species);
    
    // Criar um mapa de ID para abreviação de espécie
    const speciesAbbreviations: Record<number, string> = {};
    allSpecies.forEach(s => {
      speciesAbbreviations[s.id] = s.abbreviation;
    });
    
    // Obter contadores atuais para cada espécie a partir dos animais existentes
    const counters = await getCurrentCounters();
    
    console.log("Contadores iniciais:", counters);
    
    // Atualizar cada animal
    for (const animal of animalsToUpdate) {
      // Verificar o status null/undefined e definir um valor padrão se necessário
      if (!animal.status) {
        animal.status = "healthy";
      }
      
      // Se não houver species_id, tentamos inferir a partir do campo antigo 'species'
      if (!animal.speciesId) {
        // Acessando campo antigo que pode não existir no tipo atual
        const oldSpecies = animal.species as string | undefined;
        if (oldSpecies && speciesMapping[oldSpecies]) {
          animal.speciesId = speciesMapping[oldSpecies];
        } else {
          // Se não pudermos mapear, usamos Bovino como padrão
          animal.speciesId = 1;
        }
      }
      
      // Obtém a abreviação da espécie
      const abbr = speciesAbbreviations[animal.speciesId as number];
      
      // Incrementa o contador para esta espécie
      if (!counters[abbr]) {
        counters[abbr] = 1;
      } else {
        counters[abbr]++;
      }
      
      // Gera o código de registro
      const registrationCode = generateRegistrationCode(abbr, counters[abbr]);
      
      // Atualiza o animal
      await db
        .update(animals)
        .set({ 
          registrationCode,
          speciesId: animal.speciesId as number,
          status: animal.status as string
        })
        .where(eq(animals.id, animal.id as number));
      
      console.log(`Animal ID ${animal.id} atualizado com código ${registrationCode}`);
    }
    
    console.log("Atualização de animais concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar animais:", error);
  }
}

// Função principal
async function main() {
  try {
    console.log("Iniciando atualização de registros de animais...");
    await updateAnimalRegistrations();
    console.log("Processo finalizado com sucesso!");
  } catch (error) {
    console.error("Erro no processo:", error);
  } finally {
    process.exit(0);
  }
}

// Executar o script
main();