# Arquitetura do Sistema - iAgris

## Visão Geral

O iAgris é uma Progressive Web App (PWA) construída com arquitetura moderna de três camadas, seguindo princípios de separação de responsabilidades, escalabilidade e manutenibilidade. O sistema foi projetado especificamente para gestão agrícola em Angola, com suporte bilíngue e capacidades offline.

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Frontend (React PWA)                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │    Pages    │ │ Components  │ │    Contexts     │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │    Hooks    │ │    Utils    │ │     Stores      │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Servidor (Node.js)                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Backend (Express + Vite)                  │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │   Routes    │ │ Middleware  │ │  Authentication │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │  Controllers│ │   Storage   │ │    Validation   │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Banco de Dados (PostgreSQL)                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │   Tabelas   │ │   Índices   │ │   Constraints   │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │  Triggers   │ │    Views    │ │   Procedures    │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Camada Frontend

### Tecnologias Principais

- **React 18**: Framework principal com hooks e functional components
- **TypeScript**: Type safety e melhor experiência de desenvolvimento
- **Vite**: Build tool moderno com HMR e otimizações
- **Tailwind CSS**: Framework CSS utility-first
- **PWA**: Progressive Web App capabilities

### Estrutura de Diretórios

```
client/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── ui/              # Componentes base (Radix UI + Shadcn)
│   │   ├── forms/           # Componentes de formulário
│   │   ├── charts/          # Componentes de gráficos
│   │   └── layout/          # Componentes de layout
│   ├── pages/               # Páginas da aplicação
│   │   ├── dashboard.tsx
│   │   ├── animals/
│   │   ├── crops/
│   │   ├── inventory/
│   │   └── financial/
│   ├── hooks/               # Custom hooks
│   │   ├── use-auth.ts
│   │   ├── use-toast.ts
│   │   └── use-api.ts
│   ├── context/             # React contexts
│   │   ├── LanguageContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/                 # Utilitários e configurações
│   │   ├── queryClient.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── types/               # Definições de tipos TypeScript
│   └── assets/              # Arquivos estáticos
├── public/                  # Arquivos públicos
└── package.json
```

### Gerenciamento de Estado

#### React Query (TanStack Query)
- **Cache inteligente**: Gerencia cache automático de dados do servidor
- **Background fetching**: Atualiza dados em background
- **Optimistic updates**: Updates otimistas para melhor UX
- **Error handling**: Tratamento centralizado de erros

```typescript
// Exemplo de uso do React Query
export function useAnimals(farmId: number) {
  return useQuery({
    queryKey: ['animals', farmId],
    queryFn: () => apiRequest(`/api/farms/${farmId}/animals`),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}
```

#### Context API
- **AuthContext**: Estado de autenticação global
- **LanguageContext**: Internacionalização
- **ThemeContext**: Tema da aplicação

### Roteamento

Utiliza **Wouter** para roteamento leve e performático:

```typescript
// Estrutura de rotas
<Switch>
  <ProtectedRoute path="/" component={Dashboard} />
  <ProtectedRoute path="/animals" component={Animals} />
  <ProtectedRoute path="/crops" component={Crops} />
  <ProtectedRoute path="/inventory" component={Inventory} />
  <Route path="/login" component={AuthPage} />
  <Route component={NotFound} />
</Switch>
```

### Componentes e Design System

#### Shadcn/UI + Radix UI
- **Acessibilidade**: Componentes acessíveis por padrão
- **Customização**: Altamente customizáveis
- **Consistência**: Design system unificado

#### Responsive Design
- **Mobile-first**: Priorizando dispositivos móveis
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Flexible layouts**: CSS Grid e Flexbox

## Camada Backend

### Tecnologias Principais

- **Node.js**: Runtime JavaScript server-side
- **Express.js**: Framework web minimalista e flexível
- **TypeScript**: Type safety em todo o backend
- **Drizzle ORM**: ORM type-safe para PostgreSQL

### Estrutura de Diretórios

```
server/
├── index.ts                 # Entry point da aplicação
├── routes.ts                # Definição de rotas
├── auth.ts                  # Configuração de autenticação
├── storage.ts               # Interface de armazenamento
├── middleware/              # Middlewares customizados
│   ├── auth.middleware.ts
│   ├── cors.middleware.ts
│   └── validation.middleware.ts
├── controllers/             # Controladores de negócio
│   ├── animals.controller.ts
│   ├── crops.controller.ts
│   └── users.controller.ts
├── services/                # Serviços de negócio
│   ├── email.service.ts
│   ├── backup.service.ts
│   └── reports.service.ts
└── utils/                   # Utilitários
    ├── logger.ts
    ├── validators.ts
    └── helpers.ts
```

### API Design

#### RESTful Architecture
- **Recursos**: Endpoints organizados por recursos
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Códigos HTTP semânticos
- **JSON**: Formato padrão de troca de dados

```typescript
// Exemplo de endpoint RESTful
app.get('/api/farms/:farmId/animals', async (req, res) => {
  const { farmId } = req.params;
  const animals = await storage.getAnimalsByFarm(parseInt(farmId));
  res.json(animals);
});
```

#### Middleware Stack

```typescript
// Stack de middleware
app.use(express.json());                    // Parse JSON
app.use(express.urlencoded({ extended: false })); // Parse URL encoded
app.use(cors());                           // CORS headers
app.use(helmet());                         // Security headers
app.use(compression());                    // Gzip compression
app.use(morgan('combined'));               // Logging
app.use(session(sessionConfig));           // Session management
app.use(passport.initialize());            // Authentication
app.use(passport.session());               // Session persistence
```

### Autenticação e Autorização

#### Passport.js + Session-based Auth
- **Local Strategy**: Autenticação com username/password
- **Session Management**: Sessões persistentes no PostgreSQL
- **Role-based Access**: Controle de acesso baseado em roles

```typescript
// Configuração do Passport
passport.use(new LocalStrategy(
  async (username: string, password: string, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (user && validatePassword(password, user.password)) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error);
    }
  }
));
```

#### Sistema de Roles

```typescript
export enum UserRole {
  SUPER_ADMIN = "super_admin",     // Administrador geral
  FARM_ADMIN = "farm_admin",       // Administrador da fazenda
  MANAGER = "manager",             // Gerente
  EMPLOYEE = "employee",           // Funcionário
  VETERINARIAN = "veterinarian",   // Veterinário
  AGRONOMIST = "agronomist",       // Agrônomo
  CONSULTANT = "consultant"        // Consultor
}

export enum AccessLevel {
  FULL = "full",                   // Acesso total
  READ_ONLY = "read_only",        // Somente leitura
  MANAGE = "manage",              // Gerenciar
  EDIT = "edit",                  // Editar
  VIEW = "view",                  // Visualizar
  NONE = "none"                   // Sem acesso
}
```

### Storage Layer

#### Drizzle ORM
- **Type Safety**: Schemas tipados em TypeScript
- **Migration System**: Sistema de migrações automáticas
- **Query Builder**: Construtor de queries type-safe

```typescript
// Exemplo de schema Drizzle
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  registrationCode: text("registration_code").notNull(),
  name: text("name"),
  speciesId: integer("species_id").notNull(),
  breed: text("breed"),
  sex: text("sex"),
  birthDate: date("birth_date"),
  weight: decimal("weight"),
  status: text("status").default("active"),
  farmId: integer("farm_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### Connection Pooling
- **Neon Serverless**: Conexões serverless otimizadas
- **Pool Configuration**: Configuração de pool para performance
- **Health Checks**: Monitoramento de saúde das conexões

## Camada de Dados

### PostgreSQL

#### Schema Design
- **Normalização**: Schema normalizado para consistência
- **Índices**: Índices otimizados para performance
- **Constraints**: Restrições para integridade de dados
- **Triggers**: Triggers para auditoria e validação

#### Principais Entidades

```sql
-- Estrutura principal das entidades
Users ──────┐
            │
            ▼
Farms ──────┤
            │
            ├─── Animals
            ├─── Crops  
            ├─── Inventory
            ├─── Employees
            ├─── Costs
            └─── Goals
```

#### Performance
- **Indexação estratégica**: Índices para queries frequentes
- **Particionamento**: Para tabelas grandes (futuro)
- **Vacuum automático**: Manutenção automática
- **Query optimization**: Análise e otimização de queries

## Fluxo de Dados

### Request Flow

```
1. User Action (Frontend)
   │
   ▼
2. API Request (HTTP)
   │
   ▼
3. Express Router
   │
   ▼
4. Authentication Middleware
   │
   ▼
5. Authorization Check
   │
   ▼
6. Controller Logic
   │
   ▼
7. Storage Layer (Drizzle)
   │
   ▼
8. PostgreSQL Database
   │
   ▼
9. Response (JSON)
   │
   ▼
10. Frontend Update (React Query)
   │
   ▼
11. UI Re-render (React)
```

### Data Synchronization

#### Real-time Updates (Futuro)
- **WebSockets**: Para updates em tempo real
- **Event-driven**: Arquitetura baseada em eventos
- **Optimistic Updates**: Updates otimistas no frontend

#### Caching Strategy
- **Browser Cache**: Cache de recursos estáticos
- **React Query Cache**: Cache de dados da API
- **Database Cache**: Cache de queries no PostgreSQL

## Segurança

### Frontend Security
- **CSP Headers**: Content Security Policy
- **HTTPS Only**: Comunicação apenas HTTPS
- **XSS Protection**: Proteção contra XSS
- **Input Validation**: Validação no client-side

### Backend Security
- **Helmet.js**: Headers de segurança
- **Rate Limiting**: Limitação de taxa de requests
- **CORS Configuration**: Configuração CORS restritiva
- **SQL Injection**: Proteção via prepared statements

### Database Security
- **Row Level Security**: Segurança a nível de linha
- **Encrypted Connections**: Conexões criptografadas
- **User Permissions**: Permissões mínimas necessárias
- **Backup Encryption**: Backups criptografados

## Escalabilidade

### Horizontal Scaling
- **Stateless Backend**: Backend sem estado para scaling
- **Load Balancing**: Distribuição de carga
- **Database Clustering**: Cluster PostgreSQL (futuro)

### Vertical Scaling
- **Resource Optimization**: Otimização de recursos
- **Connection Pooling**: Pool de conexões eficiente
- **Query Optimization**: Otimização de queries

### Caching Layers
- **Application Cache**: Cache na aplicação
- **Database Cache**: Cache no banco de dados
- **CDN**: Content Delivery Network para assets

## Monitoramento e Observabilidade

### Logging
- **Structured Logs**: Logs estruturados em JSON
- **Log Levels**: debug, info, warn, error
- **Centralized Logging**: Logs centralizados

### Metrics
- **Application Metrics**: Métricas da aplicação
- **Database Metrics**: Performance do banco
- **Infrastructure Metrics**: Métricas de infraestrutura

### Health Checks
- **Application Health**: Status da aplicação
- **Database Health**: Status do banco
- **External Services**: Status de serviços externos

## Deployment Architecture

### Development
```
Developer Machine
├── Frontend Dev Server (Vite)
├── Backend Dev Server (Node.js)
└── Local PostgreSQL
```

### Staging
```
Staging Server
├── Frontend Build (Static Files)
├── Backend (PM2)
├── PostgreSQL (Staging DB)
└── Nginx (Reverse Proxy)
```

### Production
```
Production Infrastructure
├── Load Balancer (Nginx/AWS ALB)
├── Application Servers (Multiple instances)
│   ├── Frontend (Static Files)
│   └── Backend (PM2 Cluster)
├── Database (PostgreSQL Master/Replica)
├── File Storage (Local/S3)
├── Monitoring (Logs, Metrics)
└── Backup System
```

## Futuras Melhorias

### Arquiteturais
- **Microservices**: Migração para microserviços
- **Event Sourcing**: Implementação de event sourcing
- **CQRS**: Command Query Responsibility Segregation
- **GraphQL**: API GraphQL complementar

### Tecnológicas
- **Redis**: Cache distribuído
- **Elasticsearch**: Busca avançada
- **WebSockets**: Comunicação real-time
- **Message Queue**: Processamento assíncrono

### Performance
- **CDN**: Content Delivery Network
- **Edge Computing**: Processamento na borda
- **Database Sharding**: Particionamento horizontal
- **Read Replicas**: Réplicas de leitura

---

*Esta documentação de arquitetura deve ser mantida atualizada conforme evoluções do sistema.*