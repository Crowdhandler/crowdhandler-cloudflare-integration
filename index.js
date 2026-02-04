import helpers from './helpers/misc'
import http_helpers from './helpers/http'
import Timeout from 'await-timeout'

async function handleWhitelabelRequest(request, env) {
  let fallbackPath = `/${request.queryString}`
  let slug = request.path.substring(4)

  let templateContentType = 'text/html;charset=UTF-8'
  let templateDomain

  let devPublicKeys = [
    'dba793b5eb837611498d0b809aefdefcb6f113310b272f6114435964670125a1',
    '04a39378b6abc3e3ee870828471636a9d1e157b1a7720821aed4c260108ebe43',
  ]

  if (devPublicKeys.includes(env.API_KEY)) {
    templateDomain = 'wait-dev.crowdhandler.com'
  } else {
    templateDomain = 'wait.crowdhandler.com'
  }

  let templateEndpoint
  let templateFetchTimeout = 6000
  if (slug) {
    templateEndpoint = `https://${templateDomain}/${slug}`
  } else {
    templateEndpoint = `https://${templateDomain}${fallbackPath}`
  }

  let cache = await caches.open('crowdhandler:cache')
  let cacheHit = await cache.match(templateEndpoint)

  if (cacheHit) {
    console.log('Serving waiting room template from cache.')
    return {
      response: cacheHit,
      useCache: true,
    }
  }

  let httpParams = {
    headers: {
      'content-type': templateContentType,
    },
    method: 'GET',
  }

  async function gatherResponse(response) {
    const { headers } = response
    const contentType = headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return JSON.stringify(await response.json())
    } else if (contentType.includes('application/text')) {
      return response.text()
    } else if (contentType.includes('text/html')) {
      return response.text()
    } else {
      return response.text()
    }
  }

  let errorState
  let fetchCounter = 0

  async function fetchTemplate() {
    let timer = new Timeout()
    //reset the error state
    errorState = null
    let response
    try {
      fetchCounter++
      response = await Promise.race([
        fetch(templateEndpoint, httpParams),
        timer.set(templateFetchTimeout, 'API Communication Timed Out!'),
      ])
      //await fetch(templateEndpoint, httpParams)
      if (response.status !== 200) {
        throw `${response.status} ${response.statusText}`
      }
    } catch (error) {
      errorState = true
      console.error('Template Fetch Failure:', error)
    } finally {
      timer.clear()
      if (errorState === true && fetchCounter < 3) {
        console.log('Retrying Template Fetch.')
        return await fetchTemplate()
      }
      return response
    }
  }

  let templateResponse = await fetchTemplate()
  let results
  let resultsMeta

  if (templateResponse) {
    results = await gatherResponse(templateResponse)
    resultsMeta = {
      headers: {
        'content-type': templateContentType,
      },
      status: templateResponse.status,
      statusText: templateResponse.statusText,
    }
  } else {
    results = '<h2>Service Temporarily Unavailable</h2>'
    resultsMeta = {
      headers: {
        'content-type': templateContentType,
      },
      status: 503,
      statusText: 'Service Unavailable',
    }
  }

  return { cache, results, resultsMeta, templateEndpoint }
}

async function handleRequest(request, env, ctx) {

  //Log the time that the request was initiated
  const requestStartTime = Date.now()
  //Extensions that should be passed-through
  const bypassedFileExtensions = helpers.creativeAssetExtensions
  const wordpressExclusions = helpers.wordpressExclusions

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
  const unprocessedQueryString = urlAttributes.search
  const IPAddress = requestHeaders['cf-connecting-ip'] || null
  const userAgent = requestHeaders['user-agent'] || null
  const validToken = /(.*\d+.*)/
  let language = null
  let waitingRoomDomain

  let statusIdentifier = /^\/ch\/status$/
  let whiteLabelIdentifier = /^\/ch\/.*/

  //Check if the request is for a status check and handle response
  if (statusIdentifier.test(path) === true) {
    return new Response(
      JSON.stringify({ integration: 'cloudflare', status: 'ok' }),
      {
        headers: {
          'content-type': 'text/plain',
          'cache-control': 'public, max-age=60',
        },
      },
    )
  }

  //Check if the request is for a whitelabel waiting room and handle response
  if (whiteLabelIdentifier.test(path) === true) {
    //Handle the whitelabel request
    const whitelabelResponse = await handleWhitelabelRequest({
      path: path,
      queryString: unprocessedQueryString,
    }, env)

    //Return cached response if we have one.
    try {
      if (whitelabelResponse.useCache === true) {
        return whitelabelResponse.response
      }
    } catch (error) {
      console.error('Cache retrieval error:', error)
    }

    //Store template in cache
    try {
      whitelabelResponse.resultsMeta.headers['cache-control'] =
        'public, max-age=60'

      if (whitelabelResponse.resultsMeta.status === 200) {
        await whitelabelResponse.cache.put(
          whitelabelResponse.templateEndpoint,
          new Response(
            whitelabelResponse.results,
            whitelabelResponse.resultsMeta,
          ),
        )
      }
    } catch (error) {
      console.error('Cache storage error:', error)
    }

    //Return the template
    return new Response(
      whitelabelResponse.results,
      whitelabelResponse.resultsMeta,
    )
  }

  //attempt to pull language from accept-language header
  try {
    language = requestHeaders['accept-language'].split(',')[0]
  } catch (error) {
    // Accept-language header not present - not critical
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
  if (env.NO_BYPASS) {
    modifiedRequest.headers.append('x-ch-no-bypass', env.NO_BYPASS)
  }

  //If environment variable is set to true, users that fail to check-in with CrowdHandler will be trusted.
  let failTrust = true
  if (env.FAIL_TRUST && env.FAIL_TRUST === 'false') {
    failTrust = false
  }

  //Set slug of fallback waiting room for users that fail to check-in with CrowdHandler.
  let safetyNetSlug
  if (env.SAFETY_NET_SLUG) {
    safetyNetSlug = env.SAFETY_NET_SLUG
  }

  //If environment variable is set to true, whitelabel waiting room will be used.
  let whitelabel = false
  if (env.WHITELABEL && env.WHITELABEL === 'true') {
    whitelabel = true
  }

  if (whitelabel === true) {
    waitingRoomDomain = `${host}/ch`
  } else {
    waitingRoomDomain = 'wait.crowdhandler.com'
  }

  //Handle static file extensions
  let fileExtension = path.match(/\.([^.]+)$/)
  if (fileExtension !== null) {
    fileExtension = fileExtension[1]
  }

  if (bypassedFileExtensions.indexOf(fileExtension) !== -1) {
    return await fetch(modifiedRequest)
  }

  //Process query strings
  let queryString
  if (unprocessedQueryString) {
    queryString = helpers.queryStringParse(unprocessedQueryString)
  }

  //Destructure special params from query string if they are present
  let {
    'ch-code': chCode,
    'ch-fresh': chFresh,
    'ch-id': chID,
    'ch-id-signature': chIDSignature,
    'ch-public-key': chPublicKey,
    'ch-requested': chRequested,
  } = queryString || {}

  //Override chCode value if the current one is unusable
  if (!chCode || chCode === 'undefined' || chCode === 'null') {
    chCode = ''
  }

  //Remove special params from the queryString object now that we don't need them anymore
  if (queryString) {
    delete queryString['ch-code']
    delete queryString['ch-fresh']
    delete queryString['ch-id']
    delete queryString['ch-id-signature']
    delete queryString['ch-public-key']
    delete queryString['ch-requested']
  }

  //Convert to usable querystring format
  if (queryString && Object.keys(queryString).length !== 0) {
    queryString = Object.keys(queryString)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(queryString[key]))
      .join('&')

    queryString = `?${queryString}`
  } else {
    queryString = null
  }

  //Handle Wordpress exclusions
  let origin_type
  if (env.ORIGIN_TYPE) {
    origin_type = env.ORIGIN_TYPE
  }

  if (origin_type === 'wordpress') {
    if (
      wordpressExclusions.test(path) === true ||
      wordpressExclusions.test(queryString) === true
    ) {
      return await fetch(modifiedRequest)
    }
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
  let tokenSource
  let freshlyPromoted
  if (chID) {
    token = chID
    tokenSource = 'param'
    freshlyPromoted = true
  } else if (crowdhandlerCookieValue) {
    token = crowdhandlerCookieValue
    tokenSource = 'cookie'
  } else {
    token = null
    tokenSource = 'new'
  }

  //If this is a freshly promoted session, strip the special CrowdHandler parameters by issuing a redirect.
  if (freshlyPromoted) {
    let setCookie = {
      'Set-Cookie': `crowdhandler=${token}; path=/; Secure`,
    }
    let redirectLocation
    if (queryString) {
      redirectLocation = { Location: `${path}${queryString}` }
    } else {
      redirectLocation = { Location: path }
    }
    return new Response(null, {
      status: 302,
      headers: Object.assign(
        helpers.noCacheHeaders,
        redirectLocation,
        setCookie,
      ),
    })
  }

  //Invalidate tokens that don't conform to the accepted format
  if (validToken.test(token) !== true) {
    token = null
  }

  //First API call here
  const apiHost = env.API_ENDPOINT
  const apiTimeout = 4000 // 4 second timeout
  let httpParams = {
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.API_KEY,
    },
    //choose method dynamically
    method: undefined,
  }

  //Determine if a GET or POST request should be made.
  let response
  let timer = new Timeout()

  //Make fetch
  if (token) {
    httpParams.method = 'GET'
    try {
      response = await Promise.race([
        fetch(
          `${apiHost}/requests/${token}?url=${targetURL}&agent=${encodeURIComponent(
            userAgent,
          )}&ip=${encodeURIComponent(IPAddress)}&lang=${encodeURIComponent(
            language,
          )}`,
          httpParams,
        ),
        timer.set(apiTimeout, 'CrowdHandler API request timed out'),
      ])
    } catch (error) {
      console.error('CrowdHandler API GET request failed:', error)
      response = undefined
    } finally {
      timer.clear()
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
      response = await Promise.race([
        fetch(`${apiHost}/requests`, httpParams),
        timer.set(apiTimeout, 'CrowdHandler API request timed out'),
      ])
    } catch (error) {
      console.error('CrowdHandler API POST request failed:', error)
      response = undefined
    } finally {
      timer.clear()
    }
  }

  //Process fetch response
  const processResponse = http_helpers.processResponse
  const results = await processResponse(response)

  let responseBody

  //Handle API request error here
  if (results.success !== true) {
    console.error(
      `API error: ${results.status} ${results.statusText}`,
    )
    responseBody = results.body.result
  } else {
    responseBody = results.body.result
  }

  let redirect
  let redirectLocation
  let statusCode

  //Normal healthy response
  if (responseBody.promoted !== 1 && responseBody.status !== 2) {
    redirect = true
    redirectLocation = `https://${waitingRoomDomain}/${responseBody.slug}?url=${targetURL}&ch-code=${chCode}&ch-id=${responseBody.token}&ch-public-key=${env.API_KEY}`
    //4xx client error - always redirect to safety net (ignore failTrust)
  } else if (responseBody.clientError === true) {
    console.error('[CH] API returned 4xx client error - redirecting to safety net')
    redirect = true
    if (safetyNetSlug) {
      redirectLocation = `https://${waitingRoomDomain}/${safetyNetSlug}?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${env.API_KEY}`
    } else {
      redirectLocation = `https://${waitingRoomDomain}/?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${env.API_KEY}`
    }
    //5xx server error - respect failTrust setting
  } else if (
    failTrust !== true &&
    responseBody.promoted !== 1 &&
    responseBody.status === 2
  ) {
    redirect = true
    if (safetyNetSlug) {
      redirectLocation = `https://${waitingRoomDomain}/${safetyNetSlug}?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${env.API_KEY}`
    } else {
      redirectLocation = `https://${waitingRoomDomain}/?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${env.API_KEY}`
    }
    //User is promoted
  } else {
    redirect = false
  }

  switch (redirect) {
    case true: {
      console.log(`[CH] ${host}${path} | src:${tokenSource} | action:redirect | token:${responseBody.token || token || 'none'}`)
      if (responseBody.token) {
        return new Response(null, {
          status: 302,
          headers: Object.assign(helpers.noCacheHeaders, {
            Location: redirectLocation,
            'Set-Cookie': `crowdhandler=${responseBody.token}; path=/; Secure`,
          }),
        })
      } else {
        return new Response(null, {
          status: 302,
          headers: Object.assign(helpers.noCacheHeaders, {
            Location: redirectLocation,
          }),
        })
      }
      break
    }
    case false: {
      console.log(`[CH] ${host}${path} | src:${tokenSource} | action:allow | token:${responseBody.token || 'none'}`)
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
  if (validToken.test(responseBody.token) === true) {
    modifiedOriginResponse.headers.append(
      'set-cookie',
      `crowdhandler=${responseBody.token}; path=/; Secure`,
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
    if (responseID && helpers.lottery(3) === 0) {
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
  //https://developers.cloudflare.com/workers/runtime-apis/context
  ctx.waitUntil(sendRequestMeta())

  //We're done send the response
  return modifiedOriginResponse
}

export default {
  async fetch(request, env, ctx) {
    ctx.passThroughOnException()
    return await handleRequest(request, env, ctx)
  },
}
