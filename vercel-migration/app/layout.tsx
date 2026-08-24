import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { FloatingChatWidget } from "@/components/floating-chat-widget";
import { OrganizationSchema, MedicalBusinessSchema } from "@/components/seo/json-ld-schemas";
import { Toaster } from "@/components/ui/toaster";
import { UtmCapture } from "@/components/utm-capture";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agendamedpro.com'),
  title: {
    default: "AgendaMedPro — Más citas, menos inasistencias y más control para tu clínica",
    template: "%s | AgendaMedPro"
  },
  description: "Reduce inasistencias, organiza tu clínica y cobra mejor. Agenda de citas, recordatorios por WhatsApp, inventario automático y facturación en un solo sistema. Prueba gratis 14 días.",
  keywords: [
    "software médico México",
    "agenda médica",
    "sistema de citas médicas",
    "expediente clínico electrónico",
    "gestión de consultorio",
    "software para doctores",
    "agenda para clínicas",
    "recordatorios WhatsApp médicos",
    "facturación médica CFDI",
    "historial clínico digital",
    "citas médicas online",
    "administración de pacientes"
  ],
  authors: [{ name: "AgendaMedPro" }],
  creator: "AgendaMedPro",
  publisher: "AgendaMedPro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://agendamedpro.com',
    siteName: 'AgendaMedPro',
    title: 'AgendaMedPro — Más citas, menos inasistencias y más ingresos para tu clínica',
    description: 'Reduce inasistencias, organiza tu clínica y cobra mejor. Agenda, recordatorios por WhatsApp, inventario y facturación en un solo sistema. Prueba gratis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AgendaMedPro - Sistema de Gestión Médica',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgendaMedPro - Software para Consultorios Médicos',
    description: 'Gestiona tu consultorio médico: citas, pacientes, facturación y WhatsApp. Prueba gratis 14 días.',
    images: ['/og-image.png'],
    creator: '@agendamedpro',
  },
  alternates: {
    canonical: 'https://agendamedpro.com',
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgendaMedPro",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  verification: {
    google: 'tu-codigo-de-search-console', // Reemplazar después
  },
  category: 'medical software',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="privacy-policy" href="https://agendamedpro.com/privacidad" />
        <link rel="terms-of-service" href="https://agendamedpro.com/terminos" />
        <OrganizationSchema />
        <MedicalBusinessSchema />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <Suspense fallback={null}><UtmCapture /></Suspense>
          {children}
          <PWAInstallPrompt />
          <FloatingChatWidget />
          <Toaster />
        </AuthProvider>
        <Analytics />
        {/* Google Analytics 4 — activar con NEXT_PUBLIC_GA_MEASUREMENT_ID en .env */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        {/* Meta Pixel — activar con NEXT_PUBLIC_FB_PIXEL_ID en .env */}
        {FB_PIXEL_ID && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        {/* Links visibles para crawlers que no ejecutan JS */}
        <noscript>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <a href="/privacidad">Política de Privacidad</a> | 
            <a href="/terminos">Términos y Condiciones</a>
          </div>
        </noscript>
      </body>
    </html>
  );
}
