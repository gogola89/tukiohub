'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ticketsAPI, Ticket } from '@/lib/api/endpoints/tickets';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, Printer, Loader2 } from 'lucide-react';
import TicketCard from '@/components/tickets/TicketCard';

const STATUS_BADGE: Record<Ticket['status'], string> = {
  ACTIVE: 'bg-green-500',
  USED: 'bg-blue-500',
  TRANSFERRED: 'bg-purple-500',
  CANCELLED: 'bg-gray-500',
};

export default function TicketsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [printingCode, setPrintingCode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-search', query],
    queryFn: () => ticketsAPI.searchTickets(query),
  });

  const tickets = data?.results || [];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
  };

  const handleDownload = async (ticket: Ticket) => {
    setDownloadingCode(ticket.ticket_code);
    try {
      const blob = await ticketsAPI.downloadTicket(ticket.ticket_code);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.ticket_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download ticket');
    } finally {
      setDownloadingCode(null);
    }
  };

  const handlePrint = async (ticket: Ticket) => {
    setPrintingCode(ticket.ticket_code);
    try {
      const blob = await ticketsAPI.downloadTicket(ticket.ticket_code);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Failed to open ticket for printing');
    } finally {
      setPrintingCode(null);
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <p className="text-muted-foreground">
          Search tickets across your events by code or attendee name
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
        <Input
          placeholder="Search by ticket code or attendee name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </form>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {!isLoading && tickets.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {query ? 'No tickets match your search.' : 'No tickets yet.'}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-mono font-semibold">{ticket.ticket_code}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.attendee_name}
                  {ticket.event?.title && <> &middot; {ticket.event.title}</>}
                  {' '}&middot; {ticket.ticket_type.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_BADGE[ticket.status]}>{ticket.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={downloadingCode === ticket.ticket_code}
                  onClick={() => handleDownload(ticket)}
                  title="Download PDF"
                >
                  {downloadingCode === ticket.ticket_code ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={printingCode === ticket.ticket_code}
                  onClick={() => handlePrint(ticket)}
                  title="Print"
                >
                  {printingCode === ticket.ticket_code ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <TicketCard
              ticket={selectedTicket}
              eventTitle={selectedTicket.event?.title || 'Event'}
              eventDate={selectedTicket.event?.start_datetime || selectedTicket.created_at}
              eventVenue={selectedTicket.event?.venue || ''}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
