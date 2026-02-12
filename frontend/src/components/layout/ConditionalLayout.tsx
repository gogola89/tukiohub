'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on a dashboard or admin route
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAdminRoute = pathname?.startsWith('/admin');

  // Dashboard and admin routes don't need the main header/footer
  if (isDashboardRoute || isAdminRoute) {
    return <>{children}</>;
  }

  // All other routes get the standard layout with header and footer
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
