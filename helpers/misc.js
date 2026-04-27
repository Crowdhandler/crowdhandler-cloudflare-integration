const helpers = {
  //List of known static file extensions that should never be subjected to queueing.
  creativeAssetExtensions: [
    'avi',
    'css',
    'csv',
    'eot',
    'gif',
    'ico',
    'jpg',
    'js',
    'json',
    'map',
    'mov',
    'mp4',
    'mpeg',
    'mpg',
    'ogg',
    'ogv',
    'ott',
    'pdf',
    'png',
    'svg',
    'ttf',
    'webmanifest',
    'wmv',
    'woff',
    'woff2',
    'xml',
  ],
  //regex for matching wordpress urls and query strings
  wordpressExclusions: /(w[cp][-_](?![-_])(?!order_).*|xmlrpc\.php|readme\.html|license\.txt|trackback|feed(?:\/.*)?|comments\/feed(?:\/.*)?)(\?.*)?/,
  noCacheHeaders: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Expires: 'Fri, 01 Jan 1970 00:00:00 GMT',
    Pragma: 'no-cache',
  },
  lottery: function(roofInteger) {
    return Math.floor(Math.random() * parseInt(roofInteger))
  },
  parseCookies: function(headers) {
    const parsedCookie = {}
    if (headers.cookie) {
      headers.cookie.split(';').forEach(cookie => {
        if (cookie) {
          const parts = cookie.split('=')
          if (parts[1] !== undefined) {
            parsedCookie[parts[0].trim()] = parts[1].trim()
          }
        }
      })
    }
    return parsedCookie
  },
  //Build a Set-Cookie value for the crowdhandler token, optionally with a
  //Domain attribute so the cookie can be shared across subdomains of the
  //configured parent. The raw value is trimmed and validated against
  //hostname-safe characters so a typo'd or malicious env var can't inject
  //into the Set-Cookie header.
  buildCrowdhandlerCookie: function(tokenValue, rawCookieDomain) {
    const parts = [`crowdhandler=${tokenValue}`, 'path=/', 'Secure']
    if (rawCookieDomain) {
      const trimmed = String(rawCookieDomain).trim()
      if (/^\.?[a-zA-Z0-9.-]+$/.test(trimmed)) {
        parts.push(`Domain=${trimmed}`)
      } else {
        console.warn(`[CH] Ignoring invalid COOKIE_DOMAIN value: ${JSON.stringify(rawCookieDomain)}`)
      }
    }
    return parts.join('; ')
  },
  queryStringParse: function(querystring) {
    const params = new URLSearchParams(querystring)
    let qStrObject = {}

    for (let item of params) {
      if (qStrObject.hasOwnProperty(item[0])) {
        if (Array.isArray(qStrObject[item[0]])) {
          qStrObject[item[0]].push(item[1])
        } else {
          qStrObject[item[0]] = [qStrObject[item[0]], item[1]]
        }
      } else {
        qStrObject[item[0]] = item[1]
      }
    }
    //return as object
    return qStrObject
  },
}

export default helpers
