import { NextResponse } from 'next/server';

export async function GET() {
  const merchantId = process.env.VIVA_MERCHANT_ID;
  const apiKey = process.env.VIVA_API_KEY;

  if (!merchantId || !apiKey) {
    return NextResponse.json({ error: 'Missing VIVA_MERCHANT_ID or VIVA_API_KEY env vars' }, { status: 500 });
  }

  const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');

  const res = await fetch('https://www.vivapayments.com/api/messages/config/token', {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
