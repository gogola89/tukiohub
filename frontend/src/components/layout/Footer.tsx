'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
import { useEffect, useState } from 'react';

export default function Footer() {
  const { isAuthenticated } = useAuthStore();
  const { isAuthenticated: isAttendeeAuthenticated } = useAttendeeAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const anyAuthenticated = isAuthenticated || isAttendeeAuthenticated;
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">TukioHub</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Discover and book tickets for events across Kenya.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/events"
                  className="text-muted-foreground hover:text-primary"
                >
                  Browse Events
                </Link>
              </li>
              <li>
                <Link
                  href="/events/categories"
                  className="text-muted-foreground hover:text-primary"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">For Organizers</h3>
            <ul className="space-y-2 text-sm">
              {mounted && !anyAuthenticated && (
                <>
                  <li>
                    <Link
                      href="/register"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Organizer Dashboard
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-primary"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-primary"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-muted-foreground hover:text-primary"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} TukioHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
