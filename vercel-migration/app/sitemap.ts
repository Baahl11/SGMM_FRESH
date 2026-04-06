import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://agendamedpro.com';
  const currentDate = new Date();

  // Páginas principales (alta prioridad)
  const mainPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/pricing`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/acerca-de`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/testimonios`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/casos-exito`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/documentacion`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/guias`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/soporte`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  // Páginas legales (baja prioridad pero necesarias)
  const legalPages = [
    { url: `${baseUrl}/privacidad`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/terminos`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/cookies`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/aviso-legal`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/datos-mexico`, priority: 0.4, changeFrequency: 'yearly' as const },
  ];

  // Páginas de features/producto
  const featurePages = [
    { url: `${baseUrl}/promociones`, priority: 0.6, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/estado-sistema`, priority: 0.5, changeFrequency: 'daily' as const },
  ];

  // Auth pages (baja prioridad, pero indexables)
  const authPages = [
    { url: `${baseUrl}/auth/signin`, priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  const allPages = [...mainPages, ...legalPages, ...featurePages, ...authPages];

  return allPages.map((page) => ({
    url: page.url,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
