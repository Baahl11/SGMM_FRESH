"use client";

import { Suspense } from "react";

function LoginSimpleClient() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#1d4ed8',
          marginBottom: '1rem'
        }}>
          SGMM Pro
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Sistema de Gestión Médica
        </p>
        
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          border: '1px solid #16a34a',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#16a34a', margin: 0, textAlign: 'center' }}>
            ✅ Login funcionando en modo demo
          </p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1d4ed8',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          Ir al Dashboard
        </button>
        
        <p style={{
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: 0
        }}>
          Usuario: demo@sgmm.pro
        </p>
      </div>
    </div>
  );
}

export default function LoginSimple() {
  return (
    <Suspense fallback={<div style={{padding: '20px'}}>Cargando login...</div>}>
      <LoginSimpleClient />
    </Suspense>
  );
}
