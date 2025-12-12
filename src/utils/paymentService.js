import Stripe from "stripe";



let stripeInstance;

const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

/**
 * Process a payment using Stripe
 * @param {Object} paymentData - Payment data
 * @returns {Object} Payment result
 */
export const processPayment = async (paymentData) => {
  const stripe = getStripe();
  try {
    const { amount, currency = "usd", paymentMethodId, bookingId, customerId, artistId, artistStripeAccountId } = paymentData;

    // Calculate platform fee (e.g., 10%)
    const platformFeePercent = 0.10;
    const applicationFeeAmount = Math.round(amount * 100 * platformFeePercent);

    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        bookingId: bookingId.toString(),
        customerId: customerId.toString(),
        artistId: artistId.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    if (paymentMethodId) {
      paymentIntentData.payment_method = paymentMethodId;
      paymentIntentData.confirm = true;
      paymentIntentData.return_url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${bookingId}/payment/success`;
    }

    // If artist has a connected Stripe account, use destination charges or direct charges
    // Here we use destination charges (on_behalf_of or transfer_data)
    if (artistStripeAccountId) {
      paymentIntentData.transfer_data = {
        destination: artistStripeAccountId,
      };
      paymentIntentData.application_fee_amount = applicationFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return {
      success: true,
      transactionId: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret, // For frontend to handle next actions if needed
      data: paymentIntent,
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const refundPayment = async (transactionId, amount) => {
  const stripe = getStripe();
  try {
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
    };
  } catch (error) {
    console.error("Refund error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const verifyPayment = async (transactionId) => {
  const stripe = getStripe();
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      data: paymentIntent,
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
