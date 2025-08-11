# Documentação da API - iAgris

## Visão Geral

A API do iAgris é uma API RESTful que fornece acesso a todas as funcionalidades do sistema de gestão agrícola. Ela utiliza autenticação baseada em sessão e implementa controle de acesso baseado em roles.

## Base URL

```
Desenvolvimento: http://localhost:5000/api
Produção: https://seu-dominio.com/api
```

## Autenticação

### POST /auth/login
Autentica um usuário no sistema.

**Request Body:**
```json
{
  "username": "admin",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrador",
    "email": "admin@fazenda.com",
    "role": "super_admin",
    "farmId": null
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

### POST /auth/logout
Faz logout do usuário atual.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me
Retorna informações do usuário autenticado.

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrador",
    "email": "admin@fazenda.com",
    "role": "super_admin",
    "farmId": null,
    "permissions": {
      "animals": "full",
      "crops": "full",
      "inventory": "full"
    }
  }
}
```

## Gestão de Fazendas

### GET /api/farms
Lista todas as fazendas acessíveis ao usuário.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Fazenda Modelo",
    "location": "Luanda, Angola",
    "size": 1000,
    "description": "Uma fazenda modelo para demonstração",
    "coordinates": "-8.8368,13.2343",
    "type": "mixed",
    "createdAt": "2025-01-01T10:00:00Z"
  }
]
```

### GET /api/farms/:id
Retorna detalhes de uma fazenda específica.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Fazenda Modelo",
  "location": "Luanda, Angola",
  "size": 1000,
  "description": "Uma fazenda modelo para demonstração",
  "coordinates": "-8.8368,13.2343",
  "type": "mixed",
  "admin": {
    "id": 2,
    "name": "João Silva"
  },
  "createdAt": "2025-01-01T10:00:00Z"
}
```

### POST /api/farms
Cria uma nova fazenda (apenas super_admin).

**Request Body:**
```json
{
  "name": "Nova Fazenda",
  "location": "Benguela, Angola",
  "size": 500,
  "description": "Descrição da nova fazenda",
  "coordinates": "-12.5764,13.4055",
  "type": "livestock",
  "adminId": 3
}
```

### PUT /api/farms/:id
Atualiza uma fazenda existente.

**Request Body:**
```json
{
  "name": "Fazenda Atualizada",
  "location": "Nova localização",
  "size": 750,
  "description": "Nova descrição"
}
```

### DELETE /api/farms/:id
Remove uma fazenda (apenas super_admin).

## Gestão de Animais

### GET /api/farms/:farmId/animals
Lista todos os animais de uma fazenda.

**Query Parameters:**
- `species` (opcional): Filtrar por espécie
- `status` (opcional): Filtrar por status (active, removed, dead)
- `limit` (opcional): Número máximo de resultados
- `offset` (opcional): Offset para paginação

**Response (200 OK):**
```json
{
  "animals": [
    {
      "id": 1,
      "registrationCode": "BOV001",
      "name": "Mimosa",
      "species": "Bovino",
      "breed": "Nelore",
      "sex": "Fêmea",
      "birthDate": "2023-01-15",
      "weight": 450,
      "status": "active",
      "healthStatus": "Saudável",
      "location": "Pasto A",
      "motherId": null,
      "fatherId": null,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

### GET /api/animals/:id
Retorna detalhes completos de um animal.

**Response (200 OK):**
```json
{
  "id": 1,
  "registrationCode": "BOV001",
  "name": "Mimosa",
  "species": "Bovino",
  "breed": "Nelore",
  "sex": "Fêmea",
  "birthDate": "2023-01-15",
  "weight": 450,
  "status": "active",
  "healthStatus": "Saudável",
  "location": "Pasto A",
  "observations": "Animal em excelente estado",
  "mother": {
    "id": 2,
    "name": "Vaca Mãe",
    "registrationCode": "BOV002"
  },
  "father": {
    "id": 3,
    "name": "Touro Pai",
    "registrationCode": "BOV003"
  },
  "vaccinations": [
    {
      "id": 1,
      "vaccine": "Febre Aftosa",
      "date": "2024-06-15",
      "veterinarian": "Dr. Paulo"
    }
  ],
  "healthHistory": [
    {
      "id": 1,
      "date": "2024-07-01",
      "type": "Consulta",
      "description": "Check-up regular",
      "veterinarian": "Dr. Paulo"
    }
  ]
}
```

### POST /api/farms/:farmId/animals
Registra um novo animal.

**Request Body:**
```json
{
  "name": "Nova Vaca",
  "species": "Bovino",
  "breed": "Nelore",
  "sex": "Fêmea",
  "birthDate": "2024-01-15",
  "weight": 350,
  "location": "Pasto B",
  "motherId": 2,
  "fatherId": 3,
  "observations": "Animal recém-nascido"
}
```

### PUT /api/animals/:id
Atualiza informações de um animal.

### DELETE /api/animals/:id
Remove um animal do sistema.

### POST /api/animals/:id/vaccinations
Registra uma nova vacinação.

**Request Body:**
```json
{
  "vaccine": "Brucelose",
  "date": "2024-08-15",
  "veterinarian": "Dr. Maria",
  "nextDose": "2025-08-15",
  "observations": "Primeira dose"
}
```

### POST /api/animals/:id/health-records
Adiciona um registro de saúde.

**Request Body:**
```json
{
  "date": "2024-08-01",
  "type": "Tratamento",
  "description": "Tratamento para ferimento",
  "veterinarian": "Dr. Maria",
  "medications": "Antibiótico X",
  "cost": 150.00
}
```

## Gestão de Cultivos

### GET /api/farms/:farmId/crops
Lista todos os cultivos de uma fazenda.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Milho Safra 2024",
    "cropType": "Milho",
    "variety": "BRS 1040",
    "area": 50.5,
    "plantingDate": "2024-03-01",
    "expectedHarvest": "2024-07-01",
    "actualHarvest": null,
    "status": "growing",
    "location": "Lote 1",
    "estimatedYield": 3000,
    "actualYield": null,
    "createdAt": "2024-02-15T10:00:00Z"
  }
]
```

### GET /api/crops/:id
Retorna detalhes completos de um cultivo.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Milho Safra 2024",
  "cropType": "Milho",
  "variety": "BRS 1040",
  "area": 50.5,
  "plantingDate": "2024-03-01",
  "expectedHarvest": "2024-07-01",
  "actualHarvest": null,
  "status": "growing",
  "location": "Lote 1",
  "estimatedYield": 3000,
  "actualYield": null,
  "soilType": "Argiloso",
  "irrigationType": "Aspersão",
  "observations": "Cultivo em desenvolvimento normal",
  "activities": [
    {
      "id": 1,
      "date": "2024-03-01",
      "type": "Plantio",
      "description": "Plantio realizado",
      "cost": 1500.00
    }
  ],
  "costs": [
    {
      "id": 1,
      "description": "Sementes",
      "amount": 800.00,
      "category": "Insumos",
      "date": "2024-02-28"
    }
  ]
}
```

### POST /api/farms/:farmId/crops
Cria um novo cultivo.

**Request Body:**
```json
{
  "name": "Soja Safra 2024",
  "cropType": "Soja",
  "variety": "M-SOY 8001",
  "area": 75.0,
  "plantingDate": "2024-04-01",
  "expectedHarvest": "2024-08-15",
  "location": "Lote 2",
  "estimatedYield": 2500,
  "soilType": "Franco",
  "irrigationType": "Gotejamento"
}
```

### PUT /api/crops/:id
Atualiza informações de um cultivo.

### DELETE /api/crops/:id
Remove um cultivo.

### POST /api/crops/:id/activities
Registra uma atividade no cultivo.

**Request Body:**
```json
{
  "date": "2024-04-15",
  "type": "Adubação",
  "description": "Aplicação de fertilizante NPK",
  "cost": 500.00,
  "employeeId": 5,
  "observations": "Aplicação uniforme"
}
```

## Controle de Inventário

### GET /api/farms/:farmId/inventory
Lista todos os itens do inventário.

**Query Parameters:**
- `category` (opcional): Filtrar por categoria
- `lowStock` (opcional): Apenas itens com estoque baixo (true/false)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Ração Bovina Premium",
    "category": "Ração",
    "unit": "kg",
    "currentStock": 500,
    "minStock": 100,
    "maxStock": 1000,
    "unitCost": 2.50,
    "totalValue": 1250.00,
    "supplier": "Rações Angolanas Ltda",
    "location": "Galpão A",
    "expirationDate": "2024-12-31",
    "lastUpdated": "2024-08-01T10:00:00Z"
  }
]
```

### GET /api/inventory/:id
Retorna detalhes de um item do inventário.

### POST /api/farms/:farmId/inventory
Adiciona um novo item ao inventário.

**Request Body:**
```json
{
  "name": "Fertilizante NPK 20-10-20",
  "category": "Fertilizante",
  "unit": "kg",
  "currentStock": 200,
  "minStock": 50,
  "maxStock": 500,
  "unitCost": 3.75,
  "supplier": "AgroInsumos Angola",
  "location": "Depósito B",
  "expirationDate": "2025-06-30"
}
```

### PUT /api/inventory/:id
Atualiza um item do inventário.

### DELETE /api/inventory/:id
Remove um item do inventário.

### POST /api/inventory/:id/transactions
Registra uma transação de inventário (entrada/saída).

**Request Body:**
```json
{
  "type": "in",
  "quantity": 100,
  "unitCost": 2.50,
  "description": "Compra de ração bovina",
  "reference": "NF-001234",
  "date": "2024-08-01",
  "employeeId": 3
}
```

### GET /api/farms/:farmId/inventory/transactions
Lista transações de inventário.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "itemId": 1,
    "itemName": "Ração Bovina Premium",
    "type": "in",
    "quantity": 100,
    "unitCost": 2.50,
    "totalCost": 250.00,
    "description": "Compra de ração bovina",
    "reference": "NF-001234",
    "date": "2024-08-01",
    "employee": {
      "id": 3,
      "name": "Carlos Silva"
    },
    "createdAt": "2024-08-01T14:30:00Z"
  }
]
```

## Gestão de Funcionários

### GET /api/farms/:farmId/employees
Lista funcionários permanentes de uma fazenda.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "João Santos",
    "position": "Vaqueiro",
    "contact": "+244 923 456 789",
    "email": "joao@fazenda.com",
    "hireDate": "2024-01-15",
    "salary": 45000.00,
    "status": "active",
    "department": "Pecuária",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### GET /api/farms/:farmId/temporary-employees
Lista funcionários temporários.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Maria Oliveira",
    "workSector": "Campo (Agricultura)",
    "contact": "+244 912 345 678",
    "birthDate": "1985-05-20",
    "startDate": "2024-07-01",
    "endDate": "2024-12-31",
    "nationality": "AO",
    "status": "active",
    "createdAt": "2024-07-01T09:00:00Z"
  }
]
```

### POST /api/farms/:farmId/employees
Adiciona um novo funcionário permanente.

### POST /api/farms/:farmId/temporary-employees
Adiciona um funcionário temporário.

## Gestão Financeira

### GET /api/farms/:farmId/costs
Lista todos os custos de uma fazenda.

**Query Parameters:**
- `category` (opcional): Filtrar por categoria
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)
- `relatedArea` (opcional): Área relacionada (crops, animals, etc.)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "description": "Compra de Ração",
    "amount": 1250.00,
    "category": "Alimentação",
    "date": "2024-08-01",
    "relatedArea": "animals",
    "relatedId": 15,
    "notes": "Ração para gado leiteiro",
    "createdBy": {
      "id": 2,
      "name": "Admin Fazenda"
    },
    "createdAt": "2024-08-01T14:00:00Z"
  }
]
```

### POST /api/farms/:farmId/costs
Registra um novo custo.

**Request Body:**
```json
{
  "description": "Compra de Fertilizante",
  "amount": 750.00,
  "category": "Insumos Agrícolas",
  "date": "2024-08-15",
  "relatedArea": "crops",
  "relatedId": 5,
  "notes": "NPK para plantio de milho"
}
```

### GET /api/farms/:farmId/financial/summary
Retorna resumo financeiro da fazenda.

**Response (200 OK):**
```json
{
  "totalCosts": 15750.00,
  "costsByCategory": {
    "Alimentação": 5200.00,
    "Insumos Agrícolas": 3800.00,
    "Veterinário": 2100.00,
    "Combustível": 1950.00,
    "Outros": 2700.00
  },
  "costsByMonth": {
    "2024-01": 2100.00,
    "2024-02": 1890.00,
    "2024-03": 3200.00
  },
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-08-31"
  }
}
```

## Gestão de Metas

### GET /api/farms/:farmId/goals
Lista todas as metas de uma fazenda.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Aumentar Produção de Leite",
    "description": "Meta de produzir 5000L de leite por mês",
    "category": "Produção",
    "targetValue": 5000.00,
    "currentValue": 3200.00,
    "unit": "litros",
    "targetDate": "2024-12-31",
    "status": "in_progress",
    "progress": 64.0,
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

### POST /api/farms/:farmId/goals
Cria uma nova meta.

**Request Body:**
```json
{
  "title": "Reduzir Custos Veterinários",
  "description": "Reduzir gastos com veterinário em 15%",
  "category": "Custos",
  "targetValue": 1800.00,
  "currentValue": 2100.00,
  "unit": "kwanzas",
  "targetDate": "2024-12-31"
}
```

## Relatórios

### GET /api/farms/:farmId/reports/animals
Gera relatório de animais.

**Query Parameters:**
- `format` (opcional): json, csv, pdf (padrão: json)
- `species` (opcional): Filtrar por espécie
- `dateRange` (opcional): Período (last_30_days, last_year, etc.)

### GET /api/farms/:farmId/reports/crops
Gera relatório de cultivos.

### GET /api/farms/:farmId/reports/financial
Gera relatório financeiro.

### GET /api/farms/:farmId/reports/inventory
Gera relatório de inventário.

## Gestão de Usuários (Admin)

### GET /api/admin/users
Lista todos os usuários do sistema (apenas super_admin).

### POST /api/admin/users
Cria um novo usuário.

### PUT /api/admin/users/:id/permissions
Atualiza permissões de um usuário.

### PUT /api/admin/users/:id/farm
Atribui usuário a uma fazenda.

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos na requisição |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão para acessar o recurso |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: registro duplicado) |
| 422 | Unprocessable Entity - Dados válidos mas não processáveis |
| 500 | Internal Server Error - Erro interno do servidor |

## Estruturas de Erro

### Erro de Validação (400)
```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### Erro de Permissão (403)
```json
{
  "error": "Access Denied",
  "message": "Você não tem permissão para acessar este recurso"
}
```

### Erro Interno (500)
```json
{
  "error": "Internal Server Error",
  "message": "Ocorreu um erro interno no servidor"
}
```

## Rate Limiting

A API implementa rate limiting para prevenir abuso:

- **Limite Geral**: 1000 requisições por hora por IP
- **Login**: 10 tentativas por 15 minutos
- **Upload**: 50 uploads por hora
- **Relatórios**: 100 gerações por hora

## Webhooks (Futuro)

Planejado para versões futuras: webhooks para notificar sistemas externos sobre eventos importantes.

## SDKs e Bibliotecas

### JavaScript/TypeScript
```javascript
import { iAgrisAPI } from '@iagris/api-client';

const api = new iAgrisAPI({
  baseURL: 'https://api.iagris.com',
  apiKey: 'sua-api-key'
});

const animals = await api.animals.list(farmId);
```

### Python
```python
from iagris_api import iAgrisClient

client = iAgrisClient('https://api.iagris.com', 'sua-api-key')
animals = client.animals.list(farm_id)
```

## Changelog da API

### v1.0.0 (Atual)
- Implementação completa da API REST
- Autenticação baseada em sessão
- Controle de acesso por roles
- Endpoints para todas as funcionalidades principais

### Próximas Versões
- v1.1.0: API Keys para autenticação
- v1.2.0: Webhooks
- v1.3.0: GraphQL endpoint
- v2.0.0: WebSocket para tempo real