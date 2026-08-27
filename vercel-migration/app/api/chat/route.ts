import { createAnthropic } from '@ai-sdk/anthropic';
import { clinicDateStringRangeUtc, dateStringInTimezone, DEFAULT_CLINIC_TIMEZONE } from '@/lib/timezone';
import { maskPhone, maskEmail } from '@/lib/log';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Edge runtime para mejor performance
export const runtime = 'edge';

// Cliente Supabase con service role para acceso completo
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting simple en memoria
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

type RagSnippet = {
  id: string;
  keywords: string[];
  content: string;
};

const RAG_KNOWLEDGE_SNIPPETS: RagSnippet[] = [
  {
    id: 'product-core',
    keywords: ['agenda', 'citas', 'pacientes', 'inventario', 'factura', 'facturacion', 'cfdi'],
    content: 'AgendaMedPro centraliza agenda, pacientes, inventario, recordatorios y facturación en una sola plataforma.',
  },
  {
    id: 'trial-pricing',
    keywords: ['trial', 'demo', 'precio', 'plan', 'suscripcion', 'costo'],
    content: 'AgendaMedPro maneja flujo de trial comercial y planes por nivel de operación; la activación se completa desde el onboarding de pago.',
  },
  {
    id: 'messaging',
    keywords: ['whatsapp', 'recordatorio', 'mensaje', 'notificacion', 'sms', 'email'],
    content: 'El sistema soporta mensajería y notificaciones para seguimiento de pacientes y reducción de inasistencias.',
  },
  {
    id: 'operations',
    keywords: ['dashboard', 'reporte', 'ingresos', 'gastos', 'estadisticas', 'metricas'],
    content: 'El dashboard consolida indicadores operativos y financieros para decisiones rápidas en clínica.',
  },
];

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = 20; // 20 mensajes por hora
  const windowMs = 60 * 60 * 1000;
  
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: limit - userLimit.count };
}

function cleanSystemContext(contextData: string): string {
  return (contextData || '')
    .replace(/\[DATOS DEL SISTEMA\s*-?\s*/gi, '')
    .replace(/\[RAG\s*-?\s*Base de conocimiento:\s*/gi, '')
    .replace(/\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function retrieveRagContext(question: string): string {
  const normalizedQuestion = (question || '').toLowerCase();
  if (!normalizedQuestion) return '';

  const matched = RAG_KNOWLEDGE_SNIPPETS.filter((snippet) =>
    snippet.keywords.some((keyword) => normalizedQuestion.includes(keyword))
  ).slice(0, 3);

  if (!matched.length) return '';

  return matched.map((snippet, index) => `${index + 1}. ${snippet.content}`).join('\n');
}

function isAppointmentIntent(question: string): boolean {
  const text = (question || '').toLowerCase();
  const asksByAppointmentKeywords = /\bcitas?\b|\bappointment(?:s)?\b/i.test(text);
  const asksByAgendaOperation = /\bagenda\b/i.test(text)
    && /\b(hoy|ma[ñn]ana|fecha|calendario|disponib|ocupad|libre|programad|tengo|cu[aá]nt|ver|mostrar)\b/i.test(text);

  return asksByAppointmentKeywords || asksByAgendaOperation;
}

function shouldEscalateToAI(question: string, cleanedContext: string): boolean {
  if (!cleanedContext) {
    return true;
  }

  const requiresReasoning = /(recomienda|estrateg|analiza|insight|predic|optimiza|prioriza|roadmap|propuesta|plan de acci[oó]n|comparar|pros|contras|por qu[eé]|porque|opina)/i;
  const asksForGeneration = /(redacta|escribe|copy|mensaje|correo|guion|script|campa[ñn]a|anuncio)/i;
  const longQuestion = (question || '').trim().length > 240;

  return requiresReasoning.test(question) || asksForGeneration.test(question) || longQuestion;
}

function buildContextFirstAnswer(question: string, cleanedContext: string): string {
  const normalizedQuestion = (question || '').toLowerCase();
  let intro = 'Con base en el contexto recuperado (RAG + base de datos), esto es lo que encontré:';

  if (isAppointmentIntent(normalizedQuestion)) {
    intro = 'Con base en tu agenda y tus datos actuales:';
  } else if (/paciente|patient/.test(normalizedQuestion)) {
    intro = 'Con base en tu módulo de pacientes:';
  } else if (/inventario|stock|producto/.test(normalizedQuestion)) {
    intro = 'Con base en tu inventario actual:';
  } else if (/factura|cfdi|cobro|pago/.test(normalizedQuestion)) {
    intro = 'Con base en tu información de facturación y cobros:';
  }

  return `${intro}\n\n${cleanedContext}`;
}

function buildDeterministicFallback(lastMessage: string, contextData: string, isAuthenticated: boolean): string {
  const compactQuestion = (lastMessage || '').trim();
  const cleanedContext = cleanSystemContext(contextData);

  if (cleanedContext) {
    return `Estoy en modo respaldo, pero sí pude consultar tu sistema.\n\n${cleanedContext}`;
  }

  if (!isAuthenticated) {
    if (/precio|plan|suscrip|trial|demo/i.test(compactQuestion)) {
      return 'AgendaMedPro ofrece trial de 14 días y planes por nivel de operación. Si quieres, te explico qué incluye cada plan y cuál te conviene según tu clínica.';
    }

    if (/cita|agenda|paciente|inventario|factura/i.test(compactQuestion)) {
      return 'AgendaMedPro centraliza agenda, pacientes, inventario, recordatorios y facturación en un solo sistema. Inicia sesión para darte respuestas con datos reales de tu cuenta.';
    }

    return 'Soy el asistente de AgendaMedPro. Puedo resolver dudas del producto y, al iniciar sesión, ayudarte con datos de tu clínica en tiempo real.';
  }

  return 'No pude usar el modelo IA en este momento, pero puedo seguir apoyándote con consultas de citas, pacientes, inventario, facturación y reportes de tu cuenta.';
}

async function getAuthenticatedUserFromCookies() {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {
            // No-op in this read-only auth lookup context
          },
          remove() {
            // No-op in this read-only auth lookup context
          },
        },
      }
    );

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (error) {
    console.error('[AI CHAT] Cookie auth lookup failed', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    // Validación básica
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Sin mensajes' }), 
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const authHeader = req.headers.get('authorization');
    let authenticatedUser = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      authenticatedUser = user;
      console.log('[AI DEBUG] Usuario autenticado:', user?.id);
    } else {
      console.log('[AI DEBUG] No hay token de autenticación');
    }

    // Fallback: autenticación por cookies de sesión
    if (!authenticatedUser) {
      const cookieUser = await getAuthenticatedUserFromCookies();
      if (cookieUser) {
        authenticatedUser = cookieUser;
        console.log('[AI DEBUG] Usuario autenticado por cookie:', cookieUser.id);
      }
    }

    // Rate limiting por usuario autenticado o IP para anónimos
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || 'anonymous-ip';
    // Auditoría fable 2026-06-11 (E2): antes un anónimo podía enviar `userId`
    // arbitrario y rotarlo para evadir el límite. La identidad sólo puede ser
    // el usuario AUTENTICADO o la IP. (Limitación conocida: Map en memoria por
    // instancia serverless — ver OD-4 para límite distribuido.)
    const rateLimitId = authenticatedUser?.id ? `user:${authenticatedUser.id}` : `ip:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitId);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Límite excedido. Máximo 20 mensajes por hora.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
        }
      );
    }

    // Límite de contexto (últimos 10 mensajes)
    const limitedMessages = messages.slice(-10);
    const lastMessage = limitedMessages[limitedMessages.length - 1]?.content || '';

    // DETECCIÓN SIMPLE DE INTENCIÓN (pre-tool execution)
    let contextData = '';
    const appointmentIntent = isAppointmentIntent(lastMessage);

    // RAG ligero de conocimiento de producto antes de escalar a IA
    const ragContext = appointmentIntent ? '' : retrieveRagContext(lastMessage);
    if (ragContext) {
      contextData += `\n\n[RAG - Base de conocimiento:\n${ragContext}]`;
    }
    
    // Si pregunta por citas (detectar fecha)
    let targetDate = null;
    let dateLabel = '';
    
    // Detectar cualquier pregunta sobre citas primero
    const askingAboutAppointments = appointmentIntent;
    
    if (askingAboutAppointments) {
      // Detectar mañana
      if (lastMessage.match(/ma[ñn]ana|tomorrow/i)) {
        // fable E3: zona IANA de la clínica (multi-sede, DST correcto) en lugar
        // de UTC-6 manual. México tiene varias zonas; ver lib/timezone.ts.
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        targetDate = dateStringInTimezone(tomorrow, DEFAULT_CLINIC_TIMEZONE);
        dateLabel = 'mañana';
      }
      // Detectar hoy
      else if (lastMessage.match(/hoy|today/i)) {
        // fable E3: fecha local de la clínica vía zona IANA.
        targetDate = dateStringInTimezone(new Date(), DEFAULT_CLINIC_TIMEZONE);
        dateLabel = 'hoy';
      }
      // Detectar fecha específica (ej: "29 de enero", "enero 29", "2026-01-29")
      else {
        const dateMatch = lastMessage.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(\d{4}-\d{2}-\d{2})/i);
        if (dateMatch) {
          if (dateMatch[3]) {
            // Formato YYYY-MM-DD
            targetDate = dateMatch[3];
            dateLabel = targetDate;
          } else {
            // Formato "29 de enero"
            const months: {[key: string]: number} = {
              enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
              julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
            };
            const day = parseInt(dateMatch[1]);
            const month = months[dateMatch[2].toLowerCase()];
            const year = new Date().getFullYear();
            const date = new Date(year, month, day);
            targetDate = date.toISOString().split('T')[0];
            dateLabel = `${day} de ${dateMatch[2]}`;
          }
          console.log('[AI DEBUG] Detectado fecha específica:', dateLabel, 'calculada:', targetDate);
        } else {
          // Si pregunta por citas sin especificar, asumir hoy (adenda V2.1,
          // A-5: fecha local de la clínica, no el día UTC del proceso)
          targetDate = dateStringInTimezone(new Date(), DEFAULT_CLINIC_TIMEZONE);
          dateLabel = 'hoy';
          console.log('[AI DEBUG] No se especificó fecha, asumiendo hoy:', targetDate);
        }
      }
    }
    
    // Buscar citas para la fecha detectada
    if (targetDate) {
      try {
        console.log('[AI DEBUG] Buscando citas para fecha:', targetDate);
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para citas');
        } else {
        
        // Adenda V2.1, A-5: targetDate ya es la fecha local de la clínica
        // (dateStringInTimezone más arriba) -- envolverla con "Z" aquí la
        // trataba como si fuera UTC y corría la ventana 6h en México.
        const { startUtc: targetDateStartUtc, endUtc: targetDateEndUtc } = clinicDateStringRangeUtc(targetDate);
        const { data, error } = await supabase
          .from('appointments')
          .select('id, fecha_hora, duracion_minutos, estado, precio_acordado, patient:patients(nombre, apellido)')
          .eq('user_id', authenticatedUser.id)
          .gte('fecha_hora', targetDateStartUtc.toISOString())
          .lt('fecha_hora', targetDateEndUtc.toISOString())
          .order('fecha_hora');
        
        console.log('[AI DEBUG] Query result - Citas encontradas:', data?.length || 0, 'Error:', error);
        if (data && data.length > 0) console.log('[AI DEBUG] Primera cita:', JSON.stringify(data[0]));
        
        if (data && data.length > 0) {
          const citasDetalle = data.map((a: any, i: number) => {
            // Extraer hora directamente del string sin conversión de timezone
            // La BD almacena: "2026-01-29T09:00:00+00:00" pero queremos mostrar 09:00
            const fechaStr = a.fecha_hora;
            const horaMatch = fechaStr.match(/T(\d{2}):(\d{2})/);
            const hora = horaMatch ? `${horaMatch[1]}:${horaMatch[2]}` : 'N/A';
            
            // Calcular hora de fin
            const duracion = a.duracion_minutos || 30;
            const startDate = new Date(a.fecha_hora);
            const endDate = new Date(startDate.getTime() + duracion * 60000);
            const endHoraMatch = endDate.toISOString().match(/T(\d{2}):(\d{2})/);
            const horaFin = endHoraMatch ? `${endHoraMatch[1]}:${endHoraMatch[2]}` : 'N/A';
            
            const patientName = a.patient ? `${a.patient.nombre} ${a.patient.apellido}` : 'Sin nombre';
            return `Cita #${i+1}:\n  - Hora de inicio: ${hora}\n  - Hora de fin: ${horaFin}\n  - Duración: ${duracion} minutos\n  - Paciente: ${patientName}\n  - Estado: ${a.estado}\n  - Precio acordado: $${a.precio_acordado || 0}`;
          }).join('\n\n');
          
          contextData += `\n\n[DATOS DEL SISTEMA - Citas para ${dateLabel} (${targetDate}):\nTotal: ${data.length} cita(s) agendada(s)\n\n${citasDetalle}]`;
          console.log('[AI DEBUG] Context data creado con', data.length, 'citas');
        } else {
          contextData += `\n\n[DATOS DEL SISTEMA - Citas para ${dateLabel} (${targetDate}): 0 citas agendadas. La agenda está completamente libre.]`;
          console.log('[AI DEBUG] No se encontraron citas');
        }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error completo fetching appointments:', e);
      }
    }
    
    // Si pregunta por estadísticas/ingresos (con o sin acento)
    if (lastMessage.match(/estad[ií]sticas?|ganado|ingresos?|cuanto.*hoy|dame.*n[uú]meros|resumen.*d[ií]a/i)) {
      try {
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para estadísticas');
        } else {
          // Adenda V2.1, A-5: "hoy" en el calendario local de la clinica,
          // no el dia UTC del proceso
          const today = dateStringInTimezone(new Date());
          const { startUtc: todayStartUtc, endUtc: todayEndUtc } = clinicDateStringRangeUtc(today);
          const { data } = await supabase
            .from('appointments')
            .select('estado, precio_acordado')
            .eq('user_id', authenticatedUser.id)
            .gte('fecha_hora', todayStartUtc.toISOString())
            .lt('fecha_hora', todayEndUtc.toISOString());
        
          const stats = {
            total: data?.length || 0,
            confirmed: data?.filter(a => a.estado === 'confirmed').length || 0,
            completed: data?.filter(a => a.estado === 'completed').length || 0,
            cancelled: data?.filter(a => a.estado === 'cancelled').length || 0,
            pending: data?.filter(a => a.estado === 'pending').length || 0,
            income: data?.reduce((sum, a) => sum + (a.precio_acordado || 0), 0) || 0,
          };
        
          contextData += `\n\n[DATOS DEL SISTEMA - Estadísticas de hoy (${today}):
- Total de citas: ${stats.total}
- Confirmadas: ${stats.confirmed}
- Completadas: ${stats.completed}
- Canceladas: ${stats.cancelled}
- Pendientes: ${stats.pending}
- Ingresos totales: $${stats.income.toLocaleString('es-MX')} MXN]`;
        }
      } catch (e) {
        console.error('Error fetching stats:', e);
      }
    }
    
    // Si pregunta por tratamientos
    if (lastMessage.match(/tratamiento|treatment|procedimiento|servicio|cuantos tratamiento/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre tratamientos');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado');
        } else {
          const { data, error } = await supabase
            .from('treatments')
            .select('*')
            .eq('user_id', authenticatedUser.id)
            .order('created_at', { ascending: false });
          
          console.log('[AI DEBUG] Tratamientos encontrados:', data?.length || 0, 'Error:', error);
          if (data && data.length > 0) {
            console.log('[AI DEBUG] Primer tratamiento:', JSON.stringify(data[0]));
          }
          
          if (data && data.length > 0) {
            const treatmentsList = data.slice(0, 20).map((t: any, i: number) => 
              `${i+1}. ${t.name || t.nombre} - $${t.price || t.precio || 0}${t.duration || t.duracion_minutos ? ` - ${t.duration || t.duracion_minutos} min` : ''}${t.category || t.categoria ? ` (${t.category || t.categoria})` : ''}`
            ).join('\n');
            
            contextData += `\n\n[DATOS DEL SISTEMA - Tratamientos (${data.length} total):
${treatmentsList}${data.length > 20 ? '\n... y más' : ''}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay tratamientos registrados]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching treatments:', e);
      }
    }
    
    // Si pregunta por inventario
    if (lastMessage.match(/inventario|inventory|producto|stock|existencia|almac[eé]n|cuanto.*inventario|bajo|items?|item/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre inventario');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para inventario');
        } else {
          const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('user_id', authenticatedUser.id)
            .order('nombre');
          
          console.log('[AI DEBUG] Productos en inventario:', data?.length || 0, 'Error:', error);
          if (data && data.length > 0) {
            console.log('[AI DEBUG] Primer producto:', JSON.stringify(data[0]));
          }
          
          if (data && data.length > 0) {
            const inventoryList = data.slice(0, 20).map((item: any, i: number) => {
              const stock = item.stock_actual ?? 0;
              const minStock = item.stock_minimo ?? 0;
              const price = item.precio_unitario ?? 0;
              const stockWarning = stock <= minStock ? ' ⚠️ STOCK BAJO' : '';
              return `${i+1}. Producto: "${item.nombre}" | Stock actual: ${stock} unidades | Stock mínimo: ${minStock} | Precio unitario: $${price}${item.descripcion ? ` | Descripción: ${item.descripcion}` : ''}${stockWarning}`;
            }).join('\n');
            
            const lowStockItems = data.filter((item: any) => (item.stock_actual ?? 0) <= (item.stock_minimo ?? 0));
            
            contextData += `\n\n[DATOS DEL SISTEMA - Inventario (${data.length} productos totales):
${inventoryList}${data.length > 20 ? '\n... y más' : ''}

${lowStockItems.length > 0 ? `⚠️ ALERTA DE STOCK BAJO: ${lowStockItems.length} productos necesitan reabastecimiento:\n${lowStockItems.map(i => `  - ${i.nombre}: Stock actual ${i.stock_actual ?? 0} (mínimo requerido: ${i.stock_minimo ?? 0})`).join('\n')}` : '✅ INVENTARIO SALUDABLE: Todos los productos tienen stock adecuado (por encima del mínimo)'}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay productos en inventario]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching inventory:', e);
      }
    }
    
    // Si pregunta por gastos fijos
    if (lastMessage.match(/gasto.*fijo|egreso|gastos?\s*(fijos?|mensuale|recurrente)|cuanto.*gasto|cuanto.*mes|dame.*gasto/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre gastos');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para gastos');
        } else {
          const { data, error } = await supabase
            .from('gastos_fijos')
            .select('id, concepto, monto, frecuencia, fecha_inicio, activo')
            .eq('user_id', authenticatedUser.id)
            .eq('activo', true)
            .order('monto', { ascending: false });
        
          console.log('[AI DEBUG] Gastos fijos encontrados:', data?.length || 0, 'Error:', error);
          if (error) console.error('[AI DEBUG] Error detail:', JSON.stringify(error));
        
          if (data && data.length > 0) {
            const gastosList = data.map((g: any, i: number) => 
              `${i+1}. ${g.concepto} - $${g.monto || 0} (${g.frecuencia || 'mensual'})${g.fecha_inicio ? ` - Desde: ${g.fecha_inicio}` : ''}`
            ).join('\n');
          
            const totalMensual = data.reduce((sum: number, g: any) => sum + (g.monto || 0), 0);
          
            contextData += `\n\n[DATOS DEL SISTEMA - Gastos Fijos (${data.length} conceptos):
${gastosList}
TOTAL MENSUAL: $${totalMensual.toLocaleString('es-MX')} MXN]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay gastos fijos registrados]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching gastos:', e);
      }
    }
    
    // Si pregunta por pacientes
    if (lastMessage.match(/paciente|cuantos paciente|lista.*paciente|patient/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre pacientes');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para pacientes');
        } else {
          const { data, count } = await supabase
            .from('patients')
            .select('id, nombre, apellido, telefono, email', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('nombre')
            .limit(15);
        
        console.log('[AI DEBUG] Pacientes encontrados:', count || 0);
        
        if (data && data.length > 0) {
          const patientsList = data.map((p: any, i: number) => 
            `${i+1}. ${p.nombre} ${p.apellido}${p.telefono ? ` - ${maskPhone(p.telefono)}` : ''}${p.email ? ` - ${maskEmail(p.email)}` : ''}` // fable E1: PII enmascarada hacia el proveedor IA
          ).join('\n');
          
            contextData += `\n\n[DATOS DEL SISTEMA - Pacientes (${count} total):
${patientsList}${(count || 0) > 15 ? '\n... y más' : ''}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay pacientes registrados]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching patients:', e);
      }
    }
    
    // Si busca un paciente
    const patientMatch = lastMessage.match(/busca.*(paciente|nombre)\s+([a-záéíóúñ]+)/i);
    if (patientMatch) {
      try {
        const query = patientMatch[2];

        if (!authenticatedUser) {
          contextData += `\n\n[DATOS DEL SISTEMA - Búsqueda de paciente: inicia sesión para consultar pacientes de tu cuenta]`;
        } else {
          const { data } = await supabase
            .from('patients')
            .select('id, nombre, apellido, telefono, email')
            .eq('user_id', authenticatedUser.id)
            .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%`)
            .limit(5);

          const patientSummary = (data || [])
            .map((patient: any) => `${patient.nombre} ${patient.apellido || ''}`.trim() + (patient.telefono ? ` (Tel: ${maskPhone(patient.telefono)})` : '') /* fable E1 */)
            .join(', ');

          contextData += `\n\n[DATOS DEL SISTEMA - Resultados de búsqueda "${query}": ${data?.length || 0} pacientes encontrados${patientSummary ? `. ${patientSummary}` : ''}]`;
        }
      } catch (e) {
        console.error('Error searching patients:', e);
      }
    }

    // Si pregunta por WhatsApp templates
    if (lastMessage.match(/whatsapp.*template|plantilla.*whatsapp|mensaje.*autom[aá]tico/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre WhatsApp templates');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para WhatsApp templates');
        } else {
          const { data, count } = await supabase
            .from('whatsapp_templates')
            .select('*', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          console.log('[AI DEBUG] WhatsApp templates encontrados:', count || 0);
          
          if (data && data.length > 0) {
            const templatesList = data.map((t: any, i: number) => 
              `${i+1}. ${t.name || 'Sin nombre'}${t.message ? ` - "${t.message.substring(0, 50)}..."` : ''}`
            ).join('\n');
            
            contextData += `\n\n[DATOS DEL SISTEMA - Plantillas WhatsApp (${count} total):
${templatesList}${(count || 0) > 10 ? '\n... y más' : ''}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay plantillas de WhatsApp registradas]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching WhatsApp templates:', e);
      }
    }
    
    // Si pregunta por mensajes de WhatsApp
    if (lastMessage.match(/mensaje.*whatsapp|whatsapp.*mensaje|envio.*whatsapp|chat.*whatsapp/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre mensajes WhatsApp');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para mensajes WhatsApp');
        } else {
          const { data, count } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('created_at', { ascending: false })
            .limit(15);
          
          console.log('[AI DEBUG] Mensajes WhatsApp encontrados:', count || 0);
          
          if (data && data.length > 0) {
            const messagesList = data.map((m: any, i: number) => 
              `${i+1}. ${m.status || 'Sin estado'} - ${m.to_phone || m.to_number || 'Sin destino'}${m.sent_at ? ` - ${new Date(m.sent_at).toLocaleDateString()}` : ''}`
            ).join('\n');
            
            contextData += `\n\n[DATOS DEL SISTEMA - Mensajes WhatsApp (${count} total):
${messagesList}${(count || 0) > 15 ? '\n... y más' : ''}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay mensajes de WhatsApp registrados]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching WhatsApp messages:', e);
      }
    }
    
    // Si pregunta por facturas/invoices
    if (lastMessage.match(/factura|invoice|cobr[aoó]|cuanto.*cobr[éeó]|pago.*recib/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre facturas');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para facturas');
        } else {
          const { data, count } = await supabase
            .from('invoices')
            .select('*', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('created_at', { ascending: false })
            .limit(15);
          
          console.log('[AI DEBUG] Facturas encontradas:', count || 0);
          
          if (data && data.length > 0) {
            const invoicesList = data.map((inv: any, i: number) => {
              const amount = inv.amount || inv.total || 0;
              const status = inv.status || inv.estado || 'Pendiente';
              const date = inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Sin fecha';
              return `${i+1}. $${amount} - ${status} - ${date}`;
            }).join('\n');
            
            const totalAmount = data.reduce((sum: number, inv: any) => sum + (inv.amount || inv.total || 0), 0);
            
            contextData += `\n\n[DATOS DEL SISTEMA - Facturas (${count} total):
${invoicesList}${(count || 0) > 15 ? '\n... y más' : ''}
TOTAL: $${totalAmount.toLocaleString('es-MX')} MXN]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay facturas registradas]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching invoices:', e);
      }
    }
    
    // Si pregunta por notificaciones
    if (lastMessage.match(/notificaci[oó]n|notif|alerta|avisos?/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre notificaciones');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para notificaciones');
        } else {
          const { data, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          console.log('[AI DEBUG] Notificaciones encontradas:', count || 0);
          
          if (data && data.length > 0) {
            const notifsList = data.map((n: any, i: number) => {
              const isRead = n.read || n.leida ? '✅' : '🔴';
              const message = n.message || n.mensaje || 'Sin mensaje';
              const date = n.created_at ? new Date(n.created_at).toLocaleDateString() : '';
              return `${isRead} ${i+1}. ${message.substring(0, 60)}${message.length > 60 ? '...' : ''} - ${date}`;
            }).join('\n');
            
            const unreadCount = data.filter((n: any) => !n.read && !n.leida).length;
            
            contextData += `\n\n[DATOS DEL SISTEMA - Notificaciones (${count} total, ${unreadCount} sin leer):
${notifsList}${(count || 0) > 10 ? '\n... y más' : ''}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay notificaciones]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching notifications:', e);
      }
    }
    
    // Si pregunta por equipo/doctores
    if (lastMessage.match(/equipo|team|doctor|m[eé]dico|colaborador|personal|miembro/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre equipo/doctores');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para equipo');
        } else {
          // Buscar en tabla 'doctors' (doctores del consultorio)
          const { data, count } = await supabase
            .from('doctors')
            .select('*', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('nombre');
          
          console.log('[AI DEBUG] Doctores encontrados:', count || 0);
          
          if (data && data.length > 0) {
            const doctorsList = data.map((doc: any, i: number) => {
              const nombre = doc.nombre || 'Sin nombre';
              const especialidad = doc.especialidad || 'Sin especialidad';
              const estado = doc.activo ? '✅ Activo' : '⚠️ Inactivo';
              const cedula = doc.cedula_profesional ? ` - Cédula: ${doc.cedula_profesional}` : '';
              const telefono = doc.telefono ? ` - Tel: ${doc.telefono}` : '';
              return `${i+1}. ${nombre} - ${especialidad} ${estado}${cedula}${telefono}`;
            }).join('\n');
            
            const activeDoctors = data.filter((d: any) => d.activo).length;
            const inactiveDoctors = (count || 0) - activeDoctors;
            
            contextData += `\n\n[DATOS DEL SISTEMA - Equipo Médico (${count} doctores registrados):
${activeDoctors} activos, ${inactiveDoctors} inactivos

${doctorsList}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay doctores registrados]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching doctors:', e);
      }
    }
    
    // Si pregunta por ubicaciones/consultorios
    if (lastMessage.match(/ubicaci[oó]n|consultorio|sucursal|cl[ií]nica|location/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre ubicaciones');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para ubicaciones');
        } else {
          const { data, count } = await supabase
            .from('locations')
            .select('*', { count: 'exact' })
            .eq('user_id', authenticatedUser.id)
            .order('nombre')
            .limit(10);
          
          console.log('[AI DEBUG] Ubicaciones encontradas:', count || 0);
          
          if (data && data.length > 0) {
            const locationsList = data.map((loc: any, i: number) => {
              const name = loc.nombre || 'Sin nombre';
              const address = loc.direccion || 'Sin dirección';
              const phone = loc.telefono ? ` - Tel: ${loc.telefono}` : '';
              const isPrincipal = loc.es_principal ? ' ⭐ PRINCIPAL' : '';
              return `${i+1}. ${name} - ${address}${phone}${isPrincipal}`;
            }).join('\n');
            
            contextData += `\n\n[DATOS DEL SISTEMA - Ubicaciones/Consultorios (${count} total):
${locationsList}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay ubicaciones registradas]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching locations:', e);
      }
    }
    
    // Si pregunta por suscripción
    if (lastMessage.match(/suscripci[oó]n|subscription|plan|member|pago.*mensual/i)) {
      try {
        console.log('[AI DEBUG] Detectado pregunta sobre suscripción');
        
        if (!authenticatedUser) {
          console.log('[AI DEBUG] No hay usuario autenticado para suscripción');
        } else {
          const { data } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', authenticatedUser.id)
            .single();
          
          console.log('[AI DEBUG] Suscripción encontrada:', data ? 'Sí' : 'No');
          
          if (data) {
            const plan = data.plan_tier || 'Sin plan';
            const status = data.status || 'Inactivo';
            const endDate = data.current_period_end ? new Date(data.current_period_end).toLocaleDateString() : 'Sin fecha';
            const maxDoctors = data.max_doctors || 0;
            const maxLocations = data.max_locations || 0;
            
            contextData += `\n\n[DATOS DEL SISTEMA - Suscripción:
Plan: ${plan.toUpperCase()}
Estado: ${status}
Vigencia hasta: ${endDate}
Doctores permitidos: ${maxDoctors}
Ubicaciones permitidas: ${maxLocations}]`;
          } else {
            contextData += `\n\n[DATOS DEL SISTEMA - No hay suscripción activa]`;
          }
        }
      } catch (e) {
        console.error('[AI DEBUG] Error fetching subscription:', e);
      }
    }
    
    const cleanedContext = cleanSystemContext(contextData);
    const escalateToAI = shouldEscalateToAI(lastMessage, cleanedContext);

    // Retrieval-first: si RAG/DB alcanzan, responde sin costo de modelo
    if (cleanedContext && !escalateToAI) {
      return new Response(buildContextFirstAnswer(lastMessage, cleanedContext), {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error('[AI CHAT] Missing ANTHROPIC_API_KEY');

      const deterministicFallback = buildDeterministicFallback(
        lastMessage,
        contextData,
        Boolean(authenticatedUser)
      );

      return new Response(deterministicFallback, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Inicializar Anthropic
    const anthropic = createAnthropic({
      apiKey: anthropicApiKey,
    });

    // Modificar el último mensaje con contexto de datos
    const messagesWithContext = [...limitedMessages];
    if (contextData) {
      messagesWithContext[messagesWithContext.length - 1] = {
        ...messagesWithContext[messagesWithContext.length - 1],
        content: messagesWithContext[messagesWithContext.length - 1].content + contextData
      };
    }

    const conversationPrompt = messagesWithContext
      .map((message) => {
        const roleLabel = message.role === 'assistant' ? 'Asistente' : 'Usuario';
        return `${roleLabel}: ${message.content}`;
      })
      .join('\n\n');

    const systemPrompt = `Eres un asistente IA para AgendaMedPro. Responde de forma CONCISA (máximo 3 párrafos).

REGLA CRÍTICA: Cuando veas información marcada como [DATOS DEL SISTEMA], SIEMPRE úsala como la única fuente de verdad. NUNCA inventes o asumas información diferente. Si los DATOS DEL SISTEMA dicen que hay citas, entonces HAY citas. Si dicen que NO hay citas, entonces NO hay.

Los datos del sistema son SIEMPRE correctos y tienen prioridad sobre cualquier otra información.

Responde en español mexicano natural y profesional.`;

    const configuredModel = process.env.ANTHROPIC_MODEL?.trim();
    const modelCandidates = [
      configuredModel,
      'claude-3-5-haiku-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-haiku-20240307',
    ].filter((modelName): modelName is string => Boolean(modelName));

    let finalText = '';
    let lastGenerationError: unknown = null;

    for (const modelName of modelCandidates) {
      try {
        const { text } = await generateText({
          model: anthropic(modelName),
          prompt: conversationPrompt,
          system: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 700, // fable B1: API correcta del AI SDK v6 instalado
        });

        if (text && text.trim()) {
          finalText = text.trim();
          break;
        }

        console.warn('[AI CHAT] Modelo respondió vacío:', modelName);
      } catch (modelError) {
        lastGenerationError = modelError;
        console.error('[AI CHAT] Error con modelo', modelName, modelError);
      }
    }

    if (!finalText) {
      if (lastGenerationError) {
        console.error('[AI CHAT] No se pudo generar respuesta con ningún modelo', lastGenerationError);
      }

      const deterministicFallback = buildDeterministicFallback(
        lastMessage,
        contextData,
        Boolean(authenticatedUser)
      );

      return new Response(
        deterministicFallback,
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    return new Response(finalText, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Ocurrió un error al procesar tu solicitud.' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
