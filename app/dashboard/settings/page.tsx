'use client';

import { Card, CardContent } from '../../../components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <Card className="border shadow-none">
      <CardContent className="py-16 text-center text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Configuración</p>
        <p className="text-xs mt-1">Próximamente</p>
      </CardContent>
    </Card>
  );
}
