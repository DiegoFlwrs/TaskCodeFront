// Application module types

export interface App {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  color: string; // hex or tailwind color key
  createdAt: string;
}

export interface AppFormData {
  nombre: string;
  descripcion: string;
  url: string;
  color: string;
}

export const APP_COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#64748B', label: 'Gris' },
];
