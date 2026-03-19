import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { postgresService } from "../../../shared/services/postgresService.ts";

const router = new Router();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Create delivery payment endpoint - replaces create-delivery-payment
router.post("/api/create-delivery-payment", async (ctx) => {
  try {
    // Get the session or user object
    const authHeader = ctx.request.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    // For now, we'll extract user info from the token (you might want to validate this properly)
    const token = authHeader.replace("Bearer ", "");

    // TODO: Validate the JWT token properly
    const userEmail = "user@example.com"; // This should be extracted from the validated JWT

    if (!userEmail) {
      throw new Error("Unauthorized or no email found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Parse the request body
    const body = await ctx.request.body().value;
    const { items, comment } = body;
    console.log("Processing items:", items);

    // Create line items with explicit currency
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "eur", // Set currency to EUR
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee as a separate line item with explicit currency
    const deliveryFee = {
      price_data: {
        currency: "eur", // Set currency to EUR
        product_data: {
          name: "Delivery Fee",
        },
        unit_amount: 500, // 5.00€ delivery fee
      },
      quantity: 1,
    };

    lineItems.push(deliveryFee);

    // Calculate total including delivery fee
    const total =
      items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0,
      ) + 5; // Add 5€ delivery fee

    console.log("Creating checkout session...");
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: lineItems,
      mode: "payment",
      metadata: {
        comment: comment || "",
      },
      success_url: `${ctx.request.headers.get("origin")}/my-orders?payment=success`,
      cancel_url: `${ctx.request.headers.get("origin")}/my-orders?payment=cancelled`,
    });

    // Send order confirmation email using our email service
    try {
      await fetch("http://localhost:8000/api/send-templated-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateName: "medication-order",
          recipientEmail: userEmail,
          variables: {
            items,
            total,
            SiteURL: ctx.request.headers.get("origin") || "",
            DeliveryFee: 5.0,
          },
        }),
      });
    } catch (emailError) {
      console.error("Error sending order confirmation email:", emailError);
      // Don't throw here, we still want to return the checkout session
    }

    console.log("Checkout session created:", session.id);
    ctx.response.status = 200;
    ctx.response.body = { url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Create pharmacy subscription endpoint - replaces create-pharmacy-subscription
router.post("/api/create-pharmacy-subscription", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    // TODO: Validate JWT and get user info
    const userEmail = "user@example.com"; // Extract from validated JWT
    const userId = "user-id"; // Extract from validated JWT

    if (!userEmail) {
      throw new Error("No email found");
    }

    // Verify user is a pharmacist using Postgres
    const client = await postgresService.getClient();
    const profileResult = await client.queryObject(
      "SELECT role FROM profiles WHERE id = $1",
      [userId],
    );
    postgresService.releaseClient(client);

    if (!profileResult.rows[0] || profileResult.rows[0].role !== "pharmacist") {
      throw new Error("Only pharmacists can subscribe to this plan");
    }

    // Get pharmacy ID associated with this user
    const client2 = await postgresService.getClient();
    const userPharmacyResult = await client2.queryObject(
      "SELECT pharmacy_id FROM user_pharmacies WHERE user_id = $1",
      [userId],
    );
    postgresService.releaseClient(client2);

    const pharmacyId = userPharmacyResult.rows[0]?.pharmacy_id;
    if (!pharmacyId) {
      throw new Error("No pharmacy associated with this user");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customer_id = undefined;
    if (customers.data.length > 0) {
      customer_id = customers.data[0].id;
      // Check if already subscribed
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: "active",
        price: "price_1QfDc2A1DaoRGs36hsqAfkEG",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        // If already subscribed, mark pharmacy as endorsed
        const client3 = await postgresService.getClient();
        await client3.queryObject(
          "UPDATE pharmacies SET endorsed = true WHERE id = $1",
          [pharmacyId],
        );
        postgresService.releaseClient(client3);

        throw new Error("Already subscribed to the Pharmacy Partner Plan");
      }
    }

    console.log("Creating pharmacy subscription session...");
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      customer_email: customer_id ? undefined : userEmail,
      line_items: [
        {
          price: "price_1QfDc2A1DaoRGs36hsqAfkEG", // Pharmacy Partner Plan
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${ctx.request.headers.get("origin")}/settings?subscription=success&pharmacy_id=${pharmacyId}`,
      cancel_url: `${ctx.request.headers.get("origin")}/settings?subscription=cancelled`,
      metadata: {
        pharmacy_id: pharmacyId,
        user_id: userId,
      },
    });

    // Send confirmation email
    try {
      await fetch("http://localhost:8000/api/send-order-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          type: "subscription",
          email: userEmail,
          details: {
            pharmacy_id: pharmacyId,
          },
        }),
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    console.log("Subscription session created:", session.id);
    ctx.response.status = 200;
    ctx.response.body = { url: session.url };
  } catch (error) {
    console.error("Error creating subscription session:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Stripe webhook endpoint - replaces stripe-webhook
router.post("/api/stripe-webhook", async (ctx) => {
  const stripeSignature = ctx.request.headers.get("stripe-signature");
  if (!stripeSignature) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Stripe signature missing" };
    return;
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get the raw request body
    const body = await ctx.request.body({ type: "text" }).value;

    // Construct the event using the signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(
          body,
          stripeSignature,
          webhookSecret,
        );
      } else {
        // Fallback for development or when webhook secret is not set
        event = JSON.parse(body);
        console.warn(
          "Webhook secret not set, proceeding with unverified event",
        );
      }
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      ctx.response.status = 400;
      ctx.response.body = { error: `Webhook Error: ${err.message}` };
      return;
    }

    console.log(`Event received: ${event.type}`);

    // Handle different event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Get pharmacy ID from metadata
      const pharmacyId = session.metadata?.pharmacy_id;

      if (pharmacyId) {
        // Update pharmacy endorsed status
        const client = await postgresService.getClient();
        await client.queryObject(
          "UPDATE pharmacies SET endorsed = true WHERE id = $1",
          [pharmacyId],
        );
        postgresService.releaseClient(client);

        console.log(`Pharmacy ${pharmacyId} marked as endorsed successfully`);
      } else {
        // Handle product order completion
        console.log(
          "Order completed successfully, customer data:",
          session.customer_details,
        );

        // Record the completed order if needed
        try {
          if (session.customer_details?.email) {
            const client = await postgresService.getClient();
            const userResult = await client.queryObject(
              "SELECT id FROM profiles WHERE email = $1",
              [session.customer_details.email],
            );

            if (userResult.rows.length > 0) {
              console.log("Found user for order:", userResult.rows[0].id);
              // Add code here to update order status if needed
            }
            postgresService.releaseClient(client);
          }
        } catch (dbError) {
          console.error("Error recording completed order:", dbError);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Handle subscription cancellation
      console.log(
        "Subscription deleted, pharmacy should be marked as not endorsed",
      );
    }

    ctx.response.status = 200;
    ctx.response.body = { received: true };
  } catch (error) {
    console.error("Error processing webhook:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

export default router;
