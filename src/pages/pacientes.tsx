import React, { useEffect, useState } from 'react';
import ApiService from '../lib/api-service';

interface Patient {
  id: number;
  nombre: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  requiere_factura?: boolean;
  fotos?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

const PacientesPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/patients')
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch(() => setError('Error al cargar pacientes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-green-700">Pacientes</h1>
      {loading && <div>Cargando pacientes...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-green-700">{p.nombre}</h2>
            <div><b>Teléfono:</b> {p.telefono || '-'}</div>
            <div><b>Email:</b> {p.email || '-'}</div>
            <div><b>Fecha nacimiento:</b> {p.fecha_nacimiento || '-'}</div>
            <div><b>Dirección:</b> {p.direccion || '-'}</div>
            <div><b>Factura:</b> {p.requiere_factura ? 'Sí' : 'No'}</div>
            <div><b>Creado:</b> {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</div>
            <div><b>Actualizado:</b> {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PacientesPage;
