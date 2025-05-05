-- Script de exportação do banco de dados iAgris
-- Data: 5 de maio de 2025
-- Senha padrão para todos os usuários: kmab620048

-- Criação das tabelas (se não existirem)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  language TEXT NOT NULL DEFAULT 'pt',
  farm_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  size INTEGER,
  created_by INTEGER,
  admin_id INTEGER,
  description TEXT,
  coordinates TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_farms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  farm_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  farm_id INTEGER NOT NULL,
  module TEXT NOT NULL,
  access_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animals (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  identification_code TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TIMESTAMP,
  weight INTEGER,
  status TEXT,
  last_vaccine_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crops (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  area INTEGER NOT NULL,
  status TEXT,
  planting_date TIMESTAMP,
  expected_harvest_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  minimum_level INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMP NOT NULL,
  assigned_to INTEGER,
  related_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT,
  assigned_to INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Limpeza do banco de dados (execute com cuidado)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS animals CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_farms CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recriação das tabelas
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  language TEXT NOT NULL DEFAULT 'pt',
  farm_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  size INTEGER,
  created_by INTEGER,
  admin_id INTEGER,
  description TEXT,
  coordinates TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_farms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  farm_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  farm_id INTEGER NOT NULL,
  module TEXT NOT NULL,
  access_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE animals (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  identification_code TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TIMESTAMP,
  weight INTEGER,
  status TEXT,
  last_vaccine_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  area INTEGER NOT NULL,
  status TEXT,
  planting_date TIMESTAMP,
  expected_harvest_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  minimum_level INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMP NOT NULL,
  assigned_to INTEGER,
  related_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT,
  assigned_to INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de usuários
INSERT INTO users (id, username, password, name, email, role, language, farm_id, created_at) VALUES 
(10, 'admin', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Administrador Geral', 'admin@iagris.com', 'super_admin', 'pt', NULL, '2025-05-04 19:10:20.486275'),
(11, 'jsilva', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'João Silva', 'joao@example.com', 'farm_admin', 'pt', NULL, '2025-05-04 19:10:20.559894'),
(12, 'mluisa', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Maria Luisa', 'mluisa@example.com', 'employee', 'pt', NULL, '2025-05-04 19:10:20.624135'),
(13, 'carlosvet', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Carlos Pereira', 'carlos@example.com', 'veterinarian', 'pt', NULL, '2025-05-04 19:10:20.688364'),
(14, 'anagro', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Ana Santos', 'ana@example.com', 'agronomist', 'pt', NULL, '2025-05-04 19:10:20.7594'),
(15, 'pedroger', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Pedro Oliveira', 'pedro@example.com', 'manager', 'pt', NULL, '2025-05-04 19:10:20.819594'),
(16, 'juliacons', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Julia Fernandes', 'julia@example.com', 'consultant', 'pt', NULL, '2025-05-04 19:10:20.879389'),
(17, 'superadmin', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Super Administrador', 'superadmin@teste.com', 'super_admin', 'pt', NULL, '2025-05-05 08:25:03.368615'),
(18, 'farmadmin', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Administrador de Fazenda', 'farmadmin@teste.com', 'farm_admin', 'pt', NULL, '2025-05-05 08:25:03.459886'),
(19, 'manager', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Gerente', 'manager@teste.com', 'manager', 'pt', NULL, '2025-05-05 08:25:03.518826'),
(20, 'employee', 'fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0', 'Funcionário', 'employee@teste.com', 'employee', 'pt', NULL, '2025-05-05 08:25:03.576695');

-- Inserção de fazendas
INSERT INTO farms (id, name, location, size, created_by, admin_id, description, coordinates, type, created_at) VALUES 
(6, 'Fazenda Modelo', 'Luanda, Angola', 1000, 10, 11, 'Uma fazenda modelo para demonstração do sistema', '-8.8368,13.2343', 'mixed', '2025-05-04 19:10:20.943674'),
(7, 'Fazenda Pecuária do Sul', 'Huambo, Angola', 2500, 10, 11, 'Fazenda de criação de gado no sul de Angola', '-12.7761,15.7385', 'livestock', '2025-05-04 19:10:21.005855'),
(8, 'Fazenda Agrícola do Norte', 'Uíge, Angola', 1500, 10, 11, 'Fazenda de plantações no norte de Angola', '-7.6087,15.0613', 'crop', '2025-05-04 19:10:21.066821'),
(9, 'Pomar Tropical', 'Benguela, Angola', 350, 10, 11, 'Fazenda especializada na produção de frutas tropicais', '-12.5763,13.4055', 'crop', '2025-05-04 19:10:21.130104'),
(10, 'Granja Aviária', 'Lubango, Angola', 200, 10, 11, 'Granja dedicada à criação de aves', '-14.9195,13.5326', 'livestock', '2025-05-04 19:10:21.190499'),
(11, 'Fazenda Modelo', 'Luanda, Angola', 1000, 17, 18, 'Fazenda principal para testes do sistema', '-8.8368,13.2343', 'mixed', '2025-05-05 08:33:50.909642'),
(12, 'Fazenda Modelo', 'Luanda, Angola', 1000, 18, 18, 'Fazenda principal para testes', '-8.8368,13.2343', 'mixed', '2025-05-05 08:35:01.1958');

-- As tabelas restantes podem ser adicionadas conforme necessário
-- Para uma importação completa, você precisaria adicionar:
-- user_farms, user_permissions, animals, crops, inventory, tasks, goals