'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { ticketsAPI } from '@/lib/api/endpoints/tickets';
import { useCreateBooking, useConfirmCashPayment } from '@/lib/hooks/useBooking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Loader2, Smartphone, Banknote, User, Download, Printer } from 'lucide-react';
import DeskTicketPicker from '@/components/dashboard/desk/DeskTicketPicker';
import AttendeeForm from '@/components/booking/AttendeeForm';
import MpesaPayment from '@/components/payment/MpesaPayment';
import TicketCard from '@/components/tickets/TicketCard';
import { AttendeeFormInput } from '@/lib/validations/booking';
import { Booking } from '@/types/booking';

interface DeskPageProps {
  params: Promise<{ id: string }>;
}

type DeskStep = 'tickets' | 'attendee' | 'payment-method' | 'mpesa' | 'success';
type PaymentMethod = 'MPESA' | 'CASH';

export default function RegistrationDeskPage({ params }: DeskPageProps) {
  const { id: eventId } = use(params);

  const [step, setStep] = useState<DeskStep>('tickets');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attendee, setAttendee] = useState<AttendeeFormInput | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getEventById(eventId),
  });

  const createBooking = useCreateBooking();
  const confirmCashPayment = useConfirmCashPayment();

  const ticketTypes = event?.ticket_types || [];
  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity }));
  const totalTickets = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = selectedItems.reduce((sum, item) => {
    const ticketType = ticketTypes.find((t) => t.id === item.ticket_type_id);
    return sum + (ticketType?.price || 0) * item.quantity;
  }, 0);

  const handleQuantityChange = (ticketTypeId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [ticketTypeId]: quantity }));
  };

  const handleAttendeeSubmit = (data: AttendeeFormInput) => {
    setAttendee(data);
    setStep('payment-method');
  };

  const handleRegisterAndCharge = async () => {
    if (!attendee) return;

    try {
      const newBooking = await createBooking.mutateAsync({
        event_id: eventId,
        attendee_name: attendee.attendee_name,
        attendee_email: attendee.attendee_email,
        attendee_phone: attendee.attendee_phone,
        notes: attendee.notes,
        items: selectedItems,
        payment_method: paymentMethod,
      });

      setBooking(newBooking);

      if (paymentMethod === 'CASH') {
        const result = await confirmCashPayment.mutateAsync(newBooking.booking_reference);
        setBooking(result.booking);
        toast.success('Cash payment confirmed');
        setStep('success');
      } else {
        setStep('mpesa');
      }
    } catch (error: unknown) {
      const message = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error || 'Failed to register attendee'
        : 'Failed to register attendee';
      toast.error(message);
    }
  };

  const handleReset = () => {
    setStep('tickets');
    setQuantities({});
    setAttendee(null);
    setPaymentMethod('MPESA');
    setBooking(null);
  };

  const handleDownloadAll = async () => {
    if (!booking) return;
    setIsDownloadingAll(true);
    try {
      for (const ticket of booking.tickets) {
        const blob = await ticketsAPI.downloadTicket(ticket.ticket_code);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${ticket.ticket_code}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      toast.error('Failed to download one or more tickets');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handlePrintAll = async () => {
    if (!booking) return;
    setIsPrintingAll(true);
    try {
      for (const ticket of booking.tickets) {
        const blob = await ticketsAPI.downloadTicket(ticket.ticket_code);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      }
    } catch {
      toast.error('Failed to open one or more tickets for printing');
    } finally {
      setIsPrintingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full px-4 py-8 text-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 max-w-2xl mx-auto">
      <Link href="/dashboard/desk">
        <Button variant="ghost" className="mb-4 -ml-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Desk
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registration Desk</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      {step === 'tickets' && (
        <div className="space-y-4">
          <DeskTicketPicker
            ticketTypes={ticketTypes}
            quantities={quantities}
            onChange={handleQuantityChange}
          />
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{totalTickets} ticket(s)</p>
                <p className="text-xl font-bold">KES {totalAmount.toLocaleString()}</p>
              </div>
              <Button size="lg" disabled={totalTickets === 0} onClick={() => setStep('attendee')}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'attendee' && (
        <div className="space-y-4">
          <AttendeeForm onSubmit={handleAttendeeSubmit} defaultValues={attendee || undefined} />
          <Button variant="outline" className="w-full" onClick={() => setStep('tickets')}>
            Back to Tickets
          </Button>
        </div>
      )}

      {step === 'payment-method' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                {attendee?.attendee_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalTickets} ticket(s) &middot; KES {totalAmount.toLocaleString()}
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer transition-colors ${paymentMethod === 'MPESA' ? 'border-primary border-2' : ''}`}
              onClick={() => setPaymentMethod('MPESA')}
            >
              <CardContent className="pt-6 flex flex-col items-center gap-2 text-center">
                <Smartphone className="w-8 h-8 text-green-600" />
                <p className="font-medium">M-Pesa</p>
                <p className="text-xs text-muted-foreground">STK push to phone</p>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-colors ${paymentMethod === 'CASH' ? 'border-primary border-2' : ''}`}
              onClick={() => setPaymentMethod('CASH')}
            >
              <CardContent className="pt-6 flex flex-col items-center gap-2 text-center">
                <Banknote className="w-8 h-8 text-primary" />
                <p className="font-medium">Cash</p>
                <p className="text-xs text-muted-foreground">Mark as paid</p>
              </CardContent>
            </Card>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={createBooking.isPending || confirmCashPayment.isPending}
            onClick={handleRegisterAndCharge}
          >
            {createBooking.isPending || confirmCashPayment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === 'CASH' ? (
              'Register & Mark as Paid'
            ) : (
              'Register & Send STK Push'
            )}
          </Button>

          <Button variant="outline" className="w-full" onClick={() => setStep('attendee')}>
            Back
          </Button>
        </div>
      )}

      {step === 'mpesa' && booking && (
        <MpesaPayment
          bookingReference={booking.booking_reference}
          amount={totalAmount}
          eventId={eventId}
          eventTitle={event.title}
          onSuccess={() => setStep('success')}
        />
      )}

      {step === 'success' && (
        <div className="space-y-4">
          <Card className="p-6 border-2 border-green-500 text-center">
            <p className="text-xl font-bold text-green-600">Registration Complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tickets are shown below and have been emailed to {attendee?.attendee_email}
            </p>
          </Card>

          {booking && booking.tickets.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isDownloadingAll}
                onClick={handleDownloadAll}
              >
                {isDownloadingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download {booking.tickets.length > 1 ? 'All Tickets' : 'Ticket'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isPrintingAll}
                onClick={handlePrintAll}
              >
                {isPrintingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Print {booking.tickets.length > 1 ? 'All Tickets' : 'Ticket'}
              </Button>
            </div>
          )}

          {booking?.tickets.map((ticket) => (
            <TicketCard
              key={ticket.ticket_code}
              ticket={ticket}
              eventTitle={event.title}
              eventDate={event.start_datetime}
              eventVenue={event.venue_name}
            />
          ))}

          <Button size="lg" className="w-full" onClick={handleReset}>
            Register Another Attendee
          </Button>
        </div>
      )}
    </div>
  );
}
