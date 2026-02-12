'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EventAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Redirect to the main analytics page with the event selected
  useEffect(() => {
    // Update the URL to the main analytics page with the event pre-selected
    router.push(`/dashboard/analytics?event=${id}`);
  }, [id, router]);

  return (
    <div className="p-6">
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-lg">Redirecting to analytics...</p>
      </div>
    </div>
  );
}