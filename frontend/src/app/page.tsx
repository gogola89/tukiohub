'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Ticket, TrendingUp, ArrowRight } from "lucide-react";
import { useFeaturedEvents, useUpcomingEvents } from "@/lib/hooks/useEvents";
import EventGrid from "@/components/events/EventGrid";
import EventSearch from "@/components/events/EventSearch";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data: featuredEvents, isLoading: isFeaturedLoading } = useFeaturedEvents();
  const { data: upcomingEvents, isLoading: isUpcomingLoading } = useUpcomingEvents();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/events?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center space-y-6 text-center -mx-4 -mt-16 px-4 pt-16 pb-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TukioHub
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Discover and book tickets for the best events across Kenya. From
            concerts to conferences, find your next experience here.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl">
          <EventSearch onSearch={handleSearch} placeholder="Search for events..." />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Create Event</Link>
          </Button>
        </div>
      </section>

      {/* Featured Events */}
      {(isFeaturedLoading || (featuredEvents && featuredEvents.length > 0)) && (
        <section className="mt-24">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent mb-2">
              Featured Events
            </h2>
            <p className="text-muted-foreground">Hand-picked events just for you</p>
          </div>
          <EventGrid events={featuredEvents?.slice(0, 3) || []} isLoading={isFeaturedLoading} />
        </section>
      )}

      {/* Upcoming Events */}
      {(isUpcomingLoading || (upcomingEvents && upcomingEvents.length > 0)) && (
        <section className="mt-24">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground">Discover exciting events happening soon</p>
          </div>
          <EventGrid events={upcomingEvents?.slice(0, 6) || []} isLoading={isUpcomingLoading} />
          <div className="flex justify-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/events" className="flex items-center gap-2">
                View All Events <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="mt-24 grid gap-8 md:grid-cols-3">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Easy Discovery</h3>
          <p className="text-muted-foreground">
            Find events by category, location, or date. Browse featured events
            and discover what's happening near you.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Secure Booking</h3>
          <p className="text-muted-foreground">
            Book tickets securely with M-Pesa integration. Get instant
            confirmation and QR code tickets delivered to your email.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Organizer Tools</h3>
          <p className="text-muted-foreground">
            Powerful dashboard for event organizers. Manage events, track sales,
            and gain insights with comprehensive analytics.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-24 rounded-lg bg-primary/5 p-8 text-center">
        <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
        <p className="mt-4 text-muted-foreground">
          Join thousands of event-goers and organizers on TukioHub
        </p>
        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/events">Explore Events</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Become an Organizer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
