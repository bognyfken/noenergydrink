// Подписка на Web Push для ежедневных напоминаний.
//
// iOS: пуши работают ТОЛЬКО в установленном PWA (добавлено на экран «Домой»),
// iOS 16.4+. В обычной вкладке Safari подписка недоступна — это нормально.
// Подписка хранится в Supabase (push_subscriptions); рассылку шлёт Vercel Cron.

import { supabase } from './supabase'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC as string | undefined

export type PushState =
  | 'unsupported' // браузер не умеет Web Push
  | 'needs-install' // iOS, но приложение не установлено на экран «Домой»
  | 'denied' // пользователь запретил уведомления
  | 'on' // подписка активна
  | 'off' // поддерживается, но выключено

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function supported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) {
    // на iOS Push доступен только в установленном PWA — подскажем установить
    return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

/** Включить напоминания: запросить разрешение, подписаться, сохранить в облако. */
export async function enablePush(did: string, reminderHour = 20): Promise<PushState> {
  if (!supported()) return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported'
  if (!VAPID_PUBLIC) return 'unsupported'

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
  })

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (supabase && json.endpoint && json.keys?.p256dh && json.keys?.auth) {
    await supabase.from('push_subscriptions').upsert(
      {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        did,
        enabled: true,
        reminder_hour: reminderHour,
      },
      { onConflict: 'endpoint' },
    )
  }
  return 'on'
}

/** Выключить напоминания: убрать из облака и отписаться. */
export async function disablePush(): Promise<PushState> {
  if (!supported()) return 'unsupported'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    if (supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    await sub.unsubscribe()
  }
  return 'off'
}
