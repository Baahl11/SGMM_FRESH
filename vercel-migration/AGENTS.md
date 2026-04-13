# 🤖 PLAN MAESTRO: AGENDAMEDPRO AaaS
## De SaaS Tradicional a Agents-as-a-Service

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Objetivo:** Transformar AgendaMedPro en la primera plataforma médica con IA autónoma en México

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis Técnico ClawdBot](#análisis-técnico-clawdbot)
3. [Arquitectura AgendaMedPro AaaS](#arquitectura-agendamedpro-aaas)
4. [Plan de Implementación (12 meses)](#plan-de-implementación)
5. [Componentes Técnicos Detallados](#componentes-técnicos-detallados)
6. [Casos de Uso y Flujos](#casos-de-uso-y-flujos)
7. [Modelo de Negocio y Monetización](#modelo-de-negocio-y-monetización)
8. [Seguridad y Compliance Médico](#seguridad-y-compliance-médico)
9. [Métricas y KPIs](#métricas-y-kpis)
10. [Roadmap y Milestones](#roadmap-y-milestones)

---

## 1. RESUMEN EJECUTIVO

### 🎯 Visión

Convertir AgendaMedPro de un software de gestión tradicional a una **plataforma inteligente** donde agentes de IA ejecutan tareas médico-administrativas de forma autónoma, ahorrando 15-20 horas semanales por consultorio.

### 💡 Propuesta de Valor

**Actual (SaaS tradicional):**
- Doctor ingresa datos manualmente
- Tareas repetitivas consumen tiempo
- Decisiones basadas en intuición

**Futuro (AaaS con IA):**
- Agentes ejecutan tareas automáticamente
- Doctor solo supervisa y aprueba
- Decisiones basadas en datos y predicciones IA

### 📊 Oportunidad de Mercado

| Métrica | Valor |
|---------|-------|
| Consultorios en México | ~180,000 |
| TAM (addressable) | ~45,000 (25%) |
| Precio premium AaaS | $999-1,999 MXN/mes |
| ARR potencial (5% penetración) | $26.9M - $53.9M MXN/año |

### 🎁 Quick Wins

1. **Chat Assistant** (4 semanas): ROI inmediato, diferenciador vs competencia
2. **Agente de Recordatorios** (6 semanas): Reduce no-shows 40% → más ingresos
3. **Agente Facturador** (8 semanas): Elimina retrasos en cobranza

---

## 2. ANÁLISIS TÉCNICO CLAWDBOT

### 2.1 Arquitectura del Sistema

```
ClawdBot/
├── Core Agent System
│   ├── base.py           # Clase base de agentes
│   ├── autonomous.py     # Agentes autónomos con loops
│   └── task_executor.py  # Ejecutor de tareas con reintentos
│
├── Planning Layer
│   ├── planner.py        # Descomposición de tareas
│   ├── strategy.py       # Estrategias de ejecución
│   └── validator.py      # Validación de planes
│
├── Tools (Interfaces)
│   ├── bash.py           # Ejecutar comandos sistema
│   ├── browser.py        # Navegación web automatizada
│   ├── code_editor.py    # Generar/editar código
│   └── file_ops.py       # Operaciones archivos
│
├── MCP Integration
│   ├── server.py         # Servidor MCP
│   ├── client.py         # Cliente MCP
│   └── tools/*.py        # Tools expuestas vía MCP
│
└── Memory & Context
    ├── manager.py        # Gestión de memoria
    ├── embeddings.py     # Búsqueda semántica
    └── history.py        # Historial de acciones
```

### 2.2 Componentes Clave Reutilizables

#### 🔷 Agent Base Class

**Lo que hace:**
```python
class Agent:
    def __init__(self, llm, tools, memory):
        self.llm = llm              # Claude/GPT
        self.tools = tools          # Lista de herramientas
        self.memory = memory        # Historial
        self.state = AgentState()   # Estado actual
    
    async def execute_task(self, task: str):
        # 1. Planificar pasos
        plan = await self.planner.create_plan(task)
        
        # 2. Ejecutar cada paso
        for step in plan.steps:
            result = await self.execute_step(step)
            if result.failed:
                await self.handle_failure(step, result)
        
        # 3. Validar resultado
        return await self.validator.verify(task, results)
```

**Adaptación para AgendaMedPro:**
```typescript
// agents/base.ts
export abstract class MedicalAgent {
  constructor(
    protected anthropic: Anthropic,
    protected supabase: SupabaseClient,
    protected memory: AgentMemory
  ) {}
  
  abstract async execute(task: MedicalTask): Promise<TaskResult>;
  
  protected async useTool(tool: string, params: any) {
    // Ejecuta herramienta (appointments, patients, etc)
  }
  
  protected async saveMemory(interaction: Interaction) {
    // Guarda contexto para futuros llamados
  }
}
```

#### 🔷 Planner System

**Lo que hace:**
- Recibe tarea compleja: "Optimiza la agenda de esta semana"
- La descompone en pasos ejecutables:
  1. Analizar citas actuales
  2. Identificar huecos
  3. Revisar lista de espera
  4. Proponer redistribución
  5. Enviar notificaciones

**Código adaptado:**
```typescript
// planning/medical-planner.ts
export class MedicalPlanner {
  async createPlan(goal: string, context: MedicalContext): Promise<Plan> {
    const prompt = `
      Objetivo: ${goal}
      Contexto: ${JSON.stringify(context)}
      
      Descompone en pasos ejecutables usando estas herramientas:
      - getAppointments(filters)
      - updateAppointment(id, data)
      - sendWhatsApp(phone, message)
      - getAvailability(doctorId, date)
    `;
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: prompt }]
    });
    
    return this.parseSteps(response.content);
  }
}
```

#### 🔷 MCP (Model Context Protocol)

**Por qué es revolucionario:**
- Protocolo estándar para que LLMs accedan a datos/funciones
- Anthropic lo usa en Claude Desktop
- Permite que agentes interactúen con cualquier sistema

**Arquitectura MCP para AgendaMedPro:**
```typescript
// mcp-server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'agendamedpro-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
});

// Tool: Obtener citas
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_appointments',
      description: 'Obtiene lista de citas con filtros',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed'] }
        }
      }
    },
    {
      name: 'create_appointment',
      description: 'Crea nueva cita médica',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: { type: 'number' },
          doctorId: { type: 'string' },
          dateTime: { type: 'string' },
          type: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['patientId', 'doctorId', 'dateTime']
      }
    },
    {
      name: 'send_whatsapp_reminder',
      description: 'Envía recordatorio de cita por WhatsApp',
      inputSchema: {
        type: 'object',
        properties: {
          appointmentId: { type: 'number' },
          template: { type: 'string', enum: ['24h', '2h', 'confirmation'] }
        },
        required: ['appointmentId', 'template']
      }
    },
    {
      name: 'generate_invoice',
      description: 'Genera CFDI 4.0 para una cita',
      inputSchema: {
        type: 'object',
        properties: {
          appointmentId: { type: 'number' },
          fiscalData: { type: 'object' }
        },
        required: ['appointmentId']
      }
    },
    {
      name: 'get_analytics',
      description: 'Obtiene métricas y reportes del consultorio',
      inputSchema: {
        type: 'object',
        properties: {
          metric: { 
            type: 'string', 
            enum: ['revenue', 'appointments', 'no_shows', 'top_treatments'] 
          },
          period: { type: 'string' },
          groupBy: { type: 'string' }
        }
      }
    }
  ]
}));

// Implementar cada tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'get_appointments':
      return await handleGetAppointments(args);
    case 'create_appointment':
      return await handleCreateAppointment(args);
    case 'send_whatsapp_reminder':
      return await handleSendWhatsApp(args);
    // ... más tools
  }
});
```

#### 🔷 Memory System

**Tipos de memoria:**
1. **Short-term:** Conversación actual (últimos 10 mensajes)
2. **Working:** Contexto de tarea en ejecución
3. **Long-term:** Preferencias del usuario, patrones aprendidos

**Implementación:**
```typescript
// memory/medical-memory.ts
export class MedicalMemory {
  constructor(private supabase: SupabaseClient) {}
  
  async remember(interaction: {
    userId: string;
    agentId: string;
    task: string;
    result: any;
    feedback?: 'positive' | 'negative';
  }) {
    // Guardar en vector store para búsqueda semántica
    await this.supabase.from('agent_memory').insert({
      user_id: interaction.userId,
      agent_id: interaction.agentId,
      task_description: interaction.task,
      result_json: interaction.result,
      feedback: interaction.feedback,
      embedding: await this.generateEmbedding(interaction.task)
    });
  }
  
  async recall(query: string, userId: string, limit = 5) {
    const embedding = await this.generateEmbedding(query);
    
    // Búsqueda por similitud semántica
    const { data } = await this.supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id_filter: userId
    });
    
    return data;
  }
  
  private async generateEmbedding(text: string) {
    // Usar OpenAI embeddings o similar
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }
}
```

---

## 3. ARQUITECTURA AGENDAMEDPRO AaaS

### 3.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard         Chat Assistant        Agent Manager          │
│  Clásico          (nuevo)               (nuevo)                 │
└───────────────┬────────────────┬────────────────────────────────┘
                │                │
                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Next.js Edge)                    │
├─────────────────────────────────────────────────────────────────┤
│  /api/chat          /api/agents          /api/workflows         │
│  (streaming)        (CRUD)               (orchestration)        │
└───────────┬──────────────────┬──────────────────┬───────────────┘
            │                  │                  │
            ▼                  ▼                  ▼
┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   ANTHROPIC API   │  │  AGENT RUNTIME   │  │  MCP SERVER      │
│   (Claude 3.5)    │  │  (Temporal.io)   │  │  (Stdio/HTTP)    │
└───────────────────┘  └──────────────────┘  └──────────────────┘
            │                  │                  │
            └──────────────────┴──────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL  │  Redis (Queue)  │  Vector DB (Memory)   │
│  (datos transaccionales) (jobs agentes)  (búsqueda semántica)   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **LLM** | Claude 3.5 Sonnet | Mejor razonamiento médico, 200K context window |
| **Orquestación** | Temporal.io | Workflows durables, maneja fallas automáticamente |
| **MCP Server** | @modelcontextprotocol/sdk | Estándar de Anthropic |
| **Chat UI** | Vercel AI SDK | Streaming nativo, soporte Claude |
| **Vector Store** | Supabase pgvector | Ya usamos Supabase |
| **Queue** | Redis + BullMQ | Jobs de agentes asíncronos |
| **Monitoring** | Langfuse | Observabilidad de LLM calls |

### 3.3 Tipos de Agentes

#### 🤖 **Agente Tipo 1: Chat Assistant (Reactivo)**

**Características:**
- Responde a comandos del usuario
- No ejecuta tareas automáticamente
- Requiere aprobación explícita

**Ejemplo:**
```
Usuario: "Agenda a María López con el Dr. Hernández mañana 10am"
Assistant: 
  1. ✅ Verifico disponibilidad Dr. Hernández: Disponible 10:00-10:30
  2. ✅ Paciente María López encontrada (ID: 1234)
  3. ✅ Cita creada #5678
  4. 📱 ¿Deseas enviar WhatsApp de confirmación? [Sí] [No]
```

#### 🤖 **Agente Tipo 2: Scheduled Agent (Cron)**

**Características:**
- Se ejecuta en horarios específicos
- Tareas predefinidas
- Envía reporte al doctor

**Ejemplo:**
```typescript
// Agente: Recordatorios matutinos
Cron: 8:00 AM diario
Tarea: 
  1. Obtener citas del día con status 'confirmed'
  2. Enviar WhatsApp 2h antes de cada cita
  3. Si no hay respuesta 30 min antes → marcar como 'at-risk'
  4. Notificar al doctor por app
```

#### 🤖 **Agente Tipo 3: Autonomous Agent (Proactivo)**

**Características:**
- Identifica oportunidades automáticamente
- Ejecuta acciones sin intervención (dentro de límites)
- Aprende de feedback

**Ejemplo:**
```typescript
// Agente: Optimizador de Agenda
Trigger: Hueco de 1+ hora detectado
Proceso autónomo:
  1. Analizar lista de espera
  2. Identificar pacientes flexibles
  3. Generar propuestas de horarios
  4. Enviar WhatsApp: "¿Te viene bien mañana 3pm en lugar del viernes?"
  5. Si acepta → confirmar y reagendar
  6. Actualizar métricas de optimización
```

---

## 4. PLAN DE IMPLEMENTACIÓN

### FASE 1: FUNDACIÓN (Mes 1-2) 🏗️

**Objetivo:** Infraestructura base para agentes

#### Sprint 1 (Semanas 1-2): MCP Server

**Entregables:**
- [x] Setup proyecto MCP con TypeScript
- [x] Tools básicas: get_appointments, create_appointment
- [x] Integración con Supabase
- [x] Tests unitarios

**Archivos a crear:**
```
mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Entry point
│   ├── tools/
│   │   ├── appointments.ts   # CRUD citas
│   │   ├── patients.ts       # CRUD pacientes
│   │   └── index.ts
│   └── utils/
│       └── supabase.ts       # Cliente DB
└── tests/
    └── tools.test.ts
```

**Código base:**
```typescript
// mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { appointmentTools } from './tools/appointments.js';
import { patientTools } from './tools/patients.js';

const server = new Server({
  name: 'agendamedpro-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Registrar todas las tools
const allTools = [...appointmentTools, ...patientTools];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }))
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = allTools.find(t => t.name === request.params.name);
  if (!tool) throw new Error(`Tool ${request.params.name} not found`);
  
  return await tool.handler(request.params.arguments);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### Sprint 2 (Semanas 3-4): Chat Assistant UI

**Entregables:**
- [x] Componente de chat con streaming
- [x] Integración Vercel AI SDK + Claude
- [x] Sistema de sugerencias contextuales
- [x] Historial de conversación

**Archivos a crear:**
```
app/dashboard/assistant/
├── page.tsx                 # Main page
└── components/
    ├── chat-interface.tsx   # UI del chat
    ├── message-list.tsx     # Lista de mensajes
    ├── input-box.tsx        # Input con sugerencias
    └── tool-result.tsx      # Mostrar resultado de tools

api/chat/
└── route.ts                 # Endpoint streaming
```

**Implementación:**
```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Construir mensaje system con contexto médico
  const systemPrompt = `
    Eres un asistente IA para AgendaMedPro, sistema de gestión médica.
    
    Capacidades:
    - Consultar y modificar citas médicas
    - Gestionar pacientes
    - Enviar recordatorios por WhatsApp
    - Generar reportes
    
    Herramientas disponibles:
    ${JSON.stringify(await getMCPTools())}
    
    Siempre confirma acciones importantes antes de ejecutar.
    Usa lenguaje profesional pero amigable.
  `;
  
  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  });
  
  // Convertir stream de Anthropic a Response stream
  const responseStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          controller.enqueue(chunk.delta.text);
        }
      }
      controller.close();
    }
  });
  
  return new StreamingTextResponse(responseStream);
}
```

```typescript
// app/dashboard/assistant/components/chat-interface.tsx
'use client';

import { useChat } from 'ai/react';
import { Send, Loader2 } from 'lucide-react';

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });
  
  return (
    <div className="flex h-[calc(100vh-200px)] flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] rounded-2xl p-4 ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Pregúntame algo... Ej: ¿Cuántas citas tengo hoy?"
            className="flex-1 rounded-full bg-white/5 border border-white/10 px-6 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={isLoading || !input}
            className="rounded-full bg-blue-500 px-6 py-3 hover:bg-blue-600 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### FASE 2: AGENTES AUTÓNOMOS (Mes 3-5) 🤖

#### Sprint 3 (Semanas 5-7): Agent Runtime

**Objetivo:** Sistema de ejecución de agentes

**Tecnologías:**
- Temporal.io para workflows durables
- BullMQ para cola de tareas
- Redis para estado compartido

**Entregables:**
- [x] Setup Temporal.io
- [x] Worker para ejecutar tareas
- [x] Sistema de retry automático
- [x] Logging y observabilidad

**Arquitectura:**
```typescript
// lib/agents/runtime.ts
import { Worker, Connection } from '@temporalio/worker';
import { agentWorkflows } from './workflows';
import { agentActivities } from './activities';

export async function startAgentWorker() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS,
  });
  
  const worker = await Worker.create({
    connection,
    namespace: 'agendamedpro',
    taskQueue: 'agents',
    workflowsPath: require.resolve('./workflows'),
    activities: agentActivities,
  });
  
  await worker.run();
}
```

```typescript
// lib/agents/workflows/reminder-agent.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';

const { getAppointmentsToRemind, sendWhatsApp, markAsReminded } = 
  proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
    retry: {
      maximumAttempts: 3,
    },
  });

export async function reminderAgentWorkflow(date: string): Promise<void> {
  // 1. Obtener citas que necesitan recordatorio
  const appointments = await getAppointmentsToRemind(date);
  
  // 2. Enviar recordatorio a cada una
  for (const apt of appointments) {
    try {
      await sendWhatsApp({
        phone: apt.patient_phone,
        template: 'reminder_24h',
        variables: {
          patient_name: apt.patient_name,
          doctor_name: apt.doctor_name,
          datetime: apt.appointment_time,
        }
      });
      
      await markAsReminded(apt.id);
    } catch (error) {
      // Log error pero continúa con siguientes
      console.error(`Failed to remind ${apt.id}:`, error);
    }
  }
}
```

#### Sprint 4 (Semanas 8-10): Primer Agente - Recordatorios Inteligentes

**Características:**
- Se ejecuta automáticamente 24h, 2h y 30min antes de cita
- Detecta si paciente ya confirmó (evita spam)
- Aprende mejores horarios para cada paciente
- Reporta métricas de efectividad

**Implementación:**
```typescript
// agents/reminder-agent/index.ts
import { MedicalAgent } from '../base';

export class ReminderAgent extends MedicalAgent {
  name = 'reminder-agent';
  description = 'Envía recordatorios inteligentes de citas';
  
  async execute(task: ReminderTask): Promise<void> {
    // 1. Obtener citas del rango de tiempo
    const appointments = await this.getUpcomingAppointments(task.timeWindow);
    
    // 2. Para cada cita, decidir si enviar recordatorio
    for (const apt of appointments) {
      const shouldRemind = await this.shouldSendReminder(apt);
      
      if (shouldRemind) {
        // 3. Generar mensaje personalizado
        const message = await this.generateMessage(apt);
        
        // 4. Enviar WhatsApp
        await this.sendWhatsApp(apt.patient.phone, message);
        
        // 5. Guardar en memoria para aprender
        await this.memory.remember({
          userId: apt.doctor_id,
          agentId: this.name,
          task: 'send_reminder',
          result: { appointmentId: apt.id, sent: true }
        });
      }
    }
  }
  
  private async shouldSendReminder(apt: Appointment): Promise<boolean> {
    // Verificar si ya está confirmada
    if (apt.status === 'confirmed') return false;
    
    // Verificar si ya enviamos recordatorio reciente
    const lastReminder = await this.getLastReminder(apt.id);
    if (lastReminder && Date.now() - lastReminder.sent_at < 3600000) {
      return false; // Menos de 1h desde último recordatorio
    }
    
    // Consultar memoria: ¿Este paciente responde a recordatorios?
    const patientHistory = await this.memory.recall(
      `recordatorios paciente ${apt.patient_id}`,
      apt.doctor_id
    );
    
    // Si tiene historial de no responder, tal vez cambiar estrategia
    return true;
  }
  
  private async generateMessage(apt: Appointment): Promise<string> {
    // Usar Claude para generar mensaje personalizado
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `
          Genera un recordatorio amigable de cita médica:
          - Paciente: ${apt.patient.name}
          - Doctor: ${apt.doctor.name}
          - Fecha: ${apt.date}
          - Hora: ${apt.time}
          - Tipo: ${apt.type}
          
          Tono: profesional pero cálido, en español mexicano.
          Incluye opción de confirmar respondiendo "Confirmo".
        `
      }]
    });
    
    return response.content[0].text;
  }
}
```

#### Sprint 5 (Semanas 11-12): Segundo Agente - Optimizador de Agenda

**Características:**
- Detecta huecos en agenda > 1 hora
- Contacta pacientes de lista de espera
- Negocia reagendamientos
- Maximiza ocupación sin saturar

**Flujo:**
```
Trigger: Cron diario 9 PM (revisa agenda del día siguiente)

1. Analizar agenda:
   - Identificar huecos entre citas
   - Calcular tiempo disponible por doctor
   
2. Priorizar huecos:
   - Huecos grandes (>2h) = alta prioridad
   - Horarios prime (10am-2pm) = alta prioridad
   
3. Buscar candidatos en lista de espera:
   - Filtrar por tipo de cita compatible
   - Priorizar por tiempo en espera
   - Verificar disponibilidad del paciente (historial)
   
4. Generar propuestas:
   - Para cada hueco, top 3 candidatos
   - Crear mensaje personalizado
   
5. Enviar WhatsApp:
   - "Hola [Paciente], se liberó un espacio con [Doctor] mañana [Hora]. ¿Te interesa?"
   - Incluir botón de confirmación
   
6. Procesar respuestas:
   - Si acepta → crear cita y confirmar
   - Si rechaza → ofrecer a siguiente candidato
   - Timeout 2h → asumir no interesado
   
7. Reportar:
   - Huecos llenados
   - Ingresos adicionales estimados
   - Satisfacción de pacientes
```

---

### FASE 3: WORKFLOW BUILDER (Mes 6-8) 🔄

**Objetivo:** Permitir a usuarios crear automatizaciones sin código

#### Sprint 6-7 (Semanas 13-16): Visual Workflow Editor

**UI Inspirada en:** n8n, Zapier, Make.com

**Componentes:**
```typescript
// Nodos disponibles
const workflowNodes = {
  triggers: [
    { type: 'cron', label: 'Programar', icon: Clock },
    { type: 'webhook', label: 'API Call', icon: Zap },
    { type: 'event', label: 'Evento', icon: Bell },
  ],
  actions: [
    { type: 'send_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare },
    { type: 'create_appointment', label: 'Crear Cita', icon: Calendar },
    { type: 'send_email', label: 'Enviar Email', icon: Mail },
    { type: 'generate_invoice', label: 'Facturar', icon: FileText },
    { type: 'run_agent', label: 'Ejecutar Agente IA', icon: Bot },
  ],
  conditions: [
    { type: 'if', label: 'Si/Entonces', icon: GitBranch },
    { type: 'switch', label: 'Múltiples casos', icon: ListTree },
    { type: 'loop', label: 'Repetir', icon: Repeat },
  ],
};
```

**Ejemplo de workflow creado por usuario:**
```json
{
  "name": "Seguimiento Post-Consulta",
  "trigger": {
    "type": "event",
    "event": "appointment.completed"
  },
  "nodes": [
    {
      "id": "1",
      "type": "delay",
      "config": { "hours": 24 }
    },
    {
      "id": "2",
      "type": "send_whatsapp",
      "config": {
        "template": "¿Cómo te sientes después de tu consulta? Responde del 1-5",
        "saveResponse": true
      }
    },
    {
      "id": "3",
      "type": "if",
      "condition": "response <= 3",
      "then": [
        {
          "type": "notify_doctor",
          "config": {
            "message": "Paciente {{patient_name}} reporta malestar ({{response}}/5)"
          }
        }
      ],
      "else": [
        {
          "type": "log",
          "config": { "message": "Paciente satisfecho" }
        }
      ]
    }
  ]
}
```

---

### FASE 4: FEATURES AVANZADAS (Mes 9-12) 🚀

#### Sprint 8: Agente Facturador

**Características:**
- Detecta citas sin facturar
- Solicita datos fiscales si faltan
- Genera CFDI automáticamente
- Envía por email
- Detecta pagos en Stripe y marca como pagadas

#### Sprint 9: Agente Analista

**Características:**
- Genera reportes semanales/mensuales automáticos
- Identifica tendencias: mejores días, tratamientos más rentables
- Predice flujo de caja próximos 30 días
- Sugiere ajustes de precios basado en demanda

#### Sprint 10: Agente Marketing

**Características:**
- Identifica pacientes inactivos (>6 meses sin cita)
- Genera campañas de reactivación personalizadas
- Maneja promociones automáticas (ej: Día de las Madres)
- Mide ROI de cada campaña

#### Sprint 11: Voice Agent

**Características:**
- Integración con Twilio Voice
- Contestar llamadas automáticamente
- Agendar citas por teléfono
- Transcripción y resumen de llamadas

#### Sprint 12: Multi-Agente Collaboration

**Características:**
- Agentes que se coordinan entre sí
- Ejemplo: Facturador detecta pago → notifica a Analista → actualiza proyecciones
- Sistema de mensajería entre agentes
- Orquestación inteligente de tareas complejas

---

## 5. COMPONENTES TÉCNICOS DETALLADOS

### 5.1 MCP Server Completo

**Estructura de carpetas:**
```
mcp-server/
├── src/
│   ├── index.ts                    # Entry point
│   ├── server.ts                   # MCP Server setup
│   ├── tools/
│   │   ├── appointments/
│   │   │   ├── index.ts
│   │   │   ├── get.ts              # get_appointments
│   │   │   ├── create.ts           # create_appointment
│   │   │   ├── update.ts           # update_appointment
│   │   │   └── delete.ts           # delete_appointment
│   │   ├── patients/
│   │   │   ├── index.ts
│   │   │   ├── search.ts           # search_patients
│   │   │   ├── get.ts              # get_patient
│   │   │   └── update.ts           # update_patient
│   │   ├── messaging/
│   │   │   ├── whatsapp.ts         # send_whatsapp
│   │   │   ├── sms.ts              # send_sms
│   │   │   └── email.ts            # send_email
│   │   ├── billing/
│   │   │   ├── invoice.ts          # generate_invoice
│   │   │   └── payment.ts          # record_payment
│   │   └── analytics/
│   │       ├── reports.ts          # generate_report
│   │       └── metrics.ts          # get_metrics
│   ├── utils/
│   │   ├── supabase.ts             # DB client
│   │   ├── validators.ts           # Schema validation
│   │   └── errors.ts               # Error handling
│   └── types/
│       └── index.ts                # TypeScript types
├── tests/
│   └── tools/
│       ├── appointments.test.ts
│       └── patients.test.ts
├── package.json
└── tsconfig.json
```

**Tool Example: Create Appointment**
```typescript
// mcp-server/src/tools/appointments/create.ts
import { z } from 'zod';
import { createClient } from '@/utils/supabase';

export const createAppointmentSchema = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.string().uuid(),
  dateTime: z.string().datetime(),
  appointmentTypeId: z.string().uuid(),
  consultorioId: z.string().uuid().optional(),
  notes: z.string().optional(),
  duration: z.number().int().positive().default(30),
});

export async function createAppointment(args: unknown) {
  // 1. Validate input
  const validated = createAppointmentSchema.parse(args);
  
  // 2. Check availability
  const supabase = createClient();
  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', validated.doctorId)
    .gte('appointment_time', validated.dateTime)
    .lt('appointment_time', addMinutes(validated.dateTime, validated.duration))
    .eq('status', 'scheduled');
  
  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error: 'El doctor no está disponible en ese horario',
      conflicts: conflicts.map(c => c.id)
    };
  }
  
  // 3. Create appointment
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: validated.patientId,
      doctor_id: validated.doctorId,
      appointment_time: validated.dateTime,
      appointment_type_id: validated.appointmentTypeId,
      consultorio_id: validated.consultorioId,
      notes: validated.notes,
      status: 'scheduled',
      duration: validated.duration,
    })
    .select()
    .single();
  
  if (error) {
    return {
      success: false,
      error: error.message
    };
  }
  
  // 4. Return success
  return {
    success: true,
    appointment: {
      id: data.id,
      datetime: data.appointment_time,
      patient: await getPatientName(data.patient_id),
      doctor: await getDoctorName(data.doctor_id),
    }
  };
}

function addMinutes(datetime: string, minutes: number): string {
  const date = new Date(datetime);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}
```

### 5.2 Agent Base Architecture

```typescript
// lib/agents/base.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { AgentMemory } from './memory';
import { MedicalPlanner } from './planning';

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  autonomyLevel: 'reactive' | 'semi-autonomous' | 'autonomous';
  maxIterations?: number;
}

export interface Task {
  id: string;
  userId: string;
  goal: string;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  stepsExecuted: StepResult[];
  tokensUsed: number;
  durationMs: number;
}

export interface StepResult {
  step: number;
  action: string;
  input: any;
  output: any;
  success: boolean;
  timestamp: string;
}

export abstract class MedicalAgent {
  protected anthropic: Anthropic;
  protected supabase: ReturnType<typeof createClient>;
  protected memory: AgentMemory;
  protected planner: MedicalPlanner;
  
  constructor(protected config: AgentConfig) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.memory = new AgentMemory(this.supabase);
    this.planner = new MedicalPlanner(this.anthropic);
  }
  
  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const steps: StepResult[] = [];
    let tokensUsed = 0;
    
    try {
      // 1. Load relevant memories
      const memories = await this.memory.recall(task.goal, task.userId);
      
      // 2. Create execution plan
      const plan = await this.planner.createPlan(task.goal, {
        ...task.context,
        pastExperiences: memories,
      });
      
      // 3. Execute each step
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        
        const stepResult = await this.executeStep(step, {
          previousSteps: steps,
          task,
        });
        
        steps.push(stepResult);
        tokensUsed += stepResult.tokensUsed || 0;
        
        if (!stepResult.success && this.config.autonomyLevel !== 'autonomous') {
          // Si no es autónomo, detener en error
          throw new Error(`Step ${i + 1} failed: ${stepResult.output}`);
        }
        
        if (this.shouldStop(steps)) {
          break;
        }
      }
      
      // 4. Validate final result
      const finalResult = steps[steps.length - 1];
      
      // 5. Save to memory
      await this.memory.remember({
        userId: task.userId,
        agentId: this.config.name,
        task: task.goal,
        result: finalResult.output,
        feedback: finalResult.success ? 'positive' : 'negative',
      });
      
      return {
        success: finalResult.success,
        result: finalResult.output,
        stepsExecuted: steps,
        tokensUsed,
        durationMs: Date.now() - startTime,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stepsExecuted: steps,
        tokensUsed,
        durationMs: Date.now() - startTime,
      };
    }
  }
  
  protected abstract executeStep(
    step: PlanStep,
    context: ExecutionContext
  ): Promise<StepResult>;
  
  protected shouldStop(steps: StepResult[]): boolean {
    if (this.config.maxIterations && steps.length >= this.config.maxIterations) {
      return true;
    }
    
    // Detectar loops infinitos
    const lastThreeSteps = steps.slice(-3);
    if (lastThreeSteps.length === 3) {
      const allSameAction = lastThreeSteps.every(
        s => s.action === lastThreeSteps[0].action
      );
      if (allSameAction) {
        console.warn('Detected potential infinite loop, stopping');
        return true;
      }
    }
    
    return false;
  }
  
  protected async callLLM(messages: Anthropic.MessageParam[]): Promise<{
    content: string;
    toolCalls?: any[];
    tokensUsed: number;
  }> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: this.config.systemPrompt,
      messages,
      tools: await this.getTools(),
    });
    
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
    
    const toolCalls = response.content
      .filter(block => block.type === 'tool_use')
      .map(block => ({
        id: block.id,
        name: block.name,
        input: block.input,
      }));
    
    return {
      content,
      toolCalls,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }
  
  protected async getTools(): Promise<Anthropic.Tool[]> {
    // Obtener tools del MCP server
    const mcpTools = await this.fetchMCPTools();
    
    return mcpTools
      .filter(tool => this.config.tools.includes(tool.name))
      .map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));
  }
  
  private async fetchMCPTools() {
    // Llamar al MCP server para obtener lista de tools
    // En producción esto se cachearía
    return [
      {
        name: 'get_appointments',
        description: 'Obtiene lista de citas médicas con filtros',
        inputSchema: { /* ... */ }
      },
      // ... más tools
    ];
  }
}
```

### 5.3 Concrete Agent Example: Reminder Agent

```typescript
// lib/agents/reminder-agent.ts
import { MedicalAgent, AgentConfig, Task, StepResult } from './base';

const REMINDER_AGENT_CONFIG: AgentConfig = {
  name: 'reminder-agent',
  description: 'Envía recordatorios inteligentes de citas médicas',
  systemPrompt: `
    Eres un agente especializado en recordatorios médicos.
    
    Tu objetivo es enviar recordatorios de citas de forma oportuna y efectiva.
    
    Consideraciones:
    - No envíes recordatorios si la cita ya está confirmada
    - Personaliza los mensajes según el historial del paciente
    - Si un paciente no responde frecuentemente, ajusta la estrategia
    - Respeta horarios (no envíes antes de 8am o después de 9pm)
    
    Siempre usa un tono profesional pero amigable.
  `,
  tools: [
    'get_appointments',
    'send_whatsapp',
    'update_appointment',
    'get_patient',
  ],
  autonomyLevel: 'semi-autonomous',
  maxIterations: 10,
};

export class ReminderAgent extends MedicalAgent {
  constructor() {
    super(REMINDER_AGENT_CONFIG);
  }
  
  protected async executeStep(
    step: any,
    context: any
  ): Promise<StepResult> {
    const startTime = Date.now();
    
    try {
      // Llamar al LLM para decidir qué hacer
      const { content, toolCalls, tokensUsed } = await this.callLLM([
        {
          role: 'user',
          content: `
            Paso ${step.number}: ${step.description}
            
            Contexto:
            ${JSON.stringify(context, null, 2)}
            
            Pasos anteriores:
            ${context.previousSteps.map((s: any) => 
              `${s.step}. ${s.action}: ${s.success ? 'Exitoso' : 'Falló'}`
            ).join('\n')}
          `
        }
      ]);
      
      // Si el LLM decidió usar una tool
      if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        const toolResult = await this.executeTool(toolCall.name, toolCall.input);
        
        return {
          step: step.number,
          action: toolCall.name,
          input: toolCall.input,
          output: toolResult,
          success: true,
          timestamp: new Date().toISOString(),
          tokensUsed,
        };
      }
      
      // Si solo respondió con texto (decisión, explicación)
      return {
        step: step.number,
        action: 'reasoning',
        input: step.description,
        output: content,
        success: true,
        timestamp: new Date().toISOString(),
        tokensUsed,
      };
      
    } catch (error) {
      return {
        step: step.number,
        action: 'error',
        input: step.description,
        output: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  private async executeTool(name: string, input: any): Promise<any> {
    // Aquí llamaríamos al MCP server
    // Por ahora simulamos con llamadas directas
    
    switch (name) {
      case 'get_appointments':
        return await this.getAppointments(input);
      case 'send_whatsapp':
        return await this.sendWhatsApp(input);
      case 'update_appointment':
        return await this.updateAppointment(input);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  
  private async getAppointments(filters: any) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*, patients(*), doctors(*)')
      .gte('appointment_time', filters.startDate)
      .lte('appointment_time', filters.endDate)
      .eq('status', filters.status || 'scheduled');
    
    if (error) throw error;
    return data;
  }
  
  private async sendWhatsApp(params: any) {
    // Integración con WhatsApp Business API
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    return await response.json();
  }
  
  private async updateAppointment(params: any) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update(params.updates)
      .eq('id', params.appointmentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

---

## 6. CASOS DE USO Y FLUJOS

### Caso de Uso 1: Optimización Automática de Agenda

**Contexto:**
Dr. Hernández tiene 3 horas de huecos mañana. Hay 12 pacientes en lista de espera.

**Flujo Completo:**

```
[20:00] Agente Optimizador se ejecuta (cron diario)

1. Análisis de Agenda
   └─ Query: SELECT * FROM appointments WHERE doctor_id = 'dr_h' AND date = tomorrow
   └─ Resultado: 5 citas, 3 huecos (1.5h, 1h, 0.5h)

2. Priorización de Huecos
   └─ LLM evalúa: "El hueco de 1.5h a las 11am es ideal para consultas largas"

3. Búsqueda de Candidatos
   └─ Query: SELECT * FROM waitlist WHERE preferred_time LIKE '11%'
   └─ Resultado: 3 pacientes (María, José, Ana)

4. Evaluación de Candidatos
   └─ LLM analiza historial:
       • María: 90% asistencia, prefiere mañanas → SCORE: 9/10
       • José: 60% asistencia, última vez llegó tarde → SCORE: 6/10
       • Ana: Nueva paciente → SCORE: 7/10

5. Generación de Propuesta
   └─ LLM crea mensaje para María:
       "Hola María 👋
        Se liberó un espacio con el Dr. Hernández mañana a las 11am.
        ¿Te gustaría tomar esta cita?
        
        Responde:
        • SÍ para confirmar
        • VER OTRAS para más opciones"

6. Envío de WhatsApp
   └─ API call: sendWhatsApp(+52xxx, message)
   └─ Timeout: 2 horas para respuesta

[21:30] María responde "SÍ"

7. Confirmación Automática
   └─ Crear cita en agenda
   └─ Eliminar de lista de espera
   └─ Enviar confirmación: "¡Perfecto! Te esperamos mañana 11am 📅"

8. Logging y Métricas
   └─ Guardar: hueco_optimizado, paciente_contactado, conversion_rate
   └─ Actualizar: ingresos_proyectados += $800

[Reporte generado]:
✅ 1 hueco optimizado
💰 $800 MXN ingreso adicional
📊 Tasa de conversión: 100% (1/1)
⏱️ Tiempo ahorrado: 30 minutos (secretaria lo haría manual)
```

### Caso de Uso 2: Facturación Automática al Completar Cita

**Trigger:** Cita marcada como "completed"

```
[15:05] Dr. Hernández marca cita #1234 como completada en la app

1. Webhook/Event Triggered
   └─ Event: appointment.completed
   └─ appointmentId: 1234

2. Agente Facturador se activa

3. Verificar Datos Fiscales
   └─ Query: SELECT fiscal_data FROM patients WHERE id = patient_id
   └─ Resultado: 
       • RFC: ✅
       • Razón Social: ✅
       • Uso CFDI: ❌ FALTANTE

4. Solicitar Datos Faltantes
   └─ WhatsApp al paciente:
       "Hola Juan, para tu factura necesito saber:
        ¿Para qué usarás la factura?
        1) Gastos médicos
        2) Gastos generales
        3) Otro"
   
[15:08] Paciente responde: "1"

5. Actualizar Datos
   └─ UPDATE patients SET fiscal_uso_cfdi = 'D01' WHERE id = patient_id

6. Generar Factura
   └─ API Facturama:
       POST /api/3/cfdis
       {
         receptor: { rfc, razon_social, uso_cfdi },
         conceptos: [{ descripcion, precio, cantidad }]
       }

7. Enviar Factura
   └─ Email: adjuntar PDF + XML
   └─ WhatsApp: "Tu factura está lista 📄 Te la envié por email"

8. Registrar en Sistema
   └─ INSERT INTO invoices (appointment_id, cfdi_uuid, pdf_url, xml_url)
   └─ UPDATE appointments SET invoiced = true

9. Notificar Doctor
   └─ Push notification: "Factura #1234 generada automáticamente"

[Métricas]:
⏱️ Tiempo total: 3 minutos (vs 15 minutos manual)
✅ 0 errores
📧 Email entregado: ✅
```

### Caso de Uso 3: Gestión Proactiva de No-Shows

**Objetivo:** Reducir faltas sin previo aviso

```
[Día D-1, 08:00] Agente Recordatorios ejecuta análisis predictivo

1. Identificar Citas de Alto Riesgo
   └─ Query: 
       SELECT * FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.date = tomorrow
       AND (
         p.no_show_rate > 0.3 OR
         a.status != 'confirmed' OR
         p.last_contact < NOW() - INTERVAL '7 days'
       )
   
   └─ Resultado: 3 citas de riesgo
       • Juan Pérez (40% no-shows histórico)
       • Ana García (no ha confirmado)
       • Carlos López (nuevo paciente)

2. Estrategia Personalizada por LLM
   └─ Prompt a Claude:
       "Paciente: Juan Pérez
        Historial: 4/10 últimas citas canceladas último momento
        Perfil: Profesionista ocupado, responde mejor por WhatsApp
        
        Genera estrategia de recordatorio"
   
   └─ LLM responde:
       {
         channel: 'whatsapp',
         timing: ['24h', '4h', '1h'],
         tone: 'urgente pero comprensivo',
         incentive: 'ofrecer reagendamiento fácil si no puede'
       }

3. Ejecución Escalonada

   [D-1, 10:00] Primer recordatorio
   └─ WhatsApp: 
       "Hola Juan, te recuerdo tu cita mañana 3pm con el Dr. Hernández.
        
        Si surge algo y no puedes asistir, avísanos con 4h de anticipación
        para que otro paciente pueda tomar el espacio.
        
        Responde CONFIRMO para confirmar tu asistencia ✅"
   
   [D-0, 11:00] Si no respondió - Segundo recordatorio
   └─ WhatsApp:
       "Juan, tu cita es en 4 horas (3pm).
        
        ¿Sigues confirmado? Responde SÍ o NO"
   
   [D-0, 14:00] Si no respondió - Tercer recordatorio + escalación
   └─ WhatsApp:
       "Última confirmación: tu cita es en 1 hora.
        Si no respondes en 15 min, liberaremos el espacio."
   
   └─ Notificar recepcionista:
       "⚠️ Paciente Juan Pérez no confirma cita 3pm. Posible no-show."

4. Acciones Reactivas

   Si responde "NO PUEDO":
   └─ Agente responde: 
       "Entendido. ¿Quieres reagendar?
        Tengo estos espacios disponibles:
        • Jueves 2pm
        • Viernes 10am
        • Lunes próximo 4pm"
   
   Si no responde en absoluto:
   └─ 14:15 - Liberar espacio en agenda
   └─ Contactar siguiente paciente de lista de espera
   └─ Registrar no-show en historial del paciente

5. Análisis Post-Mortem
   └─ Si fue no-show:
       • Incrementar no_show_rate del paciente
       • Ajustar estrategia para próximas citas
       • Considerar solicitar pago adelantado si rate > 50%
   
   └─ Si asistió:
       • Reducir no_show_rate
       • Marcar estrategia como efectiva
       • Replicar para pacientes similares

[Resultados Esperados]:
• Reducción de no-shows: 35% → 15%
• Recuperación de espacios: 80% llenado con lista de espera
• Satisfacción pacientes: +15% (aprecian recordatorios)
```

---

## 7. MODELO DE NEGOCIO Y MONETIZACIÓN

### 7.1 Estructura de Planes

| Feature | Free | Premium | Smart | Pro | Enterprise |
|---------|------|---------|-------|-----|------------|
| **Precio/mes** | $0 | $299 | $599 | $999 | $1,999 |
| Usuarios | 1 | 3 | 5 | 10 | Ilimitados |
| Citas/mes | 50 | 500 | 1,000 | 3,000 | Ilimitadas |
| **Chat Assistant** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Agentes Autónomos** | ❌ | ❌ | 2 activos | 5 activos | Ilimitados |
| Workflows | ❌ | 3 básicos | 10 | 25 | Ilimitados |
| WhatsApp/mes | 100 | 500 | 2,000 | 5,000 | Ilimitado |
| Facturación | ❌ | Manual | Automática | Automática | Automática |
| Reportes IA | ❌ | ❌ | Semanales | Diarios | Tiempo real |
| Soporte | Email | Email | Chat | Prioritario | Dedicado |
| Multi-sucursal | ❌ | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ | ✅ |
| Custom Agents | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7.2 Proyección de Ingresos

**Supuestos Conservadores:**

| Mes | Usuarios Totales | Smart (10%) | Pro (3%) | Enterprise (1%) | MRR | ARR |
|-----|------------------|-------------|----------|-----------------|-----|-----|
| 1 | 100 | 10 | 3 | 1 | $13,996 | $167,952 |
| 3 | 250 | 25 | 8 | 3 | $36,990 | $443,880 |
| 6 | 500 | 50 | 15 | 5 | $73,980 | $887,760 |
| 12 | 1,000 | 100 | 30 | 10 | $147,960 | $1,775,520 |
| 24 | 2,500 | 250 | 75 | 25 | $369,900 | $4,438,800 |

**Supuestos Optimistas (20% adoption):**

| Mes 24 | Usuarios | Smart (20%) | Pro (5%) | Enterprise (2%) | MRR | ARR |
|--------|----------|-------------|----------|-----------------|-----|-----|
| | 2,500 | 500 | 125 | 50 | $524,375 | $6,292,500 |

### 7.3 Estructura de Costos

**Costos por Usuario Smart (ejemplo):**

| Item | Costo/mes | Detalle |
|------|-----------|---------|
| Anthropic API | ~$15 | 1M tokens/mes promedio |
| Temporal Cloud | $2 | Worker time |
| Supabase | $1 | Storage + compute |
| Redis | $1 | Cache + queue |
| WhatsApp API | $5 | ~200 mensajes/mes |
| **Total COGS** | **$24** | |
| **Margen Bruto** | **96%** | ($599 - $24) / $599 |

**Punto de Equilibrio:**
- Costos fijos: ~$5,000 USD/mes (infraestructura + equipo)
- COGS variable: $24/usuario Smart
- BEP Smart: 9 usuarios ($599*9 - $24*9 = $5,175 > $5,000)

### 7.4 Estrategia de Pricing

**Anchoring:** Precio Enterprise alto ($1,999) hace que Pro ($999) parezca razonable

**Value-Based:** 
- Smart ($599): Ahorra 10h/mes → valor ~$2,000 MXN en tiempo
- Pro ($999): Ahorra 20h/mes → valor ~$4,000 MXN en tiempo
- ROI claro: 3-4x el costo

**Freemium Funnel:**
```
Free (100 users) 
  ↓ 30% upgrade después de 60 días
Premium ($299) 
  ↓ 20% upgrade después de 90 días viendo beneficios IA
Smart ($599)
  ↓ 15% upgrade si tienen múltiples doctores
Pro ($999)
```

### 7.5 Upsell Strategy

**In-App Prompts:**
```
Usuario tiene 10 no-shows este mes
↓
Modal: "El Agente de Recordatorios en plan Smart reduce no-shows 40%.
       Esto representa ~$4,000 MXN recuperados/mes.
       
       [Upgrade a Smart - $599/mes] [Ver demo]"
```

**Usage-Based Nudges:**
```
Usuario crea 5+ workflows manualmente
↓
Notification: "Estás creando muchos workflows.
               Con Pro puedes automatizar completamente.
               
               [Ver planes]"
```

---

## 8. SEGURIDAD Y COMPLIANCE MÉDICO

### 8.1 Protección de Datos Médicos

**Cumplimiento:**
- ✅ LFPDPPP (Ley Federal México)
- ✅ NOM-024-SSA3-2012 (expedientes electrónicos)
- ✅ Aviso de privacidad médico
- ✅ Consentimiento informado digital

**Medidas Técnicas:**

```typescript
// Encriptación de datos sensibles
class SecureAgentContext {
  async encryptPHI(data: any): Promise<string> {
    // PHI = Protected Health Information
    const key = await this.getKMSKey();
    return encrypt(JSON.stringify(data), key);
  }
  
  async decryptPHI(encrypted: string): Promise<any> {
    const key = await this.getKMSKey();
    const decrypted = decrypt(encrypted, key);
    return JSON.parse(decrypted);
  }
  
  // Anonimizar para enviar a Anthropic
  async anonymizePHI(data: any): Promise<any> {
    return {
      ...data,
      patientName: hashString(data.patientName),
      phone: hashString(data.phone),
      email: hashString(data.email),
      // Mantener solo datos necesarios para el agente
    };
  }
}
```

**Audit Trail:**
```typescript
// Registrar TODA interacción de agentes
interface AgentAuditLog {
  id: string;
  timestamp: string;
  agentId: string;
  userId: string;
  action: string;
  resourceType: 'appointment' | 'patient' | 'invoice';
  resourceId: string;
  changes: {
    before: any;
    after: any;
  };
  llmPrompt: string; // Qué se le preguntó al LLM
  llmResponse: string; // Qué respondió
  tokensUsed: number;
  success: boolean;
  ipAddress: string;
  userAgent: string;
}
```

### 8.2 Guardrails para Agentes

**Prevenir Acciones Peligrosas:**

```typescript
class AgentSafetyLayer {
  // Lista de acciones que requieren aprobación humana
  private RESTRICTED_ACTIONS = [
    'delete_patient',
    'delete_appointment',
    'cancel_invoice',
    'modify_diagnosis',
    'prescribe_medication',
  ];
  
  async validateAction(action: string, params: any): Promise<{
    allowed: boolean;
    requiresApproval: boolean;
    reason?: string;
  }> {
    // 1. Revisar si está en lista restringida
    if (this.RESTRICTED_ACTIONS.includes(action)) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: 'Esta acción requiere aprobación del doctor'
      };
    }
    
    // 2. Validar límites de modificación
    if (action === 'update_appointment') {
      const timeDiff = Date.now() - params.originalDate;
      if (timeDiff > 24 * 60 * 60 * 1000) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: 'No se pueden modificar citas a más de 24h'
        };
      }
    }
    
    // 3. Verificar permisos del usuario
    const userPermissions = await this.getUserPermissions(params.userId);
    if (!userPermissions.includes(action)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: 'Usuario sin permisos para esta acción'
      };
    }
    
    return { allowed: true, requiresApproval: false };
  }
  
  // Rate limiting para prevenir spam
  async checkRateLimit(userId: string, action: string): Promise<boolean> {
    const key = `ratelimit:${userId}:${action}`;
    const count = await redis.incr(key);
    await redis.expire(key, 60); // 1 minuto
    
    return count <= this.getLimit(action); // ej: max 10 WhatsApp/min
  }
}
```

### 8.3 Monitoreo y Alertas

**Dashboard de Seguridad:**
```typescript
// Métricas en tiempo real
interface SecurityMetrics {
  agentsActive: number;
  actionsPerMinute: number;
  failedActions: number;
  suspiciousActivity: Alert[];
  dataBreachAttempts: number;
  
  alerts: {
    type: 'rate_limit' | 'unauthorized' | 'data_leak' | 'anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    agentId: string;
    description: string;
    timestamp: string;
  }[];
}
```

**Alertas Automáticas:**
```typescript
// Detectar comportamiento anómalo
if (agent.actionsPerMinute > 100) {
  await sendAlert({
    type: 'anomaly',
    severity: 'high',
    message: `Agente ${agent.id} ejecutando ${agent.actionsPerMinute} acciones/min`,
    action: 'pause_agent'
  });
}

// Detectar intentos de acceso no autorizado
if (agent.failedActions > 5) {
  await sendAlert({
    type: 'unauthorized',
    severity: 'critical',
    message: `Posible ataque a agente ${agent.id}`,
    action: 'disable_agent'
  });
}
```

---

## 9. MÉTRICAS Y KPIS

### 9.1 Métricas de Producto

| Métrica | Definición | Target | Medición |
|---------|------------|--------|----------|
| **Chat Engagement** | % usuarios que usan chat/mes | >40% | Google Analytics |
| **Messages per Session** | Promedio mensajes por conversación | >8 | Backend logs |
| **Task Completion Rate** | % tareas completadas exitosamente | >85% | Agent logs |
| **User Satisfaction** | Rating promedio de respuestas | >4.2/5 | In-app feedback |

### 9.2 Métricas de Agentes

| Agente | Métrica Clave | Target | Impacto Negocio |
|--------|---------------|--------|-----------------|
| **Recordatorios** | No-show reduction | -40% | +$2,000 MXN/consultorio/mes |
| **Optimizador** | Slots filled | +25% | +$3,500 MXN/consultorio/mes |
| **Facturador** | Time to invoice | <10 min | -15h staff/mes |
| **Analista** | Insights actioned | >60% | Mejores decisiones |

### 9.3 Métricas de Negocio

**Funnel de Conversión:**
```
1000 Free users
  ↓ 30% activan trial Smart (300)
  ↓ 40% convierten después de trial (120)
  ↓ 15% upgrade a Pro después 6m (18)
  
MRR de este cohorte:
- 120 Smart x $599 = $71,880
- 18 Pro x $999 = $17,982
- Total: $89,862 MRR
```

**Customer Lifetime Value (LTV):**
```
Average customer lifetime: 24 meses
Average monthly spend: $599 (Smart)
Churn rate: 5%/mes → Retention 95%

LTV = $599 * (1 / 0.05) = $11,980 MXN
```

**Customer Acquisition Cost (CAC):**
```
Marketing spend: $10,000 USD/mes
New customers: 50/mes

CAC = $10,000 / 50 = $200 USD = ~$3,600 MXN

LTV/CAC Ratio = $11,980 / $3,600 = 3.3x ✅ (>3 es saludable)
```

### 9.4 Dashboard Ejecutivo

```typescript
// /dashboard/analytics/ai-metrics
interface AIMetricsDashboard {
  overview: {
    activeAgents: number;
    tasksExecutedToday: number;
    timesSaved: string; // "45 hours"
    revenueCaptured: number; // $25,000 MXN
  };
  
  agentPerformance: {
    agentId: string;
    name: string;
    executions: number;
    successRate: number;
    avgDuration: number;
    userSatisfaction: number;
    businessImpact: {
      metric: string;
      value: number;
      change: number; // % vs last month
    };
  }[];
  
  costAnalysis: {
    anthropicTokens: number;
    anthropicCost: number;
    temporalExecutions: number;
    temporalCost: number;
    totalAICost: number;
    costPerTask: number;
  };
  
  trends: {
    date: string;
    tasks: number;
    successRate: number;
    avgSatisfaction: number;
  }[];
}
```

---

## 10. ROADMAP Y MILESTONES

### Q1 2026 (Enero-Marzo): FUNDACIÓN

**Mes 1: Infraestructura Base**
- ✅ MCP Server con tools básicas
- ✅ Setup Anthropic API
- ✅ Tests y documentación

**Mes 2: Chat Assistant**
- ✅ UI de chat con streaming
- ✅ Integración Vercel AI SDK
- ✅ Sistema de sugerencias
- ✅ Beta privada (10 consultorios)

**Mes 3: Primer Agente - Recordatorios**
- ✅ Agent runtime con Temporal
- ✅ Reminder Agent funcional
- ✅ Dashboard de monitoreo
- 🎯 **Milestone:** 100 recordatorios automatizados/día

### Q2 2026 (Abril-Junio): AGENTES AUTÓNOMOS

**Mes 4: Segundo Agente - Optimizador**
- Detección de huecos
- Contacto automático a lista espera
- 🎯 **Milestone:** +20% ocupación de agenda

**Mes 5: Tercer Agente - Facturador**
- Generación CFDI automática
- Envío email/WhatsApp
- 🎯 **Milestone:** <10 min promedio facturación

**Mes 6: Workflow Builder (MVP)**
- Interfaz drag & drop básica
- 5 nodos esenciales
- 🎯 **Milestone:** 50 workflows creados por usuarios

### Q3 2026 (Julio-Septiembre): FEATURES AVANZADAS

**Mes 7: Agente Analista**
- Reportes automáticos semanales
- Predicciones flujo de caja
- Sugerencias de optimización

**Mes 8: Multi-Agente Collaboration**
- Agentes coordinados entre sí
- Workflows complejos

**Mes 9: Voice Agent (Beta)**
- Atención telefónica con IA
- Agendamiento por voz
- 🎯 **Milestone:** 1,000 llamadas manejadas

### Q4 2026 (Octubre-Diciembre): ESCALAMIENTO

**Mes 10: Workflow Builder (Completo)**
- 20+ nodos disponibles
- Plantillas predefinidas
- Marketplace de workflows

**Mes 11: Enterprise Features**
- Custom agents por cliente
- API pública
- Integraciones avanzadas

**Mes 12: Scale & Polish**
- Optimizaciones de performance
- Mejoras UX basadas en feedback
- 🎯 **Milestone:** 500 consultorios usando AaaS

---

## 🎬 CONCLUSIONES Y PRÓXIMOS PASOS

### Recomendación Final

**Empezar con FASE 1 - Fundación:**
1. MCP Server (2 semanas)
2. Chat Assistant (2 semanas)

**Total: 1 mes para MVP funcional**

### Inversión Inicial Estimada

| Item | Costo |
|------|-------|
| Desarrollo (4 semanas x 2 devs) | $40,000 USD |
| Anthropic API (testing) | $500 USD |
| Infraestructura (Temporal, Redis) | $200 USD/mes |
| **Total Fase 1** | **$40,700 USD** |

### ROI Esperado

Con solo 50 clientes Smart ($599/mes):
- MRR: $29,950 MXN
- ARR: $359,400 MXN
- Payback period: ~4 meses

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| LLM da respuestas incorrectas | Media | Alto | Guardrails + human-in-loop |
| Costos API muy altos | Baja | Medio | Monitoring + rate limiting |
| Usuarios no adoptan IA | Media | Alto | Onboarding + quick wins |
| Compliance médico | Baja | Crítico | Audit trail + encriptación |

---

## 📚 RECURSOS Y REFERENCIAS

- [ClawdBot Repository](https://github.com/cyanheads/clawdbot)
- [Anthropic MCP Documentation](https://docs.anthropic.com/mcp)
- [Temporal.io Documentation](https://docs.temporal.io/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [NOM-024-SSA3-2012](http://www.dof.gob.mx/nota_detalle.php?codigo=5280848)

---

**Documento vivo - Última actualización:** Enero 2026  
**Autores:** Equipo AgendaMedPro  
**Estado:** Plan Aprobado - En Implementación

---

## 📝 CHANGELOG

- **v1.0** (Enero 2026): Documento inicial completo
