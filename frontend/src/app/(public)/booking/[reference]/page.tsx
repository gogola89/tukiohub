'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { bookingsAPI } from '@/lib/api/endpoints/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  Ticket,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import TicketCard from '@/components/tickets/TicketCard';

interface PageProps {
  params: Promise<{ reference: string }>;
}

export default function BookingReviewPage({ params }: PageProps) {
  const { reference } = use(params);
  const router = useRouter();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', reference],
    queryFn: () => bookingsAPI.getBooking(reference),
    enabled: !!reference,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-8 max-w-md mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-red-600">Booking Not Found</h2>
          <p className="text-gray-600">
            We couldn't find a booking with reference <span className="font-mono font-semibold">{reference}</span>
          </p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleProceedToPayment = () => {
    const paymentAmount = booking.final_amount || booking.total_amount;
    router.push(`/payment?booking_reference=${booking.booking_reference}&amount=${paymentAmount}&payment_method=${booking.payment_method}`);
  };

  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED';

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">Pending Payment</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Confirmed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">{booking.status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Booking Review</h1>
          {getStatusBadge()}
        </div>
        <p className="text-muted-foreground">
          Review your booking details and proceed to payment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Booking Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold">{booking.booking_reference}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please keep this reference number for your records
              </p>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{booking.event?.title || 'Event'}</h3>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {booking.event?.start_datetime && format(new Date(booking.event.start_datetime), 'PPP')}
                  </p>
                  <p className="text-muted-foreground">
                    {booking.event?.start_datetime && format(new Date(booking.event.start_datetime), 'p')}
                  </p>
                </div>
              </div>

              {booking.event?.venue_name && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{booking.event.venue_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendee Details */}
          <Card>
            <CardHeader>
              <CardTitle>Attendee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{booking.attendee_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{booking.attendee_email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{booking.attendee_phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.ticket_type_name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">KES {item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Details with QR Codes (Only show if confirmed and tickets exist) */}
          {isConfirmed && booking.tickets && booking.tickets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                <h2 className="text-xl font-bold">Your Tickets</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Below are your tickets with QR codes. Show these at the event entrance.
              </p>
              {booking.tickets.map((ticket) => (
                <TicketCard
                  key={ticket.ticket_code}
                  ticket={ticket}
                  eventTitle={booking.event?.title || 'Event'}
                  eventDate={booking.event?.start_datetime || new Date().toISOString()}
                  eventVenue={booking.event?.venue_name || 'Venue'}
                  onTransferSuccess={() => {
                    // Refetch booking data to update tickets
                    window.location.reload();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Payment Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {booking.discount_amount && booking.discount_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>KES {booking.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-KES {booking.discount_amount.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              {booking.discount_amount && booking.discount_amount > 0 && <Separator />}

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>KES {booking.final_amount?.toLocaleString() || booking.total_amount.toLocaleString()}</span>
              </div>

              {isPending && (
                <>
                  <Separator />
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 text-sm">Payment Required</p>
                        <p className="text-xs text-yellow-800">
                          Your booking will be held for 5 minutes. Please complete payment to confirm.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    className="w-full h-12"
                    size="lg"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Continue to Payment
                  </Button>
                </>
              )}

              {isConfirmed && (
                <>
                  <Separator />
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">Payment Confirmed</p>
                    <p className="text-xs text-green-800 mt-1">
                      Your tickets have been sent to your email
                    </p>
                  </div>
                  <Link href={`/booking/${reference}/confirmation`}>
                    <Button className="w-full" variant="outline">
                      View Tickets
                    </Button>
                  </Link>
                </>
              )}

              {isCancelled && (
                <>
                  <Separator />
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900">Booking Cancelled</p>
                    <p className="text-xs text-red-800 mt-1">
                      This booking has been cancelled
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Link href="/events">
            <Button variant="outline" className="w-full">
              Browse More Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
