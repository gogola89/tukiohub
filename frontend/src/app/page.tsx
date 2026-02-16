'use client';

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Ticket, TrendingUp, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Shield, BarChart3 } from "lucide-react";
import { useFeaturedEvents, useUpcomingEvents } from "@/lib/hooks/useEvents";
import EventGrid from "@/components/events/EventGrid";
import EventCard from "@/components/events/EventCard";
import EventSearch from "@/components/events/EventSearch";
import { useRouter } from "next/navigation";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { data: featuredEvents, isLoading: isFeaturedLoading } = useFeaturedEvents();
  const { data: upcomingEvents, isLoading: isUpcomingLoading } = useUpcomingEvents();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/events?search=${encodeURIComponent(query)}`);
    }
  };

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [upcomingEvents]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = container.querySelector(':scope > div')?.clientWidth || 350;
      const scrollAmount = cardWidth + 24; // card width + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#006B3F]/5 via-background to-[#BE0027]/5">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#006B3F]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#BE0027]/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Hero Text */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Kenya's Premier Event Platform
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Discover{" "}
                <span className="bg-gradient-to-r from-[#006B3F] via-primary to-[#BE0027] bg-clip-text text-transparent">
                  Amazing Events
                </span>{" "}
                Across Kenya
              </h1>

              <p className="max-w-[540px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                From vibrant concerts to insightful conferences, find and book tickets for unforgettable experiences. Powered by M-Pesa for seamless payments.
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-lg">
                <EventSearch onSearch={handleSearch} placeholder="Search events, venues, artists..." />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="bg-gradient-to-r from-primary to-[#006B3F] hover:opacity-90 transition-opacity text-white shadow-lg shadow-primary/25" asChild>
                  <Link href="/events">
                    Browse Events
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 hover:bg-primary/5 hover:text-foreground" asChild>
                  <Link href="/register/organizer">Become an Organizer</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">1000+</p>
                  <p className="text-sm text-muted-foreground">Events Hosted</p>
                </div>
                <div className="border-l pl-8">
                  <p className="text-2xl font-bold text-foreground">50K+</p>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                </div>
                <div className="border-l pl-8">
                  <p className="text-2xl font-bold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Organizers</p>
                </div>
              </div>
            </div>

            {/* Right - Hero Visual */}
            <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700 [animation-delay:200ms]">
              <div className="relative">
                {/* Main visual card */}
                <div className="relative bg-gradient-to-br from-[#006B3F] via-primary to-[#006B3F] rounded-3xl p-8 shadow-2xl shadow-primary/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Live Concert</p>
                        <p className="text-white/70 text-sm">Nairobi, Kenya</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/20 rounded-full w-3/4" />
                      <div className="h-2 bg-white/20 rounded-full w-1/2" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-white/80 text-sm">From KES 500</span>
                      <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium">Book Now</span>
                    </div>
                  </div>
                </div>

                {/* Floating accent cards */}
                <div className="absolute -top-6 -left-6 bg-white dark:bg-card rounded-2xl shadow-xl p-4 animate-bounce [animation-duration:3s]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#BE0027]/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#BE0027]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">This Weekend</p>
                      <p className="text-sm font-semibold">12 Events</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-card rounded-2xl shadow-xl p-4 animate-bounce [animation-duration:4s] [animation-delay:500ms]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#006B3F]/10 rounded-lg flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-[#006B3F]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sold Today</p>
                      <p className="text-sm font-semibold">243 Tickets</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Featured Events */}
        {(isFeaturedLoading || (featuredEvents && featuredEvents.length > 0)) && (
          <section className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Sparkles className="w-3 h-3" />
                Curated for you
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Featured{" "}
                <span className="bg-gradient-to-r from-[#006B3F] to-primary bg-clip-text text-transparent">
                  Events
                </span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">Hand-picked events you won't want to miss</p>
            </div>
            <EventGrid events={featuredEvents?.slice(0, 3) || []} isLoading={isFeaturedLoading} />
          </section>
        )}

        {/* Upcoming Events - Horizontal Scroll */}
        {(isUpcomingLoading || (upcomingEvents && upcomingEvents.length > 0)) && (
          <section className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                  <Calendar className="w-3 h-3" />
                  Coming soon
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Upcoming{" "}
                  <span className="bg-gradient-to-r from-[#BE0027] to-secondary bg-clip-text text-transparent">
                    Events
                  </span>
                </h2>
                <p className="text-muted-foreground">Discover exciting events happening soon</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="rounded-full h-10 w-10 border-2 hover:bg-primary/5 hover:border-primary hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="rounded-full h-10 w-10 border-2 hover:bg-primary/5 hover:border-primary hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {isUpcomingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="relative">
                <div
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mb-4 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {upcomingEvents?.map((event) => (
                    <div
                      key={event.id}
                      className="min-w-[320px] md:min-w-[350px] lg:min-w-[380px] max-w-[400px] snap-start flex-shrink-0"
                    >
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
                {/* Fade edges when scrollable */}
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                )}
                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                )}
              </div>
            )}

            <div className="flex justify-center mt-8">
              <Button variant="outline" className="border-2 hover:bg-primary/5 hover:border-primary hover:text-foreground" asChild>
                <Link href="/events" className="flex items-center gap-2">
                  View All Events <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="mt-20 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Why{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TukioHub
              </span>
              ?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">Everything you need for seamless event experiences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#006B3F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006B3F]/10 group-hover:bg-[#006B3F]/20 transition-colors duration-300">
                  <Calendar className="h-7 w-7 text-[#006B3F]" />
                </div>
                <h3 className="text-xl font-bold">Easy Discovery</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find events by category, location, or date. Browse featured events
                  and discover what's happening near you.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#BE0027]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#BE0027]/10 group-hover:bg-[#BE0027]/20 transition-colors duration-300">
                  <Shield className="h-7 w-7 text-[#BE0027]" />
                </div>
                <h3 className="text-xl font-bold">Secure Booking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Book tickets securely with M-Pesa integration. Get instant
                  confirmation and QR code tickets delivered to your email.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                  <BarChart3 className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold">Organizer Tools</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Powerful dashboard for event organizers. Manage events, track sales,
                  and gain insights with comprehensive analytics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-20 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#006B3F] via-primary to-[#006B3F] p-12 md:p-16 text-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Get Started?</h2>
            <p className="mt-4 text-white/80 max-w-md mx-auto text-lg">
              Join thousands of event-goers and organizers across Kenya on TukioHub
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
                <Link href="/events">Explore Events</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-primary hover:bg-white/10 hover:text-white" asChild>
                <Link href="/register/organizer">Become an Organizer</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
