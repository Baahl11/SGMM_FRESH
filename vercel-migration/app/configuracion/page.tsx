'use client';

import React, { useState } from 'react';
import { Settings, Calendar, Bell, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BufferTimeSettings from '@/components/settings/buffer-time-settings';
import GoogleCalendarSettings from '@/components/settings/google-calendar-settings';
import RecurringAppointmentsGuide from '@/components/appointments/recurring-guide';
import { WaitlistSettingsComponent } from '@/components/settings/waitlist-settings';
import { WaitlistGuide } from '@/components/waitlist/waitlist-guide';
import { useWaitlist } from '@/hooks/use-waitlist';
import { SmsRemindersGuide } from '@/components/sms/sms-reminders-guide';
import { MobileDragDropSettings } from '@/components/settings/mobile-drag-drop-settings';
import { MobileDragDropGuide } from '@/components/mobile/mobile-drag-drop-guide';
import { BookingLockSettings } from '@/components/settings/booking-lock-settings';
import { BookingLockGuide } from '@/components/booking/booking-lock-guide';
import {
  loadMobileDragConfig,
  saveMobileDragConfig,
  MobileDragConfig,
} from '@/lib/utils/mobile-drag-drop';
import {
  loadBookingLockConfig,
  saveBookingLockConfig,
  BookingLockConfig,
} from '@/lib/utils/booking-lock';
import { GuideToggle } from '@/components/settings/guide-toggle';

const essentialHighlights = [
  {
    title: 'Agenda sin huecos',
    description: 'Activa el buffer y sincroniza Google Calendar para evitar choques.',
    icon: Calendar,
  },
  {
    title: 'Recordatorios automáticos',
    description: 'Envía SMS de confirmación y seguimiento sin trabajo manual.',
    icon: Bell,
  },
  {
    title: 'Lista de espera inteligente',
    description: 'Recicla cancelaciones y asigna espacios vacíos en minutos.',
    icon: Users,
  },
];

const upcomingItems = [
  {
    title: 'Roles y permisos',
    description: 'Define qué puede ver cada integrante del equipo. (En desarrollo)',
    icon: Users,
  },
  {
    title: 'Preferencias globales',
    description: 'Idioma, zona horaria y personalización visual. (Próximamente)',
    icon: Settings,
  },
];

export default function ConfiguracionPage() {
  const { settings, updateSettings } = useWaitlist();
  const [mobileDragConfig, setMobileDragConfig] = useState<MobileDragConfig>(
    loadMobileDragConfig()
  );
  const [bookingLockConfig, setBookingLockConfig] = useState<BookingLockConfig>(
    loadBookingLockConfig()
  );

  const handleMobileDragConfigChange = (updates: Partial<MobileDragConfig>) => {
    const updated = { ...mobileDragConfig, ...updates };
    setMobileDragConfig(updated);
    saveMobileDragConfig(updates);
  };

  const handleBookingLockConfigChange = (updates: Partial<BookingLockConfig>) => {
    const updated = { ...bookingLockConfig, ...updates };
    setBookingLockConfig(updated);
    saveBookingLockConfig(updates);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 lg:py-12">
      <div className="mb-10 space-y-3">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Configuración
          </h1>
        </div>
        <p className="text-gray-600">
          Ajusta primero lo esencial y despliega las secciones avanzadas solo cuando las necesites.
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>¿Por dónde empiezo?</CardTitle>
            <CardDescription>
              Completa estos pasos esenciales en menos de 5 minutos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {essentialHighlights.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajustes esenciales</CardTitle>
            <CardDescription>
              Abre solo el ajuste que quieres configurar hoy. Todo está explicado con lenguaje sencillo.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Accordion type="multiple">
              <AccordionItem value="agenda-basics">
                <AccordionTrigger className="px-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-blue-100 p-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-slate-900">
                        Agenda sin huecos
                      </p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Define descansos automáticos y sincroniza con Google Calendar.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                  <p className="text-sm text-muted-foreground">
                    Empieza activando el buffer entre citas y conecta tu Google Calendar para que nadie agende por error en un espacio ya ocupado.
                  </p>
                  <BufferTimeSettings />
                  <GoogleCalendarSettings />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sms-reminders">
                <AccordionTrigger className="px-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-emerald-100 p-2">
                      <Bell className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-slate-900">
                        Recordatorios automáticos
                      </p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Envía confirmaciones y recordatorios por SMS sin trabajo manual.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                  <p className="text-sm text-muted-foreground">
                    Configura el mensaje y los tiempos de envío. Puedes pausar los SMS en cualquier momento.
                  </p>
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          Ahora administras los recordatorios y las credenciales desde la pestaña <strong>Mensajería → SMS</strong>.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button asChild>
                            <Link href="/messaging?tab=sms">
                              Abrir configuración de SMS
                            </Link>
                          </Button>
                          <Button asChild variant="outline">
                            <Link href="/messaging?tab=reminders">
                              Ver recordatorios activos
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <GuideToggle label="¿Cómo funcionan los recordatorios por SMS?">
                        <SmsRemindersGuide />
                      </GuideToggle>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="waitlist">
                <AccordionTrigger className="px-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-orange-100 p-2">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-slate-900">
                        Lista de espera inteligente
                      </p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Llena huecos automáticamente con pacientes que esperan turno.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                  <p className="text-sm text-muted-foreground">
                    Define prioridades y avisos para que los espacios libres se asignen solos.
                  </p>
                  <WaitlistSettingsComponent
                    settings={settings}
                    onSettingsChange={updateSettings}
                  />
                  <GuideToggle label="Ver guía paso a paso de la lista de espera">
                    <WaitlistGuide />
                  </GuideToggle>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle>Funciones opcionales</CardTitle>
            </div>
            <CardDescription>
              Actívalas cuando quieras pulir la experiencia o automatizar todavía más.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Accordion type="multiple">
              <AccordionItem value="recurring-appointments">
                <AccordionTrigger className="px-6">
                  <div className="text-left">
                    <p className="text-base font-semibold text-slate-900">
                      Citas recurrentes
                    </p>
                    <p className="text-sm font-normal text-muted-foreground">
                      Programa sesiones periódicas sin recrear la cita cada vez.
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                  <GuideToggle label="Ver guía rápida de citas recurrentes">
                    <RecurringAppointmentsGuide />
                  </GuideToggle>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="mobile-drag-drop">
                <AccordionTrigger className="px-6">
                  <div className="text-left">
                    <p className="text-base font-semibold text-slate-900">
                      Arrastrar citas desde el celular
                    </p>
                    <p className="text-sm font-normal text-muted-foreground">
                      Ajusta la sensibilidad del drag & drop táctil para tu equipo.
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                  <MobileDragDropSettings
                    config={mobileDragConfig}
                    onConfigChange={handleMobileDragConfigChange}
                  />
                  <GuideToggle label="Guía completa de drag & drop móvil">
                    <MobileDragDropGuide />
                  </GuideToggle>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="booking-lock">
                <AccordionTrigger className="px-6">
                  <div className="text-left">
                    <p className="text-base font-semibold text-slate-900">
                      Prevenir doble agendado
                    </p>
                    <p className="text-sm font-normal text-muted-foreground">
                      Bloquea temporalmente un horario mientras alguien lo edita.
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                  <BookingLockSettings
                    config={bookingLockConfig}
                    onConfigChange={handleBookingLockConfigChange}
                  />
                  <GuideToggle label="Aprender a usar el bloqueo anti doble cita">
                    <BookingLockGuide />
                  </GuideToggle>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Lo que viene en camino</CardTitle>
            <CardDescription>
              Estamos simplificando estas áreas para que también sean fáciles de usar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {upcomingItems.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="flex h-full items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-muted-foreground"
              >
                <div className="rounded-full bg-slate-100 p-2">
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{title}</p>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
