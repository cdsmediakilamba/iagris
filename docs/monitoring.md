# Monitoramento - iAgris

## Visão Geral

Este documento detalha as estratégias e ferramentas de monitoramento para o sistema iAgris, incluindo métricas de performance, alertas, logs e dashboards para garantir a operação estável e eficiente do sistema.

## Arquitetura de Monitoramento

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Stack de Monitoramento                   │
├─────────────────────────────────────────────────────────────┤
│  Alertas          │  Grafana Dashboard  │  Log Aggregation  │
│  (Email/Slack)    │  (Visualização)     │  (ELK/Loki)       │
├─────────────────────────────────────────────────────────────┤
│           Prometheus (Coleta de Métricas)                  │
├─────────────────────────────────────────────────────────────┤
│  Node Exporter │  PostgreSQL Exporter │  Application      │
│  (Sistema)     │  (Banco de Dados)    │  (Custom Metrics) │
├─────────────────────────────────────────────────────────────┤
│              Aplicação iAgris + PostgreSQL                 │
└─────────────────────────────────────────────────────────────┘
```

## Métricas Essenciais

### Métricas de Aplicação

#### Performance da API
- **Response Time**: Tempo de resposta por endpoint
- **Throughput**: Requests por segundo
- **Error Rate**: Taxa de erros HTTP (4xx, 5xx)
- **Concurrent Users**: Usuários simultâneos

#### Métricas de Negócio
- **Active Users**: Usuários ativos por dia/semana/mês
- **Data Growth**: Crescimento de dados (animais, cultivos, etc.)
- **Feature Usage**: Uso das funcionalidades principais
- **Session Duration**: Duração média das sessões

### Métricas de Sistema

#### CPU e Memória
- **CPU Usage**: Uso de CPU por core
- **Memory Usage**: Uso de RAM
- **Swap Usage**: Uso de swap
- **Load Average**: Carga média do sistema

#### Disco e Rede
- **Disk Usage**: Uso do disco por partição
- **Disk I/O**: Operações de leitura/escrita
- **Network I/O**: Tráfego de rede
- **Available Space**: Espaço livre em disco

### Métricas de Banco de Dados

#### Performance
- **Query Duration**: Tempo de execução das queries
- **Active Connections**: Conexões ativas
- **Lock Waits**: Esperas por locks
- **Cache Hit Ratio**: Taxa de acerto do cache

#### Recursos
- **Database Size**: Tamanho do banco
- **Table Sizes**: Tamanho das tabelas
- **Index Usage**: Uso dos índices
- **Vacuum Statistics**: Estatísticas de manutenção

## Implementação com Prometheus

### Instalação do Prometheus

```bash
# Criar usuário para Prometheus
sudo useradd --no-create-home --shell /bin/false prometheus

# Baixar e instalar Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvf prometheus-2.40.0.linux-amd64.tar.gz

# Mover arquivos
sudo cp prometheus-2.40.0.linux-amd64/prometheus /usr/local/bin/
sudo cp prometheus-2.40.0.linux-amd64/promtool /usr/local/bin/
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool

# Criar diretórios
sudo mkdir /etc/prometheus
sudo mkdir /var/lib/prometheus
sudo chown prometheus:prometheus /etc/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus
```

### Configuração do Prometheus

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (Sistema)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # PostgreSQL Exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  # Aplicação iAgris
  - job_name: 'iagris'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

### Service do Prometheus

```ini
# /etc/systemd/system/prometheus.service
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090 \
    --web.enable-lifecycle \
    --storage.tsdb.retention.time=30d

[Install]
WantedBy=multi-user.target
```

```bash
# Iniciar Prometheus
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus
```

## Exporters e Coletores

### Node Exporter (Métricas do Sistema)

```bash
# Baixar e instalar Node Exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar xvf node_exporter-1.5.0.linux-amd64.tar.gz

sudo cp node_exporter-1.5.0.linux-amd64/node_exporter /usr/local/bin
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
```

```ini
# /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \
    --collector.systemd \
    --collector.processes \
    --collector.diskstats \
    --collector.filesystem

[Install]
WantedBy=multi-user.target
```

### PostgreSQL Exporter

```bash
# Instalar PostgreSQL Exporter
cd /tmp
wget https://github.com/prometheus-community/postgres_exporter/releases/download/v0.11.1/postgres_exporter-0.11.1.linux-amd64.tar.gz
tar xvf postgres_exporter-0.11.1.linux-amd64.tar.gz

sudo cp postgres_exporter-0.11.1.linux-amd64/postgres_exporter /usr/local/bin
sudo chown postgres_exporter:postgres_exporter /usr/local/bin/postgres_exporter
```

```ini
# /etc/systemd/system/postgres_exporter.service
[Unit]
Description=PostgreSQL Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=postgres_exporter
Group=postgres_exporter
Type=simple
Environment=DATA_SOURCE_NAME="postgresql://iagris:password@localhost:5432/iagris_prod?sslmode=disable"
ExecStart=/usr/local/bin/postgres_exporter

[Install]
WantedBy=multi-user.target
```

### Nginx Exporter

```bash
# Instalar Nginx Prometheus Exporter
cd /tmp
wget https://github.com/nginxinc/nginx-prometheus-exporter/releases/download/v0.10.0/nginx-prometheus-exporter_0.10.0_linux_amd64.tar.gz
tar xvf nginx-prometheus-exporter_0.10.0_linux_amd64.tar.gz

sudo cp nginx-prometheus-exporter /usr/local/bin
sudo chown nginx_exporter:nginx_exporter /usr/local/bin/nginx-prometheus-exporter
```

```nginx
# Adicionar ao nginx.conf
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

## Métricas Customizadas da Aplicação

### Instrumentação do Express.js

```typescript
// server/middleware/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Métricas HTTP
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Métricas de negócio
const activeUsersGauge = new Gauge({
  name: 'iagris_active_users',
  help: 'Number of currently active users'
});

const totalAnimalsGauge = new Gauge({
  name: 'iagris_total_animals',
  help: 'Total number of animals in the system',
  labelNames: ['farm_id', 'species']
});

const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Middleware para coleta de métricas HTTP
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
}

// Atualizar métricas de negócio
export async function updateBusinessMetrics() {
  try {
    // Atualizar contagem de usuários ativos
    const activeUsers = await getActiveUsersCount();
    activeUsersGauge.set(activeUsers);

    // Atualizar contagem de animais por fazenda/espécie
    const animalCounts = await getAnimalCountsByFarmAndSpecies();
    
    totalAnimalsGauge.reset();
    animalCounts.forEach(({ farmId, species, count }) => {
      totalAnimalsGauge.labels(farmId, species).set(count);
    });

  } catch (error) {
    console.error('Error updating business metrics:', error);
  }
}

// Endpoint de métricas
export function setupMetricsEndpoint(app: Express) {
  app.get('/metrics', async (req, res) => {
    try {
      // Atualizar métricas before serving
      await updateBusinessMetrics();
      
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });
}
```

### Instrumentação de Queries do Banco

```typescript
// server/middleware/database-metrics.ts
import { databaseQueryDuration } from './metrics';

export function instrumentQuery<T>(
  queryType: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const timer = databaseQueryDuration.startTimer({ query_type: queryType, table });
  
  return queryFn()
    .finally(() => {
      timer();
    });
}

// Exemplo de uso
export async function getAnimals(farmId: number) {
  return instrumentQuery('SELECT', 'animals', async () => {
    return await db
      .select()
      .from(animals)
      .where(eq(animals.farmId, farmId));
  });
}
```

## Configuração de Alertas

### Alertmanager

```bash
# Instalar Alertmanager
cd /tmp
wget https://github.com/prometheus/alertmanager/releases/download/v0.25.0/alertmanager-0.25.0.linux-amd64.tar.gz
tar xvf alertmanager-0.25.0.linux-amd64.tar.gz

sudo cp alertmanager-0.25.0.linux-amd64/alertmanager /usr/local/bin
sudo cp alertmanager-0.25.0.linux-amd64/amtool /usr/local/bin
sudo chown alertmanager:alertmanager /usr/local/bin/alertmanager
sudo chown alertmanager:alertmanager /usr/local/bin/amtool
```

### Configuração do Alertmanager

```yaml
# /etc/alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@iagris.com'
  smtp_auth_username: 'alerts@iagris.com'
  smtp_auth_password: 'app_password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning  
      receiver: 'warning-alerts'

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@iagris.com'
        subject: '[iAgris] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@iagris.com,tech-team@iagris.com'
        subject: '[CRITICAL] iAgris Alert'
        body: |
          ALERTA CRÍTICO no sistema iAgris!
          
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Time: {{ .StartsAt }}
          {{ end }}

  - name: 'warning-alerts'
    email_configs:
      - to: 'admin@iagris.com'
        subject: '[WARNING] iAgris Alert'
```

### Regras de Alerta

```yaml
# /etc/prometheus/rules/iagris-alerts.yml
groups:
  - name: iagris-system
    rules:
      # Alerta de CPU alta
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage is above 80%"
          description: "CPU usage has been above 80% for more than 5 minutes"

      # Alerta de memória baixa
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage is above 85%"
          description: "Memory usage has been above 85% for more than 5 minutes"

      # Alerta de disco baixo
      - alert: LowDiskSpace
        expr: 100 - (node_filesystem_avail_bytes / node_filesystem_size_bytes * 100) > 90
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is above 90%"
          description: "Disk usage is above 90% on {{ $labels.mountpoint }}"

  - name: iagris-application
    rules:
      # Alerta de aplicação down
      - alert: ApplicationDown
        expr: up{job="iagris"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "iAgris application is down"
          description: "The iAgris application has been down for more than 30 seconds"

      # Alerta de alta taxa de erro
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 10% for more than 5 minutes"

      # Alerta de response time alto
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is above 2 seconds"

  - name: iagris-database
    rules:
      # Alerta de muitas conexões
      - alert: TooManyDatabaseConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Too many database connections"
          description: "Number of database connections is above 80"

      # Alerta de queries lentas
      - alert: SlowQueries
        expr: rate(pg_stat_activity_max_tx_duration[5m]) > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"
          description: "Database queries are taking longer than usual"
```

## Dashboard com Grafana

### Instalação do Grafana

```bash
# Adicionar repositório Grafana
sudo apt-get install -y software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list

# Instalar Grafana
sudo apt-get update
sudo apt-get install grafana

# Iniciar Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

### Dashboard Principal do iAgris

```json
{
  "dashboard": {
    "title": "iAgris - Sistema de Monitoramento",
    "panels": [
      {
        "title": "System Overview",
        "type": "stat",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "targets": [
          {
            "expr": "up{job='iagris'}",
            "legendFormat": "Application Status"
          },
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "title": "Business Metrics",
        "type": "stat",
        "gridPos": { "h": 4, "w": 24, "x": 0, "y": 16 },
        "targets": [
          {
            "expr": "iagris_active_users",
            "legendFormat": "Active Users"
          },
          {
            "expr": "sum(iagris_total_animals)",
            "legendFormat": "Total Animals"
          }
        ]
      }
    ]
  }
}
```

## Logs e Observabilidade

### Configuração de Logs Estruturados

```typescript
// server/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'iagris',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/iagris/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/var/log/iagris/combined.log' 
    })
  ]
});

// Em desenvolvimento, também log para console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### Middleware de Logging

```typescript
// server/middleware/logging.ts
import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  });
  
  next();
}

export function errorLogger(error: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    body: req.body
  });
  
  next(error);
}
```

### Log Aggregation com ELK Stack

#### Filebeat Configuration

```yaml
# /etc/filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/iagris/*.log
  fields:
    service: iagris
    environment: production
  fields_under_root: true
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "iagris-logs-%{+yyyy.MM.dd}"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

## Health Checks

### Health Check Endpoint

```typescript
// server/routes/health.ts
import { Router } from 'express';
import { db } from '../storage';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: 'healthy' | 'unhealthy';
    filesystem: 'healthy' | 'unhealthy';
    memory: 'healthy' | 'unhealthy';
  };
}

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: 'unhealthy',
      filesystem: 'unhealthy',
      memory: 'unhealthy'
    }
  };

  try {
    // Verificar banco de dados
    await db.execute('SELECT 1');
    healthStatus.checks.database = 'healthy';
  } catch (error) {
    healthStatus.status = 'unhealthy';
  }

  try {
    // Verificar filesystem
    const fs = require('fs');
    fs.accessSync('/var/www/iagris', fs.constants.R_OK | fs.constants.W_OK);
    healthStatus.checks.filesystem = 'healthy';
  } catch (error) {
    healthStatus.status = 'unhealthy';
  }

  // Verificar memória
  const used = process.memoryUsage();
  const totalMemory = used.heapTotal;
  const usedMemory = used.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  if (memoryUsagePercent < 85) {
    healthStatus.checks.memory = 'healthy';
  } else {
    healthStatus.status = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;
  
  if (healthStatus.status === 'healthy') {
    res.status(200).json({ ...healthStatus, responseTime });
  } else {
    res.status(503).json({ ...healthStatus, responseTime });
  }
});

// Health check simples para load balancer
router.get('/health/simple', (req, res) => {
  res.status(200).send('OK');
});

export { router as healthRouter };
```

### Monitoramento Externo

#### Uptime Monitoring

```bash
#!/bin/bash
# Script para monitoramento externo

HEALTH_URL="https://iagris.com/health"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
LOG_FILE="/var/log/uptime-monitor.log"

check_health() {
    local response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$HEALTH_URL")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        local status=$(jq -r '.status' /tmp/health_response.json)
        local response_time=$(jq -r '.responseTime' /tmp/health_response.json)
        
        echo "$(date): OK - Status: $status, Response: ${response_time}ms" >> $LOG_FILE
        
        if [ "$status" != "healthy" ]; then
            send_alert "⚠️ Health check degraded" "Status: $status"
        fi
    else
        echo "$(date): ERROR - HTTP $http_code" >> $LOG_FILE
        send_alert "🔴 Health check failed" "HTTP Status: $http_code"
    fi
}

send_alert() {
    local title="$1"
    local message="$2"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$title: $message\"}" \
        "$WEBHOOK_URL"
}

check_health
```

## Relatórios de Monitoramento

### Relatório Semanal Automatizado

```typescript
// scripts/weekly-report.ts
import { generateSystemReport } from '../server/utils/reports';
import { sendEmail } from '../server/utils/email';

async function generateWeeklyReport() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const report = await generateSystemReport(startDate, endDate);
  
  const emailContent = `
    <h2>Relatório Semanal do Sistema iAgris</h2>
    <p>Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
    
    <h3>Resumo de Performance</h3>
    <ul>
      <li>Uptime: ${report.uptime}%</li>
      <li>Tempo médio de resposta: ${report.avgResponseTime}ms</li>
      <li>Total de requests: ${report.totalRequests}</li>
      <li>Taxa de erro: ${report.errorRate}%</li>
    </ul>
    
    <h3>Uso de Recursos</h3>
    <ul>
      <li>CPU médio: ${report.avgCpu}%</li>
      <li>Memória média: ${report.avgMemory}%</li>
      <li>Uso de disco: ${report.diskUsage}%</li>
    </ul>
    
    <h3>Métricas de Negócio</h3>
    <ul>
      <li>Usuários ativos: ${report.activeUsers}</li>
      <li>Sessões criadas: ${report.newSessions}</li>
      <li>Animais cadastrados: ${report.newAnimals}</li>
    </ul>
  `;
  
  await sendEmail({
    to: 'admin@iagris.com',
    subject: 'Relatório Semanal - Sistema iAgris',
    html: emailContent
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  generateWeeklyReport().catch(console.error);
}
```

### Cronjob para Relatórios

```bash
# Adicionar ao cron para execução aos domingos às 8h
0 8 * * 0 cd /var/www/iagris && npm run generate-weekly-report
```

## Troubleshooting e Alertas

### Playbook de Resolução

```yaml
# Playbook para resolução de alertas comuns

AlertName: HighCPUUsage
Severity: warning
Action:
  1. Verificar processos com maior uso de CPU
  2. Analisar logs para atividade incomum
  3. Verificar se há jobs pesados executando
  4. Considerar scaling horizontal se persistir

AlertName: HighMemoryUsage  
Severity: warning
Action:
  1. Verificar vazamentos de memória na aplicação
  2. Reiniciar aplicação se necessário
  3. Analisar garbage collection
  4. Considerar aumento de RAM

AlertName: ApplicationDown
Severity: critical
Action:
  1. Verificar se processo está rodando
  2. Verificar logs de erro
  3. Tentar restart da aplicação
  4. Verificar dependências (banco, rede)
  5. Escalar para equipe de desenvolvimento

AlertName: DatabaseConnectionsHigh
Severity: warning
Action:
  1. Verificar pool de conexões
  2. Identificar queries longas
  3. Analisar locks no banco
  4. Considerar restart da aplicação
```

---

*Este sistema de monitoramento deve ser adaptado conforme as necessidades específicas do ambiente de produção.*