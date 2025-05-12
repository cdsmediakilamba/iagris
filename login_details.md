# Detalhes de Acesso ao Sistema Iagris

Este arquivo contém os detalhes de acesso para diferentes tipos de usuários do sistema Iagris. Você pode usar essas credenciais para testar as funcionalidades conforme os diferentes níveis de permissão.

## Senha Padrão para Todos os Usuários

**Senha:** `12345`

## Administradores do Sistema

| Usuário | Perfil | Descrição |
|---------|--------|-----------|
| admin | Super Admin | Acesso completo a todo o sistema, pode ver todas as fazendas |
| superadmin | Super Admin | Acesso completo a todo o sistema, pode ver todas as fazendas |

## Fazendas e Seus Usuários

### Fazenda Modelo (ID: 6)
**Descrição:** Uma fazenda modelo para demonstração do sistema  
**Tipo:** Mista (Mixed)

| Usuário | Perfil | Função na Fazenda |
|---------|--------|-------------------|
| jsilva | Administrador de Fazenda | Admin |
| pedroger | Gerente | Manager |
| mluisa | Funcionário | Worker |
| carlosvet | Veterinário | Specialist |
| anagro | Agrônomo | Specialist |

### Fazenda Pecuária do Sul (ID: 7)
**Descrição:** Fazenda de criação de gado no sul de Angola  
**Tipo:** Pecuária (Livestock)

| Usuário | Perfil | Função na Fazenda |
|---------|--------|-------------------|
| jsilva | Administrador de Fazenda | Admin |
| mluisa | Funcionário | Worker |
| carlosvet | Veterinário | Specialist |

### Fazenda Agrícola do Norte (ID: 8)
**Descrição:** Fazenda de plantações no norte de Angola  
**Tipo:** Agrícola (Crop)

| Usuário | Perfil | Função na Fazenda |
|---------|--------|-------------------|
| jsilva | Administrador de Fazenda | Admin |
| pedroger | Gerente | Manager |
| anagro | Agrônomo | Specialist |

### Fazenda Modelo (ID: 12) - Usada para testes
**Descrição:** Fazenda principal para testes do sistema  
**Tipo:** Mista (Mixed)

| Usuário | Perfil | Função na Fazenda |
|---------|--------|-------------------|
| farmadmin | Administrador de Fazenda | Admin |
| manager | Gerente | Manager |
| employee | Funcionário | Worker |
| damiana | Funcionário | Employee |
| marta | Funcionário | Employee |

## Outros Usuários Disponíveis

| Usuário | Perfil | Notas |
|---------|--------|-------|
| juliacons | Consultor | Consultor no Pomar Tropical |
| gugu | Funcionário | Usuário de teste |
| juliabr | Funcionário | Usuário de teste |

## Níveis de Acesso

Os diferentes tipos de usuários têm diferentes níveis de acesso no sistema:

- **Super Admin:** Acesso total a todas as funcionalidades e fazendas do sistema
- **Administrador de Fazenda:** Acesso total às fazendas sob sua administração
- **Gerente:** Acesso à maioria das funcionalidades, incluindo financeiro e relatórios
- **Funcionário:** Acesso básico para registro de atividades e visualização
- **Especialistas** (Veterinário, Agrônomo): Acesso às áreas relevantes à sua especialidade

## Como Testar as Funcionalidades

1. Acesse a página de login do sistema
2. Digite o nome de usuário e a senha (12345)
3. Explore as diferentes funcionalidades disponíveis para cada tipo de usuário:
   - **Super Admin (admin)**: Acesse todas as fazendas e todas as funcionalidades
   - **Administrador de Fazenda (farmadmin)**: Teste a administração completa de uma fazenda
   - **Gerente (manager)**: Verifique o acesso às áreas de gestão e relatórios
   - **Funcionário (employee, damiana, marta)**: Teste o registro de tarefas e outras atividades básicas
4. Você pode alternar entre diferentes usuários para testar as restrições de acesso
