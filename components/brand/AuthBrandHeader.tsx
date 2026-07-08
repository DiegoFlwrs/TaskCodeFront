import { TadLogo } from './TadLogo';

interface AuthBrandHeaderProps {
  subtitle: string;
  hint?: string;
}

export function AuthBrandHeader({ subtitle, hint }: AuthBrandHeaderProps) {
  return (
    <div className="flex flex-col items-center mb-8 text-center">
      <TadLogo variant="auth" />
      <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
