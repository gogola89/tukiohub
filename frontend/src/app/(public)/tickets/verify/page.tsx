import { Metadata } from 'next';
import TicketVerification from '@/components/tickets/TicketVerification';
import { Ticket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Ticket | TukioHub',
  description: 'Verify the authenticity of event tickets',
};

/**
 * Ticket Verification Page
 * Public page for verifying tickets by entering ticket code or scanning QR
 */
export default function VerifyTicketPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ticket Verification
          </h1>
          <p className="text-gray-600">
            Verify the authenticity and validity of event tickets
          </p>
        </div>

        {/* Verification Component */}
        <TicketVerification />

        {/* Information Section */}
        <div className="mt-8 bg-white rounded-lg border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            How Ticket Verification Works
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <p>
                Enter the ticket code found on the ticket or scan the QR code
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <p>
                The system will check if the ticket is valid and has not been used
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <p>
                View ticket details including event information and attendee name
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                4
              </div>
              <p>
                Organizers can check in tickets to mark them as used
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Security Notice:</strong> Each ticket has a unique code and QR
            code. If a ticket shows as invalid or already used, please contact the
            event organizer immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
