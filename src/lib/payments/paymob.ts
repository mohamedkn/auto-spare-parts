import crypto from "crypto";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

function requiredEnv(name: string, developmentFallback?: string): string {
  const value = process.env[name] || (!isProd ? developmentFallback : undefined);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const PaymobWebhookObjectSchema = z.object({
  id: z.union([z.number(), z.string()]),
  success: z.boolean(),
  pending: z.boolean(),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string(),
  created_at: z.union([z.string(), z.number()]),
  error_occured: z.union([z.boolean(), z.string(), z.number()]),
  has_parent_transaction: z.union([z.boolean(), z.string(), z.number()]),
  integration_id: z.union([z.number(), z.string()]),
  is_3d_secure: z.union([z.boolean(), z.string(), z.number()]),
  is_auth: z.union([z.boolean(), z.string(), z.number()]),
  is_capture: z.union([z.boolean(), z.string(), z.number()]),
  is_refunded: z.union([z.boolean(), z.string(), z.number()]),
  is_standalone_payment: z.union([z.boolean(), z.string(), z.number()]),
  is_voided: z.union([z.boolean(), z.string(), z.number()]),
  owner: z.union([z.number(), z.string()]),
  order: z.object({
    id: z.union([z.number(), z.string()]),
    merchant_order_id: z.union([z.number(), z.string()]),
  }).passthrough(),
  source_data: z.object({
    pan: z.union([z.string(), z.number()]),
    sub_type: z.string(),
    type: z.string(),
  }).passthrough(),
}).passthrough();

export const PaymobWebhookSchema = z.object({
  obj: PaymobWebhookObjectSchema,
  type: z.string(),
}).passthrough();

export type PaymobWebhookPayload = z.infer<typeof PaymobWebhookSchema>;

export function verifyWebhookSignature(payload: unknown, receivedHmac: string): boolean {
  const parsed = PaymobWebhookSchema.safeParse(payload);
  if (!parsed.success) return false;
  const { obj } = parsed.data;

  const concatenatedString = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order.id,
    obj.owner,
    obj.pending,
    obj.source_data.pan,
    obj.source_data.sub_type,
    obj.source_data.type,
    obj.success,
  ].join("");

  const calculatedHmac = crypto
    .createHmac("sha512", requiredEnv("PAYMOB_HMAC_SECRET", "dummy_hmac_secret_for_dev"))
    .update(concatenatedString)
    .digest("hex");

  const calculatedBuffer = Buffer.from(calculatedHmac, "hex");
  const receivedBuffer = Buffer.from(receivedHmac, "hex");
  return calculatedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
}

const AuthResponseSchema = z.object({ token: z.string().min(1) });
const OrderResponseSchema = z.object({ id: z.union([z.number(), z.string()]) });
const PaymentKeyResponseSchema = z.object({ token: z.string().min(1) });

async function parsePaymobResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(`Paymob request failed with status ${response.status}`);
  return schema.parse(body);
}

export async function createPaymobPayment(
  orderNumber: string,
  amountInEgp: number,
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  }
): Promise<string> {
  const apiKey = requiredEnv("PAYMOB_API_KEY", "dummy_api_key");
  const integrationId = process.env.PAYMOB_INTEGRATION_ID
    || process.env.PAYMOB_INTEGRATION_ID_CARD
    || (!isProd ? "5765554" : "");
  if (!integrationId) throw new Error("PAYMOB_INTEGRATION_ID is required");
  const iframeId = requiredEnv("PAYMOB_IFRAME_ID", "1057413");
  const amountCents = Math.round(amountInEgp * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error("Invalid payment amount");

  const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const { token: authToken } = await parsePaymobResponse(authResponse, AuthResponseSchema);

  const orderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: orderNumber,
      items: [],
    }),
  });
  const { id: orderId } = await parsePaymobResponse(orderResponse, OrderResponseSchema);

  const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        ...billingData,
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        country: "EG",
        state: "NA",
      },
      currency: "EGP",
      integration_id: integrationId,
    }),
  });
  const { token: paymentToken } = await parsePaymobResponse(paymentKeyResponse, PaymentKeyResponseSchema);

  return `https://accept.paymob.com/api/acceptance/iframes/${encodeURIComponent(iframeId)}?payment_token=${encodeURIComponent(paymentToken)}`;
}
