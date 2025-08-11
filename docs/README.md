# iAgris - Sistema de Gestão Agrícola

## Visão Geral

O iAgris é um sistema completo de gestão de fazendas desenvolvido especificamente para operações agrícolas em Angola. É uma Progressive Web App (PWA) bilíngue (Português/Inglês) que oferece funcionalidades avançadas para rastreamento de animais, gestão de cultivos, controle de inventário, gestão de tarefas e relatórios financeiros.

## Documentação Disponível

Este diretório contém toda a documentação técnica e de usuário do sistema iAgris:

### 📋 Documentação de Instalação e Configuração
- **[Guia de Instalação](./installation-guide.md)** - Instruções completas para instalação em diferentes servidores
- **[Instalação no cPanel](./cpanel-installation.md)** - Guia específico para hospedagem compartilhada
- **[Configuração do Ambiente](./environment-setup.md)** - Configuração de variáveis e dependências
- **[Configuração do Banco de Dados](./database-setup.md)** - Setup e migração do PostgreSQL

### 🏗️ Documentação Técnica
- **[Arquitetura do Sistema](./architecture.md)** - Visão geral da arquitetura e componentes
- **[Documentação da API](./api-documentation.md)** - Endpoints e especificações da API REST
- **[Schema do Banco de Dados](./database-schema.md)** - Estrutura completa do banco de dados
- **[Guia de Desenvolvimento](./development-guide.md)** - Como contribuir e desenvolver no projeto

### 👥 Documentação do Usuário
- **[Manual do Usuário](./user-manual.md)** - Guia completo para usuários finais
- **[Guia de Administração](./admin-guide.md)** - Funcionalidades administrativas
- **[Sistema de Permissões](./permissions-guide.md)** - Roles e níveis de acesso
- **[FAQ](./faq.md)** - Perguntas frequentes e solução de problemas

### 🚀 Implantação e Manutenção
- **[Guia de Deploy](./deployment-guide.md)** - Procedimentos de implantação em produção
- **[Monitoramento](./monitoring.md)** - Como monitorar o sistema em produção
- **[Backup e Recuperação](./backup-recovery.md)** - Estratégias de backup e recuperação de dados
- **[Atualizações](./updates-guide.md)** - Como aplicar atualizações do sistema

## Recursos Principais

### 🐄 Gestão de Animais
- Rastreamento completo do gado com códigos únicos
- Histórico de saúde e vacinações
- Controle genealógico
- Registro de mortes e remoções

### 🌱 Gestão de Cultivos
- Planejamento de plantios e colheitas
- Monitoramento de ciclos de crescimento
- Controle de produtividade
- Gestão de custos por cultivo

### 📦 Controle de Inventário
- Gestão de estoque por categorias
- Alertas de estoque baixo
- Histórico de transações
- Controle de entrada e saída

### 👥 Gestão de Funcionários
- Registro de funcionários permanentes e temporários
- Controle de acesso por roles
- Histórico de atividades
- Gestão de permissões

### 💰 Gestão Financeira
- Controle de custos por categoria
- Relatórios financeiros detalhados
- Acompanhamento de metas
- Análise de rentabilidade

### 📊 Relatórios e Analytics
- Dashboard com métricas em tempo real
- Relatórios personalizáveis
- Exportação de dados
- Gráficos e visualizações

## Requisitos do Sistema

### Requisitos Mínimos do Servidor
- **CPU**: 1 vCPU / 1 GHz
- **RAM**: 1 GB mínimo, 2 GB recomendado
- **Armazenamento**: 5 GB de espaço livre
- **Sistema Operacional**: Linux (Ubuntu 20.04+), Windows Server 2019+, ou macOS

### Requisitos de Software
- **Node.js**: Versão 18.0 ou superior
- **PostgreSQL**: Versão 13 ou superior
- **npm**: Versão 8 ou superior

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis
- **React Query** para gestão de estado
- **Wouter** para roteamento

### Backend
- **Node.js** com Express
- **TypeScript** para type safety
- **Drizzle ORM** para acesso ao banco
- **Passport.js** para autenticação

### Banco de Dados
- **PostgreSQL** para persistência de dados
- **Drizzle Kit** para migrações
- **Connection Pooling** para performance

## Suporte

Para suporte técnico ou dúvidas sobre o sistema:

1. Consulte primeiro a **[FAQ](./faq.md)**
2. Verifique a documentação técnica relevante
3. Entre em contato com a equipe de suporte

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## Contribuição

Para contribuir com o projeto, consulte o **[Guia de Desenvolvimento](./development-guide.md)** para instruções detalhadas sobre como configurar o ambiente de desenvolvimento e submeter contribuições.

---

*Última atualização: Agosto 2025*