export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { marceId, title, body } = req.body;
  if (!marceId) return res.status(400).json({ error: 'marceId required' });

  const appId = process.env.VITE_ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_KEY;

  if (!appId || !restKey) {
    return res.status(500).json({ error: 'OneSignal not configured' });
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Key ${restKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [marceId] },
        target_channel: 'push',
        contents: { en: body, pt: body },
        headings: { en: title, pt: title },
        web_url: 'https://erp-marcenaria-final.vercel.app',
      }),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 400).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
