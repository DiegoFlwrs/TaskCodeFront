'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Copy,
  ChevronDown,
  ChevronUp,
  Shield,
  User,
  X,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { validatePassword } from '../../lib/utils';
import { useToastManager } from '../ui/toast-manager';
import apiClient from '../../lib/api';
import { useUser } from '../../hooks/useAuth';
import { TeamStatsModal } from './TeamStatsModal';
import type { StatsMember } from './TeamStatsModal';

// ---- Types ----
type MemberRole = 'LEADER' | 'DEVELOPER' | 'QA' | 'DESIGNER' | 'DEVOPS';
type MemberStatus = 'activo' | 'inactivo';

interface TeamMember {
  id: string;
  nombre: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
}

interface Team {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  members: TeamMember[];
  createdAt: string;
}

interface SystemUser {
  id: string;
  nombre: string;
  email: string;
}

type AddMemberPayload =
  | { mode: 'new'; nombre: string; email: string; role: MemberRole; status: MemberStatus; passwordMode?: string; password?: string; confirmPassword?: string }
  | { mode: 'existing'; existingUserId: string; role: MemberRole; status: MemberStatus };

const ROLE_LABELS: Record<MemberRole, string> = {
  LEADER: 'Líder',
  DEVELOPER: 'Desarrollador',
  QA: 'QA',
  DESIGNER: 'Diseñador',
  DEVOPS: 'DevOps',
};

const ROLE_COLORS: Record<MemberRole, string> = {
  LEADER: 'bg-violet-600 text-white',
  DEVELOPER: 'bg-blue-600 text-white',
  QA: 'bg-amber-500 text-white',
  DESIGNER: 'bg-pink-500 text-white',
  DEVOPS: 'bg-emerald-600 text-white',
};

// ---- Schemas ----
const teamSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  descripcion: z.string(),
});

const memberSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['LEADER', 'DEVELOPER', 'QA', 'DESIGNER', 'DEVOPS']),
  status: z.enum(['activo', 'inactivo']),
  passwordMode: z.enum(['manual', 'auto']).optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.passwordMode === 'manual') {
    const result = validatePassword(data.password ?? '');
    if (!result.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La contraseña no cumple los requisitos', path: ['password'] });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] });
    }
  }
});

type TeamFormData = z.infer<typeof teamSchema>;
type MemberFormData = z.infer<typeof memberSchema>;

// ---- Member badge ----
function StatusDot({ status }: { status: MemberStatus }) {
  return (
    <span
      className={cn(
        'inline-block w-1.5 h-1.5 rounded-full',
        status === 'activo' ? 'bg-emerald-500' : 'bg-zinc-400'
      )}
    />
  );
}

// ---- Member Form Modal ----
function MemberModal({
  open,
  onClose,
  onSave,
  member,
  currentMembers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: AddMemberPayload) => Promise<void>;
  member?: TeamMember | null;
  currentMembers: TeamMember[];
}) {
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [pendingData, setPendingData] = useState<MemberFormData | null>(null);
  const [loading, setLoading] = useState(false);

  // Existing-user tab state
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [existingRole, setExistingRole] = useState<MemberRole>('DEVELOPER');
  const [existingStatus, setExistingStatus] = useState<MemberStatus>('activo');
  const [existingError, setExistingError] = useState('');

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member
      ? { ...member, passwordMode: undefined, password: '', confirmPassword: '' }
      : { nombre: '', email: '', role: 'DEVELOPER', status: 'activo', passwordMode: 'auto', password: '', confirmPassword: '' },
  });

  const passwordMode = form.watch('passwordMode');
  const passwordValue = form.watch('password') ?? '';
  const pwValidation = validatePassword(passwordValue);

  useEffect(() => {
    if (open) {
      form.reset(
        member
          ? { ...member, passwordMode: undefined, password: '', confirmPassword: '' }
          : { nombre: '', email: '', role: 'DEVELOPER', status: 'activo', passwordMode: 'auto', password: '', confirmPassword: '' }
      );
      setStep('form');
      setPendingData(null);
      setSelectedUserId('');
      setExistingRole('DEVELOPER');
      setExistingStatus('activo');
      setExistingError('');
      if (!member) {
        setTab('existing');
        setUsersLoading(true);
        apiClient.request<SystemUser[] | SystemUser>('/api/users')
          .then((data) => setSystemUsers(Array.isArray(data) ? data : [data]))
          .catch(() => setSystemUsers([]))
          .finally(() => setUsersLoading(false));
      }
    }
  }, [open, member]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableUsers = systemUsers.filter(
    (u) => !currentMembers.some((m) => m.id === u.id)
  );

  const handleClose = () => {
    if (loading) return;
    setStep('form');
    setPendingData(null);
    form.reset();
    onClose();
  };

  const handleAddExisting = async () => {
    if (!selectedUserId) { setExistingError('Selecciona un usuario'); return; }
    setExistingError('');
    setLoading(true);
    try {
      await onSave({ mode: 'existing', existingUserId: selectedUserId, role: existingRole, status: existingStatus });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNew = form.handleSubmit((data) => {
    if (!member) {
      setPendingData(data);
      setStep('confirm');
    } else {
      void (async () => {
        setLoading(true);
        try { await onSave({ mode: 'new', ...data }); handleClose(); }
        finally { setLoading(false); }
      })();
    }
  });

  const title = member
    ? 'Editar miembro'
    : step === 'confirm'
    ? 'Confirmar creación'
    : 'Agregar miembro';

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-xl border shadow-xl p-6 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-card/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">
                {tab === 'existing' ? 'Asociando usuario...' : 'Creando usuario...'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs — only when adding a new member */}
          {!member && step === 'form' && (
            <div className="flex rounded-lg border overflow-hidden mb-5 text-sm">
              {(['existing', 'new'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2 font-medium transition-colors',
                    tab === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t === 'existing' ? 'Usuario existente' : 'Nuevo usuario'}
                </button>
              ))}
            </div>
          )}

          {/* Confirm step */}
          {step === 'confirm' && pendingData ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Se creará el usuario{' '}
                <span className="font-medium text-foreground">{pendingData.nombre}</span> y se
                notificará al correo{' '}
                <span className="font-medium text-foreground">{pendingData.email}</span> con sus
                credenciales de acceso.
              </p>
              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="outline" disabled={loading} onClick={() => setStep('form')}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try { await onSave({ mode: 'new', ...pendingData }); handleClose(); }
                    finally { setLoading(false); }
                  }}
                >
                  Aceptar
                </Button>
              </div>
            </div>

          /* Tab: existing user */
          ) : !member && tab === 'existing' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Usuario</Label>
                {usersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando usuarios...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hay usuarios disponibles para agregar.
                  </p>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => { setSelectedUserId(e.target.value); setExistingError(''); }}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} — {u.email}</option>
                    ))}
                  </select>
                )}
                {existingError && <p className="text-xs text-destructive">{existingError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <select
                    value={existingRole}
                    onChange={(e) => setExistingRole(e.target.value as MemberRole)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {(Object.entries(ROLE_LABELS) as [MemberRole, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <select
                    value={existingStatus}
                    onChange={(e) => setExistingStatus(e.target.value as MemberStatus)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="button" disabled={!selectedUserId} onClick={handleAddExisting}>
                  Agregar
                </Button>
              </div>
            </div>

          /* Tab: new user / edit */
          ) : (
            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  placeholder="Nombre completo"
                  {...form.register('nombre')}
                  error={form.formState.errors.nombre?.message}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  disabled={!!member}
                  {...form.register('email')}
                  error={!member ? form.formState.errors.email?.message : undefined}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <select
                    {...form.register('role')}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {(Object.entries(ROLE_LABELS) as [MemberRole, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <select
                    {...form.register('status')}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              {!member && (
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <div className="flex flex-col gap-2.5 rounded-lg border p-3 bg-muted/30">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" value="auto" {...form.register('passwordMode')} className="accent-primary" />
                      <span className="text-sm">Generar automáticamente</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" value="manual" {...form.register('passwordMode')} className="accent-primary" />
                      <span className="text-sm">Especificar contraseña</span>
                    </label>
                  </div>
                  {passwordMode === 'manual' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Input
                          type="password"
                          placeholder="Contraseña"
                          {...form.register('password')}
                          error={form.formState.errors.password?.message}
                        />
                        {passwordValue && (
                          <div className="text-xs space-y-1 pt-0.5">
                            <div className={`h-1 w-full rounded ${pwValidation.isValid ? 'bg-emerald-500' : 'bg-red-300'}`} />
                            {!pwValidation.isValid && (
                              <ul className="text-red-500 space-y-0.5">
                                {pwValidation.errors.map((e, i) => <li key={i}>• {e}</li>)}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                      <Input
                        type="password"
                        placeholder="Confirmar contraseña"
                        {...form.register('confirmPassword')}
                        error={form.formState.errors.confirmPassword?.message}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="submit">{member ? 'Guardar' : 'Agregar'}</Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---- Team Form Modal ----
function TeamModal({
  open,
  onClose,
  onSave,
  team,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TeamFormData) => void;
  team?: Team | null;
}) {
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: team ?? { nombre: '', descripcion: '' },
  });

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-xl border shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold">
              {team ? 'Editar equipo' : 'Nuevo equipo'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <form
            onSubmit={form.handleSubmit((d) => {
              onSave(d);
              onClose();
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Nombre del equipo</Label>
              <Input placeholder="Ej: Frontend Team" {...form.register('nombre')} error={form.formState.errors.nombre?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                rows={3}
                placeholder="Descripción del equipo..."
                {...form.register('descripcion')}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{team ? 'Guardar' : 'Crear equipo'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---- Team Card ----
function TeamCard({
  team,
  onEdit,
  onDelete,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onStats,
  readOnly = false,
}: {
  team: Team;
  onEdit: () => void;
  onDelete: () => void;
  onAddMember: () => void;
  onEditMember: (m: TeamMember) => void;
  onDeleteMember: (id: string, nombre: string) => void;
  onStats: () => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { toast } = useToastManager();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.codigo);
    toast.success('Copiado', `Código ${team.codigo} copiado`);
  };

  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{team.nombre}</CardTitle>
              {team.descripcion && (
                <p className="text-xs text-muted-foreground mt-0.5">{team.descripcion}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onStats} title="Estadísticas">
              <BarChart3 className="h-3.5 w-3.5" />
            </Button>
            {!readOnly && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Code + meta */}
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Código:</span>
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{team.codigo}</code>
            <button onClick={handleCopyCode} className="hover:text-foreground transition-colors">
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <span>{team.members.length} miembro{team.members.length !== 1 ? 's' : ''}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Members header */}
          <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Miembros
          </button>
          {!readOnly && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onAddMember}>
              <UserPlus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          )}
        </div>

        {/* Members list */}
        {expanded && (
          <div className="rounded-lg border overflow-hidden">
            {team.members.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Sin miembros aún
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rol</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                            {m.nombre.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{m.nombre}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.email}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[m.role])}>
                          {ROLE_LABELS[m.role]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <StatusDot status={m.status} />
                          <span className="text-xs capitalize">{m.status}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {!readOnly && (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onEditMember(m)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDeleteMember(m.id, m.nombre)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Main TeamsView ----
export function TeamsView() {
  const { toast } = useToastManager();
  const { teamInfo } = useUser();

  const [teams, setTeams] = useState<Team[]>([]);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await apiClient.request<Team[]>('/api/teams');
      setTeams(data);
    } catch {
      // silently keep empty
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // If user belongs to a team, show only that team; otherwise show all
  const displayedTeams = teamInfo
    ? teams.filter((t) => t.id === String(teamInfo.id))
    : teams;
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteMemberConfirm, setDeleteMemberConfirm] = useState<{ teamId: string; memberId: string; nombre: string } | null>(null);
  const [statsTeam, setStatsTeam] = useState<{ id: string; nombre: string; members: StatsMember[] } | null>(null);

  const handleSaveTeam = async (data: TeamFormData) => {
    try {
      if (editingTeam) {
        const updated = await apiClient.request<Team>(`/api/teams/${editingTeam.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setTeams((prev) => prev.map((t) => (t.id === editingTeam.id ? updated : t)));
        toast.success('Equipo actualizado', data.nombre);
      } else {
        const team = await apiClient.request<Team>('/api/teams', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setTeams((prev) => [...prev, team]);
        toast.success('Equipo creado', data.nombre);
      }
    } catch {
      toast.error('Error', 'No se pudo guardar el equipo');
    }
    setEditingTeam(null);
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await apiClient.request<void>(`/api/teams/${id}`, { method: 'DELETE' });
      setTeams((prev) => prev.filter((t) => t.id !== id));
      toast.success('Equipo eliminado', '');
    } catch {
      toast.error('Error', 'No se pudo eliminar el equipo');
    }
  };

  const openAddMember = (teamId: string) => {
    setTargetTeamId(teamId);
    setEditingMember(null);
    setMemberModalOpen(true);
  };

  const openEditMember = (teamId: string, member: TeamMember) => {
    setTargetTeamId(teamId);
    setEditingMember(member);
    setMemberModalOpen(true);
  };

  const handleSaveMember = async (payload: AddMemberPayload) => {
    if (!targetTeamId) return;
    try {
      if (editingMember) {
        const updated = await apiClient.request<TeamMember>(
          `/api/teams/${targetTeamId}/members/${editingMember.id}`,
          { method: 'PUT', body: JSON.stringify(payload) }
        );
        setTeams((prev) =>
          prev.map((t) =>
            t.id !== targetTeamId
              ? t
              : { ...t, members: t.members.map((m) => (m.id === editingMember.id ? updated : m)) }
          )
        );
        toast.success('Miembro actualizado', editingMember.nombre);
      } else if (payload.mode === 'existing') {
        const newMember = await apiClient.request<TeamMember>(
          `/api/teams/${targetTeamId}/members`,
          { method: 'POST', body: JSON.stringify({ existingUserId: payload.existingUserId, role: payload.role, status: payload.status }) }
        );
        setTeams((prev) =>
          prev.map((t) =>
            t.id !== targetTeamId ? t : { ...t, members: [...t.members, newMember] }
          )
        );
        toast.success('Miembro agregado', newMember.nombre);
      } else {
        const newMember = await apiClient.request<TeamMember>(
          `/api/teams/${targetTeamId}/members`,
          { method: 'POST', body: JSON.stringify(payload) }
        );
        setTeams((prev) =>
          prev.map((t) =>
            t.id !== targetTeamId ? t : { ...t, members: [...t.members, newMember] }
          )
        );
        toast.success('Miembro creado', newMember.nombre);
      }
    } catch {
      toast.error('Error', 'No se pudo guardar el miembro');
    }
    setEditingMember(null);
    setTargetTeamId(null);
  };

  const handleDeleteMember = async () => {
    if (!deleteMemberConfirm) return;
    const { teamId, memberId } = deleteMemberConfirm;
    try {
      await apiClient.request<void>(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t
        )
      );
      toast.success('Miembro eliminado', '');
    } catch {
      toast.error('Error', 'No se pudo eliminar el miembro');
    }
    setDeleteMemberConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Equipos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tus equipos y sus miembros
          </p>
        </div>
        {!teamInfo && (
          <Button
            className="gap-2"
            onClick={() => {
              setEditingTeam(null);
              setTeamModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo equipo
          </Button>
        )}
      </div>

      {/* Teams list */}
      {displayedTeams.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{teamInfo ? 'No se encontró tu equipo' : 'Sin equipos creados'}</p>
            <p className="text-xs mt-1">{teamInfo ? 'Contacta a tu líder de equipo' : 'Crea tu primer equipo para comenzar'}</p>
            {!teamInfo && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setTeamModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Crear equipo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={() => {
                setEditingTeam(team);
                setTeamModalOpen(true);
              }}
              onDelete={() => handleDeleteTeam(team.id)}
              onAddMember={() => openAddMember(team.id)}
              onEditMember={(m) => openEditMember(team.id, m)}
              onDeleteMember={(mid, nombre) => setDeleteMemberConfirm({ teamId: team.id, memberId: mid, nombre })}
              onStats={() => setStatsTeam({ id: team.id, nombre: team.nombre, members: team.members })}
              readOnly={!!teamInfo}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TeamModal
        open={teamModalOpen}
        onClose={() => {
          setTeamModalOpen(false);
          setEditingTeam(null);
        }}
        onSave={handleSaveTeam}
        team={editingTeam}
      />
      <MemberModal
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        member={editingMember}
        currentMembers={teams.find((t) => t.id === targetTeamId)?.members ?? []}
      />

      <TeamStatsModal
        open={!!statsTeam}
        onClose={() => setStatsTeam(null)}
        team={statsTeam}
      />

      {/* Delete member confirm */}
      <Dialog.Root open={!!deleteMemberConfirm} onOpenChange={(v) => !v && setDeleteMemberConfirm(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <Dialog.Title className="text-base font-semibold mb-2">Eliminar miembro</Dialog.Title>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              La cuenta de{' '}
              <span className="font-medium text-foreground">{deleteMemberConfirm?.nombre}</span>{' '}
              y todos sus registros asociados serán eliminados permanentemente. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteMemberConfirm(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMember}
              >
                Sí, eliminar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
