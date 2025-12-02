import crypto from 'crypto';

const PAYOS_API_URL = process.env.PAYOS_API_URL || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_SECRET = process.env.PAYOS_SECRET || '';
const PAYOS_MERCHANT_ID = process.env.PAYOS_MERCHANT_ID || '';

async function createTransfer({ orderId, amount, description, callbackUrl }) {
  // This implementation assumes PayOS exposes a REST endpoint to create bank-transfer instructions.
  // Adjust fields and URL according to the real PayOS API documentation.
  if (!PAYOS_API_URL) {
    // Fallback: generate fake bank instruction for local/dev usage
    const fakeRef = `PAYOS-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    return {
      success: true,
      payment_ref: fakeRef,
      bank_name: 'Ngân hàng Nội bộ (DEV)',
      account_number: '1900123456789',
      account_holder: 'Cửa hàng Demo',
      amount,
      instructions: `Vui lòng chuyển ${Number(amount).toLocaleString('vi-VN')}₫ vào tài khoản ${'1900123456789'} - ${'Cửa hàng Demo'} và ghi rõ mã: ${fakeRef}`,
      raw: null,
    };
  }

  const payload = {
    merchant_id: PAYOS_MERCHANT_ID,
    order_id: String(orderId),
    amount,
    description,
    callback_url: callbackUrl,
    method: 'bank_transfer',
  };

  const res = await fetch(`${PAYOS_API_URL.replace(/\/$/, '')}/payments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAYOS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `PayOS create failed: ${res.status} ${text}` };
  }

  const data = await res.json();

  // Expecting data contains payment_ref and bank instructions
  return { success: true, ...data, raw: data };
}

function verifySignature(rawBodyBuffer, signatureHeader) {
  if (!PAYOS_SECRET) return false;
  const hmac = crypto.createHmac('sha256', PAYOS_SECRET);
  hmac.update(rawBodyBuffer);
  const expected = hmac.digest('hex');
  if (!signatureHeader) return false;
  // Signature header might contain the hex string or prefixed like 'sha256=...'
  const sig = signatureHeader.includes('=') ? signatureHeader.split('=')[1] : signatureHeader;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export default {
  createTransfer,
  verifySignature,
};
