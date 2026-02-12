'use client';

import CreateEventForm from '@/components/dashboard/events/CreateEventForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateEventPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/events">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground">
          Fill in the details to create your event
        </p>
      </div>

      <CreateEventForm />
    </div>
  );
}
