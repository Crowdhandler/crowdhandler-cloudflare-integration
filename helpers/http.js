const http_helpers = {
  //This is used as a placeholder response when a safety net redirect is required
  dummyResponseData: {
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
  },
  processResponse: async function(response) {
    let responseObject = {}

    let status = await response

    responseObject.body = await response.json()
    responseObject.status = status.status
    responseObject.statusText = status.statusText
    responseObject.success = status.ok

    return responseObject
  },
}

export default http_helpers
