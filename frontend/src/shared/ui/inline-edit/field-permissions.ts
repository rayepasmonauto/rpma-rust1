import type { UserRole } from '@/lib/backend';

export const TECHNICIAN_EDITABLE_FIELDS = [
  'status',
  'notes',
  'checklist_completed',
  'lot_film',
  'actual_duration',
] as const;

export type EditableFieldName = typeof TECHNICIAN_EDITABLE_FIELDS[number] | string;

export function canEditField(userRole: UserRole | undefined, fieldName: string): boolean {
  if (!userRole) return false;
  
  if (userRole === 'admin' || userRole === 'supervisor') {
    return true;
  }
  
  if (userRole === 'technician') {
    return TECHNICIAN_EDITABLE_FIELDS.includes(fieldName as typeof TECHNICIAN_EDITABLE_FIELDS[number]);
  }
  
  return false;
}

export function getFieldRestrictionMessage(fieldName: string): string {
  return `Vous n'avez pas les droits pour modifier ce champ (${fieldName})`;
}

export const FIELD_LABELS: Record<string, string> = {
  status: 'Statut',
  notes: 'Notes',
  checklist_completed: 'Checklist',
  lot_film: 'Lot film',
  actual_duration: 'Durée réelle',
  vehicle_plate: 'Plaque',
  vehicle_make: 'Marque',
  vehicle_model: 'Modèle',
  vehicle_year: 'Année',
  vin: 'VIN',
  ppf_zones: 'Zones PPF',
  custom_ppf_zones: 'Zones PPF personnalisées',
  customer_name: 'Nom client',
  customer_email: 'Email client',
  customer_phone: 'Téléphone client',
  customer_address: 'Adresse client',
  scheduled_date: 'Date prévue',
  start_time: 'Heure de début',
  end_time: 'Heure de fin',
  priority: 'Priorité',
  technician_id: 'Technicien',
  description: 'Description',
};