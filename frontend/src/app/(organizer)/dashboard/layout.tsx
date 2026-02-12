'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardFooter from '@/components/dashboard/DashboardFooter';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['ORGANIZER']}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <main className="flex-1">
            {children}
          </main>
          <DashboardFooter />
        </div>
      </div>
    </ProtectedRoute>
  );
}
