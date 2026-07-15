"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import { Plus, ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TaskTable } from "./TaskTable";
import { TaskFormModal } from "./TaskFormModal";
import { usePaginatedTasks, useTaskDates, useTaskMutations } from "../../hooks/useTasks";
import { Task, TaskFormData } from "../../lib/task-types";
import { useToastManager } from "../ui/toast-manager";
import { DEFAULT_PAGE_SIZE } from "../../lib/pagination";
import { getHolidayName, isHoliday, toDateStr } from "../../lib/feriados";
import "./calendar.css";

export function TasksView() {
  const { toast } = useToastManager();
  const { summaries, refetchDates } = useTaskDates();

  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const date = searchParams.get("date");
    if (!date) return;
    if (isHoliday(date)) {
      toast.error("Día no laborable", `No se pueden asignar tareas en feriado (${getHolidayName(date)})`);
      return;
    }
    setSelectedDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reaccionar al query param
  }, [searchParams]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  const { data: tasksPage, loading, refetch: refetchTasks } = usePaginatedTasks({
    fecha: selectedDate ?? undefined,
    page,
    size,
  });

  const refreshAll = useCallback(() => {
    refetchDates();
    refetchTasks();
  }, [refetchDates, refetchTasks]);

  const { addTask, updateTask, deleteTask } = useTaskMutations(refreshAll);

  useEffect(() => {
    setPage(0);
  }, [selectedDate, size]);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    if (isHoliday(arg.dateStr)) {
      toast.error(
        "Día feriado",
        `${getHolidayName(arg.dateStr) ?? "Feriado"} — no laborable, no se pueden asignar tareas`,
      );
      return;
    }
    setSelectedDate(arg.dateStr);
  }, [toast]);

  const handleAddTask = () => {
    if (selectedDate && isHoliday(selectedDate)) {
      toast.error("Día feriado", "No se pueden asignar tareas en un día no laborable");
      return;
    }
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
      toast.success("Tarea eliminada", "La tarea fue eliminada correctamente");
    } catch {
      toast.error("Error", "No se pudo eliminar la tarea");
    }
  };

  const handleSaveTask = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        toast.success("Tarea actualizada", "Los cambios fueron guardados");
      } else if (selectedDate) {
        if (isHoliday(selectedDate)) {
          toast.error("Día feriado", "No se pueden asignar tareas en un día no laborable");
          throw new Error("holiday");
        }
        await addTask(selectedDate, data);
        toast.success("Tarea agregada", "La tarea fue registrada correctamente");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "holiday") throw err;
      toast.error("Error", "No se pudo guardar la tarea");
      throw new Error("save failed");
    }
  };

  const handleFinishTask = async (task: Task) => {
    const now = new Date();
    const horaFin = now.toTimeString().slice(0, 5);
    let tiempoInvertido = "";
    if (task.horaInicio) {
      const [startH, startM] = task.horaInicio.split(":").map(Number);
      const [endH, endM] = horaFin.split(":").map(Number);
      const diffMins = endH * 60 + endM - (startH * 60 + startM);
      if (diffMins > 0) {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        tiempoInvertido = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }
    try {
      await updateTask(task.id, {
        ...task,
        status: "completada",
        horaFin,
        tiempoInvertido,
      });
      toast.success("Tarea finalizada", `Marcada como completada a las ${horaFin}`);
    } catch {
      toast.error("Error", "No se pudo finalizar la tarea");
    }
  };

  const handleConsultTask = async (task: Task, observacion: string) => {
    try {
      await updateTask(task.id, {
        ...task,
        status: "consultar",
        consultaObservacion: observacion,
      });
      toast.success("Marcada para consultar", task.nombre);
    } catch {
      toast.error("Error", "No se pudo actualizar la tarea");
    }
  };

  const formattedSelectedDate = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const calendarEvents = summaries.map((summary) => ({
    id: summary.fecha,
    title: `${summary.count} tarea${summary.count !== 1 ? "s" : ""}`,
    date: summary.fecha,
    classNames: [
      "task-dot-event",
      summary.allCompleted ? "event-all-done" : "event-pending",
    ],
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">Mis Tareas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selecciona un día para ver o registrar tus actividades
          </p>
        </div>
        {!selectedDate && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-xs text-muted-foreground">Tiene tareas pendientes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span className="text-xs text-muted-foreground">Todas completadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-200 border border-rose-300" />
              <span className="text-xs text-muted-foreground">Feriado (no laborable)</span>
            </div>
          </div>
        )}
      </div>

      {!selectedDate && (
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="es"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridYear",
              }}
              views={{
                dayGridYear: {
                  type: "dayGrid",
                  duration: { years: 1 },
                  buttonText: "Año",
                },
              }}
              dateClick={handleDateClick}
              events={calendarEvents}
              height="auto"
              dayMaxEvents={2}
              eventClassNames="cursor-pointer"
              dayCellClassNames={(arg) => {
                const dateStr = toDateStr(arg.date);
                if (isHoliday(dateStr)) {
                  return ["fc-day-holiday"];
                }
                return ["cursor-pointer", "hover:bg-muted/50", "transition-colors"];
              }}
              dayCellContent={(arg) => {
                const dateStr = toDateStr(arg.date);
                const holiday = getHolidayName(dateStr);
                return (
                  <div className="fc-daygrid-day-top flex flex-col items-end gap-0.5 w-full px-1">
                    <span className="fc-daygrid-day-number">{arg.date.getDate()}</span>
                    {holiday && (
                      <span className="fc-holiday-label" title={holiday}>
                        Feriado
                      </span>
                    )}
                  </div>
                );
              }}
              buttonIcons={false}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                prev: "‹",
                next: "›",
              }}
            />
          </CardContent>
        </Card>
      )}

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
                  {tasksPage.totalElements} tarea
                  {tasksPage.totalElements !== 1 ? "s" : ""} registrada
                  {tasksPage.totalElements !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button onClick={handleAddTask} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <TaskTable
              tasks={tasksPage.content}
              loading={loading}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onFinish={handleFinishTask}
              onConsult={handleConsultTask}
              page={tasksPage.page}
              size={tasksPage.size}
              totalElements={tasksPage.totalElements}
              totalPages={tasksPage.totalPages}
              onPageChange={setPage}
              onSizeChange={setSize}
            />
          </CardContent>
        </Card>
      )}

      {!selectedDate && summaries.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Haz clic en cualquier día para comenzar</p>
        </div>
      )}

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
