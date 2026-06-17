import { cn } from '../../lib/utils';

interface TadLogoProps {
  variant?: 'default' | 'sidebar' | 'auth' | 'icon';
  collapsed?: boolean;
  className?: string;
}

function TadLogoMark({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col leading-[0.9] font-black tracking-tight select-none',
        className,
      )}
    >
      <span className={cn('text-[11px]', inverted ? 'text-white' : 'text-primary')}>
        TAD
      </span>
      <span
        className={cn(
          'text-[9px]',
          inverted ? 'text-white/90' : 'text-[hsl(var(--tad-black))]',
        )}
      >
        CODE
      </span>
    </div>
  );
}

export function TadLogo({
  variant = 'default',
  collapsed = false,
  className,
}: TadLogoProps) {
  const isSidebar = variant === 'sidebar';
  const isAuth = variant === 'auth';

  if (collapsed || variant === 'icon') {
    return (
      <div
        className={cn(
          'bg-primary rounded-md px-2 py-1.5 flex items-center justify-center',
          className,
        )}
        title="TaskCode TAD"
      >
        <span className="text-white font-black text-[10px] tracking-tight">TAD</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'rounded-lg flex items-center justify-center',
          isSidebar ? 'bg-primary p-2' : 'bg-primary/10 p-2',
          isAuth && 'bg-primary p-2.5',
        )}
      >
        <TadLogoMark
          inverted={isSidebar || isAuth}
          className={isAuth ? 'scale-110' : undefined}
        />
      </div>
      <div className={cn('leading-tight', isAuth && 'text-left')}>
        <span
          className={cn(
            'font-semibold',
            isAuth ? 'text-xl' : 'text-sm',
            isSidebar ? 'text-white' : 'text-foreground',
          )}
        >
          TaskCode{' '}
        </span>
        <span
          className={cn(
            'font-black text-primary',
            isAuth ? 'text-xl' : 'text-sm',
          )}
        >
          TAD
        </span>
      </div>
    </div>
  );
}
