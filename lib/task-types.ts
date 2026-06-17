// Task module types

export type TaskStatus = 'pendiente' | 'completada' | 'consultar';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';

export interface Task {
  id: string;
  nombre: string;
  rqTicket: string;
  solicitante: string;
  aplicacion: string;
  observacion: string;
  urlEscenario: string;
  status: TaskStatus;
  priority: TaskPriority;
  horaInicio: string;
  horaFin: string;
  tiempoInvertido: string; // calculado o manual
  consultaObservacion?: string; // nota al marcar como consultar
  fecha: string; // YYYY-MM-DD
  createdAt: string;
}

export interface TaskFormData {
  nombre: string;
  rqTicket: string;
  solicitante: string;
  aplicacion: string;
  observacion: string;
  urlEscenario: string;
  status: TaskStatus;
  priority: TaskPriority;
  horaInicio: string;
  horaFin: string;
  tiempoInvertido: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  // 'en-progreso': 'En Progreso',
  completada: 'Completada',
  // cancelada: 'Cancelada',
  consultar: 'Consultar',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pendiente: 'bg-amber-500 text-white',
  // 'en-progreso': 'bg-blue-600 text-white',
  completada: 'bg-emerald-600 text-white',
  // cancelada: 'bg-zinc-500 text-white',
  consultar: 'bg-purple-600 text-white',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  baja: 'bg-zinc-500 text-white',
  media: 'bg-amber-500 text-white',
  alta: 'bg-orange-500 text-white',
  critica: 'bg-red-600 text-white',
};
