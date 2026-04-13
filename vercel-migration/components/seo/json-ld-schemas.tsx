'use client';

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AgendaMedPro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'MXN',
      description: 'Prueba gratis por 7 días',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'AgendaMedPro',
      url: 'https://agendamedpro.com',
      logo: 'https://agendamedpro.com/icon.svg',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+52-222-340-4585',
        contactType: 'customer service',
        availableLanguage: ['Spanish'],
        areaServed: 'MX',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Puebla',
        addressCountry: 'MX',
      },
      sameAs: [
        'https://facebook.com/agendamedpro',
        'https://twitter.com/agendamedpro',
        'https://instagram.com/agendamedpro',
        'https://linkedin.com/company/agendamedpro',
      ],
    },
    description: 'Software de gestión para consultorios médicos en México. Agenda de citas, expedientes electrónicos, facturación CFDI y recordatorios por WhatsApp.',
    screenshot: 'https://agendamedpro.com/og-image.png',
    featureList: [
      'Agenda de citas inteligente',
      'Expediente clínico electrónico',
      'Facturación electrónica CFDI',
      'Recordatorios por WhatsApp',
      'Reservas online 24/7',
      'Gestión de inventario médico',
      'Reportes y analytics',
      'Multi-doctor y multi-sucursal',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function MedicalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'AgendaMedPro',
    description: 'Plataforma de software para gestión de consultorios médicos en México',
    url: 'https://agendamedpro.com',
    logo: 'https://agendamedpro.com/icon.svg',
    image: 'https://agendamedpro.com/og-image.png',
    telephone: '+52-222-340-4585',
    email: 'contacto@agendamedpro.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Puebla',
      addressRegion: 'Puebla',
      addressCountry: 'MX',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '19.0414',
      longitude: '-98.2063',
    },
    areaServed: {
      '@type': 'Country',
      name: 'México',
    },
    priceRange: '$$',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cuánto cuesta AgendaMedPro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AgendaMedPro ofrece una prueba gratuita de 7 días. Después, los planes comienzan desde $499 MXN al mes con todas las funcionalidades incluidas.',
        },
      },
      {
        '@type': 'Question',
        name: '¿AgendaMedPro funciona para clínicas con varios doctores?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, AgendaMedPro soporta múltiples doctores, consultorios y sucursales. Cada doctor tiene su propia agenda y puedes gestionar permisos por rol.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo enviar recordatorios por WhatsApp a mis pacientes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, AgendaMedPro incluye integración con WhatsApp Business API para enviar recordatorios automáticos de citas, confirmaciones y seguimientos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Los datos de mis pacientes están seguros?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutamente. Cumplimos con la Ley Federal de Protección de Datos Personales (LFPDPPP) y NOM-024. Todos los datos están encriptados y almacenados en servidores seguros.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
