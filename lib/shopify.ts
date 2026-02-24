import { createHmac, timingSafeEqual } from "crypto";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;

// Cache the access token in memory — resets on each deploy
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const res = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Shopify token error:", JSON.stringify(data));
    throw new Error(`Failed to get Shopify access token: ${res.status} - ${JSON.stringify(data)}`);
  }

  console.log("Shopify token scopes:", data.scope);

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

async function shopifyGraphQL(query: string, variables?: Record<string, any>) {
  const token = await getAccessToken();

  const res = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2026-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const data = await res.json();
  if (data.errors) {
    console.error("Shopify GraphQL errors:", JSON.stringify(data.errors));
  }
  return data;
}

// Find the Shopify customer ID by email
async function findCustomerByEmail(email: string): Promise<string | null> {
  const query = `
    query findCustomer($query: String!) {
      customers(first: 1, query: $query) {
        nodes {
          id
        }
      }
    }
  `;

  const res = await shopifyGraphQL(query, { query: `email:${email}` });
  const customers = res?.data?.customers?.nodes || [];
  return customers.length > 0 ? customers[0].id : null;
}

// Add the ttsd-verified tag to a customer
export async function tagCustomerAsVerified(email: string) {
  const customerId = await findCustomerByEmail(email);
  if (!customerId) {
    console.error(`Customer not found for email: ${email}`);
    return;
  }

  const mutation = `
    mutation tagCustomer($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const res = await shopifyGraphQL(mutation, {
    id: customerId,
    tags: ["ttsd-verified"],
  });

  const errors = res?.data?.tagsAdd?.userErrors || [];
  if (errors.length > 0) {
    console.error("Failed to tag customer:", JSON.stringify(errors));
  }

  console.log(`Tagged customer ${customerId} as ttsd-verified`);
}

// Set the checkoutblocks.trigger metafield so the banner stops showing
export async function setCustomerMetafield(email: string) {
  const customerId = await findCustomerByEmail(email);
  if (!customerId) return;

  const mutation = `
    mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const res = await shopifyGraphQL(mutation, {
    metafields: [
      {
        ownerId: customerId,
        namespace: "checkoutblocks",
        key: "trigger",
        value: "verified",
        type: "single_line_text_field",
      },
    ],
  });

  const errors = res?.data?.metafieldsSet?.userErrors || [];
  if (errors.length > 0) {
    console.error("Failed to set metafield:", JSON.stringify(errors));
  }

  console.log(`Set checkoutblocks.trigger metafield for ${customerId}`);
}

// Activate a verified customer: tag + metafield triggers Shopify Flow to release holds
export async function activateVerifiedCustomer(email: string, shopifyOrderIds: string[]) {
  await tagCustomerAsVerified(email);
  await setCustomerMetafield(email);
  console.log(`Activated customer ${email} for orders: ${shopifyOrderIds.join(", ")}`);
}

export async function cancelOrder(shopifyOrderId: string) {
  const orderGid = `gid://shopify/Order/${shopifyOrderId}`;

  const mutation = `
    mutation orderCancel($orderId: ID!, $reason: OrderCancelReason!, $notifyCustomer: Boolean!) {
      orderCancel(orderId: $orderId, reason: $reason, notifyCustomer: $notifyCustomer) {
        orderCancelUserErrors {
          field
          message
        }
      }
    }
  `;

  await shopifyGraphQL(mutation, {
    orderId: orderGid,
    reason: "OTHER",
    notifyCustomer: true,
  });
}

// Check if an order is actually still on hold in Shopify
export async function isOrderOnHold(shopifyOrderId: string): Promise<boolean> {
  const orderGid = `gid://shopify/Order/${shopifyOrderId}`;

  const query = `
    query getOrderStatus($orderId: ID!) {
      order(id: $orderId) {
        displayFulfillmentStatus
        cancelledAt
      }
    }
  `;

  const res = await shopifyGraphQL(query, { orderId: orderGid });

  if (res.errors) {
    throw new Error(`Shopify API error checking order ${shopifyOrderId}: ${JSON.stringify(res.errors)}`);
  }

  const order = res?.data?.order;

  if (!order) {
    throw new Error(`Order ${shopifyOrderId} not found in Shopify`);
  }

  if (order.cancelledAt) return false;

  // ON_HOLD status shows as "ON_HOLD" in displayFulfillmentStatus
  return order.displayFulfillmentStatus === "ON_HOLD";
}

export function verifyWebhook(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const digest = createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}
