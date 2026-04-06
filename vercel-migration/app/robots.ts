import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://agendamedpro.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/auth/callback',
          '/auth/signout',
          '/patients/',
          '/treatments/',
          '/inventory/',
          '/medical/',
          '/records/',
          '/messaging/',
          '/notifications/',
          '/reports/',
          '/bundles/',
          '/gastos-fijos/',
          '/profile/',
          '/agenda/',
          '/team/',
          '/book/',
          '/booking/',
          '/signup/',
          '/public/forms/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
