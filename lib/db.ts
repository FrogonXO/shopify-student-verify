import { neon } from "@neondatabase/serverless";

function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export async function isEmailVerified(purchaseEmail: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    SELECT id FROM verified_students WHERE purchase_email = ${purchaseEmail.toLowerCase()}
  `;
  return rows.length > 0;
}

export async function autoVerifyStudent(purchaseEmail: string) {
  const sql = getDb();
  await sql`
    INSERT INTO verified_students (purchase_email, student_email)
    VALUES (${purchaseEmail.toLowerCase()}, ${purchaseEmail.toLowerCase()})
    ON CONFLICT (purchase_email) DO NOTHING
  `;
}

export async function createPendingVerification(
  purchaseEmail: string,
  studentEmail: string,
  token: string,
  orderId: string
) {
  const sql = getDb();
  await sql`
    INSERT INTO pending_verifications (purchase_email, student_email, token, order_id)
    VALUES (${purchaseEmail.toLowerCase()}, ${studentEmail.toLowerCase()}, ${token}, ${orderId})
    ON CONFLICT (token) DO NOTHING
  `;
}

export async function confirmVerification(token: string) {
  const sql = getDb();

  // Find the pending verification
  const rows = await sql`
    SELECT purchase_email, student_email, order_id FROM pending_verifications WHERE token = ${token}
  `;
  if (rows.length === 0) return null;

  const { purchase_email, student_email, order_id } = rows[0];

  // Move to verified_students
  await sql`
    INSERT INTO verified_students (purchase_email, student_email)
    VALUES (${purchase_email}, ${student_email})
    ON CONFLICT (purchase_email) DO NOTHING
  `;

  // Delete all pending verifications for this email
  await sql`
    DELETE FROM pending_verifications WHERE purchase_email = ${purchase_email}
  `;

  // Update all on-hold orders for this email
  await sql`
    UPDATE orders SET status = 'activated' WHERE email = ${purchase_email} AND status = 'on_hold'
  `;

  // Get all on-hold order IDs to activate in Shopify
  const orderRows = await sql`
    SELECT shopify_order_id FROM orders WHERE email = ${purchase_email} AND status = 'activated'
  `;

  return {
    purchaseEmail: purchase_email,
    studentEmail: student_email,
    orderId: order_id,
    orderIds: orderRows.map((r: any) => r.shopify_order_id),
  };
}

export async function storeOrder(shopifyOrderId: string, email: string) {
  const sql = getDb();
  await sql`
    INSERT INTO orders (shopify_order_id, email, status, created_at)
    VALUES (${shopifyOrderId}, ${email.toLowerCase()}, 'on_hold', NOW())
    ON CONFLICT (shopify_order_id) DO NOTHING
  `;
}

export async function getStaleReminders() {
  const sql = getDb();
  // Orders older than 24h but less than 48h, still on hold, not yet reminded
  return await sql`
    SELECT o.shopify_order_id, o.email, o.id
    FROM orders o
    LEFT JOIN verified_students v ON v.purchase_email = o.email
    WHERE o.status = 'on_hold'
      AND o.reminded = false
      AND v.id IS NULL
      AND o.created_at < NOW() - INTERVAL '24 hours'
      AND o.created_at > NOW() - INTERVAL '48 hours'
  `;
}

export async function markReminded(orderId: number) {
  const sql = getDb();
  await sql`UPDATE orders SET reminded = true WHERE id = ${orderId}`;
}

export async function getStaleOrders() {
  const sql = getDb();
  // Orders older than 48h, still on hold
  return await sql`
    SELECT o.shopify_order_id, o.email, o.id
    FROM orders o
    LEFT JOIN verified_students v ON v.purchase_email = o.email
    WHERE o.status = 'on_hold'
      AND v.id IS NULL
      AND o.created_at < NOW() - INTERVAL '48 hours'
  `;
}

export async function markCancelled(orderId: number) {
  const sql = getDb();
  await sql`UPDATE orders SET status = 'cancelled' WHERE id = ${orderId}`;
}

export async function findPendingOrderId(purchaseEmail: string): Promise<string | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT shopify_order_id FROM orders
    WHERE email = ${purchaseEmail.toLowerCase()} AND status = 'on_hold'
    ORDER BY created_at DESC LIMIT 1
  `;
  return rows.length > 0 ? rows[0].shopify_order_id : null;
}
