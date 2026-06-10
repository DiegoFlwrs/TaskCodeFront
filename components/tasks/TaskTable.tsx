"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Pencil,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Task,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from "../../lib/task-types";
import { cn } from "../../lib/utils";

const col = createColumnHelper<Task>();

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onFinish: (task: Task) => void;
  onConsult: (task: Task, observacion: string) => void;
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onFinish,
  onConsult,
}: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [finishConfirmTask, setFinishConfirmTask] = useState<Task | null>(null);
  const [consultTask, setConsultTask] = useState<Task | null>(null);
  const [consultObs, setConsultObs] = useState("");

  const columns = useMemo(
    () => [
      col.accessor("nombre", {
        header: ({ column }) => (
          <SortableHeader label="Tarea" column={column} />
        ),
        cell: (info) => (
          <span
            className="font-medium text-sm max-w-[200px] block truncate"
            title={info.getValue()}
          >
            {info.getValue()}
          </span>
        ),
      }),
      col.accessor("rqTicket", {
        header: "RQ / Ticket",
        cell: (info) => (
          <span className="text-sm text-muted-foreground font-mono">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      col.accessor("aplicacion", {
        header: "Aplicación",
        cell: (info) => (
          <span className="text-sm">{info.getValue() || "—"}</span>
        ),
      }),
      col.accessor("status", {
        header: ({ column }) => (
          <SortableHeader label="Estado" column={column} />
        ),
        cell: (info) => (
          <Badge
            label={TASK_STATUS_LABELS[info.getValue()]}
            className={TASK_STATUS_COLORS[info.getValue()]}
          />
        ),
      }),
      col.accessor("priority", {
        header: ({ column }) => (
          <SortableHeader label="Prioridad" column={column} />
        ),
        cell: (info) => (
          <Badge
            label={TASK_PRIORITY_LABELS[info.getValue()]}
            className={TASK_PRIORITY_COLORS[info.getValue()]}
          />
        ),
      }),
      col.accessor("horaInicio", {
        header: "Inicio",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      col.accessor("horaFin", {
        header: "Fin",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      col.accessor("tiempoInvertido", {
        header: "Tiempo",
        cell: (info) => (
          <span className="text-sm font-medium">{info.getValue() || "—"}</span>
        ),
      }),
      col.accessor("urlEscenario", {
        header: "URL",
        cell: (info) =>
          info.getValue() ? (
            <a
              href={info.getValue()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Ver
            </a>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      }),
      col.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.status !== "completada" &&
              // row.original.status !== "cancelada" && 
              (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                  title="Finalizar tarea"
                  onClick={() => setFinishConfirmTask(row.original)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              )}
            {row.original.status !== "completada" &&
              // row.original.status !== "cancelada" && 
              (
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    row.original.status === "consultar"
                      ? "h-7 w-7 text-purple-600 hover:text-purple-700"
                      : "h-7 w-7 text-muted-foreground hover:text-purple-600"
                  }
                  title={
                    row.original.status === "consultar"
                      ? "Ver consulta registrada"
                      : "Marcar para consultar"
                  }
                  onClick={() => {
                    setConsultTask(row.original);
                    setConsultObs(row.original.consultaObservacion ?? "");
                  }}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </Button>
              )}
            {row.original.status !== "completada" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(row.original)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(row.original.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ),
      }),
    ],
    [onEdit, onDelete, onFinish, onConsult],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Buscar tareas..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  No hay tareas registradas para este día
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tasks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {tasks.length} tareas
        </p>
      )}

      {/* Finish confirm dialog */}
      <Dialog.Root
        open={Boolean(finishConfirmTask)}
        onOpenChange={(v) => {
          if (!v) setFinishConfirmTask(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <Dialog.Title className="text-base font-semibold">
              ¿Finalizar esta tarea?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              Se registrará la hora actual como hora de fin y se calculará el
              tiempo invertido automáticamente.
              {finishConfirmTask && (
                <span className="block mt-2 font-medium text-foreground">
                  {finishConfirmTask.nombre}
                </span>
              )}
            </Dialog.Description>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setFinishConfirmTask(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (finishConfirmTask) {
                    onFinish(finishConfirmTask);
                    setFinishConfirmTask(null);
                  }
                }}
              >
                Sí, finalizar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Consult modal */}
      <Dialog.Root
        open={Boolean(consultTask)}
        onOpenChange={(v) => {
          if (!v) {
            setConsultTask(null);
            setConsultObs("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <Dialog.Title className="text-base font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-purple-600" />
              {consultTask?.status === "consultar"
                ? "Consulta registrada"
                : "¿Qué necesitas consultar?"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-1">
              {consultTask && (
                <span className="font-medium text-foreground">
                  {consultTask.nombre}
                </span>
              )}
            </Dialog.Description>
            {consultTask?.status === "consultar" ? (
              <div className="mt-4 w-full min-h-[7rem] px-3 py-2 rounded-md border bg-muted/40 text-sm whitespace-pre-wrap">
                {consultObs || (
                  <span className="text-muted-foreground italic">
                    Sin observación registrada
                  </span>
                )}
              </div>
            ) : (
              <textarea
                className="mt-4 w-full h-28 px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe qué necesitas consultar..."
                value={consultObs}
                onChange={(e) => setConsultObs(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setConsultTask(null);
                  setConsultObs("");
                }}
              >
                {consultTask?.status === "consultar" ? "Cerrar" : "Cancelar"}
              </Button>
              {consultTask?.status !== "consultar" && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    if (consultTask) {
                      onConsult(consultTask, consultObs);
                      setConsultTask(null);
                      setConsultObs("");
                    }
                  }}
                >
                  Guardar consulta
                </Button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: () => void;
  };
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={column.toggleSorting}
      className="flex items-center gap-1 group"
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40 group-hover:opacity-100" />
      )}
    </button>
  );
}
