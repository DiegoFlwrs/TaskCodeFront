"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Combobox } from "../ui/combobox";
import { useTickets } from "../../hooks/useTickets";
import { useApps } from "../../hooks/useApps";
import {
  Task,
  TaskFormData,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "../../lib/task-types";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  rqTicket: z.string(),
  aplicacion: z.string(),
  observacion: z.string(),
  urlEscenario: z.string(),
  status: z.enum([
    "pendiente",
    "en-progreso",
    "completada",
    "cancelada",
    "consultar",
  ]),
  priority: z.enum(["baja", "media", "alta", "critica"]),
  horaInicio: z.string(),
  horaFin: z.string(),
  tiempoInvertido: z.string(),
});

type FormData = z.infer<typeof schema>;

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  task?: Task | null;
  date: string;
}

export function TaskFormModal({
  open,
  onClose,
  onSave,
  task,
  date,
}: TaskFormModalProps) {
  const isEditing = Boolean(task);
  const [isLoading, setIsLoading] = useState(false);
  const { tickets } = useTickets();
  const { apps } = useApps();

  const ticketOptions = tickets
    .filter((t) => t.status === "activo")
    .map((t) => ({ value: t.codigo, label: t.codigo, description: t.nombre }));

  const appOptions = apps.map((a) => ({
    value: a.nombre,
    label: a.nombre,
    description: a.descripcion,
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      rqTicket: "",
      aplicacion: "",
      observacion: "",
      urlEscenario: "",
      status: "pendiente",
      priority: "media",
      horaInicio: "",
      horaFin: "",
      tiempoInvertido: "",
    },
  });

  useEffect(() => {
    setIsLoading(false);
    if (task) {
      form.reset({
        nombre: task.nombre ?? "",
        rqTicket: task.rqTicket ?? "",
        aplicacion: task.aplicacion ?? "",
        observacion: task.observacion ?? "",
        urlEscenario: task.urlEscenario ?? "",
        status: task.status,
        priority: task.priority,
        horaInicio: task.horaInicio ?? "",
        horaFin: task.horaFin ?? "",
        tiempoInvertido: task.tiempoInvertido ?? "",
      });
    } else {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      form.reset({
        nombre: "",
        rqTicket: "",
        aplicacion: "",
        observacion: "",
        urlEscenario: "",
        status: "pendiente",
        priority: "media",
        horaInicio: currentTime,
        horaFin: "",
        tiempoInvertido: "",
      });
    }
  }, [task, open, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload = isEditing
        ? {
            ...data,
            status: task!.status,
            horaInicio: task!.horaInicio,
            horaFin: task!.horaFin,
            tiempoInvertido: task!.tiempoInvertido,
          }
        : { ...data, status: "pendiente" as const };
      await onSave(payload as TaskFormData);
      onClose();
    } catch {
      // error toast shown by parent
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-xl border shadow-xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {isEditing ? "Editar tarea" : "Nueva tarea"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5 capitalize">
                {formattedDate}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre de tarea *</Label>
              <Input
                id="nombre"
                placeholder="Descripción de la tarea"
                {...form.register("nombre")}
                error={form.formState.errors.nombre?.message}
              />
            </div>

            {/* RQ / Ticket + Aplicación */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>RQ / Ticket</Label>
                <Controller
                  control={form.control}
                  name="rqTicket"
                  render={({ field }) => (
                    <Combobox
                      options={ticketOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        ticketOptions.length
                          ? "Seleccionar ticket..."
                          : "Sin tickets registrados"
                      }
                      searchPlaceholder="Buscar ticket..."
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aplicación</Label>
                <Controller
                  control={form.control}
                  name="aplicacion"
                  render={({ field }) => (
                    <Combobox
                      options={appOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        appOptions.length
                          ? "Seleccionar app..."
                          : "Sin apps registradas"
                      }
                      searchPlaceholder="Buscar aplicación..."
                    />
                  )}
                />
              </div>
            </div>

            {/* Status + Prioridad */}
            <div className="grid grid-cols-2 gap-4">
              {/* {isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="status">Estado</Label>
                  <select
                    id="status"
                    {...form.register("status")}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {(
                      Object.entries(TASK_STATUS_LABELS) as [
                        TaskStatus,
                        string,
                      ][]
                    ).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )} */}

              <div className="space-y-1.5">
                <Label htmlFor="priority">Prioridad</Label>
                <select
                  id="priority"
                  {...form.register("priority")}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(
                    Object.entries(TASK_PRIORITY_LABELS) as [
                      TaskPriority,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horario */}
            <div
              className={`grid gap-4 ${isEditing ? "grid-cols-3" : "grid-cols-1"}`}
            >
              {/* Horario — solo al crear */}
              {!isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="horaInicio">Hora inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    {...form.register("horaInicio")}
                  />
                </div>
              )}
              {/* {isEditing && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="horaFin">Hora fin</Label>
                    <Input
                      id="horaFin"
                      type="time"
                      {...form.register("horaFin")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tiempoInvertido">Tiempo invertido</Label>
                    <Input
                      id="tiempoInvertido"
                      placeholder="2h 30m"
                      {...form.register("tiempoInvertido")}
                    />
                  </div>
                </>
              )} */}
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="urlEscenario">URL del escenario</Label>
              <Input
                id="urlEscenario"
                type="url"
                placeholder="https://..."
                {...form.register("urlEscenario")}
              />
            </div>

            {/* Observación */}
            <div className="space-y-1.5">
              <Label htmlFor="observacion">Observación</Label>
              <textarea
                id="observacion"
                rows={3}
                placeholder="Notas adicionales..."
                {...form.register("observacion")}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 pt-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                {isEditing ? "Guardar cambios" : "Agregar tarea"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
