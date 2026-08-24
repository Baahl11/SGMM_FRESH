import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AgendaMedPro - Software de Gestión Médica';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
          }}
        />
        
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            marginBottom: '40px',
            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.5)',
          }}
        >
          <svg
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        
        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            letterSpacing: '-2px',
          }}
        >
          AgendaMedPro
        </div>
        
        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '32px',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          Reduce inasistencias, organiza tu clínica y aumenta tus ingresos
        </div>
        
        {/* Features */}
        <div
          style={{
            display: 'flex',
            marginTop: '50px',
            gap: '30px',
          }}
        >
          {['Agenda', 'Expedientes', 'Facturación', 'WhatsApp'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                borderRadius: '50px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '20px',
              }}
            >
              {feature}
            </div>
          ))}
        </div>
        
        {/* CTA */}
        <div
          style={{
            display: 'flex',
            marginTop: '50px',
            padding: '16px 40px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontSize: '24px',
            fontWeight: '600',
          }}
        >
          Prueba Gratis 14 Días
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
