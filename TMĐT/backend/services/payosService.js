import crypto from "crypto";
import axios from "axios";

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_API_URL = "https://api-merchant.payos.vn";

function createSignature(data) {
  const dataToSign = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
  return crypto
    .createHmac("sha256", PAYOS_CHECKSUM_KEY)
    .update(dataToSign)
    .digest("hex");
}

async function createPaymentLink(orderData) {
  // Validate env vars
  if (
    !PAYOS_CLIENT_ID ||
    !PAYOS_API_KEY ||
    !PAYOS_CHECKSUM_KEY ||
    !PAYOS_API_URL
  ) {
    throw new Error(
      "Missing PayOS configuration. Ensure PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY and PAYOS_API_URL are set"
    );
  }

  // Normalize amount: ensure integer number (PayOS expects amount in VND as integer)
  const amountNum = Number(orderData.amount);
  if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
    throw new Error("Invalid amount provided to PayOS");
  }
  const payload = { ...orderData, amount: Math.round(amountNum) };

  const signature = createSignature(payload);
  try {
    const resp = await axios.post(
      `${PAYOS_API_URL}/v2/payment-requests`,
      { ...payload, signature },
      {
        headers: {
          "x-client-id": PAYOS_CLIENT_ID,
          "x-api-key": PAYOS_API_KEY,
        },
      }
    );

    // Log full response for debugging
    console.log("PayOS HTTP status:", resp.status, "response:", resp.data);

    if (!resp.data) {
      throw new Error("Empty response from PayOS");
    }

    // Some PayOS responses wrap result in `data.data`, some may return directly
    if (resp.data.data) return resp.data.data;
    if (resp.data.checkoutUrl || resp.data.redirectUrl) {
      // Normalize into expected shape
      return { checkoutUrl: resp.data.checkoutUrl || resp.data.redirectUrl };
    }

    // Unexpected response shape
    throw new Error(`PayOS unexpected response: ${JSON.stringify(resp.data)}`);
  } catch (error) {
    console.error(
      "PayOS Create Payment Link Error:",
      error.response
        ? { status: error.response.status, data: error.response.data }
        : error.message
    );
    const errMsg =
      error.response?.data?.message || error.response?.data || error.message;
    throw new Error("Failed to create PayOS payment link: " + errMsg);
  }
}

function verifyWebhook(webhookData, signature) {
  const calculatedSignature = createSignature(webhookData);
  return calculatedSignature === signature;
}

export { createPaymentLink, verifyWebhook };
