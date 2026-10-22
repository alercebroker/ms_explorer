export function parseHtmxError(event) {
  const xhr = event.detail.xhr
  if (!xhr) return event.detail.error
  try {
    const body = JSON.parse(xhr.responseText)
    if (body.detail) {
      return 'Error ' + xhr.status + ': ' + body.detail
    }
  } catch {}
  return event.detail.error
}
