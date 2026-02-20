const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function isBrowser() {
  return typeof document !== 'undefined'
}

export function readCookie(name) {
  if (!isBrowser() || !name) {
    return ''
  }

  const prefix = `${encodeURIComponent(name)}=`
  const parts = document.cookie ? document.cookie.split('; ') : []

  for (const part of parts) {
    if (!part.startsWith(prefix)) {
      continue
    }

    return decodeURIComponent(part.slice(prefix.length))
  }

  return ''
}

export function writeCookie(name, value, { maxAgeSeconds = ONE_YEAR_SECONDS, path = '/' } = {}) {
  if (!isBrowser() || !name) {
    return
  }

  const encodedName = encodeURIComponent(name)
  const encodedValue = encodeURIComponent(String(value ?? ''))
  document.cookie = `${encodedName}=${encodedValue}; Max-Age=${maxAgeSeconds}; Path=${path}; SameSite=Lax`
}

export function deleteCookie(name, { path = '/' } = {}) {
  if (!isBrowser() || !name) {
    return
  }

  const encodedName = encodeURIComponent(name)
  document.cookie = `${encodedName}=; Max-Age=0; Path=${path}; SameSite=Lax`
}
