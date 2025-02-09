
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderEmailRequest {
  type: 'subscription' | 'medication';
  email: string;
  details: {
    total?: number;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, details } = await req.json() as OrderEmailRequest;
    console.log('Processing email request:', { type, email, details });

    let subject: string;
    let html: string;

    if (type === 'subscription') {
      subject = 'Welcome to Our Pharmacy Partner Program!';
      html = `
        <h1>Thank you for subscribing to our Pharmacy Partner Program!</h1>
        <p>Your subscription has been confirmed. Here are the details:</p>
        <ul>
          <li>Monthly subscription: €100</li>
          <li>Access to our digital platform and delivery network</li>
          <li>Priority customer support</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
      `;
    } else {
      // Medication order
      const itemsList = details.items?.map(item => 
        `<li>${item.name} x ${item.quantity} - €${(item.price * item.quantity).toFixed(2)}</li>`
      ).join('');

      subject = 'Your Medication Order Confirmation';
      html = `
        <h1>Thank you for your order!</h1>
        <p>Your order has been confirmed. Here are the details:</p>
        <ul>
          ${itemsList}
        </ul>
        <p>Delivery Fee: €5.00</p>
        <p><strong>Total: €${details.total?.toFixed(2)}</strong></p>
        <p>We will process your order and notify you when it's ready for delivery.</p>
      `;
    }

    console.log('Sending email with:', { subject, to: email });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Pharmacy App <orders@yourdomain.com>', // Replace with your verified domain
        to: [email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend API error:', error);
      
      // Check if it's a domain verification error
      if (error.includes('verify a domain')) {
        throw new Error('Email service not properly configured. Please verify your domain in Resend.');
      }
      
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-order-email function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "If you're seeing this in development, make sure you have verified your domain in Resend and updated the 'from' address."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);

