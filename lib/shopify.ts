import { createHmac, timingSafeEqual } from "crypto";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;

// Cache the access token in memory (lasts ~24h)
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

  if (!res.ok) {
    throw new Error(`Failed to get Shopify access token: ${res.status}`);
  }

  const data = await res.json();
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
  return res.json();
}

export async function releaseOrderHold(shopifyOrderId: string) {
  const orderGid = `gid://shopify/Order/${shopifyOrderId}`;

  const fulfillmentQuery = `
    query getFulfillmentOrders($orderId: ID!) {
      order(id: $orderId) {
        fulfillmentOrders(first: 10) {
          nodes {
            id
            status
          }
        }
      }
    }
  `;

  const fulfillmentRes = await shopifyGraphQL(fulfillmentQuery, {
    orderId: orderGid,
  });

  const fulfillmentOrders =
    fulfillmentRes?.data?.order?.fulfillmentOrders?.nodes || [];

  for (const fo of fulfillmentOrders) {
    if (fo.status === "ON_HOLD") {
      const releaseMutation = `
        mutation fulfillmentOrderReleaseHold($id: ID!) {
          fulfillmentOrderReleaseHold(id: $id) {
            fulfillmentOrder {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      await shopifyGraphQL(releaseMutation, { id: fo.id });
    }
  }
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

export function verifyWebhook(body: string, hmacHeader: string): boolean {
  const digest = createHmac("sha256", SHOPIFY_CLIENT_SECRET)
    .update(body, "utf8")
    .digest("base64");
  return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}
