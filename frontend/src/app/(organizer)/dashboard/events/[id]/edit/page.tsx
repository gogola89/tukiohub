'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Plus, Edit, Trash, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { createEventSchema, eventCategories, CreateEventInput } from '@/lib/validations/event';
import { toDatetimeLocalInput } from '@/lib/utils';
import TicketTypeForm from '@/components/dashboard/tickets/TicketTypeForm';
import PromoCodeForm from '@/components/dashboard/promo-codes/PromoCodeForm';
import AddonForm from '@/components/dashboard/addons/AddonForm';
import EventImagesUpload from '@/components/dashboard/images/EventImagesUpload';
import { TicketType, PromoCode, EventAddon } from '@/types/event';
import { z } from 'zod';

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

// Extended schema for edit page
const editEventSchema = createEventSchema.extend({
  is_free: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  age_restriction: z.number().min(0).max(100).optional(),
});

type EditEventInput = z.infer<typeof editEventSchema>;

export default function EditEventPage({ params }: EditEventPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | undefined>();
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [promoFormOpen, setPromoFormOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | undefined>();
  const [addonFormOpen, setAddonFormOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<EventAddon | undefined>();
  const [formReady, setFormReady] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getEventById(eventId),
  });

  // Get promo codes and addons from event object (already included in event response)
  const promoCodes = event?.promo_codes || [];
  const addons = event?.addons || [];

  const form = useForm<EditEventInput>({
    resolver: zodResolver(editEventSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      category: 'OTHER' as any,
      start_datetime: '',
      end_datetime: '',
      is_online: false,
      venue_name: '',
      venue_address: '',
      online_url: '',
      capacity: 100,
      is_free: false,
      latitude: undefined,
      longitude: undefined,
      age_restriction: undefined,
    },
  });

  // Explicitly reset once the event loads, rather than relying on RHF's
  // `values` sync - the category Select wasn't reliably picking up the
  // synced value on first load. formReady then forces the Select to
  // remount (see key= below) so its initial value is read fresh, after
  // reset has already applied - not while the form was still mounted with
  // its pre-load defaults.
  useEffect(() => {
    if (!event) return;
    form.reset({
      title: event.title,
      description: event.description,
      category: event.category,
      start_datetime: toDatetimeLocalInput(event.start_datetime),
      end_datetime: toDatetimeLocalInput(event.end_datetime),
      is_online: event.is_online,
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      online_url: event.online_url || '',
      capacity: event.capacity,
      is_free: event.is_free || false,
      // latitude/longitude come back as strings (DRF serializes
      // DecimalField as string by default) - coerce to number or Zod
      // rejects them on submit.
      latitude: event.latitude !== undefined && event.latitude !== null ? Number(event.latitude) : undefined,
      longitude: event.longitude !== undefined && event.longitude !== null ? Number(event.longitude) : undefined,
      age_restriction: event.age_restriction,
    });
    setFormReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: (data: EditEventInput) => {
      const formattedData: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        start_datetime: new Date(data.start_datetime).toISOString(),
        end_datetime: new Date(data.end_datetime).toISOString(),
        capacity: data.capacity,
        venue_name: data.venue_name,
        venue_address: data.venue_address,
        is_free: data.is_free || false,
      };

      if (data.latitude !== undefined) formattedData.latitude = data.latitude;
      if (data.longitude !== undefined) formattedData.longitude = data.longitude;
      if (data.age_restriction !== undefined) formattedData.age_restriction = data.age_restriction;
      if (data.online_url) formattedData.online_url = data.online_url;

      return eventsAPI.updateEvent(eventId, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update event');
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('Uploading featured image:', file.name, file.type, file.size);
      return eventsAPI.uploadFeaturedImage(eventId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Featured image uploaded successfully');
      setFeaturedImageFile(null);
    },
    onError: (error: any) => {
      console.error('Featured image upload error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Failed to upload image';

      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.featured_image) {
          // Handle field-specific errors
          errorMessage = Array.isArray(error.response.data.featured_image)
            ? error.response.data.featured_image.join(', ')
            : error.response.data.featured_image;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }

      toast.error(errorMessage);
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (ticketId: string) => eventsAPI.deleteTicketType(eventId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Ticket type deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete ticket type');
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (promoId: string) => eventsAPI.deletePromoCode(eventId, promoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Promo code deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete promo code');
    },
  });

  const deleteAddonMutation = useMutation({
    mutationFn: (addonId: string) => eventsAPI.deleteAddon(eventId, addonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Add-on deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete add-on');
    },
  });

  const onSubmit = (data: EditEventInput) => {
    updateMutation.mutate(data);
  };

  const handleEditTicket = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setTicketFormOpen(true);
  };

  const handleAddTicket = () => {
    setSelectedTicket(undefined);
    setTicketFormOpen(true);
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (confirm('Are you sure you want to delete this ticket type? This action cannot be undone.')) {
      deleteTicketMutation.mutate(ticketId);
    }
  };

  const handleAddPromo = () => {
    setSelectedPromo(undefined);
    setPromoFormOpen(true);
  };

  const handleEditPromo = (promo: PromoCode) => {
    setSelectedPromo(promo);
    setPromoFormOpen(true);
  };

  const handleDeletePromo = (promoId: string) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      deletePromoMutation.mutate(promoId);
    }
  };

  const handleAddAddon = () => {
    setSelectedAddon(undefined);
    setAddonFormOpen(true);
  };

  const handleEditAddon = (addon: EventAddon) => {
    setSelectedAddon(addon);
    setAddonFormOpen(true);
  };

  const handleDeleteAddon = (addonId: string) => {
    if (confirm('Are you sure you want to delete this add-on?')) {
      deleteAddonMutation.mutate(addonId);
    }
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImageFile(file);
    }
  };

  const handleUploadFeaturedImage = () => {
    if (featuredImageFile) {
      uploadImageMutation.mutate(featuredImageFile);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load event. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const isOnline = form.watch('is_online');

  console.log('EditEventPage - event.images:', event?.images);
  console.log('EditEventPage - event.promo_codes:', event?.promo_codes);
  console.log('EditEventPage - event.addons:', event?.addons);

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/events">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">
              Edit event details and manage tickets
            </p>
          </div>
          <Badge className={event.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-gray-500'}>
            {event.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-2">
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Event Details</TabsTrigger>
          <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Featured Image</TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ticket Types</TabsTrigger>
          <TabsTrigger value="promos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Promo Codes</TabsTrigger>
          <TabsTrigger value="addons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Add-ons</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Event Images</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Update your event details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea rows={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select key={formReady ? 'category-ready' : 'category-loading'} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0) + category.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_free"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Free Event</FormLabel>
                          <FormDescription>
                            This is a free event (no tickets required)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age_restriction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Restriction</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="18"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? undefined : parseInt(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum age required (leave empty for all ages)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Date & Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_datetime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_datetime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is_online"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>This is an online event</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {isOnline ? (
                    <FormField
                      control={form.control}
                      name="online_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Online Event URL *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="venue_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="venue_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Address *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Full address including city and county (e.g., Harambee Ave, Nairobi)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Include street address, city, and county
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="-1.2864"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : parseFloat(value));
                                  }}
                                />
                              </FormControl>
                              <FormDescription>GPS coordinates</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longitude</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="36.8172"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : parseFloat(value));
                                  }}
                                />
                              </FormControl>
                              <FormDescription>GPS coordinates</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Capacity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? 0 : parseInt(value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>
                Upload a featured image for your event (required for publishing)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.featured_image && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Current Featured Image:</p>
                  <img
                    src={event.featured_image}
                    alt="Featured"
                    className="max-w-md rounded-lg border"
                  />
                </div>
              )}

              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageChange}
                />
                {featuredImageFile && (
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Selected: {featuredImageFile.name}
                    </p>
                    <Button
                      onClick={handleUploadFeaturedImage}
                      disabled={uploadImageMutation.isPending}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadImageMutation.isPending ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ticket Types</CardTitle>
                  <CardDescription>
                    Manage ticket types and pricing for your event
                  </CardDescription>
                </div>
                <Button onClick={handleAddTicket}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ticket Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {event.ticket_types && event.ticket_types.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.ticket_types.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.name}</TableCell>
                        <TableCell>KES {ticket.price.toLocaleString()}</TableCell>
                        <TableCell>{ticket.quantity_available}</TableCell>
                        <TableCell>{ticket.quantity_sold}</TableCell>
                        <TableCell>
                          <Badge variant={ticket.is_active ? 'default' : 'secondary'}>
                            {ticket.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTicket(ticket)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No ticket types yet. Add one to start selling tickets.
                  </p>
                  <Button onClick={handleAddTicket}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ticket Type
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promo Codes</CardTitle>
                  <CardDescription>
                    Create and manage discount codes for your event
                  </CardDescription>
                </div>
                <Button onClick={handleAddPromo}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Promo Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {promoCodes && promoCodes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promo: PromoCode) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-medium">{promo.code}</TableCell>
                        <TableCell>{promo.discount_type}</TableCell>
                        <TableCell>
                          {promo.discount_type === 'PERCENTAGE'
                            ? `${promo.discount_value}%`
                            : `KES ${promo.discount_value}`}
                        </TableCell>
                        <TableCell>
                          {promo.usage_count} / {promo.usage_limit || '∞'}
                        </TableCell>
                        <TableCell>
                          {new Date(promo.valid_until).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPromo(promo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePromo(promo.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No promo codes yet. Create one to offer discounts to your customers.
                  </p>
                  <Button onClick={handleAddPromo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Promo Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Add-ons</CardTitle>
                  <CardDescription>
                    Manage additional items or services for your event
                  </CardDescription>
                </div>
                <Button onClick={handleAddAddon}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Add-on
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {addons && addons.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addons.map((addon: EventAddon) => (
                      <TableRow key={addon.id}>
                        <TableCell className="font-medium">{addon.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {addon.description}
                        </TableCell>
                        <TableCell>KES {addon.price.toLocaleString()}</TableCell>
                        <TableCell>
                          {addon.quantity_available || 'Unlimited'}
                        </TableCell>
                        <TableCell>{addon.quantity_sold}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddon(addon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAddon(addon.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No add-ons yet. Create add-ons to offer extra items or services.
                  </p>
                  <Button onClick={handleAddAddon}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Add-on
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Event Images</CardTitle>
              <CardDescription>
                Upload additional images for your event gallery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventImagesUpload eventId={eventId} images={event.images} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TicketTypeForm
        key={selectedTicket?.id ?? 'new-ticket'}
        eventId={eventId}
        ticketType={selectedTicket}
        open={ticketFormOpen}
        onOpenChange={setTicketFormOpen}
      />

      <PromoCodeForm
        key={selectedPromo?.id ?? 'new-promo'}
        eventId={eventId}
        promoCode={selectedPromo}
        open={promoFormOpen}
        onOpenChange={setPromoFormOpen}
      />

      <AddonForm
        key={selectedAddon?.id ?? 'new-addon'}
        eventId={eventId}
        addon={selectedAddon}
        open={addonFormOpen}
        onOpenChange={setAddonFormOpen}
      />
    </div>
  );
}
