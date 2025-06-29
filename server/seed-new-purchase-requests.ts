import { db } from "./db";
import { purchaseRequests, farms } from "../shared/schema";

async function clearPurchaseRequests() {
  console.log("Limpando solicitações existentes...");
  await db.delete(purchaseRequests);
  console.log("Solicitações removidas com sucesso!");
}

async function createNewPurchaseRequests() {
  console.log("Criando novas solicitações de compra...");
  
  // Buscar todas as fazendas
  const allFarms = await db.select().from(farms);
  console.log(`Encontradas ${allFarms.length} fazendas`);

  const purchaseRequestsData = [
    // Fazenda Modelo (ID: 6)
    {
      produto: "Sementes de Milho Premium",
      quantidade: "25kg",
      observacao: "Variedade híbrida resistente à seca para plantio da próxima safra",
      responsavel: "Eng. Agrônomo João Santos",
      data: "2025-07-15",
      urgente: true,
      status: "nova" as const,
      farmId: 6,
      createdBy: 10,
    },
    {
      produto: "Fertilizante Orgânico Composto",
      quantidade: "500kg",
      observacao: "Para aplicação na área de hortaliças, rico em nutrientes naturais",
      responsavel: "Técnica Agrícola Maria Silva",
      data: "2025-07-08",
      urgente: false,
      status: "em_andamento" as const,
      farmId: 6,
      createdBy: 10,
    },
    {
      produto: "Sistema de Irrigação Gotejamento",
      quantidade: "1 kit completo",
      observacao: "Para instalação na estufa de tomates, incluindo tubulação e gotejadores",
      responsavel: "Técnico em Irrigação Carlos Mendes",
      data: "2025-07-20",
      urgente: false,
      status: "nova" as const,
      farmId: 6,
      createdBy: 10,
    },

    // Fazenda B. Kwanza (ID: 15)
    {
      produto: "Ração para Suínos 18% Proteína",
      quantidade: "800kg",
      observacao: "Ração balanceada para crescimento e engorda dos suínos",
      responsavel: "Zootecnista Ana Costa",
      data: "2025-07-12",
      urgente: true,
      status: "nova" as const,
      farmId: 15,
      createdBy: 10,
    },
    {
      produto: "Vacinas para Bovinos",
      quantidade: "50 doses",
      observacao: "Vacina contra febre aftosa e outras doenças do rebanho",
      responsavel: "Veterinária Dra. Luísa Ferreira",
      data: "2025-07-05",
      urgente: true,
      status: "em_andamento" as const,
      farmId: 15,
      createdBy: 10,
    },
    {
      produto: "Ferramentas Agrícolas",
      quantidade: "1 lote",
      observacao: "Enxadas, pás, facões e outras ferramentas para manutenção",
      responsavel: "Supervisor de Campo Pedro Oliveira",
      data: "2025-07-18",
      urgente: false,
      status: "finalizada" as const,
      farmId: 15,
      createdBy: 10,
    },

    // Fazenda Cuito (ID: 17)
    {
      produto: "Mudas de Café Arábica",
      quantidade: "1000 mudas",
      observacao: "Mudas certificadas para expansão da área cafeeira",
      responsavel: "Especialista em Café Marcos Andrade",
      data: "2025-08-01",
      urgente: false,
      status: "nova" as const,
      farmId: 17,
      createdBy: 10,
    },
    {
      produto: "Defensivos Agrícolas Orgânicos",
      quantidade: "20 litros",
      observacao: "Produtos naturais para controle de pragas sem químicos",
      responsavel: "Eng. Agrônoma Sandra Lima",
      data: "2025-07-25",
      urgente: true,
      status: "nova" as const,
      farmId: 17,
      createdBy: 10,
    },
    {
      produto: "Combustível Diesel",
      quantidade: "500 litros",
      observacao: "Para abastecimento dos tratores e equipamentos agrícolas",
      responsavel: "Operador de Máquinas José Silva",
      data: "2025-07-10",
      urgente: true,
      status: "em_andamento" as const,
      farmId: 17,
      createdBy: 10,
    },
  ];

  // Filtrar apenas solicitações para fazendas que existem
  const validRequests = purchaseRequestsData.filter(request => 
    allFarms.some(farm => farm.id === request.farmId)
  );

  console.log(`Criando ${validRequests.length} solicitações...`);

  for (const requestData of validRequests) {
    await db.insert(purchaseRequests).values(requestData);
  }

  console.log("Novas solicitações criadas com sucesso!");
}

async function seedNewPurchaseRequests() {
  try {
    await clearPurchaseRequests();
    await createNewPurchaseRequests();
    console.log("Seed de solicitações de compra concluído!");
  } catch (error) {
    console.error("Erro ao fazer seed das solicitações:", error);
    throw error;
  }
}

// Executar se chamado diretamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedNewPurchaseRequests()
    .then(() => {
      console.log("Processo concluído!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erro:", error);
      process.exit(1);
    });
}

export { seedNewPurchaseRequests };