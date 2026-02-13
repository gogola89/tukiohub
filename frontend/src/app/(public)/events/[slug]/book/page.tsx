'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEventBySlug } from '@/lib/hooks/useEvents';
import { useCreateBooking } from '@/lib/hooks/useBooking';
import { useCartStore } from '@/lib/store/cartStore';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
import { useQuery } from '@tanstack/react-query';
import { attendeesAPI } from '@/lib/api/endpoints/attendees';
import { bookingsAPI } from '@/lib/api/endpoints/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import { formatDateKE, formatDateTimeKE } from '@/lib/utils';
import { toast } from 'react-hot-toast';

import TicketSelector from '@/components/booking/TicketSelector';
import AddonSelector from '@/components/booking/AddonSelector';
import PromoCodeInput from '@/components/booking/PromoCodeInput';
import AttendeeForm from '@/components/booking/AttendeeForm';
import OrderSummary from '@/components/booking/OrderSummary';
import WalletPaymentConfirmation from '@/components/wallet/WalletPaymentConfirmation';
import { AttendeeFormInput } from '@/lib/validations/booking';
import { CreateBookingData } from '@/types/booking';

interface PageProps {
  params: Promise<{ slug: string }>;
}

type BookingStep = 'tickets' | 'details' | 'payment';

export default function BookEventPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: event, isLoading, error } = useEventBySlug(slug);
  const createBooking = useCreateBooking();
  const { items, addons, promoCode, clearCart, getTotal } = useCartStore();
  const { attendee, isAuthenticated } = useAttendeeAuthStore();

  const [currentStep, setCurrentStep] = useState<BookingStep>('tickets');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD' | 'WALLET'>('MPESA');
  const [showWalletConfirmation, setShowWalletConfirmation] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<AttendeeFormInput | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Fetch wallet data if user is authenticated
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => attendeesAPI.getWallet(),
    enabled: isAuthenticated,
  });

  // Clear cart on initial mount to start fresh for each booking session
  // This ensures users don't see persisted items from previous sessions
  useEffect(() => {
    clearCart();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinueToDetails = () => {
    if (items.length === 0) {
      toast.error('Please select at least one ticket');
      return;
    }
    setCurrentStep('details');
  };

  const handleSubmitBooking = async (data: AttendeeFormInput) => {
    if (!event) return;

    // Check if using wallet and show confirmation dialog
    const totalAmount = getTotal();
    if (paymentMethod === 'WALLET') {
      if (!isAuthenticated) {
        toast.error('Please login to use wallet payment');
        return;
      }
      // Store the data and show confirmation dialog
      setPendingBookingData(data);
      setShowWalletConfirmation(true);
      return;
    }

    // For non-wallet payments, proceed directly
    await processBooking(data);
  };

  const handleConfirmWalletPayment = async () => {
    if (!pendingBookingData) return;

    setIsConfirmingPayment(true);
    try {
      await processBooking(pendingBookingData);
      setShowWalletConfirmation(false);
      setPendingBookingData(null);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const processBooking = async (data: AttendeeFormInput) => {
    if (!event) return;

    const bookingData: CreateBookingData = {
      event_id: event.id,
      attendee_name: data.attendee_name,
      attendee_email: data.attendee_email,
      attendee_phone: data.attendee_phone,
      notes: data.notes,
      items: items.map((item) => ({
        ticket_type_id: item.ticket_type_id,
        quantity: item.quantity,
      })),
      addons: addons.length > 0 ? addons.map((addon) => ({
        addon_id: addon.addon_id,
        quantity: addon.quantity,
      })) : undefined,
      promo_code: promoCode || undefined,
      attendee_id: isAuthenticated && attendee ? attendee.id : undefined,
      payment_method: paymentMethod,
    };

    try {
      const booking = await createBooking.mutateAsync(bookingData);

      // If wallet payment, confirm the payment to deduct from wallet and generate tickets
      if (paymentMethod === 'WALLET') {
        try {
          await bookingsAPI.confirmWalletPayment(booking.booking_reference);
          toast.success('Booking confirmed! Payment deducted from wallet.');
          clearCart();
          router.push(`/booking/${booking.booking_reference}/confirmation`);
        } catch (confirmError: any) {
          const confirmMessage = confirmError?.response?.data?.error
            || confirmError?.response?.data?.detail
            || 'Failed to confirm wallet payment';
          toast.error(confirmMessage);
          // Still redirect to booking page so user can see the status
          router.push(`/booking/${booking.booking_reference}`);
        }
      } else {
        toast.success(
          'Booking preserved! Awaiting payment for 5 minutes. Complete payment to confirm your tickets.',
          { duration: 8000 }
        );
        clearCart();
        // Go directly to payment page, skipping the booking summary
        const paymentAmount = booking.final_amount || booking.total_amount;
        router.push(`/payment?booking_reference=${booking.booking_reference}&amount=${paymentAmount}&payment_method=${paymentMethod}`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message
        || error?.response?.data?.error
        || 'Failed to create booking';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The event you're trying to book doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  const isSoldOut = event.is_sold_out ?? false;

  if (isSoldOut) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Event Sold Out</h2>
        <p className="text-muted-foreground mb-6">
          Unfortunately, this event is sold out. Check out other events below.
        </p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/events/${slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{formatDateTimeKE(event.start_datetime)}</span>
            <span>•</span>
            <span>{event.venue_name}</span>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'tickets'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              1
            </div>
            <span className="text-sm font-medium">Select Tickets</span>
          </div>
          <div className="w-12 h-0.5 bg-muted"></div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'details'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              2
            </div>
            <span className="text-sm font-medium">Your Details</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Forms */}
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 'tickets' && (
            <>
              {/* Ticket Selection */}
              {event.ticket_types && event.ticket_types.length > 0 && (
                <TicketSelector ticketTypes={event.ticket_types} eventId={event.id} />
              )}

              {/* Add-ons Selection */}
              {event.ticket_types && event.ticket_types.length > 0 && (
                <AddonSelector addons={[]} />
              )}

              {/* Promo Code - Available for all users */}
              <PromoCodeInput eventId={event.id} />

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleContinueToDetails}
                  disabled={items.length === 0}
                  size="lg"
                >
                  Continue to Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {currentStep === 'details' && (
            <>
              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Payment Method</CardTitle>
                  <CardDescription>Choose how you'd like to pay for your tickets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Wallet Option - Only show if user is logged in */}
                  {isAuthenticated && (
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'WALLET'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                      onClick={() => setPaymentMethod('WALLET')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-5 h-5" />
                          <div>
                            <p className="font-medium">Pay with Wallet</p>
                            <p className="text-sm text-muted-foreground">
                              Balance: KES {walletData?.wallet_balance.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                        {paymentMethod === 'WALLET' && (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            ✓
                          </div>
                        )}
                      </div>
                      {walletData && walletData.wallet_balance < getTotal() && (
                        <p className="text-sm text-red-600 mt-2">
                          Insufficient balance. You need KES {(getTotal() - walletData.wallet_balance).toLocaleString()} more.{' '}
                          <Link href="/profile" className="underline">
                            Add funds
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {/* M-Pesa Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'MPESA'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => setPaymentMethod('MPESA')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-600 rounded"></div>
                        <div>
                          <p className="font-medium">M-Pesa</p>
                          <p className="text-sm text-muted-foreground">Pay via M-Pesa STK Push</p>
                        </div>
                      </div>
                      {paymentMethod === 'MPESA' && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-blue-600 rounded"></div>
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard</p>
                        </div>
                      </div>
                      {paymentMethod === 'CARD' && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendee Form */}
              <AttendeeForm
                onSubmit={handleSubmitBooking}
                isSubmitting={createBooking.isPending}
                defaultValues={
                  isAuthenticated && attendee
                    ? {
                        attendee_name: `${attendee.first_name} ${attendee.last_name}`,
                        attendee_email: attendee.email,
                        attendee_phone: attendee.phone_number,
                      }
                    : undefined
                }
              />

              {/* Back Button */}
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('tickets')}
                  disabled={createBooking.isPending}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tickets
                </Button>
              </div>
            </>
          )}

          {(!event.ticket_types || event.ticket_types.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle>No Tickets Available</CardTitle>
                <CardDescription>
                  Tickets for this event haven't been set up yet. Please check back later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/events/${slug}`}>Back to Event</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <OrderSummary />
        </div>
      </div>

      {/* Wallet Payment Confirmation Dialog */}
      {isAuthenticated && walletData && (
        <WalletPaymentConfirmation
          open={showWalletConfirmation}
          onOpenChange={setShowWalletConfirmation}
          amount={getTotal()}
          currentBalance={walletData.wallet_balance}
          onConfirm={handleConfirmWalletPayment}
          isProcessing={isConfirmingPayment}
        />
      )}
    </div>
  );
}
