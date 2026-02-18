const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

async function shopifyGraphQL(query: string, variables?: Record<string, any>) {
  const res = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  return res.json();
}

export async function releaseOrderHold(shopifyOrderId: string) {
  // First, get the fulfillment orders for this order
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

export function verifyWebhook(
  body: string,
  hmacHeader: string
): boolean {
  const crypto = require("crypto");
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(hmacHeader)
  );
}
