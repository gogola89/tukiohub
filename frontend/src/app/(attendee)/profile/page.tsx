'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendeesAPI } from '@/lib/api/endpoints/attendees';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Wallet, Plus, User, LogOut, Eye, EyeOff, Ticket as TicketIcon, Download, ExternalLink, CreditCard, Smartphone } from 'lucide-react';
import WalletTopUpTracker from '@/components/wallet/WalletTopUpTracker';
import WalletCardTopUp from '@/components/wallet/WalletCardTopUp';
import { Pagination } from '@/components/ui/pagination';
import { formatPhoneForBackend, formatPhoneForDisplay } from '@/lib/utils/phone';
import Link from 'next/link';

const addFundsSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  phone_number: z.string().regex(/^\+254\d{9}$/, 'Phone number must start with +254 and be 13 characters (e.g., +254712345678)').optional(),
  payment_method: z.enum(['MPESA', 'CARD']).default('MPESA'),
}).refine(
  (data) => {
    // If payment method is MPESA, phone_number is required
    if (data.payment_method === 'MPESA' && !data.phone_number) {
      return false;
    }
    return true;
  },
  {
    message: 'Phone number is required for M-Pesa payments',
    path: ['phone_number'],
  }
);

type AddFundsFormData = z.infer<typeof addFundsSchema>;

export default function AttendeeProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { attendee, isAuthenticated, logout, updateWalletBalance } = useAttendeeAuthStore();
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [walletBalanceVisible, setWalletBalanceVisible] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [showCardTopUp, setShowCardTopUp] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => attendeesAPI.getWallet(),
    enabled: isAuthenticated,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['attendee-tickets'],
    queryFn: () => attendeesAPI.getTickets(),
    enabled: isAuthenticated,
  });

  const form = useForm<AddFundsFormData>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: 0,
      phone_number: formatPhoneForDisplay(attendee?.phone_number) || '',
      payment_method: 'MPESA',
    },
  });

  const addFundsMutation = useMutation({
    mutationFn: (data: AddFundsFormData) => attendeesAPI.addFunds(data),
    onSuccess: (response) => {
      if (response.transaction_reference) {
        // M-Pesa payment initiated - show tracker
        setTransactionReference(response.transaction_reference);
        setTopUpAmount(form.getValues('amount'));
        toast.success('Payment initiated. Check your phone for M-Pesa prompt.');
      } else {
        // Non-M-Pesa payment or instant success
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        toast.success('Funds added successfully');
        setAddFundsOpen(false);
        form.reset();
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error
        || error.response?.data?.detail
        || 'Failed to add funds';
      toast.error(errorMessage);
    },
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleTopUpSuccess = () => {
    // Refresh wallet data and close dialog
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    toast.success('Wallet topped up successfully!');
    setTransactionReference(null);
    setAddFundsOpen(false);
    form.reset();
  };

  const handleTopUpFailure = () => {
    toast.error('Payment timeout. If you completed the payment, check your transaction history.');
  };

  const handleTopUpRetry = () => {
    setTransactionReference(null);
  };

  const onSubmit = (data: AddFundsFormData) => {
    if (data.payment_method === 'CARD') {
      // Show card top-up component
      setTopUpAmount(data.amount);
      setShowCardTopUp(true);
    } else {
      // M-Pesa payment - format phone number for backend (remove + prefix)
      const formattedData = {
        ...data,
        phone_number: data.phone_number ? formatPhoneForBackend(data.phone_number) : undefined,
      };
      addFundsMutation.mutate(formattedData);
    }
  };

  if (!isAuthenticated || !attendee) {
    return null; // Will redirect
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and wallet
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-medium">
                {attendee.first_name} {attendee.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg">{attendee.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="text-lg">{attendee.phone_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Newsletter</p>
              <p className="text-lg">
                {attendee.is_subscribed ? 'Subscribed' : 'Not subscribed'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <CardTitle>Wallet Balance</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWalletBalanceVisible(!walletBalanceVisible)}
                className="h-8 w-8"
              >
                {walletBalanceVisible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div>
                <p className="text-4xl font-bold text-primary">
                  {walletBalanceVisible
                    ? `KES ${walletData?.wallet_balance.toLocaleString() || '0'}`
                    : '•••••••'
                  }
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setAddFundsOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Funds
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Recent wallet transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : walletData?.transactions && walletData.transactions.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletData.transactions.slice(
                    (transactionPage - 1) * ITEMS_PER_PAGE,
                    transactionPage * ITEMS_PER_PAGE
                  ).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        transaction.transaction_type === 'DEPOSIT' ? 'bg-green-100 text-green-700' :
                        transaction.transaction_type === 'BOOKING' ? 'bg-blue-100 text-blue-700' :
                        transaction.transaction_type === 'REFUND' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right">
                      <span className={
                        ['DEPOSIT', 'REFUND', 'PROMO_CREDIT'].includes(transaction.transaction_type)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }>
                        {['DEPOSIT', 'REFUND', 'PROMO_CREDIT'].includes(transaction.transaction_type) ? '+' : '-'}
                        KES {parseFloat(transaction.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      KES {parseFloat(transaction.balance_after).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {walletData.transactions.length > ITEMS_PER_PAGE && (
              <div className="mt-4">
                <Pagination
                  currentPage={transactionPage}
                  totalPages={Math.ceil(walletData.transactions.length / ITEMS_PER_PAGE)}
                  onPageChange={setTransactionPage}
                  hasNext={transactionPage < Math.ceil(walletData.transactions.length / ITEMS_PER_PAGE)}
                  hasPrevious={transactionPage > 1}
                  totalCount={walletData.transactions.length}
                  pageSize={ITEMS_PER_PAGE}
                />
              </div>
            )}
          </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Tickets */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            <CardTitle>My Tickets</CardTitle>
          </div>
          <CardDescription>
            Your purchased event tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : ticketsData?.tickets && ticketsData.tickets.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketsData.tickets.slice(
                    (ticketsPage - 1) * ITEMS_PER_PAGE,
                    ticketsPage * ITEMS_PER_PAGE
                  ).map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/events/${ticket.event.slug}`}
                            className="font-medium hover:underline"
                          >
                            {ticket.event.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ticket.event.start_datetime), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.ticket_type.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {ticket.ticket_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'USED' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/booking/${ticket.booking_reference}`}>
                            <Button variant="outline" size="sm">
                              View Ticket
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {ticketsData.tickets.length > ITEMS_PER_PAGE && (
                <div className="mt-4">
                  <Pagination
                    currentPage={ticketsPage}
                    totalPages={Math.ceil(ticketsData.tickets.length / ITEMS_PER_PAGE)}
                    onPageChange={setTicketsPage}
                    hasNext={ticketsPage < Math.ceil(ticketsData.tickets.length / ITEMS_PER_PAGE)}
                    hasPrevious={ticketsPage > 1}
                    totalCount={ticketsData.tickets.length}
                    pageSize={ITEMS_PER_PAGE}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tickets yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onOpenChange={(open) => {
        setAddFundsOpen(open);
        if (!open) {
          setTransactionReference(null);
          setShowCardTopUp(false);
          form.reset();
        }
      }}>
        <DialogContent>
          {showCardTopUp ? (
            <>
              <DialogHeader>
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogDescription>
                  Pay with your credit or debit card
                </DialogDescription>
              </DialogHeader>
              <WalletCardTopUp
                amount={topUpAmount}
                onSuccess={handleTopUpSuccess}
                onCancel={() => {
                  setShowCardTopUp(false);
                  form.reset();
                }}
              />
            </>
          ) : transactionReference ? (
            <>
              <DialogHeader>
                <DialogTitle>Processing Payment</DialogTitle>
                <DialogDescription>
                  Check your phone for M-Pesa prompt
                </DialogDescription>
              </DialogHeader>
              <WalletTopUpTracker
                transactionReference={transactionReference}
                amount={topUpAmount}
                onSuccess={handleTopUpSuccess}
                onFailure={handleTopUpFailure}
                onRetry={handleTopUpRetry}
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogDescription>
                  Top up your wallet to pay for event bookings
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MPESA">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <span>M-Pesa</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="CARD">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Credit/Debit Card</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('payment_method') === 'MPESA' && (
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M-Pesa Phone Number *</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="712 345 678"
                          error={!!form.formState.errors.phone_number}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddFundsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addFundsMutation.isPending}>
                  {addFundsMutation.isPending ? 'Processing...' : 'Continue'}
                </Button>
              </div>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
