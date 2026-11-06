export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const protocol = req.headers?.['x-forwarded-proto'] || 'https';
  const host = req.headers?.host || 'dpib-result-zone.vercel.app';

  res.status(200).json({
    webhookUrl: `${protocol}://${host}/api/donations/sms-webhook`,
    method: 'POST',
    contentType: 'application/json',
    supportedProviders: ['BKASH', 'NAGAD'],
    samplePayload: {
      sender: 'bKash',
      message:
        'You have received Tk 100.00 from 01712345678. Ref DPIB-4829. Fee Tk 0.00. Balance Tk 1500.00. TrxID BKH9A21M4P at 05/11/2026 14:30',
      secret: 'OPTIONAL_WEBHOOK_SECRET',
    },
  });
}
