import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { appointmentTools } from './tools/appointments.js';
import { patientTools } from './tools/patients.js';
import { statsTools } from './tools/stats.js';

class AgendaMedProMCPServer {
  private server: Server;
  private allTools: any[];

  constructor() {
    // Combinar todas las tools
    this.allTools = [
      ...appointmentTools,
      ...patientTools,
      ...statsTools
    ];

    // Inicializar servidor MCP
    this.server = new Server(
      {
        name: 'agendamedpro-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handler para listar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MCP] Listing tools...');
      return {
        tools: this.allTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handler para ejecutar herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const toolArgs = request.params.arguments;

      console.error(`[MCP] Executing tool: ${toolName}`);
      console.error(`[MCP] Arguments:`, JSON.stringify(toolArgs, null, 2));

      const tool = this.allTools.find(t => t.name === toolName);

      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      try {
        const result = await tool.handler(toolArgs);
        
        console.error(`[MCP] Tool executed successfully`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`[MCP] Tool execution error:`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🚀 AgendaMedPro MCP Server started');
    console.error(`📦 Available tools: ${this.allTools.length}`);
    console.error(`   - Appointments: ${appointmentTools.length}`);
    console.error(`   - Patients: ${patientTools.length}`);
    console.error(`   - Stats: ${statsTools.length}`);
  }
}

// Start server
const mcpServer = new AgendaMedProMCPServer();
mcpServer.start().catch(console.error);
