'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
  createEventSchema,
  eventCategories,
  CreateEventInput,
} from '@/lib/validations/event';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const steps = [
  { id: 1, name: 'Basic Info', description: 'Event details and category' },
  { id: 2, name: 'Date & Location', description: 'When and where' },
  { id: 3, name: 'Capacity', description: 'Event capacity settings' },
];

export default function CreateEventForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      category: undefined,
      start_datetime: '',
      end_datetime: '',
      is_online: false,
      venue_name: '',
      venue_address: '',
      online_url: '',
      capacity: 100,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: CreateEventInput) => {
      console.log('Sending to API:', data);
      return eventsAPI.createEvent(data);
    },
    onSuccess: (event) => {
      console.log('Event created successfully:', event);
      toast.success('Event created successfully!');
      router.push(`/dashboard/events/${event.id}/edit`);
    },
    onError: (error: any) => {
      console.error('Full API Error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);

      let errorMessage = 'Failed to create event';

      // Handle 403 Forbidden - likely organizer not approved
      if (error.response?.status === 403) {
        errorMessage = 'Your organizer account needs to be approved by an administrator before you can create events. Please contact support for assistance.';
        toast.error(errorMessage, {duration: 8000});
        return;
      }

      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: CreateEventInput) => {
    console.log('Form submitted with data:', data);

    // Format data to match backend API requirements
    const formattedData: any = {
      title: data.title,
      description: data.description,
      category: data.category,
      start_datetime: new Date(data.start_datetime).toISOString(),
      end_datetime: new Date(data.end_datetime).toISOString(),
      capacity: data.capacity,
      status: 'DRAFT', // Always create as draft
      is_free: false, // Default to not free (tickets will have prices)
    };

    // Add venue information
    if (data.is_online) {
      // For online events, use a placeholder venue
      formattedData.venue_name = 'Online Event';
      formattedData.venue_address = data.online_url || 'Virtual';
    } else {
      // For in-person events, use venue details as entered
      formattedData.venue_name = data.venue_name;
      formattedData.venue_address = data.venue_address;
    }

    console.log('Formatted data for API:', formattedData);
    createEventMutation.mutate(formattedData);
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    toast.error('Please fix the errors in the form before submitting');
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateEventInput)[] = [];

    console.log('Next step clicked. Current step:', currentStep);

    if (currentStep === 1) {
      fieldsToValidate = ['title', 'description', 'category'];
    } else if (currentStep === 2) {
      // Validate date fields for all events
      fieldsToValidate = ['start_datetime', 'end_datetime'];

      // Get the current is_online value
      const isOnline = form.getValues('is_online');

      // Add conditional validation based on event type
      if (isOnline) {
        fieldsToValidate.push('online_url');
      } else {
        fieldsToValidate.push('venue_name', 'venue_address');
      }
    } else if (currentStep === 3) {
      fieldsToValidate = ['capacity'];
    }

    console.log('Validating fields:', fieldsToValidate);
    const isValid = await form.trigger(fieldsToValidate);
    console.log('Validation result:', isValid);

    if (isValid && currentStep < steps.length) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      console.log('Validation errors:', form.formState.errors);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isOnline = form.watch('is_online');

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep > step.id
                    ? 'bg-primary border-primary text-primary-foreground'
                    : currentStep === step.id
                    ? 'border-primary text-primary'
                    : 'border-gray-300 text-gray-300'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.name}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={(e) => {
            // Only allow submission on the final step
            if (currentStep < steps.length) {
              e.preventDefault();
              return;
            }
            form.handleSubmit(onSubmit, onError)(e);
          }}
          className="space-y-6"
        >
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the basic details about your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter event title"
                          {...field}
                        />
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
                        <Textarea
                          placeholder="Describe your event"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of what attendees can expect
                      </FormDescription>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
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
              </CardContent>
            </Card>
          )}

          {/* Step 2: Date & Location */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Date & Location</CardTitle>
                <CardDescription>
                  When and where will your event take place?
                </CardDescription>
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
                        <FormDescription>
                          Check this if your event will be held online
                        </FormDescription>
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
                          <Input
                            placeholder="https://zoom.us/j/..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to your online event (Zoom, Teams, etc.)
                        </FormDescription>
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
                            <Input
                              placeholder="e.g., Kenyatta International Convention Centre"
                              {...field}
                            />
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
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Capacity */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Capacity</CardTitle>
                <CardDescription>
                  Set the maximum number of attendees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Capacity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : parseInt(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Total number of attendees allowed for this event
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  nextStep();
                }}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                onClick={async (e) => {
                  // Trigger validation for all fields before submit
                  const isValid = await form.trigger();
                  if (!isValid) {
                    e.preventDefault();
                    console.log('Form validation failed. Errors:', form.formState.errors);
                    toast.error('Please check all required fields');
                  }
                }}
              >
                {createEventMutation.isPending
                  ? 'Creating...'
                  : 'Create Event'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
