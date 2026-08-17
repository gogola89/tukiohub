import { Metadata } from 'next';
import TicketVerification from '@/components/tickets/TicketVerification';

export const metadata: Metadata = {
  title: 'Verify Tickets | TukioHub',
  description: 'Verify the authenticity of event tickets',
};

export default function DashboardVerifyTicketPage() {
  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verify Tickets</h1>
        <p className="text-muted-foreground">
          Scan a QR code or enter a ticket code to check validity and check in attendees
        </p>
      </div>

      <TicketVerification />
    </div>
  );
}
