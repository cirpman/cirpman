
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { worker } from '@/lib/worker';
import { useAuth } from '@/components/auth/AuthContext';

const visitorSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  personVisiting: z.string().min(1, 'Person to Visit is required'),
  department: z.string().optional(),
  purposeOfVisit: z.string().optional(),
  hasPackages: z.boolean().default(false),
  hasBeenBefore: z.boolean().default(false),
  notes: z.string().optional(),
  confirmPolicy: z.boolean().refine((val) => val === true, {
    message: 'You must confirm and agree to the policy.',
  }),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

const VisitorLogPage = () => {
  const { toast } = useToast();
  const form = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      fullName: '',
      company: '',
      email: '',
      phone: '',
      personVisiting: '',
      department: '',
      purposeOfVisit: '',
      hasPackages: false,
      hasBeenBefore: false,
      notes: '',
      confirmPolicy: false,
    },
  });

  const onSubmit = async (data: VisitorFormData) => {
    try {
      const response = await worker.post('/api/visitors', {
        full_name: data.fullName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        person_visiting: data.personVisiting,
        department: data.department,
        purpose_of_visit: data.purposeOfVisit,
        has_packages: data.hasPackages,
        has_been_before: data.hasBeenBefore,
        notes: data.notes,
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      toast({
        title: 'Visitor Signed In',
        description: 'The visitor has been successfully logged.',
      });
      form.reset();
      // TODO: Refresh the current visitors list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in visitor. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Visitor Log</CardTitle>
          <CardDescription>
            Please fill out the form to log a new visitor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="ACME Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="visitor@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <h3 className="text-lg font-medium pt-4">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="personVisiting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person Visiting</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Sales" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                <FormField
                  control={form.control}
                  name="purposeOfVisit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Visit</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Meeting about project X..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <h3 className="text-lg font-medium pt-4">Additional Information</h3>
                <FormField
                  control={form.control}
                  name="hasPackages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                           Do you have any packages or deliveries?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasBeenBefore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Have you been here before?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
              <h3 className="text-lg font-medium pt-4">Confirmation</h3>
               <FormField
                  control={form.control}
                  name="confirmPolicy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I confirm that the information provided above is accurate and I agree to abide by the company's visitor policy.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* TODO: Add Current Visitors List */}
    </div>
  );
};

export default VisitorLogPage;
