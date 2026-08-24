import type { NextConfig } from "next";
import path from "path";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  // Configuración Turbopack vacía para Next.js 16+
  turbopack: {},
  // Auditoría fable 2026-06-11 (B2): ignoreBuildErrors eliminado.
  // El build DEBE fallar si TypeScript falla; `npm run typecheck` es required check en CI.
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Ensure Next uses this folder as the workspace root in a multi-lockfile repo
  outputFileTracingRoot: path.join(__dirname),
  // Auditoría fable 2026-06-11 (C5): bloque env retirado. Las entradas de `env`
  // en next.config se inyectan en el bundle del cliente; NEXTAUTH_SECRET es
  // server-side y NextAuth lo lee de process.env directamente.
  // ACCIÓN OPERATIVA: rotar NEXTAUTH_SECRET (doc 16_RELEASE..., paso previo al deploy).
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  // Redirects
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/auth/signin',
        permanent: true,
      },
    ]
  },
};

// PWA configuration
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      // Auditoría fable 2026-06-11 (C6): antes NetworkFirst con caché de 24h sobre
      // TODO *.supabase.co (REST/Auth/Storage) — datos clínicos y fiscales quedaban
      // persistidos en el navegador y visibles tras cambiar de usuario.
      // Ahora NetworkOnly: el service worker no cachea nada de Supabase.
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
});

export default pwaConfig(nextConfig);
