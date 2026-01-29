var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/await-timeout/src/utils.js
var require_utils = __commonJS({
  "node_modules/await-timeout/src/utils.js"(exports) {
    exports.promiseFinally = (promise, fn) => {
      const success = /* @__PURE__ */ __name((result) => {
        fn();
        return result;
      }, "success");
      const error = /* @__PURE__ */ __name((e) => {
        fn();
        return Promise.reject(e);
      }, "error");
      return Promise.resolve(promise).then(success, error);
    };
    exports.toError = (value) => {
      value = typeof value === "function" ? value() : value;
      return typeof value === "string" ? new Error(value) : value;
    };
  }
});

// node_modules/await-timeout/src/index.js
var require_src = __commonJS({
  "node_modules/await-timeout/src/index.js"(exports, module) {
    var { promiseFinally, toError } = require_utils();
    module.exports = class Timeout2 {
      static {
        __name(this, "Timeout");
      }
      static set(delay, rejectReason) {
        return new Timeout2().set(delay, rejectReason);
      }
      static wrap(promise, delay, rejectReason) {
        return new Timeout2().wrap(promise, delay, rejectReason);
      }
      constructor() {
        this._id = null;
        this._delay = null;
      }
      get id() {
        return this._id;
      }
      get delay() {
        return this._delay;
      }
      set(delay, rejectReason = "") {
        return new Promise((resolve, reject) => {
          this.clear();
          const fn = rejectReason ? () => reject(toError(rejectReason)) : resolve;
          this._id = setTimeout(fn, delay);
          this._delay = delay;
        });
      }
      wrap(promise, delay, rejectReason = "") {
        const wrappedPromise = promiseFinally(promise, () => this.clear());
        const timer = this.set(delay, rejectReason);
        return Promise.race([
          wrappedPromise,
          timer
        ]);
      }
      clear() {
        if (this._id) {
          clearTimeout(this._id);
        }
      }
    };
  }
});

// helpers/misc.js
var helpers = {
  //List of known static file extensions that should never be subjected to queueing.
  creativeAssetExtensions: [
    "avi",
    "css",
    "csv",
    "eot",
    "gif",
    "ico",
    "jpg",
    "js",
    "json",
    "map",
    "mov",
    "mp4",
    "mpeg",
    "mpg",
    "ogg",
    "ogv",
    "ott",
    "pdf",
    "png",
    "svg",
    "ttf",
    "webmanifest",
    "wmv",
    "woff",
    "woff2",
    "xml"
  ],
  //regex for matching wordpress urls and query strings
  wordpressExclusions: /(w[cp][-_](?![-_]).*|xmlrpc\.php|readme\.html|license\.txt|trackback|feed(?:\/.*)?|comments\/feed(?:\/.*)?)(\?.*)?/,
  noCacheHeaders: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Expires: "Fri, 01 Jan 1970 00:00:00 GMT",
    Pragma: "no-cache"
  },
  lottery: /* @__PURE__ */ __name(function(roofInteger) {
    return Math.floor(Math.random() * parseInt(roofInteger));
  }, "lottery"),
  parseCookies: /* @__PURE__ */ __name(function(headers) {
    const parsedCookie = {};
    if (headers.cookie) {
      headers.cookie.split(";").forEach((cookie) => {
        if (cookie) {
          const parts = cookie.split("=");
          if (parts[1] !== void 0) {
            parsedCookie[parts[0].trim()] = parts[1].trim();
          }
        }
      });
    }
    return parsedCookie;
  }, "parseCookies"),
  queryStringParse: /* @__PURE__ */ __name(function(querystring) {
    const params = new URLSearchParams(querystring);
    let qStrObject = {};
    for (let item of params) {
      qStrObject[item[0]] = item[1];
    }
    return qStrObject;
  }, "queryStringParse")
};
var misc_default = helpers;

// helpers/http.js
var dummyResponseData = {
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
    ttl: null
  }
};
var http_helpers = {
  processResponse: /* @__PURE__ */ __name(async function(response) {
    let fetchResponse;
    let responseObject = {};
    fetchResponse = await response;
    if (!fetchResponse) {
      responseObject.body = dummyResponseData;
      responseObject.status = null;
      responseObject.statusText = "Communication failure between Cloudflare and the CrowdHandler API occured.";
      responseObject.success = false;
      return responseObject;
    } else if (fetchResponse.status !== 200) {
      responseObject.body = dummyResponseData;
    } else {
      responseObject.body = await response.json();
    }
    responseObject.status = fetchResponse.status;
    responseObject.statusText = fetchResponse.statusText;
    responseObject.success = fetchResponse.ok;
    return responseObject;
  }, "processResponse")
};
var http_default = http_helpers;

// index.js
var import_await_timeout = __toESM(require_src(), 1);
async function handleWhitelabelRequest(request, env) {
  let fallbackPath = `/${request.queryString}`;
  let slug = request.path.substring(4);
  let templateContentType = "text/html;charset=UTF-8";
  let templateDomain;
  let devPublicKeys = [
    "dba793b5eb837611498d0b809aefdefcb6f113310b272f6114435964670125a1",
    "04a39378b6abc3e3ee870828471636a9d1e157b1a7720821aed4c260108ebe43"
  ];
  if (devPublicKeys.includes(env.API_KEY)) {
    templateDomain = "wait-dev.crowdhandler.com";
  } else {
    templateDomain = "wait.crowdhandler.com";
  }
  let templateEndpoint;
  let templateFetchTimeout = 6e3;
  if (slug) {
    templateEndpoint = `https://${templateDomain}/${slug}`;
  } else {
    templateEndpoint = `https://${templateDomain}${fallbackPath}`;
  }
  let cache = await caches.open("crowdhandler:cache");
  let cacheHit = await cache.match(templateEndpoint);
  if (cacheHit) {
    console.log("Serving waiting room template from cache.");
    return {
      response: cacheHit,
      useCache: true
    };
  }
  let httpParams = {
    headers: {
      "content-type": templateContentType
    },
    method: "GET"
  };
  async function gatherResponse(response) {
    const { headers } = response;
    const contentType = headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return JSON.stringify(await response.json());
    } else if (contentType.includes("application/text")) {
      return response.text();
    } else if (contentType.includes("text/html")) {
      return response.text();
    } else {
      return response.text();
    }
  }
  __name(gatherResponse, "gatherResponse");
  let errorState;
  let fetchCounter = 0;
  async function fetchTemplate() {
    let timer = new import_await_timeout.default();
    errorState = null;
    let response;
    try {
      fetchCounter++;
      response = await Promise.race([
        fetch(templateEndpoint, httpParams),
        timer.set(templateFetchTimeout, "API Communication Timed Out!")
      ]);
      if (response.status !== 200) {
        throw `${response.status} ${response.statusText}`;
      }
    } catch (error) {
      errorState = true;
      console.error("Template Fetch Failure:", error);
    } finally {
      timer.clear();
      if (errorState === true && fetchCounter < 3) {
        console.log("Retrying Template Fetch.");
        return await fetchTemplate();
      }
      return response;
    }
  }
  __name(fetchTemplate, "fetchTemplate");
  let templateResponse = await fetchTemplate();
  let results;
  let resultsMeta;
  if (templateResponse) {
    results = await gatherResponse(templateResponse);
    resultsMeta = {
      headers: {
        "content-type": templateContentType
      },
      status: templateResponse.status,
      statusText: templateResponse.statusText
    };
  } else {
    results = "<h2>Service Temporarily Unavailable</h2>";
    resultsMeta = {
      headers: {
        "content-type": templateContentType
      },
      status: 503,
      statusText: "Service Unavailable"
    };
  }
  return { cache, results, resultsMeta, templateEndpoint };
}
__name(handleWhitelabelRequest, "handleWhitelabelRequest");
async function handleRequest(request, env, ctx) {
  const requestStartTime = Date.now();
  const bypassedFileExtensions = misc_default.creativeAssetExtensions;
  const wordpressExclusions = misc_default.wordpressExclusions;
  const url = request.url;
  const urlAttributes = new URL(url);
  const host = urlAttributes.hostname;
  const path = urlAttributes.pathname;
  const requestHeaders = Object.fromEntries(request.headers);
  const unprocessedQueryString = urlAttributes.search;
  const IPAddress = requestHeaders["cf-connecting-ip"] || null;
  const userAgent = requestHeaders["user-agent"] || null;
  const validToken = /(.*\d+.*)/;
  let language = null;
  let waitingRoomDomain;
  let statusIdentifier = /^\/ch\/status$/;
  let whiteLabelIdentifier = /^\/ch\/.*/;
  if (statusIdentifier.test(path) === true) {
    return new Response(
      JSON.stringify({ integration: "cloudflare", status: "ok" }),
      {
        headers: {
          "content-type": "text/plain",
          "cache-control": "public, max-age=60"
        }
      }
    );
  }
  if (whiteLabelIdentifier.test(path) === true) {
    const whitelabelResponse = await handleWhitelabelRequest({
      path,
      queryString: unprocessedQueryString
    }, env);
    try {
      if (whitelabelResponse.useCache === true) {
        return whitelabelResponse.response;
      }
    } catch (error) {
      console.error("Cache retrieval error:", error);
    }
    try {
      whitelabelResponse.resultsMeta.headers["cache-control"] = "public, max-age=60";
      if (whitelabelResponse.resultsMeta.status === 200) {
        await whitelabelResponse.cache.put(
          whitelabelResponse.templateEndpoint,
          new Response(
            whitelabelResponse.results,
            whitelabelResponse.resultsMeta
          )
        );
      }
    } catch (error) {
      console.error("Cache storage error:", error);
    }
    return new Response(
      whitelabelResponse.results,
      whitelabelResponse.resultsMeta
    );
  }
  try {
    language = requestHeaders["accept-language"].split(",")[0];
  } catch (error) {
  }
  const modifiedRequest = new Request(url, {
    body: request.body,
    headers: request.headers,
    method: request.method,
    redirect: request.redirect
  });
  if (env.NO_BYPASS) {
    modifiedRequest.headers.append("x-ch-no-bypass", env.NO_BYPASS);
  }
  let failTrust = true;
  if (env.FAIL_TRUST && env.FAIL_TRUST === "false") {
    failTrust = false;
  }
  let safetyNetSlug;
  if (env.SAFETY_NET_SLUG) {
    safetyNetSlug = env.SAFETY_NET_SLUG;
  }
  let whitelabel = false;
  if (env.WHITELABEL && env.WHITELABEL === "true") {
    whitelabel = true;
  }
  if (whitelabel === true) {
    waitingRoomDomain = `${host}/ch`;
  } else {
    waitingRoomDomain = "wait.crowdhandler.com";
  }
  let fileExtension = path.match(/\.([^.]+)$/);
  if (fileExtension !== null) {
    fileExtension = fileExtension[1];
  }
  if (bypassedFileExtensions.indexOf(fileExtension) !== -1) {
    return await fetch(modifiedRequest);
  }
  let queryString;
  if (unprocessedQueryString) {
    queryString = misc_default.queryStringParse(unprocessedQueryString);
  }
  let {
    "ch-code": chCode,
    "ch-fresh": chFresh,
    "ch-id": chID,
    "ch-id-signature": chIDSignature,
    "ch-public-key": chPublicKey,
    "ch-requested": chRequested
  } = queryString || {};
  if (!chCode || chCode === "undefined" || chCode === "null") {
    chCode = "";
  }
  if (queryString) {
    delete queryString["ch-code"];
    delete queryString["ch-fresh"];
    delete queryString["ch-id"];
    delete queryString["ch-id-signature"];
    delete queryString["ch-public-key"];
    delete queryString["ch-requested"];
  }
  if (queryString && Object.keys(queryString).length !== 0) {
    queryString = Object.keys(queryString).map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(queryString[key])).join("&");
    queryString = `?${queryString}`;
  } else {
    queryString = null;
  }
  let origin_type;
  if (env.ORIGIN_TYPE) {
    origin_type = env.ORIGIN_TYPE;
  }
  if (origin_type === "wordpress") {
    if (wordpressExclusions.test(path) === true || wordpressExclusions.test(queryString) === true) {
      return await fetch(modifiedRequest);
    }
  }
  let targetURL;
  if (queryString) {
    targetURL = encodeURIComponent(`https://${host}${path}${queryString}`);
  } else {
    targetURL = encodeURIComponent(`https://${host}${path}`);
  }
  const parsedCookies = misc_default.parseCookies(requestHeaders);
  let crowdhandlerCookieValue = parsedCookies["crowdhandler"];
  let token;
  let tokenSource;
  let freshlyPromoted;
  if (chID) {
    token = chID;
    tokenSource = "param";
    freshlyPromoted = true;
  } else if (crowdhandlerCookieValue) {
    token = crowdhandlerCookieValue;
    tokenSource = "cookie";
  } else {
    token = null;
    tokenSource = "new";
  }
  if (freshlyPromoted) {
    let setCookie = {
      "Set-Cookie": `crowdhandler=${token}; path=/; Secure`
    };
    let redirectLocation2;
    if (queryString) {
      redirectLocation2 = { Location: `${path}${queryString}` };
    } else {
      redirectLocation2 = { Location: path };
    }
    return new Response(null, {
      status: 302,
      headers: Object.assign(
        misc_default.noCacheHeaders,
        redirectLocation2,
        setCookie
      )
    });
  }
  if (validToken.test(token) !== true) {
    token = null;
  }
  const apiHost = env.API_ENDPOINT;
  const apiTimeout = 4e3;
  let httpParams = {
    headers: {
      "content-type": "application/json",
      "x-api-key": env.API_KEY
    },
    //choose method dynamically
    method: void 0
  };
  let response;
  let timer = new import_await_timeout.default();
  if (token) {
    httpParams.method = "GET";
    try {
      response = await Promise.race([
        fetch(
          `${apiHost}/requests/${token}?url=${targetURL}&agent=${encodeURIComponent(
            userAgent
          )}&ip=${encodeURIComponent(IPAddress)}&lang=${encodeURIComponent(
            language
          )}`,
          httpParams
        ),
        timer.set(apiTimeout, "CrowdHandler API request timed out")
      ]);
    } catch (error) {
      console.error("CrowdHandler API GET request failed:", error);
      response = void 0;
    } finally {
      timer.clear();
    }
  } else {
    httpParams.body = JSON.stringify({
      agent: userAgent,
      ip: IPAddress,
      lang: language,
      url
    });
    httpParams.method = "POST";
    try {
      response = await Promise.race([
        fetch(`${apiHost}/requests`, httpParams),
        timer.set(apiTimeout, "CrowdHandler API request timed out")
      ]);
    } catch (error) {
      console.error("CrowdHandler API POST request failed:", error);
      response = void 0;
    } finally {
      timer.clear();
    }
  }
  const processResponse = http_default.processResponse;
  const results = await processResponse(response);
  let responseBody;
  if (results.success !== true) {
    console.error(
      `API error: ${results.status} ${results.statusText}`
    );
    responseBody = results.body.result;
  } else {
    responseBody = results.body.result;
  }
  let redirect;
  let redirectLocation;
  let statusCode;
  if (responseBody.promoted !== 1 && responseBody.status !== 2) {
    redirect = true;
    redirectLocation = `https://${waitingRoomDomain}/${responseBody.slug}?url=${targetURL}&ch-code=${chCode}&ch-id=${responseBody.token}&ch-public-key=${env.API_KEY}`;
  } else if (failTrust !== true && responseBody.promoted !== 1 && responseBody.status === 2) {
    redirect = true;
    if (safetyNetSlug) {
      redirectLocation = `https://${waitingRoomDomain}/${safetyNetSlug}?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${env.API_KEY}`;
    } else {
      redirectLocation = `https://${waitingRoomDomain}/?url=${targetURL}&ch-code=${chCode}&ch-id=${token}&ch-public-key=${env.API_KEY}`;
    }
  } else {
    redirect = false;
  }
  switch (redirect) {
    case true: {
      console.log(`[CH] ${host}${path} | src:${tokenSource} | action:redirect | token:${responseBody.token || token || "none"}`);
      if (responseBody.token) {
        return new Response(null, {
          status: 302,
          headers: Object.assign(misc_default.noCacheHeaders, {
            Location: redirectLocation,
            "Set-Cookie": `crowdhandler=${responseBody.token}; path=/; Secure`
          })
        });
      } else {
        return new Response(null, {
          status: 302,
          headers: Object.assign(misc_default.noCacheHeaders, {
            Location: redirectLocation
          })
        });
      }
      break;
    }
    case false: {
      console.log(`[CH] ${host}${path} | src:${tokenSource} | action:allow | token:${responseBody.token || "none"}`);
      break;
    }
    default: {
      break;
    }
  }
  const originResponse = await fetch(modifiedRequest);
  let modifiedOriginResponse = new Response(originResponse.body, {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers: originResponse.headers
  });
  if (validToken.test(responseBody.token) === true) {
    modifiedOriginResponse.headers.append(
      "set-cookie",
      `crowdhandler=${responseBody.token}; path=/; Secure`
    );
  }
  modifiedOriginResponse.headers.append(
    "set-cookie",
    `crowdhandler_integration=cloudflare; path=/; Secure`
  );
  const requestEndTime = Date.now();
  const responseID = responseBody.responseID;
  async function sendRequestMeta() {
    if (responseID && misc_default.lottery(3) === 0) {
      httpParams.body = JSON.stringify({
        httpCode: originResponse.status,
        sampleRate: 3,
        time: requestEndTime - requestStartTime
      });
      httpParams.method = "PUT";
      response = await fetch(`${apiHost}/responses/${responseID}`, httpParams);
      const processResponse2 = http_default.processResponse;
      const results2 = await processResponse2(response);
      return results2;
    }
  }
  __name(sendRequestMeta, "sendRequestMeta");
  ctx.waitUntil(sendRequestMeta());
  return modifiedOriginResponse;
}
__name(handleRequest, "handleRequest");
var index_default = {
  async fetch(request, env, ctx) {
    ctx.passThroughOnException();
    return await handleRequest(request, env, ctx);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
