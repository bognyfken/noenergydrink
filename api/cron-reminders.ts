// Vercel Cron: ежедневная рассылка напоминаний «отметь день».
// Расписание — в vercel.json (вечер по МСК). Берёт подписки из Supabase,
// шлёт Web Push, чистит мёртвые подписки (404/410).
//
// Серверные env (заданы в проекте Vercel):
//   VAPID_PRIVATE, VITE_VAPID_PUBLIC, VAPID_SUBJECT (mailto:),
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, (опц.) CRON_SECRET

import webpush from 'web-push'

const MESSAGES = [
  'Как прошёл день? Не забудь отметить его 💜',
  'Загляни в приложение — отметь сегодняшний день 🌙',
  'Ты молодец. Отметим сегодняшний день без энергетика?',
  'Минутка для себя: как ты сегодня? Отметь день 💜',
]

export default async function handler(req: any, res: any) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers['authorization'] || ''
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ error: 'unauthorized' })
      return
    }
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  const pub = process.env.VITE_VAPID_PUBLIC
  const priv = process.env.VAPID_PRIVATE
  const subject = process.env.VAPID_SUBJECT || 'mailto:hoholocoste@gmail.com'
  if (!url || !key || !pub || !priv) {
    res.status(500).json({ error: 'missing env' })
    return
  }

  webpush.setVapidDetails(subject, pub, priv)

  const r = await fetch(
    `${url}/rest/v1/push_subscriptions?enabled=eq.true&select=endpoint,p256dh,auth`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  const subs: { endpoint: string; p256dh: string; auth: string }[] = await r.json()

  const day = Math.floor(Date.now() / 86_400_000)
  const body = MESSAGES[day % MESSAGES.length]
  const payload = JSON.stringify({ title: 'Нет энергетикам', body, url: '/' })

  let sent = 0
  let pruned = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
        sent++
      } catch (e: any) {
        const code = e?.statusCode
        if (code === 404 || code === 410) {
          pruned++
          await fetch(
            `${url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`,
            { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } },
          )
        }
      }
    }),
  )

  res.status(200).json({ ok: true, total: subs.length, sent, pruned })
}
