"use client";

import { useParams } from 'next/navigation';
import PatientDetailsClient from '@/components/patients/patient-details-client';

export default function PatientPage() {
  const params = useParams();
  const patientId = params.id as string;

  return <PatientDetailsClient patientId={patientId} />;
}