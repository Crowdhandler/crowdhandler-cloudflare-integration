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
  parseCookies: function(headers) {
    const parsedCookie = {}
    if (headers.cookie) {
      headers.cookie.split(';').forEach(cookie => {
        if (cookie) {
          const parts = cookie.split('=')
          parsedCookie[parts[0].trim()] = parts[1].trim()
        }
      })
    }
    return parsedCookie
  },
  queryStringParse: function(querystring) {
    const params = new URLSearchParams(querystring)
    let qStrObject = {}

    for (let item of params) {
      qStrObject[item[0]] = item[1]
    }
    //return as object
    return qStrObject
  },
}

export default helpers
