'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  category: z.enum([
    'order_inquiry',
    'shipping_issue',
    'refund_request',
    'product_question',
    'vendor_support',
    'technical_issue',
    'account_help',
    'other',
  ]),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  orderNumber: z.string().optional(),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

const categoryLabels = {
  order_inquiry: 'Order Inquiry',
  shipping_issue: 'Shipping Issue',
  refund_request: 'Refund Request',
  product_question: 'Product Question',
  vendor_support: 'Vendor Support',
  technical_issue: 'Technical Issue',
  account_help: 'Account Help',
  other: 'Other',
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      category: 'other',
      subject: '',
      message: '',
      orderNumber: '',
    },
  })

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Support ticket submitted successfully!')
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit ticket')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your support ticket has been submitted successfully. Our team will review your 
              inquiry and respond within 24-48 hours.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>A confirmation email has been sent to your email address.</p>
              <p>Ticket ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
            <Button onClick={() => setIsSubmitted(false)}>
              Submit Another Ticket
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground">
          We're here to help! Reach out to us with any questions or concerns.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Contact Information Cards */}
        <Card>
          <CardHeader>
            <Mail className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              General Inquiries:
            </p>
            <a href="mailto:support@minalesh.et" className="text-primary hover:underline">
              support@minalesh.et
            </a>
            <p className="text-sm text-muted-foreground mt-3 mb-2">
              Vendor Support:
            </p>
            <a href="mailto:vendors@minalesh.et" className="text-primary hover:underline">
              vendors@minalesh.et
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Phone className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Customer Support:
            </p>
            <a href="tel:+251111234567" className="text-primary hover:underline">
              +251-11-123-4567
            </a>
            <p className="text-sm text-muted-foreground mt-3 mb-2">
              Vendor Hotline:
            </p>
            <a href="tel:+251111234568" className="text-primary hover:underline">
              +251-11-123-4568
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Clock className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Business Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              <strong>Monday - Friday</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              8:00 AM - 6:00 PM (EAT)
            </p>
            <p className="text-sm mb-2">
              <strong>Saturday</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              9:00 AM - 4:00 PM (EAT)
            </p>
            <p className="text-sm text-muted-foreground">
              Closed on Sundays and Public Holidays
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
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
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+251-XXX-XXXX" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Number (If applicable)</FormLabel>
                      <FormControl>
                        <Input placeholder="ORD-123456" {...field} />
                      </FormControl>
                      <FormDescription>
                        Include your order number for faster assistance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your inquiry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about your inquiry..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 20 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Office Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                <strong>Minalesh Marketplace</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Bole Road, Atlas Building<br />
                5th Floor, Office 502<br />
                Addis Ababa, Ethiopia
              </p>
              <p className="text-sm text-muted-foreground">
                P.O. Box: 12345
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/help/faq" className="block text-primary hover:underline">
                📚 Frequently Asked Questions
              </a>
              <a href="/legal/terms" className="block text-primary hover:underline">
                📄 Terms of Service
              </a>
              <a href="/legal/privacy" className="block text-primary hover:underline">
                🔒 Privacy Policy
              </a>
              <a href="/about" className="block text-primary hover:underline">
                ℹ️ About Minalesh
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expected Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="font-semibold mr-2 min-w-[120px]">Order Issues:</span>
                  <span className="text-muted-foreground">2-4 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 min-w-[120px]">General Inquiries:</span>
                  <span className="text-muted-foreground">24-48 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 min-w-[120px]">Technical Issues:</span>
                  <span className="text-muted-foreground">12-24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 min-w-[120px]">Vendor Support:</span>
                  <span className="text-muted-foreground">4-8 hours</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
