import { db } from "./db.js";
import { purchaseRequests } from "../shared/schema.js";

async function seedPurchaseRequests() {
  try {
    console.log("Criando solicitações de compra de exemplo...");

    const sampleRequests = [
      {
        produto: "Sementes de Milho Híbrido",
        quantidade: "50kg",
        observacao: "Para plantio na área 1, preferência por variedade resistente à seca",
        responsavel: "João Silva - Agrônomo",
        data: "2025-07-05",
        status: "nova",
        urgente: false,
        farmId: 6,
        createdBy: 10
      },
      {
        produto: "Fertilizante NPK 20-10-20",
        quantidade: "200kg",
        observacao: "Aplicação na cultura de feijão, setor norte da fazenda",
        responsavel: "Maria Santos - Técnica Agrícola",
        data: "2025-07-01",
        status: "nova",
        urgente: true,
        farmId: 6,
        createdBy: 10
      },
      {
        produto: "Ração para Bovinos - 18% Proteína",
        quantidade: "1000kg",
        observacao: "Ração concentrada para gado leiteiro, entrega mensal",
        responsavel: "Carlos Oliveira - Zootecnista",
        data: "2025-06-30",
        status: "em_andamento",
        urgente: true,
        farmId: 6,
        createdBy: 10
      },
      {
        produto: "Medicamentos Veterinários - Kit Básico",
        quantidade: "1 kit completo",
        observacao: "Antibióticos, vermífugos e vacinas para rebanho bovino",
        responsavel: "Dr. Ana Costa - Veterinária",
        data: "2025-07-10",
        status: "nova",
        urgente: false,
        farmId: 6,
        createdBy: 10
      }
    ];

    for (const request of sampleRequests) {
      await db.insert(purchaseRequests).values(request);
      console.log(`Solicitação criada: ${request.produto}`);
    }

    console.log("✅ Solicitações de compra criadas com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao criar solicitações de compra:", error);
  }
}

// Executar se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPurchaseRequests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedPurchaseRequests };