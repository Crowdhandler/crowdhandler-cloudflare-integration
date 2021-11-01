import helpers from './helpers/misc'
import http_helpers from './helpers/http'

async function handleRequest(event) {
  const { request } = event

  //Log the time that the request was initiated
  const requestStartTime = Date.now()
  //Extensions that should be passed-through
  const bypassedFileExtensions = helpers.creativeAssetExtensions

  //Full URL
  const url = request.url
  const urlAttributes = new URL(url)
  //Hostname
  const host = urlAttributes.hostname
  //Don't try and queue static assets
  const path = urlAttributes.pathname
  //https://developers.cloudflare.com/workers/examples/logging-headers
  const requestHeaders = Object.fromEntries(request.headers)
  //https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
  const IPAddress = requestHeaders['cf-connecting-ip']
  const userAgent = requestHeaders['user-agent']
  let language

  //attempt to pull language from accept-language header
  try {
    language = requestHeaders['accept-language'].split(',')[0]
  } catch (error) {
    console.log('Failed to find a valid accept-language value')
    console.log(error)
  }

  //Request object is read only so we are going to create a clone in order to be able to modify it
  const modifiedRequest = new Request(url, {
    body: request.body,
    headers: request.headers,
    method: request.method,
    redirect: request.redirect,
  })

  //We can't be sure that these optional environment variables exists so do a check first to avoid a reference error
  //Add x-ch-no-bypass header to request object if NO_BYPASS present in CF env variables
  if (typeof NO_BYPASS !== 'undefined') {
    modifiedRequest.headers.append('x-ch-no-bypass', NO_BYPASS)
  }

  //If environment variable is set to true, users that fail to check-in with CrowdHandler will be trusted.
  let failTrust = false
  if (typeof FAIL_TRUST !== 'undefined' && FAIL_TRUST === 'true') {
    failTrust = true
  }

  // Set slug of fallback waiting room for users that fail to check-in with CrowdHandler.
  let safetyNetSlug
  if (typeof SAFETY_NET_SLUG !== 'undefined') {
    safetyNetSlug = SAFETY_NET_SLUG
  }

  //Handle static file extensions
  let fileExtension = path.match(/\.(.*)/)
  if (fileExtension !== null) {
    fileExtension = fileExtension[1]
  }

  if (bypassedFileExtensions.indexOf(fileExtension) !== -1) {
    console.log('Static file detected. Going straight to origin.')
    //Return the origin page
    return await fetch(modifiedRequest)
  }

  //Process query strings
  let unprocessedQueryString = urlAttributes.search
  let queryString
  if (unprocessedQueryString) {
    queryString = helpers.queryStringParse(
      decodeURIComponent(unprocessedQueryString),
    )
  }

  //Destructure special params from query string if they are present
  let { 'ch-code': chCode, 'ch-id': chID, 'ch-public-key': chPublicKey } =
    queryString || {}

  //Override chCode value if the current one is unusable
  if (!chCode || chCode === 'undefined' || chCode === 'null') {
    chCode = ''
  }

  //Remove special params from the queryString object now that we don't need them anymore
  if (queryString) {
    delete queryString['ch-code']
    delete queryString['ch-id']
    delete queryString['ch-public-key']
  }

  //Convert to usable querystring format
  if (queryString && Object.keys(queryString).length !== 0) {
    queryString = Object.keys(queryString)
      .map(key => key + '=' + queryString[key])
      .join('&')

    queryString = `?${queryString}`
  } else {
    queryString = null
  }

  //URL encode the targetURL to be used later in redirects
  let targetURL
  if (queryString) {
    targetURL = encodeURIComponent(`https://${host}${path}${queryString}`)
  } else {
    targetURL = encodeURIComponent(`https://${host}${path}`)
  }

  //Parse cookies
  const parsedCookies = helpers.parseCookies(requestHeaders)
  let crowdhandlerCookieValue = parsedCookies['crowdhandler']

  //Prioritise tokens in the ch-id parameter and fallback to ones found in the cookie
  let token
  if (chID) {
    token = chID
  } else if (crowdhandlerCookieValue) {
    token = crowdhandlerCookieValue
  } else {
    token = null
  }

  //First API call here
  const apiHost = API_ENDPOINT
  let httpParams = {
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
    },
    //choose method dynamically
    method: undefined,
  }

  //Determine if a GET or POST request should be made.
  let response
  //Make fetch
  if (token) {
    httpParams.method = 'GET'
    try {
      response = await fetch(
        `${apiHost}/requests/${token}?url=${targetURL}&agent=${encodeURIComponent(
          userAgent,
        )}&ip=${encodeURIComponent(IPAddress)}&lang=${encodeURIComponent(
          language,
        )}`,
        httpParams,
      )
    } catch (error) {
      console.error(error)
    }
  } else {
    //This is a post so generate a payload and add it to the httpParams object
    httpParams.body = JSON.stringify({
      agent: userAgent,
      ip: IPAddress,
      lang: language,
      url: url,
    })
    httpParams.method = 'POST'
    try {
      response = await fetch(`${apiHost}/requests`, httpParams)
    } catch (error) {
      console.error(error)
    }
  }

  //Process fetch response
  const processResponse = http_helpers.processResponse
  const results = await processResponse(response)

  let responseBody

  //Handle API request error here
  if (results.success !== true) {
    console.error(
      `API response returned a ${results.status} response with error ${results.statusText}`,
    )
    responseBody = results.body.result
    console.log(responseBody)
  } else {
    //Response body here
    responseBody = results.body.result
    console.log(responseBody)
  }

  let redirect
  let redirectLocation
  let statusCode

  //Normal healthy response
  if (responseBody.promoted !== 1 && responseBody.status !== 2) {
    redirect = true
    redirectLocation = `https://wait.crowdhandler.com/${responseBody.slug}?url=${targetURL}&ch-code=${chCode}&ch-id=${responseBody.token}&ch-public-key=${API_KEY}`
    //Abnormal response. Redirect to safety net waiting room until further notice
  } else if (
    failTrust !== true &&
    responseBody.promoted !== 1 &&
    responseBody.status === 2
  ) {
    redirect = true
    if (safetyNetSlug) {
      redirectLocation = `https://wait.crowdhandler.com/${safetyNetSlug}?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${API_KEY}`
    } else {
      redirectLocation = `https://wait.crowdhandler.com?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${API_KEY}`
    }
    //User is promoted
  } else {
    redirect = false
  }

  switch (redirect) {
    case true: {
      //redirect
      console.log('redirecting...')
      if (responseBody.token) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: redirectLocation,
            'Set-Cookie': `crowdhandler=${responseBody.token}; path=/; Secure; HttpOnly`,
          },
        })
      } else {
        return new Response(null, {
          status: 302,
          headers: {
            Location: redirectLocation,
          },
        })
      }
      break
    }
    case false: {
      //continue
      console.log('continue...')
      break
    }
    default: {
      break
    }
  }

  //We're dealing with the origin response from this point onwards
  const originResponse = await fetch(modifiedRequest)

  //Preserve original response but alter headers
  let modifiedOriginResponse = new Response(originResponse.body, {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers: originResponse.headers,
  })

  //Set token in cookie
  //Make sure we don't set invalid values
  const validToken = /(.*\d+.*)/
  if (validToken.test(responseBody.token) === true) {
    modifiedOriginResponse.headers.append(
      'set-cookie',
      `crowdhandler=${responseBody.token}; path=/; Secure; HttpOnly`,
    )
  }
  //Set integration method cookie
  modifiedOriginResponse.headers.append(
    'set-cookie',
    `crowdhandler_integration=cloudflare; path=/; Secure`,
  )

  //End of request
  const requestEndTime = Date.now()

  //Send request Meta Data
  const responseID = responseBody.responseID

  //Send request meta information.
  async function sendRequestMeta() {
    //Sampling
    if (responseID && helpers.lottery(2) === 0) {
      httpParams.body = JSON.stringify({
        httpCode: originResponse.status,
        sampleRate: 3,
        time: requestEndTime - requestStartTime,
      })
      httpParams.method = 'PUT'
      response = await fetch(`${apiHost}/responses/${responseID}`, httpParams)

      const processResponse = http_helpers.processResponse
      const results = await processResponse(response)
      return results
    }
  }

  //This trick allows the sendRequestMeta function call to continue after we've already returned the response to the user
  //https://developers.cloudflare.com/workers/runtime-apis/fetch-event
  event.waitUntil(
    new Promise(resolve => {
      resolve(sendRequestMeta())
    }),
  )

  //We're done send the response
  return modifiedOriginResponse
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})
