# Instruções para Importação do Banco de Dados iAgris

Este documento explica como importar o banco de dados para seu ambiente local.

## Requisitos

1. PostgreSQL instalado (versão 12 ou superior)
2. Acesso administrativo ao PostgreSQL

## Passos para Importação

### 1. Baixe o arquivo de exportação

Baixe o arquivo `exportacao_banco.sql` através da interface do Replit.

### 2. Crie um novo banco de dados (se necessário)

```bash
sudo -u postgres psql -c "CREATE DATABASE iagris;"
```

### 3. Importe o arquivo SQL

```bash
sudo -u postgres psql -d iagris -f exportacao_banco.sql
```

Ou, se estiver usando pgAdmin ou outro cliente gráfico:

1. Conecte-se ao servidor PostgreSQL
2. Crie um novo banco de dados chamado "iagris" (se necessário)
3. Clique com o botão direito no banco de dados > Restaurar
4. Selecione o arquivo `exportacao_banco.sql`
5. Clique em "Restaurar"

### 4. Verificação da importação

Para verificar se a importação foi bem-sucedida, execute:

```bash
sudo -u postgres psql -d iagris -c "SELECT COUNT(*) FROM users;"
```

Você deve ver 11 usuários importados.

## Configuração da Aplicação

Depois de importar o banco de dados, configure a aplicação para se conectar a ele:

1. Edite o arquivo `.env` na raiz do projeto
2. Configure a variável DATABASE_URL:

```
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/iagris
```

3. Substitua `seu_usuario` e `sua_senha` pelas suas credenciais do PostgreSQL

## Usuários Disponíveis

Todos os usuários foram configurados com a senha: `kmab620048`

Alguns usuários disponíveis:
- admin (super_admin)
- jsilva (farm_admin)
- mluisa (employee)
- carlosvet (veterinarian)
- anagro (agronomist)
- superadmin (super_admin)
- farmadmin (farm_admin)
- employee (employee)

## Problemas Comuns

1. **Erro de permissão**: Verifique se o usuário do PostgreSQL tem permissões suficientes
2. **Erro de versão**: Se houver incompatibilidade de versão, tente usar o pgAdmin para importar
3. **Erro de conexão**: Verifique se a string de conexão no .env está correta