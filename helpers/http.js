// Server error response (5xx, network errors) - respects failTrust setting
const dummyResponseData = {
  result: {
    status: 2,
    token: null,
    title: null,
    position: null,
    live_position: null,
    promoted: null,
    urlRedirect: null,
    onsale: null,
    message: null,
    slug: null,
    priority: null,
    priorityAvailable: null,
    logo: null,
    responseID: null,
    captchaRequired: null,
    ttl: null,
  },
}

// Client error response (4xx) - never triggers failTrust, always safety net
const clientErrorResponseData = {
  result: {
    status: 2,
    clientError: true,
    token: null,
    title: null,
    position: null,
    live_position: null,
    promoted: null,
    urlRedirect: null,
    onsale: null,
    message: null,
    slug: null,
    priority: null,
    priorityAvailable: null,
    logo: null,
    responseID: null,
    captchaRequired: null,
    ttl: null,
  },
}

const http_helpers = {
  processResponse: async function(response) {
    let fetchResponse
    let responseObject = {}

    fetchResponse = await response

    //Communication failure. No fetch response to use.
    if (!fetchResponse) {
      responseObject.body = dummyResponseData
      responseObject.status = null
      responseObject.statusText = "Communication failure between Cloudflare and the CrowdHandler API occurred."
      responseObject.success = false
      return responseObject;
    //Communication success. 4xx client error returned.
    } else if (fetchResponse.status >= 400 && fetchResponse.status < 500) {
      console.error(`[CH] API 4xx: ${fetchResponse.status}`)
      responseObject.body = clientErrorResponseData
    //Communication success. 5xx server error returned.
    } else if (fetchResponse.status >= 500) {
      console.error(`[CH] API 5xx: ${fetchResponse.status}`)
      responseObject.body = dummyResponseData
    //Normal response.
    } else {
      responseObject.body = await response.json()
    }

    responseObject.status = fetchResponse.status
    responseObject.statusText = fetchResponse.statusText
    responseObject.success = fetchResponse.ok

    return responseObject
  },
}

export default http_helpers
