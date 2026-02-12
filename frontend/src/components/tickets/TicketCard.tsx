'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, ticketsAPI } from '@/lib/api/endpoints/tickets';
import { toast } from 'sonner';
import TicketQRCode from './TicketQRCode';
import TicketTransferForm from './TicketTransferForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TicketCardProps {
  ticket: Ticket;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  onTransferSuccess?: () => void;
}

/**
 * TicketCard component
 * Displays a single ticket with QR code, status, and actions
 */
export default function TicketCard({
  ticket,
  eventTitle,
  eventDate,
  eventVenue,
  onTransferSuccess,
}: TicketCardProps) {
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'USED':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Clock className="w-3 h-3 mr-1" />
            Used
          </Badge>
        );
      case 'TRANSFERRED':
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <Send className="w-3 h-3 mr-1" />
            Transferred
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Call the API to download the PDF
      const blob = await ticketsAPI.downloadTicket(ticket.ticket_code);

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.ticket_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Ticket PDF downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download ticket PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTransferSuccess = () => {
    setIsTransferDialogOpen(false);
    if (onTransferSuccess) {
      onTransferSuccess();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Code Section */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div id={`qr-${ticket.ticket_code}`}>
            <TicketQRCode ticketCode={ticket.ticket_code} size={180} />
          </div>
          <div className="mt-3">{getStatusBadge()}</div>
        </div>

        {/* Ticket Details Section */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* Event Info */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{eventTitle}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(eventDate), 'PPP p')}
              </p>
              <p className="text-sm text-gray-600">{eventVenue}</p>
            </div>

            {/* Ticket Type */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Ticket Type</p>
                  <p className="font-semibold text-gray-900">{ticket.ticket_type.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Price</p>
                  <p className="font-semibold text-gray-900">
                    KES {ticket.ticket_type.price?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendee Info */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Attendee</p>
                  <p className="font-semibold text-gray-900">{ticket.attendee_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="font-semibold text-gray-900 text-sm break-all">
                    {ticket.attendee_email}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Details */}
            {ticket.status === 'USED' && ticket.used_at && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase">Checked In</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(ticket.used_at), 'PPP p')}
                </p>
              </div>
            )}

            {ticket.status === 'TRANSFERRED' && ticket.transferred_to && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase">Transferred To</p>
                <p className="font-semibold text-gray-900">{ticket.transferred_to}</p>
              </div>
            )}

            {/* Actions */}
            {ticket.status === 'ACTIVE' && (
              <div className="border-t pt-4 flex gap-2">
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>

                <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Send className="w-4 h-4 mr-2" />
                      Transfer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Ticket</DialogTitle>
                    </DialogHeader>
                    <TicketTransferForm
                      ticketCode={ticket.ticket_code}
                      onSuccess={handleTransferSuccess}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
