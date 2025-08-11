# FAQ - Perguntas Frequentes

## Geral

### O que é o iAgris?

O iAgris é um sistema completo de gestão agrícola desenvolvido especificamente para fazendas em Angola. É uma Progressive Web App (PWA) que oferece controle total sobre animais, cultivos, inventário, funcionários e finanças da sua fazenda.

### Quais navegadores são suportados?

O iAgris funciona nos seguintes navegadores:
- **Chrome** 90 ou superior
- **Firefox** 88 ou superior  
- **Safari** 14 ou superior
- **Edge** 90 ou superior

### O sistema funciona offline?

Sim, como é uma PWA, o iAgris funciona parcialmente offline. Você pode visualizar dados já carregados e fazer algumas operações que serão sincronizadas quando a conexão retornar.

### O sistema está disponível em quais idiomas?

Atualmente o iAgris está disponível em:
- **Português** (idioma principal)
- **English** (inglês)

Você pode alternar entre os idiomas clicando no seletor de idioma no canto superior direito.

## Acesso e Login

### Como faço o primeiro login?

Para o primeiro acesso:
1. Use as credenciais fornecidas pelo administrador do sistema
2. Acesse o endereço fornecido (ex: https://iagris.suafazenda.com)
3. Digite seu usuário e senha
4. Recomendamos alterar sua senha no primeiro acesso

### Esqueci minha senha, o que fazer?

1. Entre em contato com o administrador da sua fazenda
2. Ele poderá resetar sua senha
3. Você receberá uma nova senha temporária
4. Altere a senha após o login

### Posso acessar múltiplas fazendas?

Sim, dependendo das suas permissões. Se você tem acesso a múltiplas fazendas:
1. Use o seletor de fazenda no topo da tela
2. Escolha a fazenda desejada
3. Todos os dados serão atualizados automaticamente

### Minha sessão expira muito rápido

Por segurança, as sessões expiram após período de inatividade. Para manter-se conectado:
- Mantenha a aba ativa
- Interaja com o sistema regularmente
- Se necessário, faça login novamente

## Gestão de Animais

### Como registrar um novo animal?

1. Vá em **"Animais"** no menu lateral
2. Clique **"+ Novo Animal"**
3. Preencha as informações obrigatórias:
   - Nome do animal
   - Espécie
   - Sexo
   - Data de nascimento
4. Clique **"Salvar"**

O sistema gerará automaticamente um código de registro único.

### Posso alterar o código de registro de um animal?

Não é recomendado alterar códigos após criação, pois são únicos e usados para rastreabilidade. Se necessário, entre em contato com o administrador.

### Como registrar a morte de um animal?

1. Acesse os detalhes do animal
2. Clique **"Ações"** → **"Registrar Morte"**
3. Informe:
   - Data da morte
   - Causa da morte
   - Observações adicionais
4. Confirme a ação

O animal será movido para a lista de animais removidos.

### Como controlar a genealogia dos animais?

No cadastro do animal, você pode informar:
- **Mãe**: Selecione a fêmea reprodutora
- **Pai**: Selecione o macho reprodutor

O sistema criará automaticamente a árvore genealógica.

### Posso fazer pesquisas avançadas nos animais?

Sim, use os filtros disponíveis:
- **Por espécie**: Bovinos, Suínos, etc.
- **Por status**: Ativos, Removidos, Mortos
- **Por localização**: Pasto A, B, etc.
- **Por data de nascimento**: Período específico

## Gestão de Cultivos

### Como planejar um novo cultivo?

1. Vá em **"Cultivos"**
2. Clique **"+ Novo Cultivo"**
3. Preencha:
   - Nome identificador
   - Tipo de cultura
   - Área em hectares
   - Data de plantio planejada
   - Localização
4. Salve o cultivo

### Como acompanhar o progresso do cultivo?

1. Clique no cultivo desejado
2. Veja o status atual e cronograma
3. Registre atividades conforme realizadas:
   - Plantio
   - Adubação
   - Irrigação
   - Colheita

### Posso calcular custos por cultivo?

Sim! Nos detalhes do cultivo:
1. Registre todas as atividades com custos
2. O sistema calculará automaticamente:
   - Custo total do cultivo
   - Custo por hectare
   - Custo por categoria (sementes, fertilizantes, etc.)

### Como registrar a colheita?

1. Quando chegar o momento, clique **"Registrar Colheita"**
2. Informe:
   - Data da colheita
   - Quantidade colhida
   - Qualidade do produto
3. O sistema atualizará o status para "Colhido"

## Controle de Inventário

### Como adicionar um novo item ao estoque?

1. Vá em **"Inventário"**
2. Clique **"+ Novo Item"**
3. Preencha:
   - Nome do produto
   - Categoria
   - Quantidade atual
   - Estoque mínimo (para alertas)
   - Preço unitário
4. Salve o item

### Como funciona o alerta de estoque baixo?

Quando um item atinge o estoque mínimo configurado:
- Aparece em vermelho na lista
- Você recebe alerta no dashboard
- É incluído nos relatórios de estoque baixo

### Como registrar entrada de mercadoria?

1. Clique no item desejado
2. Clique **"+ Entrada"**
3. Informe:
   - Quantidade recebida
   - Preço pago
   - Número da nota fiscal
   - Data da entrada
4. O estoque será atualizado automaticamente

### Como dar saída de estoque?

1. Clique no item
2. Clique **"+ Saída"**
3. Informe:
   - Quantidade utilizada
   - Destino (animal, cultivo, etc.)
   - Responsável pela retirada
4. O estoque será reduzido automaticamente

### Posso controlar validade dos produtos?

Sim, no cadastro do item você pode informar a data de validade. O sistema alertará sobre produtos próximos ao vencimento.

## Gestão Financeira

### Como registrar um gasto?

1. Vá em **"Financeiro"**
2. Clique **"+ Novo Custo"**
3. Preencha:
   - Descrição do gasto
   - Valor
   - Categoria
   - Data
   - A que está relacionado (animal, cultivo, geral)
4. Salve o registro

### Quais categorias de custos existem?

As principais categorias são:
- **Alimentação Animal**: Rações, suplementos
- **Veterinário**: Consultas, medicamentos
- **Insumos Agrícolas**: Sementes, fertilizantes
- **Combustível**: Diesel, gasolina
- **Manutenção**: Reparos, peças
- **Funcionários**: Salários, encargos
- **Outros**: Demais gastos

### Como gerar relatórios financeiros?

1. Na página **"Financeiro"**, clique **"Relatórios"**
2. Escolha o período desejado
3. Visualize:
   - Gastos por categoria
   - Evolução mensal
   - Comparativos
4. Exporte em PDF ou Excel se necessário

### Posso definir orçamentos?

Atualmente o sistema não tem orçamentos, mas você pode:
- Usar as **"Metas"** para definir limites de gastos
- Acompanhar relatórios mensais
- Comparar com períodos anteriores

## Gestão de Funcionários

### Como cadastrar um novo funcionário?

1. Vá em **"Funcionários"**
2. Escolha **"Permanentes"** ou **"Temporários"**
3. Clique **"+ Novo Funcionário"**
4. Preencha os dados pessoais e profissionais
5. Salve o cadastro

### Qual a diferença entre permanente e temporário?

- **Permanentes**: Funcionários contratados por tempo indeterminado
- **Temporários**: Funcionários com contrato por período específico (safra, projeto, etc.)

### Funcionários podem ter acesso ao sistema?

Sim, se necessário:
1. Solicite ao administrador para criar usuário
2. Defina as permissões adequadas ao cargo
3. Forneça as credenciais de acesso

### Como controlar horários e presença?

Atualmente o sistema não tem controle de ponto. Esta funcionalidade pode ser adicionada em versões futuras.

## Relatórios

### Que tipos de relatórios posso gerar?

O sistema oferece relatórios de:
- **Animais**: Inventário do rebanho, nascimentos, mortes
- **Cultivos**: Produtividade, custos por hectare
- **Financeiro**: Gastos por categoria, evolução temporal
- **Inventário**: Situação do estoque, movimentações

### Posso exportar os relatórios?

Sim, os relatórios podem ser exportados em:
- **PDF**: Para impressão e compartilhamento
- **Excel**: Para análise detalhada
- **CSV**: Para importação em outros sistemas

### Como personalizar o período dos relatórios?

Ao gerar relatórios, você pode escolher:
- Últimos 30 dias
- Último trimestre
- Último ano
- Período customizado (data inicial e final)

### Os relatórios são atualizados em tempo real?

Sim, sempre que você gera um relatório, ele mostra os dados mais atuais do sistema.

## Problemas Técnicos

### A página não carrega

1. **Verifique sua conexão** com a internet
2. **Atualize a página** (F5 ou Ctrl+R)
3. **Limpe o cache** do navegador
4. **Tente outro navegador**
5. Se persistir, entre em contato com suporte

### Não consigo salvar dados

1. **Verifique se preencheu** todos os campos obrigatórios
2. **Certifique-se** de clicar em "Salvar"
3. **Verifique sua conexão** com internet
4. **Tente novamente** após alguns segundos

### O sistema está lento

1. **Verifique sua conexão** com internet
2. **Feche outras abas** do navegador
3. **Reinicie o navegador**
4. **Limpe o cache** se necessário

### Dados não aparecem

1. **Verifique se selecionou** a fazenda correta
2. **Confirme suas permissões** com o administrador
3. **Atualize a página**
4. **Verifique filtros** aplicados

### Erro de permissão

Se receber mensagem de "sem permissão":
1. **Verifique se está logado** corretamente
2. **Entre em contato** com o administrador para verificar suas permissões
3. **Tente fazer logout e login** novamente

## Dicas e Truques

### Como ser mais eficiente no sistema?

1. **Use os filtros** para encontrar dados rapidamente
2. **Configure alertas** de estoque baixo
3. **Registre dados** logo após as atividades
4. **Mantenha informações** sempre atualizadas
5. **Gere relatórios** regularmente para análise

### Como organizar melhor os dados?

1. **Use nomes padronizados** para animais e cultivos
2. **Mantenha códigos únicos** para identificação
3. **Organize itens** do inventário por categorias lógicas
4. **Use observações** para informações extras

### Como fazer backup dos dados?

O administrador do sistema deve:
1. Configurar backups automáticos
2. Fazer backups manuais periodicamente
3. Testar restauração dos backups
4. Manter backups em local seguro

### Posso usar no celular/tablet?

Sim! O iAgris é responsivo e funciona bem em:
- **Smartphones** (iOS e Android)
- **Tablets** (iPad, Android tablets)
- **Computadores** (Windows, Mac, Linux)

### Como melhorar a performance?

1. **Use conexão estável** com internet
2. **Mantenha o navegador atualizado**
3. **Feche abas desnecessárias**
4. **Limpe cache** periodicamente
5. **Reinicie o dispositivo** ocasionalmente

## Suporte e Contato

### Quando entrar em contato com suporte?

Entre em contato quando:
- Encontrar erros que não consegue resolver
- Precisar de novas funcionalidades
- Tiver dúvidas sobre relatórios
- Quiser treinamento adicional
- Precisar alterar permissões de usuários

### Que informações fornecer ao suporte?

Para agilizar o atendimento, informe:
- **Descrição detalhada** do problema
- **Passos** que levaram ao erro
- **Mensagens de erro** exibidas
- **Navegador e versão** utilizada
- **Fazenda e usuário** afetados

### Existe treinamento disponível?

Sim, o suporte pode fornecer:
- Treinamento inicial para novos usuários
- Sessões de reciclagem
- Treinamento em novas funcionalidades
- Manuais específicos por função

### Como sugerir melhorias?

Suas sugestões são valiosas! Você pode:
1. Entrar em contato com o suporte
2. Descrever a melhoria sugerida
3. Explicar como beneficiaria seu trabalho
4. A equipe avaliará a viabilidade

### O sistema será atualizado?

Sim, o iAgris recebe atualizações regulares com:
- Correções de bugs
- Novas funcionalidades
- Melhorias de performance
- Atualizações de segurança

As atualizações são aplicadas automaticamente pelo administrador.

---

*Esta FAQ é atualizada regularmente. Se sua dúvida não está aqui, entre em contato com o suporte.*