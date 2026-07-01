"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Ticket as TicketIcon,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn, formatApiError } from "../../lib/utils";
import { useToastManager } from "../ui/toast-manager";
import { useTickets } from "../../hooks/useTickets";
import { useUser } from "../../hooks/useAuth";
import apiClient from "../../lib/api";
import {
  Ticket,
  TicketFormData,
  TicketPriority,
  TicketStatus,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  ALARM_CONFIG,
  getAlarmLevel,
  AlarmLevel,
} from "../../lib/ticket-types";
import { ExtendModal } from "./modals/ExtendModal";
import { ReviewExtensionModal } from "./modals/ReviewExtensionModal";
import { AssignedMembersAvatars } from "./AssignedMembersAvatars";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketUrgentAlert } from "./TicketUrgentAlert";

// ---- Schema ----
function createTicketSchema(existingTickets: Ticket[], editingId?: string) {
  return z
    .object({
      teamId: z.string().optional(),
      codigo: z.string().min(1, "Requerido"),
      nombre: z.string().min(1, "Requerido"),
      descripcion: z.string(),
      asignadoPor: z.string(),
      fechaInicio: z.string().optional(),
      fechaFin: z.string().optional(),
      priority: z.enum(["alta", "media", "baja"]),
      status: z.enum(["activo", "completado", "cancelado"]).optional(),
      assignedMemberIds: z.array(z.string()).optional(),
    })
    .superRefine((data, ctx) => {
      const nombre = data.nombre.trim().toLowerCase();
      const teamId = data.teamId || undefined;

      const duplicate = existingTickets.some((t) => {
        if (editingId && t.id === editingId) return false;
        if (teamId) return t.teamId === teamId && t.nombre.trim().toLowerCase() === nombre;
        return !t.teamId && t.nombre.trim().toLowerCase() === nombre;
      });

      if (duplicate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ya existe un ticket con este nombre",
          path: ["nombre"],
        });
      }
    });
}

type FormData = z.infer<ReturnType<typeof createTicketSchema>>;

interface TeamMemberOption {
  id: string;
  nombre: string;
  email: string;
  status: string;
}

interface TeamOption {
  id: string;
  nombre: string;
  members?: TeamMemberOption[];
}

// ---- Ticket Form Modal ----
function TicketModal({
  open,
  onClose,
  onSave,
  ticket,
  teams,
  isTeamLeader,
  existingTickets,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TicketFormData) => Promise<void>;
  ticket?: Ticket | null;
  teams: TeamOption[];
  isTeamLeader: boolean;
  existingTickets: Ticket[];
}) {
  const isEditing = Boolean(ticket);
  const [isLoading, setIsLoading] = useState(false);
  const ticketSchema = useMemo(
    () => createTicketSchema(existingTickets, ticket?.id),
    [existingTickets, ticket?.id],
  );
  const form = useForm<FormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: ticket ?? {
      teamId: "",
      codigo: "",
      nombre: "",
      descripcion: "",
      asignadoPor: "",
      fechaInicio: "",
      fechaFin: "",
      priority: "media",
      status: "activo",
      assignedMemberIds: [],
    },
  });

  const selectedTeamId = form.watch("teamId");
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const activeMembers =
    selectedTeam?.members?.filter((m) => m.status === "activo") ?? [];
  const assignedMemberIds = form.watch("assignedMemberIds") ?? [];

  useEffect(() => {
    setIsLoading(false);
    form.reset(
      ticket
        ? {
            teamId: ticket.teamId ?? "",
            codigo: ticket.codigo ?? "",
            nombre: ticket.nombre ?? "",
            descripcion: ticket.descripcion ?? "",
            asignadoPor: ticket.asignadoPor ?? "",
            fechaInicio: ticket.fechaInicio ?? "",
            fechaFin: ticket.fechaFin ?? "",
            priority: ticket.priority,
            status: ticket.status,
            assignedMemberIds:
              ticket.assignedMembers?.map((m) => m.id) ?? [],
          }
        : {
            teamId: teams.length > 0 ? teams[0].id : "",
            codigo: "",
            nombre: "",
            descripcion: "",
            asignadoPor: "",
            fechaInicio: "",
            fechaFin: "",
            priority: "media",
            status: "activo",
            assignedMemberIds: [],
          },
    );
  }, [ticket, open, form, teams]);

  const toggleMember = (memberId: string) => {
    const current = form.getValues("assignedMemberIds") ?? [];
    const next = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    form.setValue("assignedMemberIds", next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card rounded-xl border shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold">
                {isEditing ? "Editar ticket" : "Nuevo ticket / RQ"}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Registra un requerimiento con fechas y prioridad
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={form.handleSubmit(async (d) => {
              setIsLoading(true);
              try {
                const payload = isEditing
                  ? d
                  : { ...d, status: "activo" as const };
                await onSave(payload as TicketFormData);
                onClose();
              } catch {
              } finally {
                setIsLoading(false);
              }
            })}
            className="space-y-4"
          >
            {teams.length > 0 && (
              <div className="space-y-1.5">
                <Label>Equipo</Label>
                <select
                  {...form.register("teamId", {
                    onChange: () => form.setValue("assignedMemberIds", []),
                  })}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isTeamLeader && teams.length > 0 && (
              <div className="space-y-1.5">
                <Label>Asignar a miembros del equipo</Label>
                {activeMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No hay miembros activos en este equipo
                  </p>
                ) : (
                  <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
                    {activeMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={assignedMemberIds.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="rounded border-input accent-primary"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input
                  placeholder="RQ-001"
                  {...form.register("codigo")}
                  error={form.formState.errors.codigo?.message}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <select
                  {...form.register("priority")}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(
                    Object.entries(TICKET_PRIORITY_LABELS) as [
                      TicketPriority,
                      string,
                    ][]
                  ).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre del requerimiento *</Label>
              <Input
                placeholder="Descripción breve del ticket"
                {...form.register("nombre")}
                error={form.formState.errors.nombre?.message}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Asignado por</Label>
              <Input
                placeholder="Nombre de quien asignó el RQ"
                {...form.register("asignadoPor")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                rows={3}
                placeholder="Detalle adicional..."
                {...form.register("descripcion")}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Fechas — solo al crear */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Fecha inicio *</Label>
                  <Input
                    type="date"
                    {...form.register("fechaInicio")}
                    error={form.formState.errors.fechaInicio?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha fin *</Label>
                  <Input
                    type="date"
                    {...form.register("fechaFin")}
                    error={form.formState.errors.fechaFin?.message}
                  />
                </div>
              </div>
            )}

            {/* {isEditing && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <select {...form.register('status')} className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {(Object.entries(TICKET_STATUS_LABELS) as [TicketStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            )} */}

            <div className="flex gap-3 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                {isEditing ? "Guardar cambios" : "Crear ticket"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---- Days remaining chip ----
function DaysChip({
  fechaFin,
  status,
}: {
  fechaFin: string;
  status: TicketStatus;
}) {
  const level = getAlarmLevel(fechaFin, status);
  if (status !== "activo") return null;
  const cfg = ALARM_CONFIG[level];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(fechaFin + "T00:00:00");
  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const text =
    diff < 0
      ? `${Math.abs(diff)}d vencido`
      : diff === 0
        ? "Hoy"
        : `${diff}d restantes`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.icon} {text}
    </span>
  );
}

// ---- Filter options ----
type FilterStatus = "todos" | TicketStatus;

// ---- Main view ----
export function TicketsView() {
  const { tickets, addTicket, updateTicket, deleteTicket, updateTicketStatus, requestExtension, reviewExtension } =
    useTickets();
  const { toast } = useToastManager();
  const { isTeamLeader } = useUser();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos");
  const [search, setSearch] = useState("");
  const [completeConfirmTicket, setCompleteConfirmTicket] =
    useState<Ticket | null>(null);

  const [extendTicket, setExtendTicket] = useState<Ticket | null>(null);
  const [reviewExtensionTicket, setReviewExtensionTicket] = useState<Ticket | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    apiClient
      .request<TeamOption[]>("/api/teams")
      .then(setTeams)
      .catch(() => {});
  }, []);

  // Alert counts
  const alertCount = tickets.filter((t) => {
    const l = getAlarmLevel(t.fechaFin, t.status);
    return l === "vencido" || l === "critico" || l === "urgente";
  }).length;

  useEffect(() => {
    setAlertDismissed(false);
  }, [alertCount]);

  const filtered = tickets.filter((t) => {
    const matchStatus = filterStatus === "todos" || t.status === filterStatus;
    const matchSearch =
      !search ||
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.codigo.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSave = async (data: TicketFormData) => {
    try {
      if (editingTicket) {
        await updateTicket(editingTicket.id, data);
        toast.success("Ticket actualizado", data.codigo);
      } else {
        await addTicket(data);
        toast.success("Ticket creado", data.codigo);
      }
    } catch (err) {
      toast.error("Error", formatApiError(err));
      throw err;
    }
  };

  const handleDelete = async (id: string, codigo: string) => {
    try {
      await deleteTicket(id);
      toast.success("Ticket eliminado", codigo);
    } catch {
      toast.error("Error", "No se pudo eliminar el ticket");
    }
  };

  const handleComplete = async (ticket: Ticket) => {
    try {
      await updateTicketStatus(ticket.id, { ...ticket, status: "completado" });
      toast.success("Ticket completado", ticket.codigo);
    } catch {
      toast.error("Error", "No se pudo completar el ticket");
    }
  };

  const handleExtend = async (
    ticket: Ticket,
    fechaFin: string,
    motivo: string,
  ) => {
    try {
      if (ticket.canRequestExtension) {
        await requestExtension(ticket.id, fechaFin, motivo);
        toast.success(
          "Solicitud enviada",
          "El líder de equipo debe aprobar la extensión",
        );
      } else {
        await updateTicketStatus(ticket.id, {
          ...ticket,
          motivo,
          fechaFin,
        });
        toast.success("Fecha extendida", `${ticket.codigo} → ${fechaFin}`);
      }
    } catch {
      toast.error("Error", "No se pudo procesar la extensión");
      throw new Error("extension failed");
    }
  };

  const handleReviewExtension = async (ticket: Ticket, approved: boolean) => {
    try {
      await reviewExtension(ticket.id, approved);
      toast.success(
        approved ? "Extensión aprobada" : "Extensión rechazada",
        ticket.codigo,
      );
    } catch {
      toast.error("Error", "No se pudo procesar la solicitud");
      throw new Error("review failed");
    }
  };

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: "Todos", value: "todos" },
    { label: "Activos", value: "activo" },
    { label: "Completados", value: "completado" },
    { label: "Cancelados", value: "cancelado" },
  ];

  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<{
    id: string;
    codigo: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tickets / RQ</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tus requerimientos y tickets de trabajo
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingTicket(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo ticket
        </Button>
      </div>

      {/* Stats row */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["vencido", "urgente", "proximo", "ok"] as AlarmLevel[]).map(
            (level) => {
              const count = tickets.filter(
                (t) => getAlarmLevel(t.fechaFin, t.status) === level,
              ).length;
              const cfg = ALARM_CONFIG[level];
              return (
                <Card key={level} className="border shadow-none">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-xl">{cfg.icon}</span>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {cfg.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {filterButtons.map((fb) => (
            <button
              key={fb.value}
              onClick={() => setFilterStatus(fb.value)}
              className={cn(
                "px-3 py-1 rounded-md text-sm transition-colors",
                filterStatus === fb.value
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {fb.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets table */}
      {filtered.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="py-14 text-center text-muted-foreground">
            <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {tickets.length === 0
                ? "Sin tickets registrados"
                : "Sin resultados"}
            </p>
            {tickets.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4" /> Crear primer ticket
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card id="tickets-table" className="border shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {(() => {
                const showTeam = filtered.some((t) => t.teamNombre);
                const showAssigned = filtered.some(
                  (t) => (t.assignedMembers?.length ?? 0) > 0,
                );
                const headers = [
                  "Código",
                  "Nombre",
                  ...(showTeam ? ["Equipo"] : []),
                  "Asignado por",
                  ...(showAssigned ? ["Asignados a"] : []),
                  "Prioridad",
                  "Estado",
                  "Inicio",
                  "Fin",
                  "Tiempo",
                  "",
                ];
                return (
                  <>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {headers.map((h) => (
                          <th
                            key={h}
                            className={cn(
                              "text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                              (h === "Tiempo" || h === "") && "w-px",
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((ticket) => {
                        return (
                          <tr
                            key={ticket.id}
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-semibold">
                                {ticket.codigo}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-medium">
                                  {ticket.nombre}
                                </span>
                                {ticket.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                                    {ticket.descripcion}
                                  </p>
                                )}
                              </div>
                            </td>
                            {showTeam && (
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {ticket.teamNombre || "—"}
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {ticket.asignadoPor || "—"}
                            </td>
                            {showAssigned && (
                              <td className="px-4 py-3">
                                <AssignedMembersAvatars
                                  members={ticket.assignedMembers ?? []}
                                />
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                  TICKET_PRIORITY_COLORS[ticket.priority],
                                )}
                              >
                                {TICKET_PRIORITY_LABELS[ticket.priority]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <TicketStatusBadge ticket={ticket} />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                              {ticket.fechaInicio}
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              {ticket.fechaFin}
                            </td>
                            <td className="px-4 py-3 w-px whitespace-nowrap">
                              <DaysChip
                                fechaFin={ticket.fechaFin}
                                status={ticket.status}
                              />
                            </td>
                            <td className="px-4 py-3 w-px whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {ticket.status !== "completado" &&
                                  ticket.status !== "cancelado" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                        title="Completar ticket"
                                        onClick={() =>
                                          setCompleteConfirmTicket(ticket)
                                        }
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      </Button>
                                      {ticket.canReviewExtension && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                                          title="Revisar solicitud de extensión"
                                          onClick={() =>
                                            setReviewExtensionTicket(ticket)
                                          }
                                        >
                                          <ClipboardCheck className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      {ticket.canExtendDirectly &&
                                        !ticket.canReviewExtension && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                                          title="Extender fecha"
                                          onClick={() => setExtendTicket(ticket)}
                                        >
                                          <CalendarClock className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      {ticket.canRequestExtension && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                                          title="Solicitar extensión"
                                          onClick={() => setExtendTicket(ticket)}
                                        >
                                          <CalendarClock className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      {ticket.canEdit && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                          onClick={() => {
                                            setEditingTicket(ticket);
                                            setModalOpen(true);
                                          }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      {ticket.canDelete && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                          onClick={() =>
                                            setDeleteConfirmTicket({
                                              id: ticket.id,
                                              codigo: ticket.codigo,
                                            })
                                          }
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </>
                );
              })()}
            </table>
          </div>
        </Card>
      )}

      <TicketModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTicket(null);
        }}
        onSave={handleSave}
        ticket={editingTicket}
        teams={teams}
        isTeamLeader={isTeamLeader}
        existingTickets={tickets}
      />

      {/* Complete confirm dialog */}
      <Dialog.Root
        open={Boolean(completeConfirmTicket)}
        onOpenChange={(v) => {
          if (!v) setCompleteConfirmTicket(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <Dialog.Title className="text-base font-semibold">
              ¿Completar este ticket?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              El ticket será marcado como completado.
              {completeConfirmTicket && (
                <span className="block mt-2 font-medium text-foreground">
                  {completeConfirmTicket.codigo} —{" "}
                  {completeConfirmTicket.nombre}
                </span>
              )}
            </Dialog.Description>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCompleteConfirmTicket(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (completeConfirmTicket) {
                    handleComplete(completeConfirmTicket);
                    setCompleteConfirmTicket(null);
                  }
                }}
              >
                Sí, completar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Extend dialog */}
      <ExtendModal
        ticket={extendTicket}
        mode={extendTicket?.canRequestExtension ? "request" : "direct"}
        onClose={() => setExtendTicket(null)}
        onSubmit={handleExtend}
      />

      <ReviewExtensionModal
        ticket={reviewExtensionTicket}
        onClose={() => setReviewExtensionTicket(null)}
        onReview={handleReviewExtension}
      />

      {/* Delete confirm dialog */}
      <Dialog.Root
        open={Boolean(deleteConfirmTicket)}
        onOpenChange={(v) => {
          if (!v) setDeleteConfirmTicket(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <Dialog.Title className="text-base font-semibold">
              ¿Eliminar este ticket?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              Esta acción no se puede deshacer.
              {deleteConfirmTicket && (
                <span className="block mt-2 font-medium text-foreground">
                  {deleteConfirmTicket.codigo}
                </span>
              )}
            </Dialog.Description>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmTicket(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmTicket) {
                    handleDelete(
                      deleteConfirmTicket.id,
                      deleteConfirmTicket.codigo,
                    );
                    setDeleteConfirmTicket(null);
                  }
                }}
              >
                Sí, eliminar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <TicketUrgentAlert
        count={alertCount}
        dismissed={alertDismissed}
        onDismiss={() => setAlertDismissed(true)}
        action={{
          label: "Ver en la tabla",
          onClick: () =>
            document
              .getElementById("tickets-table")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        }}
      />
    </div>
  );
}
