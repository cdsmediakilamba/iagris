# Guia de Administração - iAgris

## Visão Geral

Este guia é destinado aos administradores do sistema iAgris, fornecendo instruções detalhadas sobre configuração de usuários, permissões, fazendas e manutenção geral do sistema.

## Acesso Administrativo

### Tipos de Administradores

#### Super Admin
- **Escopo**: Todo o sistema
- **Permissões**: Todas as funcionalidades
- **Responsabilidades**:
  - Gerenciar múltiplas fazendas
  - Criar e configurar fazendas
  - Gerenciar todos os usuários
  - Configurações globais do sistema

#### Farm Admin
- **Escopo**: Fazenda específica
- **Permissões**: Todas as funcionalidades da fazenda
- **Responsabilidades**:
  - Gerenciar usuários da fazenda
  - Configurar dados da fazenda
  - Supervisionar operações

### Acessando Funcionalidades Administrativas

1. Faça login com conta de administrador
2. Acesse **"Administração"** no menu lateral
3. As opções disponíveis variam conforme seu nível de acesso

## Gestão de Fazendas

### Criando Nova Fazenda

**Apenas Super Admins podem criar fazendas**

1. Vá em **"Administração"** → **"Fazendas"**
2. Clique **"+ Nova Fazenda"**
3. Preencha as informações:
   - **Nome**: Nome da fazenda
   - **Localização**: Endereço ou região
   - **Tamanho**: Área em hectares
   - **Tipo**: Pecuária, Agricultura ou Mista
   - **Coordenadas**: Localização GPS (opcional)
   - **Descrição**: Informações adicionais
4. **Administrador**: Atribua um Farm Admin
5. Clique **"Criar Fazenda"**

### Editando Fazenda Existente

1. Na lista de fazendas, clique na fazenda desejada
2. Clique **"Editar"**
3. Modifique as informações necessárias
4. Clique **"Salvar Alterações"**

### Configurações da Fazenda

#### Informações Básicas
- Nome e localização
- Área e tipo de produção
- Coordenadas GPS
- Descrição detalhada

#### Configurações Operacionais
- **Prefixos de códigos**: Para animais e cultivos
- **Categorias de inventário**: Personalizar categorias
- **Tipos de cultivos**: Culturas específicas da região
- **Espécies de animais**: Configurar espécies criadas

#### Configurações Financeiras
- **Categorias de custos**: Personalizar categorias
- **Moeda**: Kwanza Angolano (AOA) por padrão
- **Períodos fiscais**: Definir ano fiscal
- **Metas financeiras**: Orçamentos e limites

### Transferindo Fazenda

Para transferir administração de uma fazenda:

1. Acesse a fazenda como Super Admin
2. Vá em **"Configurações"** → **"Administração"**
3. Selecione novo administrador
4. Confirme a transferência
5. O novo admin receberá notificação

## Gestão de Usuários

### Tipos de Usuários

#### Hierarquia de Permissões
```
Super Admin (Acesso total ao sistema)
├── Farm Admin (Administra fazenda específica)
├── Manager (Gerencia operações da fazenda)
├── Veterinarian (Foco em saúde animal)
├── Agronomist (Foco em cultivos)
├── Employee (Operações básicas)
└── Consultant (Acesso limitado para consultoria)
```

### Criando Novos Usuários

1. Vá em **"Administração"** → **"Usuários"**
2. Clique **"+ Novo Usuário"**
3. Preencha dados básicos:
   - **Nome completo**
   - **Nome de usuário** (único)
   - **Email**
   - **Senha temporária**
4. Definir permissões:
   - **Role**: Selecione o cargo
   - **Fazenda**: Atribua à fazenda (se aplicável)
   - **Módulos**: Configure acesso aos módulos
5. Clique **"Criar Usuário"**

### Configurando Permissões

#### Permissões por Módulo

**Animais**
- **FULL**: Criar, editar, excluir, visualizar tudo
- **MANAGE**: Criar e editar, visualizar tudo
- **EDIT**: Editar existentes, visualizar tudo
- **VIEW**: Apenas visualizar
- **NONE**: Sem acesso

**Cultivos**
- Mesma estrutura de permissões dos animais
- Aplicável a plantios, atividades agrícolas

**Inventário**
- **FULL**: Gerenciar estoque, transações, configurações
- **MANAGE**: Registrar entradas/saídas, ajustes
- **EDIT**: Atualizar informações de itens
- **VIEW**: Consultar apenas
- **NONE**: Sem acesso

**Financeiro**
- **FULL**: Todas as operações financeiras
- **MANAGE**: Registrar custos, gerar relatórios
- **VIEW**: Consultar relatórios
- **NONE**: Sem acesso

**Funcionários**
- **FULL**: Gerenciar todos os funcionários
- **MANAGE**: Adicionar/editar funcionários
- **VIEW**: Visualizar lista de funcionários
- **NONE**: Sem acesso

**Relatórios**
- **FULL**: Todos os relatórios, exportações
- **VIEW**: Relatórios básicos
- **NONE**: Sem acesso

#### Configuração Rápida por Cargo

**Farm Admin**
```
Todos os módulos: FULL
Escopo: Fazenda específica
```

**Manager**
```
Animais: FULL
Cultivos: FULL  
Inventário: FULL
Financeiro: MANAGE
Funcionários: MANAGE
Relatórios: FULL
```

**Veterinarian**
```
Animais: FULL
Inventário: MANAGE (medicamentos)
Financeiro: MANAGE (custos veterinários)
Funcionários: VIEW
Relatórios: VIEW
```

**Agronomist**
```
Cultivos: FULL
Inventário: MANAGE (insumos agrícolas)
Financeiro: MANAGE (custos agrícolas)
Funcionários: VIEW
Relatórios: VIEW
```

**Employee**
```
Animais: EDIT
Cultivos: EDIT
Inventário: EDIT
Financeiro: VIEW
Funcionários: VIEW
Relatórios: VIEW
```

### Gerenciando Usuários Existentes

#### Editando Permissões

1. Na lista de usuários, clique no usuário desejado
2. Vá na aba **"Permissões"**
3. Ajuste as permissões por módulo
4. Clique **"Salvar Alterações"**

#### Resetando Senhas

1. Clique no usuário na lista
2. Clique **"Resetar Senha"**
3. Uma nova senha temporária será gerada
4. Envie as credenciais para o usuário
5. Usuário deve alterar no primeiro login

#### Desativando Usuários

Para usuários que não trabalham mais:

1. Clique no usuário
2. Clique **"Desativar Usuário"**
3. Usuário perderá acesso imediatamente
4. Dados históricos são preservados

#### Transferindo Usuários

Para mover usuário entre fazendas:

1. Clique no usuário
2. Altere o campo **"Fazenda"**
3. Ajuste permissões se necessário
4. Clique **"Salvar"**

## Configurações do Sistema

### Configurações Gerais

#### Informações da Empresa

1. Vá em **"Administração"** → **"Configurações"**
2. Aba **"Empresa"**:
   - Nome da empresa/organização
   - Logo (upload de imagem)
   - Informações de contato
   - Configurações de localização

#### Configurações Regionais

- **Idioma padrão**: Português ou English
- **Fuso horário**: Angola (WAT)
- **Formato de data**: DD/MM/AAAA
- **Moeda**: Kwanza Angolano (AOA)
- **Unidades**: Métricas (kg, hectares, etc.)

#### Configurações de Segurança

**Políticas de Senha**
- Comprimento mínimo: 8 caracteres
- Exigir números e letras
- Exigir caracteres especiais
- Expiração de senha (opcional)

**Configurações de Sessão**
- Tempo de inatividade: 4 horas padrão
- Logout automático
- Limite de tentativas de login

**Backup e Segurança**
- Frequência de backups
- Retenção de logs
- Auditoria de ações

### Configurações de Email

#### SMTP Configuration

1. Vá em **"Configurações"** → **"Email"**
2. Configure servidor SMTP:
   - **Servidor**: smtp.gmail.com (exemplo)
   - **Porta**: 587
   - **Usuário**: seu-email@gmail.com
   - **Senha**: senha de app
   - **Criptografia**: TLS

#### Templates de Email

Configure templates para:
- **Novos usuários**: Credenciais de acesso
- **Reset de senha**: Nova senha temporária
- **Alertas**: Estoque baixo, vacinas vencendo
- **Relatórios**: Envio automático de relatórios

### Configurações de Backup

#### Backup Automático

1. **Frequência**: Diário, semanal ou mensal
2. **Horário**: Preferencialmente fora do horário comercial
3. **Retenção**: Quantos backups manter
4. **Localização**: Local ou nuvem

#### Backup Manual

Para fazer backup imediato:

1. Vá em **"Administração"** → **"Backup"**
2. Clique **"Criar Backup"**
3. Aguarde conclusão
4. Baixe o arquivo de backup

#### Restauração

⚠️ **Cuidado**: Restauração sobrescreve dados atuais

1. Vá em **"Backup"** → **"Restaurar"**
2. Selecione arquivo de backup
3. Confirme a operação
4. Aguarde conclusão

## Monitoramento do Sistema

### Dashboard Administrativo

O dashboard administrativo mostra:

- **Usuários ativos**: Quem está online
- **Uso por fazenda**: Estatísticas de uso
- **Performance**: Tempo de resposta, erros
- **Armazenamento**: Uso do disco
- **Backup**: Status dos backups

### Logs do Sistema

#### Tipos de Logs

**Log de Auditoria**
- Logins e logouts
- Alterações de permissões
- Criação/edição de dados importantes
- Ações administrativas

**Log de Erros**
- Erros da aplicação
- Falhas de conexão
- Problemas de performance

**Log de Acesso**
- Requests HTTP
- APIs acessadas
- Tempo de resposta

#### Visualizando Logs

1. Vá em **"Administração"** → **"Logs"**
2. Selecione tipo de log
3. Filtre por:
   - Período
   - Usuário
   - Tipo de ação
   - Nível de severidade

### Relatórios Administrativos

#### Relatório de Uso

- Usuários mais ativos
- Funcionalidades mais utilizadas
- Fazendas com maior atividade
- Horários de pico de uso

#### Relatório de Performance

- Tempo de resposta médio
- Queries mais lentas
- Uso de recursos do servidor
- Erros por período

#### Relatório de Segurança

- Tentativas de login falhadas
- Alterações de permissões
- Acessos administrativos
- Atividades suspeitas

## Manutenção do Sistema

### Rotinas de Manutenção

#### Diária
- [ ] Verificar backups automáticos
- [ ] Monitorar logs de erro
- [ ] Verificar performance geral

#### Semanal
- [ ] Revisar relatórios de uso
- [ ] Verificar integridade do banco
- [ ] Analisar logs de segurança

#### Mensal
- [ ] Atualizar sistema se necessário
- [ ] Revisar permissões de usuários
- [ ] Limpar logs antigos
- [ ] Testar procedimentos de backup

### Otimização de Performance

#### Banco de Dados

1. **Reindexação**: Mensal
2. **Vacuum**: Semanal
3. **Análise de queries lentas**: Semanal
4. **Limpeza de dados antigos**: Conforme necessário

#### Aplicação

1. **Restart periódico**: Conforme necessário
2. **Limpeza de cache**: Semanal
3. **Monitoramento de memória**: Diário
4. **Atualização de dependências**: Mensal

### Solução de Problemas

#### Usuários Não Conseguem Logar

1. **Verificar status do usuário**: Ativo/Inativo
2. **Verificar permissões**: Acesso à fazenda
3. **Resetar senha**: Se necessário
4. **Verificar logs**: Tentativas de login

#### Sistema Lento

1. **Verificar logs de performance**
2. **Analisar queries do banco**
3. **Verificar uso de recursos**
4. **Reiniciar aplicação se necessário**

#### Dados Não Salvam

1. **Verificar conexão com banco**
2. **Verificar permissões de escrita**
3. **Analisar logs de erro**
4. **Verificar validações**

#### Relatórios Não Geram

1. **Verificar permissões do usuário**
2. **Verificar período selecionado**
3. **Analisar logs de erro**
4. **Testar com dados de teste**

## Atualizações do Sistema

### Planejamento de Atualizações

#### Antes da Atualização

1. **Fazer backup completo**
2. **Notificar usuários**
3. **Agendar janela de manutenção**
4. **Testar em ambiente de staging**

#### Durante a Atualização

1. **Colocar sistema em manutenção**
2. **Aplicar atualização**
3. **Executar testes básicos**
4. **Verificar funcionalidades críticas**

#### Após a Atualização

1. **Remover modo de manutenção**
2. **Monitorar logs de erro**
3. **Verificar feedback dos usuários**
4. **Documentar mudanças**

### Rollback de Atualizações

Se houver problemas:

1. **Ativar modo de manutenção**
2. **Restaurar backup anterior**
3. **Verificar integridade dos dados**
4. **Notificar usuários sobre o rollback**

## Treinamento de Usuários

### Programa de Treinamento

#### Usuários Novos

1. **Apresentação do sistema**: 30 minutos
2. **Navegação básica**: 30 minutos
3. **Funcionalidades específicas**: 1-2 horas
4. **Prática supervisionada**: Conforme necessário

#### Usuários Existentes

1. **Novas funcionalidades**: 30 minutos
2. **Melhores práticas**: 30 minutos
3. **Reciclagem periódica**: Trimestral

### Material de Treinamento

- **Manual do usuário** completo
- **Vídeos tutoriais** por funcionalidade
- **FAQ** atualizado
- **Guias rápidos** por cargo

### Avaliação de Treinamento

1. **Teste prático**: Uso das funcionalidades
2. **Feedback**: Coleta de sugestões
3. **Acompanhamento**: Primeiras semanas de uso
4. **Reforço**: Treinamento adicional se necessário

## Políticas e Procedimentos

### Política de Backup

- **Frequência**: Diária
- **Retenção**: 30 dias locais, 1 ano em nuvem
- **Teste de restauração**: Mensal
- **Responsável**: Administrador do sistema

### Política de Senhas

- **Comprimento mínimo**: 8 caracteres
- **Complexidade**: Letras, números, símbolos
- **Expiração**: Opcional (recomendado 90 dias)
- **Reutilização**: Últimas 5 senhas

### Política de Acesso

- **Princípio do menor privilégio**
- **Revisão trimestral** de permissões
- **Desativação imediata** ao término do vínculo
- **Auditoria semestral** de acessos

### Procedimentos de Emergência

#### Falha do Sistema

1. **Verificar status** dos serviços
2. **Consultar logs** de erro
3. **Tentar restart** da aplicação
4. **Restaurar backup** se necessário
5. **Notificar usuários** sobre o status

#### Perda de Dados

1. **Avaliar extensão** da perda
2. **Localizar backup** mais recente
3. **Restaurar dados** perdidos
4. **Verificar integridade**
5. **Documenter incident**

#### Problema de Segurança

1. **Isolar o problema**
2. **Alterar senhas** se necessário
3. **Revisar logs** de acesso
4. **Implementar correções**
5. **Monitorar atividade**

---

*Este guia deve ser consultado regularmente e atualizado conforme mudanças no sistema.*