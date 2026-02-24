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

export async function confirmVerification(token: string): Promise<
  | { status: "success"; purchaseEmail: string; studentEmail: string; orderId: string; orderIds: string[] }
  | { status: "expired" }
  | { status: "not_found" }
> {
  const sql = getDb();

  // Find the pending verification
  const rows = await sql`
    SELECT purchase_email, student_email, order_id, created_at FROM pending_verifications WHERE token = ${token}
  `;
  if (rows.length === 0) return { status: "not_found" };

  const { created_at } = rows[0];
  const createdAt = new Date(created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // Check if token is older than 48 hours
  if (hoursSinceCreation > 48) {
    await sql`DELETE FROM pending_verifications WHERE token = ${token}`;
    return { status: "expired" };
  }

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
    status: "success" as const,
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

export async function getOrdersNeedingFirstReminder() {
  const sql = getDb();
  // Orders older than 24h, not yet reminded
  return await sql`
    SELECT o.shopify_order_id, o.email, o.id
    FROM orders o
    LEFT JOIN verified_students v ON v.purchase_email = o.email
    WHERE o.status = 'on_hold'
      AND o.reminder_count < 1
      AND v.id IS NULL
      AND o.created_at < NOW() - INTERVAL '24 hours'
  `;
}

export async function getOrdersNeedingSecondReminder() {
  const sql = getDb();
  // Orders older than 48h, reminded once
  return await sql`
    SELECT o.shopify_order_id, o.email, o.id
    FROM orders o
    LEFT JOIN verified_students v ON v.purchase_email = o.email
    WHERE o.status = 'on_hold'
      AND o.reminder_count < 2
      AND v.id IS NULL
      AND o.created_at < NOW() - INTERVAL '48 hours'
  `;
}

export async function incrementReminderCount(orderId: number) {
  const sql = getDb();
  await sql`UPDATE orders SET reminder_count = reminder_count + 1 WHERE id = ${orderId}`;
}

export async function getStaleOrders() {
  const sql = getDb();
  // Orders older than 72h (24h after 2nd reminder), still on hold
  return await sql`
    SELECT o.shopify_order_id, o.email, o.id
    FROM orders o
    LEFT JOIN verified_students v ON v.purchase_email = o.email
    WHERE o.status = 'on_hold'
      AND v.id IS NULL
      AND o.created_at < NOW() - INTERVAL '72 hours'
  `;
}

export async function markCancelled(orderId: number) {
  const sql = getDb();
  await sql`UPDATE orders SET status = 'cancelled' WHERE id = ${orderId}`;
}

export async function markActivated(orderId: number) {
  const sql = getDb();
  await sql`UPDATE orders SET status = 'activated' WHERE id = ${orderId}`;
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
