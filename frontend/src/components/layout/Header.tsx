'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store/authStore';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
import { Calendar, Menu, User as UserIcon } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { attendee, isAuthenticated: isAttendeeAuthenticated, logout: attendeeLogout } = useAttendeeAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Determine if any user is authenticated (organizer or attendee)
  const anyAuthenticated = isAuthenticated || isAttendeeAuthenticated;

  // Fix hydration mismatch with Zustand persist
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLogout = () => {
    if (isAuthenticated) {
      logout();
    }
    if (isAttendeeAuthenticated) {
      attendeeLogout();
    }
    // Redirect to home page after logout
    router.push('/');
  };

  const getCompanyInitials = (companyName: string) => {
    if (!companyName) return 'C';
    const words = companyName.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  const getAttendeeInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || 'A'}${lastName?.[0] || 'A'}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-b-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TukioHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:space-x-6">
          <Link
            href="/events"
            className={`text-sm font-medium transition-colors hover:text-primary relative ${
              pathname === '/events'
                ? 'text-primary after:absolute after:bottom-[-1.25rem] after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                : 'text-muted-foreground'
            }`}
          >
            Browse Events
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/events/category/')
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Categories
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="/events/category/conference">Conference</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/workshop">Workshop</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/concert">Concert</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/sports">Sports</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/exhibition">Exhibition</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/networking">Networking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/party">Party</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/theater">Theater</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/other">Other</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {mounted && isAuthenticated && user?.role === 'ORGANIZER' && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/dashboard')
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
          )}
          {mounted && isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith('/admin')
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {mounted && anyAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {isAuthenticated && user ? (
                      <>
                        <AvatarImage src={user.logo || undefined} alt={user.company_name} />
                        <AvatarFallback>
                          {getCompanyInitials(user.company_name)}
                        </AvatarFallback>
                      </>
                    ) : isAttendeeAuthenticated && attendee ? (
                      <>
                        <AvatarFallback>
                          {getAttendeeInitials(attendee.first_name, attendee.last_name)}
                        </AvatarFallback>
                      </>
                    ) : null}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    {isAuthenticated && user ? (
                      <>
                        <p className="text-sm font-medium leading-none">
                          {user.company_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </>
                    ) : isAttendeeAuthenticated && attendee ? (
                      <>
                        <p className="text-sm font-medium leading-none">
                          {attendee.first_name} {attendee.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {attendee.email}
                        </p>
                      </>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAuthenticated && user?.role === 'ORGANIZER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {isAttendeeAuthenticated && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/events">Browse Events</Link>
              </DropdownMenuItem>
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/events/category/conference">Conference</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/workshop">Workshop</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/concert">Concert</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/sports">Sports</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/exhibition">Exhibition</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/networking">Networking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/party">Party</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/theater">Theater</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/category/other">Other</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {mounted && isAuthenticated && user?.role === 'ORGANIZER' && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
              )}
              {mounted && isAuthenticated && user?.role === 'ADMIN' && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin</Link>
                </DropdownMenuItem>
              )}
              {mounted && isAttendeeAuthenticated && (
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
              )}
              {mounted && !anyAuthenticated && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">Log in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Sign up</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
