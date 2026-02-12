'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardFooter from '@/components/dashboard/DashboardFooter';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
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