import EditPatientClient from "@/components/patients/edit-patient-client";

// Función requerida para páginas dinámicas con output: export
export async function generateStaticParams() {
  try {
    // En build time, intentamos obtener los pacientes existentes
    const response = await fetch('/api/patients/');
    if (response.ok) {
      const patients = await response.json();
      if (Array.isArray(patients)) {
        return patients.map((patient: any) => ({
          id: patient.id?.toString() || '1',
        }));
      }
    }
  } catch (error) {
    console.warn('Could not fetch patients for static generation:', error);
  }
  
  // Fallback: generar algunos IDs comunes para desarrollo
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
    { id: '10' },
  ];
}

export default function EditPatientPage() {
  return <EditPatientClient />;
}
