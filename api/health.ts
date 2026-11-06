export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: 'OK',
    service: 'DPIB RESULT ZONE API',
    timestamp: Date.now(),
  });
}
