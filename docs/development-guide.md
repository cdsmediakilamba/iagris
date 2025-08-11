# Guia de Desenvolvimento - iAgris

## Visão Geral

Este guia orienta desenvolvedores sobre como configurar o ambiente de desenvolvimento, contribuir com o projeto e seguir as melhores práticas estabelecidas para o sistema iAgris.

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

#### Software Obrigatório
- **Node.js**: v18.0 ou superior
- **npm**: v8.0 ou superior (incluído com Node.js)
- **PostgreSQL**: v13.0 ou superior
- **Git**: Para controle de versão

#### Software Recomendado
- **Visual Studio Code**: Editor recomendado
- **pgAdmin**: Interface gráfica para PostgreSQL
- **Postman/Insomnia**: Para testar APIs
- **Docker**: Para containerização (opcional)

#### Extensões VS Code Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### Clonando o Repositório

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/iagris.git
cd iagris

# Configurar upstream (se for fork)
git remote add upstream https://github.com/original/iagris.git
```

### Configuração Inicial

#### 1. Instalação de Dependências

```bash
# Instalar dependências
npm install

# Verificar se não há vulnerabilidades
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix
```

#### 2. Configuração do Banco de Dados

```bash
# Criar banco de desenvolvimento
sudo -u postgres createdb iagris_dev

# Criar usuário para desenvolvimento
sudo -u postgres psql -c "CREATE USER iagris_dev WITH PASSWORD 'dev123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE iagris_dev TO iagris_dev;"
```

#### 3. Configuração de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.development

# Editar configurações de desenvolvimento
nano .env.development
```

**Conteúdo do .env.development:**

```env
# Configuração de desenvolvimento
NODE_ENV=development
PORT=5000

# Banco de dados local
DATABASE_URL="postgresql://iagris_dev:dev123@localhost:5432/iagris_dev"

# Chave de sessão (não usar em produção)
SESSION_SECRET="chave-de-desenvolvimento-nao-segura"

# Logs verbosos para debug
LOG_LEVEL=debug
LOG_FORMAT=simple

# Desabilitar seguranças desnecessárias em dev
SECURITY_HEADERS_ENABLED=false
SESSION_SECURE=false
CORS_ORIGIN="http://localhost:5000"

# Mock de APIs externas
MOCK_EXTERNAL_APIS=true
OPENWEATHER_API_KEY="mock"
```

#### 4. Inicialização do Banco

```bash
# Aplicar schema
npm run db:push

# Executar seeds (dados de teste)
npm run db:seed
```

### Executando o Projeto

#### Modo Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# O servidor estará disponível em:
# http://localhost:5000
```

#### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Inicia servidor de produção
npm run check            # Verificação de tipos TypeScript

# Banco de dados
npm run db:push          # Aplicar mudanças no schema
npm run db:generate      # Gerar migrations
npm run db:migrate       # Aplicar migrations
npm run db:seed          # Popular com dados de teste

# Qualidade de código
npm run lint             # Executar ESLint
npm run lint:fix         # Corrigir problemas do ESLint automaticamente
npm run format           # Formatar código com Prettier
npm run type-check       # Verificar tipos TypeScript

# Testes
npm run test             # Executar testes
npm run test:watch       # Executar testes em modo watch
npm run test:coverage    # Executar testes com coverage
```

## Estrutura do Projeto

### Visão Geral dos Diretórios

```
iagris/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── hooks/             # Custom hooks
│   │   ├── context/           # React contexts
│   │   ├── lib/               # Utilitários
│   │   └── types/             # Tipos TypeScript
│   ├── public/                # Arquivos públicos
│   └── index.html             # Template HTML
├── server/                     # Backend Node.js
│   ├── index.ts               # Entry point
│   ├── routes.ts              # Definição de rotas
│   ├── auth.ts                # Configuração de auth
│   ├── storage.ts             # Interface de storage
│   └── vite.ts                # Configuração Vite
├── shared/                     # Código compartilhado
│   └── schema.ts              # Schema do banco (Drizzle)
├── docs/                       # Documentação
├── migrations/                 # Migrations do banco
├── scripts/                    # Scripts utilitários
├── tests/                      # Testes
└── photos/                     # Uploads de fotos
```

### Convenções de Nomenclatura

#### Arquivos e Diretórios
- **kebab-case**: Para nomes de arquivos e diretórios
- **PascalCase**: Para componentes React
- **camelCase**: Para funções e variáveis

```
✅ Correto:
- user-profile.tsx
- AnimalCard.tsx
- getUserData()

❌ Incorreto:
- UserProfile.tsx (para arquivos)
- animalcard.tsx (para componentes)
- get_user_data() (snake_case)
```

#### Componentes React

```typescript
// ✅ Correto - PascalCase para componentes
export function AnimalCard({ animal }: AnimalCardProps) {
  return <div>...</div>;
}

// ✅ Correto - Props interface
interface AnimalCardProps {
  animal: Animal;
  onEdit?: (id: number) => void;
}
```

#### Variáveis e Funções

```typescript
// ✅ Correto - camelCase
const currentUser = useAuth();
const handleSubmit = (data: FormData) => { ... };

// ❌ Incorreto
const CurrentUser = useAuth();
const handle_submit = (data: FormData) => { ... };
```

## Guidelines de Desenvolvimento

### Frontend (React)

#### Estrutura de Componentes

```typescript
// Template para componente funcional
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComponentProps {
  // Definir props aqui
}

export function ComponentName({ ...props }: ComponentProps) {
  // Hooks no topo
  const [state, setState] = useState<Type>(initialValue);
  
  // Event handlers
  const handleAction = () => {
    // lógica aqui
  };
  
  // Effects
  useEffect(() => {
    // side effects
  }, [dependencies]);
  
  // Early returns
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Render principal
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Conteúdo */}
      </CardContent>
    </Card>
  );
}
```

#### Custom Hooks

```typescript
// hooks/use-animals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useAnimals(farmId: number) {
  return useQuery({
    queryKey: ['animals', farmId],
    queryFn: () => apiRequest(`/api/farms/${farmId}/animals`),
    enabled: !!farmId,
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAnimalData) => 
      apiRequest('/api/animals', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });
}
```

#### Formulários

```typescript
// Usar react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const animalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  birthDate: z.date(),
});

type AnimalFormData = z.infer<typeof animalSchema>;

export function AnimalForm() {
  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      name: '',
      species: '',
    },
  });
  
  const onSubmit = (data: AnimalFormData) => {
    // lógica de submissão
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* campos do formulário */}
      </form>
    </Form>
  );
}
```

### Backend (Express)

#### Estrutura de Rotas

```typescript
// routes/animals.ts
import { Router } from 'express';
import { storage } from '../storage';
import { checkAuth, checkFarmAccess } from '../middleware/auth';

const router = Router();

// GET /api/farms/:farmId/animals
router.get('/farms/:farmId/animals', checkAuth, checkFarmAccess, async (req, res) => {
  try {
    const farmId = parseInt(req.params.farmId);
    const animals = await storage.getAnimalsByFarm(farmId);
    res.json(animals);
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
});

export { router as animalsRouter };
```

#### Error Handling

```typescript
// middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);
  
  // Erro conhecido
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.message
    });
  }
  
  // Erro de autorização
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
}
```

#### Validação de Dados

```typescript
// middleware/validation.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Uso:
const createAnimalSchema = z.object({
  name: z.string().min(1),
  species: z.string(),
  birthDate: z.string().transform(str => new Date(str)),
});

router.post('/animals', validateBody(createAnimalSchema), async (req, res) => {
  // req.body já está validado e tipado
});
```

### Database (Drizzle)

#### Schema Definition

```typescript
// shared/schema.ts
import { pgTable, text, serial, integer, timestamp, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  registrationCode: text("registration_code").notNull(),
  name: text("name"),
  speciesId: integer("species_id").notNull(),
  breed: text("breed"),
  sex: text("sex"),
  birthDate: timestamp("birth_date"),
  weight: decimal("weight"),
  farmId: integer("farm_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema para inserção
export const insertAnimalSchema = createInsertSchema(animals).omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript
export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = typeof animals.$inferInsert;
```

#### Queries

```typescript
// storage/animals.ts
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import { animals, species } from '../shared/schema';

export async function getAnimalsByFarm(farmId: number) {
  return await db
    .select({
      id: animals.id,
      registrationCode: animals.registrationCode,
      name: animals.name,
      breed: animals.breed,
      speciesName: species.name,
    })
    .from(animals)
    .leftJoin(species, eq(animals.speciesId, species.id))
    .where(and(
      eq(animals.farmId, farmId),
      eq(animals.status, 'active')
    ))
    .orderBy(desc(animals.createdAt));
}
```

## Boas Práticas

### Code Style

#### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Performance

#### React Performance

```typescript
// Usar memo para componentes que re-renderizam frequentemente
const AnimalCard = memo(({ animal }: AnimalCardProps) => {
  return <div>...</div>;
});

// Usar useCallback para funções passadas como props
const handleEdit = useCallback((id: number) => {
  // lógica
}, [dependency]);

// Lazy loading para componentes grandes
const ReportsPage = lazy(() => import('./pages/reports'));
```

#### Database Performance

```typescript
// Usar índices apropriados
CREATE INDEX idx_animals_farm_status ON animals(farm_id, status);

// Limitar resultados
export async function getAnimals(farmId: number, limit = 50, offset = 0) {
  return await db
    .select()
    .from(animals)
    .where(eq(animals.farmId, farmId))
    .limit(limit)
    .offset(offset);
}
```

### Segurança

#### Input Sanitization

```typescript
// Sempre validar inputs
const schema = z.object({
  name: z.string().max(100).trim(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

// Usar prepared statements (Drizzle faz automaticamente)
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, email)); // Seguro contra SQL injection
```

#### Authentication

```typescript
// Middleware de autenticação
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Verificação de permissões
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

## Testes

### Configuração de Testes

```bash
# Instalar dependências de teste
npm install --save-dev jest @types/jest supertest @types/supertest
```

#### Jest Configuration

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'server/**/*.ts',
    'client/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
};
```

### Testes de Unidade

```typescript
// tests/utils/validation.test.ts
import { validateEmail } from '../server/utils/validation';

describe('validateEmail', () => {
  it('should validate correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  
  it('should reject invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

### Testes de Integração

```typescript
// tests/api/animals.test.ts
import request from 'supertest';
import { app } from '../server/index';

describe('Animals API', () => {
  it('should get animals for farm', async () => {
    const response = await request(app)
      .get('/api/farms/1/animals')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
      
    expect(response.body).toBeInstanceOf(Array);
  });
});
```

## Debugging

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Database Debugging

```typescript
// Habilitar logs de query no Drizzle
const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});
```

## Workflow de Desenvolvimento

### Git Workflow

#### Branch Naming

```bash
# Feature branches
feature/animal-registration
feature/crop-management

# Bug fixes
bugfix/login-validation
hotfix/critical-security-issue

# Releases
release/v1.2.0
```

#### Commit Messages

```bash
# Formato: tipo(escopo): descrição

# Exemplos:
feat(animals): add animal registration form
fix(auth): resolve login validation issue
docs(readme): update installation instructions
refactor(api): simplify route handlers
test(animals): add unit tests for animal service
```

### Pull Request Process

1. **Criar branch** a partir da `main`
2. **Desenvolver** feature/fix
3. **Escrever testes** para o código
4. **Atualizar documentação** se necessário
5. **Fazer commit** seguindo convenções
6. **Criar Pull Request** com descrição detalhada
7. **Code Review** por pelo menos um revisor
8. **Merge** após aprovação

### Code Review Checklist

#### Funcionalidade
- [ ] O código faz o que deveria fazer?
- [ ] A lógica está correta?
- [ ] Há tratamento de erros adequado?

#### Qualidade
- [ ] O código é legível e bem estruturado?
- [ ] Há comentários onde necessário?
- [ ] Segue as convenções do projeto?

#### Performance
- [ ] Há problemas de performance óbvios?
- [ ] Queries de banco estão otimizadas?
- [ ] Não há vazamentos de memória?

#### Segurança
- [ ] Inputs estão sendo validados?
- [ ] Há verificação de autorização?
- [ ] Dados sensíveis estão protegidos?

#### Testes
- [ ] Há testes adequados?
- [ ] Testes passam?
- [ ] Coverage é adequado?

## Troubleshooting

### Problemas Comuns

#### "Cannot find module"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### "Database connection failed"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U iagris_dev -d iagris_dev
```

#### "Port already in use"
```bash
# Encontrar processo usando a porta
lsof -i :5000

# Matar processo
kill -9 <PID>
```

#### "Permission denied"
```bash
# Corrigir permissões
sudo chown -R $USER:$USER .
chmod 755 scripts/*.sh
```

### Debug Logs

```typescript
// Adicionar logs de debug
console.log('[DEBUG]', 'Variable value:', variable);
console.time('Operation');
// ... código
console.timeEnd('Operation');
```

### Performance Profiling

```bash
# Node.js profiling
node --prof server/index.js

# Analisar profile
node --prof-process isolate-*.log > profile.txt
```

## Recursos Adicionais

### Documentação Oficial
- [React](https://react.dev)
- [Express.js](https://expressjs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Ferramentas Úteis
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Regex101](https://regex101.com)
- [JSON Formatter](https://jsonformatter.curiousconcept.com)
- [SQL Fiddle](http://sqlfiddle.com)

### Comunidades
- [React Discord](https://discord.gg/react)
- [TypeScript Discord](https://discord.gg/typescript)
- [Node.js Slack](https://www.nodeslang.com)

---

*Este guia deve ser atualizado conforme o projeto evolui e novas práticas são adotadas.*