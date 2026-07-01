'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeamsView } from '../../../components/teams/TeamsView';
import { useUser } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/loading';

export default function TeamsPage() {
  const router = useRouter();
  const { isTeamLeader, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isTeamLeader) {
      router.replace('/dashboard');
    }
  }, [isLoading, isTeamLeader, router]);

  if (isLoading || !isTeamLeader) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <TeamsView />;
}
