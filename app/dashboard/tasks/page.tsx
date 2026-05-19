'use client';

import { Suspense } from 'react';
import { TasksView } from '../../../components/tasks/TasksView';

export default function TasksPage() {
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  );
}
