/**
 * Stripe Service
 * Handles all Stripe payment and subscription operations
 *
 * FIXED: Uses postgresService instead of old db connection
 */

import Stripe from "https://esm.sh/stripe@14.21.0";
import { postgresService } from "../../../shared/services/postgresService.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

export interface CreatePharmacyCheckoutParams {
  userId: string;
  pharmacyId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

export interface ProcessWebhookParams {
  body: string;
  signature: string;
}

export class StripeService {
  /**
   * Create a Stripe checkout session for pharmacy subscription
   */
  async createPharmacyCheckoutSession(
    params: CreatePharmacyCheckoutParams,
  ): Promise<Stripe.Checkout.Session> {
    const { userId, pharmacyId, email, successUrl, cancelUrl } = params;

    // 1. Verify user is a pharmacist
    const userResult = await postgresService.query(
      `SELECT role FROM public.users WHERE id = $1`,
      [userId],
    );

    if (!userResult.rows[0]) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0] as unknown as { role: string };

    if (user.role !== "pharmacist") {
      throw new Error("Only pharmacists can subscribe to pharmacy plans");
    }

    // 2. Check for existing Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    let customerId: string | undefined;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;

      // 3. Check for existing active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        price: Deno.env.get("STRIPE_PHARMACY_PRICE_ID")!,
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        // Mark pharmacy as endorsed (subscription already exists)
        await postgresService.query(
          `UPDATE pharmacies SET endorsed = true WHERE id = $1`,
          [pharmacyId],
        );

        throw new Error("Already subscribed to the Pharmacy Partner Plan");
      }
    }

    // 4. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: Deno.env.get("STRIPE_PHARMACY_PRICE_ID")!,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        pharmacy_id: pharmacyId,
        user_id: userId,
      },
    });

    console.log(`✅ Stripe checkout session created: ${session.id}`);
    return session;
  }

  /**
   * Verify and construct Stripe webhook event
   */
  async constructWebhookEvent(
    params: ProcessWebhookParams,
  ): Promise<Stripe.Event> {
    const { body, signature } = params;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set, skipping verification");
      return JSON.parse(body);
    }

    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
      return event;
    } catch (err) {
      console.error(`❌ Webhook signature verification failed:`, err);
      throw new Error(`Webhook verification failed: ${err.message}`);
    }
  }

  /**
   * Mark pharmacy as endorsed after successful subscription
   */
  async markPharmacyAsEndorsed(pharmacyId: string): Promise<void> {
    const result = await postgresService.query(
      `UPDATE pharmacies SET endorsed = true WHERE id = $1 RETURNING id`,
      [pharmacyId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    console.log(`✅ Pharmacy ${pharmacyId} marked as endorsed`);
  }

  /**
   * Mark pharmacy as not endorsed after subscription cancellation
   */
  async markPharmacyAsNotEndorsed(pharmacyId: string): Promise<void> {
    const result = await postgresService.query(
      `UPDATE pharmacies SET endorsed = false WHERE id = $1 RETURNING id`,
      [pharmacyId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    console.log(`✅ Pharmacy ${pharmacyId} marked as not endorsed`);
  }

  /**
   * Find pharmacy by customer email (for subscription cancellation)
   */
  async findPharmacyByCustomerEmail(email: string): Promise<string | null> {
    const result = await postgresService.query(
      `
      SELECT p.id 
      FROM pharmacies p
      JOIN user_pharmacies up ON up.pharmacy_id = p.id
      JOIN public.users u ON u.id = up.user_id
      WHERE u.email = $1
      LIMIT 1
    `,
      [email],
    );

    const row = result.rows[0] as unknown as { id: string } | undefined;
    return row?.id || null;
  }

  /**
   * Get customer email from Stripe customer ID
   */
  async getCustomerEmail(customerId: string): Promise<string | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);

      if ("email" in customer && customer.email) {
        return customer.email;
      }

      return null;
    } catch (error) {
      console.error(`Error retrieving customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Record completed order in database
   */
  async recordCompletedOrder(params: {
    sessionId: string;
    customerEmail: string;
    amount: number;
  }): Promise<void> {
    const { sessionId, customerEmail, amount } = params;

    // Find user by email
    const userResult = await postgresService.query(
      `SELECT id FROM public.users WHERE email = $1`,
      [customerEmail],
    );

    if (!userResult.rows[0]) {
      console.warn(`User not found for email: ${customerEmail}`);
      return;
    }

    const user = userResult.rows[0] as unknown as { id: string };
    const userId = user.id;

    // Record order (adjust table name/columns as needed for your schema)
    await postgresService.query(
      `
      INSERT INTO orders (user_id, stripe_session_id, amount, status, created_at)
      VALUES ($1, $2, $3, 'completed', NOW())
    `,
      [userId, sessionId, amount],
    );

    console.log(
      `✅ Order recorded for user ${userId}, amount: ${amount / 100}`,
    );
  }

  /**
   * Create a payment intent (for direct payments, not subscriptions)
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const { amount, currency, customerId, metadata } = params;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);
    return paymentIntent;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    console.log(`✅ Subscription cancelled: ${subscriptionId}`);
    return subscription;
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * List all subscriptions for a customer
   */
  async listCustomerSubscriptions(
    customerId: string,
  ): Promise<Stripe.Subscription[]> {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    return subscriptions.data;
  }
}

// Export singleton instance
export const stripeService = new StripeService();
