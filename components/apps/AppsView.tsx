'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Pencil, Trash2, X, Globe, AppWindow } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { useToastManager } from '../ui/toast-manager';
import { useApps } from '../../hooks/useApps';
import { App, AppFormData, APP_COLORS } from '../../lib/app-types';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres'),
  url: z.string().max(500, 'Máximo 500 caracteres'),
  color: z.string().max(30, 'Máximo 30 caracteres'),
});

type FormData = z.infer<typeof schema>;

function AppModal({
  open, onClose, onSave, app,
}: { open: boolean; onClose: () => void; onSave: (d: AppFormData) => void; app?: App | null }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: app ?? { nombre: '', descripcion: '', url: '', color: APP_COLORS[0].value },
  });

  useEffect(() => {
    form.reset(app ?? { nombre: '', descripcion: '', url: '', color: APP_COLORS[0].value });
  }, [app, open, form]);

  const selectedColor = form.watch('color');

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-xl border shadow-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <Dialog.Title className="text-base font-semibold">{app ? 'Editar aplicación' : 'Nueva aplicación'}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </Dialog.Close>
          </div>
          <form onSubmit={form.handleSubmit((d) => { onSave(d as AppFormData); onClose(); })} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input placeholder="Sistema de Gestión" {...form.register('nombre')} error={form.formState.errors.nombre?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea rows={2} placeholder="Breve descripción..." {...form.register('descripcion')}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input type="url" placeholder="https://..." {...form.register('url')} />
            </div>
            <div className="space-y-1.5">
              <Label>Color identificador</Label>
              <div className="flex gap-2 flex-wrap">
                {APP_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => form.setValue('color', c.value)}
                    className={cn('w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                      selectedColor === c.value ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{app ? 'Guardar' : 'Crear aplicación'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AppsView() {
  const { apps, loading, addApp, updateApp, deleteApp, refetchOptions } = useApps();
  const { toast } = useToastManager();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [search, setSearch] = useState('');

  const filtered = apps.filter((a) =>
    !search || a.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (formData: AppFormData) => {
    try {
      if (editingApp) {
        await updateApp(editingApp.id, formData);
        toast.success('Aplicación actualizada', formData.nombre);
      } else {
        await addApp(formData);
        toast.success('Aplicación registrada', formData.nombre);
      }
      refetchOptions(true);
    } catch {
      toast.error('Error', 'No se pudo guardar la aplicación');
    }
  };

  const handleDeleteApp = async (id: string, nombre: string) => {
    try {
      await deleteApp(id);
      toast.success('Eliminada', nombre);
      refetchOptions(true);
    } catch {
      toast.error('Error', 'No se pudo eliminar la aplicación');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Aplicaciones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Registra los sistemas que utilizas en tus tareas</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingApp(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Nueva aplicación
        </Button>
      </div>

      {apps.length > 0 && (
        <div className="relative max-w-xs">
          <input
            className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Buscar aplicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <AppWindow className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {loading ? (
        <Card className="border shadow-none">
          <CardContent className="py-14 text-center text-muted-foreground">
            <p className="text-sm">Cargando aplicaciones...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="py-14 text-center text-muted-foreground">
            <AppWindow className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {apps.length === 0 ? 'Sin aplicaciones registradas' : 'Sin resultados'}
            </p>
            {apps.length === 0 && (
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> Registrar primera aplicación
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <Card key={app.id} className="border shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: app.color + '20' }}>
                      <AppWindow className="h-5 w-5" style={{ color: app.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{app.nombre}</p>
                      {app.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.descripcion}</p>
                      )}
                      {app.url && (
                        <a href={app.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 truncate max-w-[180px]"
                          onClick={(e) => e.stopPropagation()}>
                          <Globe className="h-3 w-3 shrink-0" />
                          {app.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditingApp(app); setModalOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteApp(app.id, app.nombre)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: app.color }} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AppModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingApp(null); }}
        onSave={handleSave}
        app={editingApp}
      />
    </div>
  );
}
