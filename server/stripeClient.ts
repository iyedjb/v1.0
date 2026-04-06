import Stripe from 'stripe';

export function clearCredentialsCache() {
}

async function getCredentials() {
  // First check for standard environment variables (for VPS/Coolify deployment)
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    console.log('Using Stripe credentials from environment variables');
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
    };
  }

  // Fall back to Replit Connectors (for Replit deployment)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    console.warn('No Stripe credentials found - set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY');
    return { publishableKey: null, secretKey: null };
  }

  const connectorName = 'stripe';

  // Determine which environment to use based on deployment status
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  try {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', connectorName);
    url.searchParams.set('environment', targetEnvironment);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    });

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    const pubKey = connectionSettings?.settings?.publishable ||
                   connectionSettings?.settings?.publishable_key;
    const secKey = connectionSettings?.settings?.secret ||
                   connectionSettings?.settings?.secret_key;

    if (pubKey && secKey) {
      const mode = secKey.startsWith('sk_live_') ? 'LIVE' : 'TEST';
      console.log(`Stripe credentials loaded — ${mode} mode (${targetEnvironment})`);
      return { publishableKey: pubKey, secretKey: secKey };
    }
  } catch (error) {
    console.warn(`Error fetching Stripe ${targetEnvironment} credentials:`, error);
  }

  console.warn('No Stripe credentials found in any environment');
  return { publishableKey: null, secretKey: null };
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover' as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { secretKey } = await getCredentials();
    if (!secretKey) return null;

    // Only use stripe-replit-sync if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set - Stripe sync disabled');
      return null;
    }

    try {
      const { StripeSync } = await import('stripe-replit-sync');

      stripeSync = new StripeSync({
        poolConfig: {
          connectionString: process.env.DATABASE_URL,
          max: 2,
        },
        stripeSecretKey: secretKey,
      });
    } catch (error) {
      console.warn('Failed to initialize Stripe sync:', error);
      return null;
    }
  }
  return stripeSync;
}
