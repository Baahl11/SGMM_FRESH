// Types for Patient Tags System

export interface PatientTag {
  id: string
  name: string
  color: string
  icon?: string
  description?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface PatientTagAssignment {
  id: string
  patient_id: string
  tag_id: string
  assigned_at: string
  assigned_by?: string
  tag?: PatientTag // Populated in joins
}

export interface PatientWithTags {
  id: string
  name: string
  tags: PatientTag[]
}

export interface CreateTagInput {
  name: string
  color: string
  icon?: string
  description?: string
}

export interface UpdateTagInput {
  name?: string
  color?: string
  icon?: string
  description?: string
}
