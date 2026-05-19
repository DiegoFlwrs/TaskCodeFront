import { ReactNode } from 'react';
import { DashboardLayoutInner } from '../../components/dashboard/DashboardLayoutInner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}
