"use client";

import { useParams } from 'next/navigation';
import PatientEditClient from '@/components/patients/patient-edit-client';

export default function EditPatientPage() {
  const params = useParams();
  const patientId = params.id as string;

  return <PatientEditClient patientId={patientId} />;
}