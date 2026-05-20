'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import { Plus, ArrowLeft, X, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TaskTable } from './TaskTable';
import { TaskFormModal } from './TaskFormModal';
import { useTasks } from '../../hooks/useTasks';
import { Task, TaskFormData, TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../lib/task-types';
import { useToastManager } from '../ui/toast-manager';
import './calendar.css';

export function TasksView() {
  const { getTasksForDate, getDatesWithTasks, addTask, updateTask, deleteTask } = useTasks();
  const { toast } = useToastManager();

  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const date = searchParams.get('date');
    if (date) setSelectedDate(date);
  }, [searchParams]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  const datesWithTasks = getDatesWithTasks();
  const tasksForDay = selectedDate ? getTasksForDate(selectedDate) : [];

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setSelectedDate(arg.dateStr);
  }, []);

  const handleAddTask = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Tarea eliminada', 'La tarea fue eliminada correctamente');
    } catch {
      toast.error('Error', 'No se pudo eliminar la tarea');
    }
  };

  const handleSaveTask = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        toast.success('Tarea actualizada', 'Los cambios fueron guardados');
      } else if (selectedDate) {
        await addTask(selectedDate, data);
        toast.success('Tarea agregada', 'La tarea fue registrada correctamente');
      }
    } catch (err) {
      toast.error('Error', 'No se pudo guardar la tarea');
      throw err;
    }
  };

  const handleFinishTask = async (task: Task) => {
    const now = new Date();
    const horaFin = now.toTimeString().slice(0, 5);
    let tiempoInvertido = '';
    if (task.horaInicio) {
      const [startH, startM] = task.horaInicio.split(':').map(Number);
      const [endH, endM] = horaFin.split(':').map(Number);
      const diffMins = endH * 60 + endM - (startH * 60 + startM);
      if (diffMins > 0) {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        tiempoInvertido = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }
    try {
      await updateTask(task.id, { ...task, status: 'completada', horaFin, tiempoInvertido });
      toast.success('Tarea finalizada', `Marcada como completada a las ${horaFin}`);
    } catch {
      toast.error('Error', 'No se pudo finalizar la tarea');
    }
  };

  const handleConsultTask = async (task: Task, observacion: string) => {
    try {
      await updateTask(task.id, { ...task, status: 'consultar', consultaObservacion: observacion });
      toast.success('Marcada para consultar', task.nombre);
    } catch {
      toast.error('Error', 'No se pudo actualizar la tarea');
    }
  };

  const formattedSelectedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Build calendar events from tasks
  const calendarEvents = datesWithTasks.map((date) => {
    const count = getTasksForDate(date).length;
    return {
      id: date,
      title: `${count} tarea${count !== 1 ? 's' : ''}`,
      date,
      classNames: ['task-dot-event'],
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mis Tareas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selecciona un día para ver o registrar tus actividades
          </p>
        </div>

      </div>

      {/* Calendar */}
      {!selectedDate && (
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="es"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridYear',
              }}
              views={{
                dayGridYear: {
                  type: 'dayGrid',
                  duration: { years: 1 },
                  buttonText: 'Año',
                },
              }}
              dateClick={handleDateClick}
              events={calendarEvents}
              height="auto"
              dayMaxEvents={2}
              eventClassNames="cursor-pointer"
              dayCellClassNames="cursor-pointer hover:bg-muted/50 transition-colors"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Day view */}
      {selectedDate && (
        <Card className="border shadow-none">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                title="Volver al calendario"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <CardTitle className="text-base capitalize">{formattedSelectedDate}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tasksForDay.length} tarea{tasksForDay.length !== 1 ? 's' : ''} registrada{tasksForDay.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button onClick={handleAddTask} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </CardHeader>
          <CardContent>
            <TaskTable
              tasks={tasksForDay}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onFinish={handleFinishTask}
              onConsult={handleConsultTask}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty state when no date selected */}
      {!selectedDate && datesWithTasks.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Haz clic en cualquier día para comenzar</p>
        </div>
      )}

      {/* Task form modal */}
      {selectedDate && (
        <TaskFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveTask}
          task={editingTask}
          date={selectedDate}
        />
      )}
    </div>
  );
}
