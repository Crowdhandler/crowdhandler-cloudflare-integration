//This is used as a placeholder response when a safety net redirect is required
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

const http_helpers = {
  processResponse: async function(response) {
    let fetchResponse
    let responseObject = {}

    fetchResponse = await response

    //Communication failure. No fetch response to use.
    if (!fetchResponse) {
      responseObject.body = dummyResponseData
      responseObject.status = null
      responseObject.statusText = "Communication failure between Cloudflare and the CrowdHandler API occured."
      responseObject.success = false
      return responseObject;
    //Communication success. Errror returned.
    } else if (fetchResponse.status !== 200) {
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
