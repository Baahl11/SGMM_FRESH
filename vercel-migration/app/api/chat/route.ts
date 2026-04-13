import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';

// Edge runtime para mejor performance
export const runtime = 'edge';

// Cliente Supabase con service role para acceso completo
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting simple en memoria
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

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

    // Rate limiting
    const rateLimitId = userId || 'anonymous';
    const rateLimit = checkRateLimit(rateLimitId);
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Límite excedido. Máximo 20 mensajes por hora.' }), 
        { status: 429 }
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

    // Límite de contexto (últimos 10 mensajes)
    const limitedMessages = messages.slice(-10);
    const lastMessage = limitedMessages[limitedMessages.length - 1]?.content || '';

    // DETECCIÓN SIMPLE DE INTENCIÓN (pre-tool execution)
    let contextData = '';
    
    // Si pregunta por citas (detectar fecha)
    let targetDate = null;
    let dateLabel = '';
    
    // Detectar cualquier pregunta sobre citas primero
    const askingAboutAppointments = lastMessage.match(/citas?|cita|agend|appointment/i);
    
    if (askingAboutAppointments) {
      // Detectar mañana
      if (lastMessage.match(/ma[ñn]ana|tomorrow/i)) {
        // Calcular fecha en zona horaria de México (UTC-6)
        const nowUtc = new Date();
        const mexicoOffset = -6 * 60; // -6 horas en minutos
        const mexicoTime = new Date(nowUtc.getTime() + mexicoOffset * 60 * 1000);
        
        // Sumar un día
        mexicoTime.setDate(mexicoTime.getDate() + 1);
        
        // Formatear como YYYY-MM-DD
        targetDate = mexicoTime.toISOString().split('T')[0];
        dateLabel = 'mañana';
        console.log('[AI DEBUG] Detectado: mañana, UTC:', nowUtc.toISOString(), 'México:', mexicoTime.toISOString(), 'fecha:', targetDate);
      }
      // Detectar hoy
      else if (lastMessage.match(/hoy|today/i)) {
        // Calcular fecha en zona horaria de México (UTC-6)
        const nowUtc = new Date();
        const mexicoOffset = -6 * 60;
        const mexicoTime = new Date(nowUtc.getTime() + mexicoOffset * 60 * 1000);
        targetDate = mexicoTime.toISOString().split('T')[0];
        dateLabel = 'hoy';
        console.log('[AI DEBUG] Detectado: hoy, UTC:', nowUtc.toISOString(), 'México:', mexicoTime.toISOString(), 'fecha:', targetDate);
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
          // Si pregunta por citas sin especificar, asumir hoy
          targetDate = new Date().toISOString().split('T')[0];
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
          contextData = `\n\n[DATOS DEL SISTEMA - Error: Usuario no autenticado]`;
        } else {
        
        const { data, error } = await supabase
          .from('appointments')
          .select('id, fecha_hora, duracion_minutos, estado, precio_acordado, patient:patients(nombre, apellido)')
          .eq('user_id', authenticatedUser.id)
          .gte('fecha_hora', `${targetDate}T00:00:00.000Z`)
          .lt('fecha_hora', `${targetDate}T23:59:59.999Z`)
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
          
          contextData = `\n\n[DATOS DEL SISTEMA - Citas para ${dateLabel} (${targetDate}):\nTotal: ${data.length} cita(s) agendada(s)\n\n${citasDetalle}]`;
          console.log('[AI DEBUG] Context data creado con', data.length, 'citas');
        } else {
          contextData = `\n\n[DATOS DEL SISTEMA - Citas para ${dateLabel} (${targetDate}): 0 citas agendadas. La agenda está completamente libre.]`;
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
          const today = new Date().toISOString().split('T')[0];
          const { data } = await supabase
            .from('appointments')
            .select('estado, precio_acordado')
            .eq('user_id', authenticatedUser.id)
            .gte('fecha_hora', `${today}T00:00:00`)
            .lte('fecha_hora', `${today}T23:59:59`);
        
          const stats = {
            total: data?.length || 0,
            confirmed: data?.filter(a => a.estado === 'confirmed').length || 0,
            completed: data?.filter(a => a.estado === 'completed').length || 0,
            cancelled: data?.filter(a => a.estado === 'cancelled').length || 0,
            pending: data?.filter(a => a.estado === 'pending').length || 0,
            income: data?.reduce((sum, a) => sum + (a.precio_acordado || 0), 0) || 0,
          };
        
          contextData = `\n\n[DATOS DEL SISTEMA - Estadísticas de hoy (${today}):
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
          contextData += `\n\n[DATOS DEL SISTEMA - Error: Usuario no autenticado]`;
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
            `${i+1}. ${p.nombre} ${p.apellido}${p.telefono ? ` - ${p.telefono}` : ''}${p.email ? ` - ${p.email}` : ''}`
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
        const { data } = await supabase
          .from('patients')
          .select('id, name, phone, email')
          .ilike('name', `%${query}%`)
          .limit(5);
        
        contextData = `\n\n[DATOS DEL SISTEMA - Resultados de búsqueda "${query}": ${data?.length || 0} pacientes encontrados. ${data?.map(p => `${p.name} (Tel: ${p.phone})`).join(', ')}]`;
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
              `${i+1}. ${m.status || 'Sin estado'} - ${m.to_number || 'Sin destino'}${m.sent_at ? ` - ${new Date(m.sent_at).toLocaleDateString()}` : ''}`
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
    
    // Inicializar Anthropic
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Modificar el último mensaje con contexto de datos
    const messagesWithContext = [...limitedMessages];
    if (contextData) {
      messagesWithContext[messagesWithContext.length - 1] = {
        ...messagesWithContext[messagesWithContext.length - 1],
        content: messagesWithContext[messagesWithContext.length - 1].content + contextData
      };
    }

    // Llamar a Claude Haiku SIN tools (approach más simple y confiable)
    const result = await streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      messages: messagesWithContext,
      system: `Eres un asistente IA para AgendaMedPro. Responde de forma CONCISA (máximo 3 párrafos).

REGLA CRÍTICA: Cuando veas información marcada como [DATOS DEL SISTEMA], SIEMPRE úsala como la única fuente de verdad. NUNCA inventes o asumas información diferente. Si los DATOS DEL SISTEMA dicen que hay citas, entonces HAY citas. Si dicen que NO hay citas, entonces NO hay.

Los datos del sistema son SIEMPRE correctos y tienen prioridad sobre cualquier otra información.

Responde en español mexicano natural y profesional.`,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
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
