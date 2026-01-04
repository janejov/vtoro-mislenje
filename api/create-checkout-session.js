// Stripe Checkout Session API endpoint for Vtoro Mislenje
// Creates a Stripe checkout session for payment

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (for CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Creating checkout session...');

    // Check for Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found');
      return res.status(500).json({
        error: 'Stripe not configured',
        hint: 'Set STRIPE_SECRET_KEY in Vercel environment variables'
      });
    }

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      plan,
      price,
      planName,
      userEmail,
      userId,
      questionTitle
    } = req.body;

    // Validate required fields
    if (!plan || !price || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['plan', 'price', 'userEmail']
      });
    }

    // Define success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com';
    const successUrl = `${baseUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}?payment_cancelled=true`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'mkd',
            product_data: {
              name: `Второ мислење - ${planName}`,
              description: `Медицинска консултација - План: ${planName}`,
              images: ['https://vtoromislenje.com/logo.png'], // Optional: Add your logo URL
            },
            unit_amount: price * 100, // Stripe expects amount in smallest currency unit (deni for MKD)
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: plan,
        userId: userId,
        questionTitle: questionTitle || 'Medical consultation',
        planName: planName
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'auto', // Auto-detect language
      // Optional: Allow promotion codes
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', session.id);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}
