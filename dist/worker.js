!function(e){var t={};function o(n){if(t[n])return t[n].exports;var s=t[n]={i:n,l:!1,exports:{}};return e[n].call(s.exports,s,s.exports,o),s.l=!0,s.exports}o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)o.d(n,s,function(t){return e[t]}.bind(null,s));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=0)}([function(e,t,o){"use strict";o.r(t);var n={creativeAssetExtensions:["avi","css","csv","eot","gif","ico","jpg","js","json","map","mov","mp4","mpeg","mpg","ogg","ogv","ott","pdf","png","svg","ttf","webmanifest","wmv","woff","woff2","xml"],parseCookies:function(e){const t={};return e.cookie&&e.cookie.split(";").forEach(e=>{if(e){const o=e.split("=");t[o[0].trim()]=o[1].trim()}}),t},queryStringParse:function(e){const t=new URLSearchParams(e);let o={};for(let e of t)o[e[0]]=e[1];return o}};var s={dummyResponseData:{result:{status:2,token:null,title:null,position:null,live_position:null,promoted:null,urlRedirect:null,onsale:null,message:null,slug:null,priority:null,priorityAvailable:null,logo:null,responseID:null,captchaRequired:null,ttl:null}},processResponse:async function(e){let t={},o=await e;return t.body=await e.json(),t.status=o.status,t.statusText=o.statusText,t.success=o.ok,t}};async function r(e){const{request:t}=e,o=Date.now(),r=n.creativeAssetExtensions,l=t.url,c=new URL(l),a=c.hostname,i=c.pathname,u=Object.fromEntries(t.headers),d=u["cf-connecting-ip"],p=u["user-agent"];let f;try{f=u["accept-language"].split(",")[0]}catch(e){console.log("Failed to find a valid accept-language value"),console.log(e)}const h=new Request(l,{body:t.body,headers:t.headers,method:t.method,redirect:t.redirect});"undefined"!=typeof NO_BYPASS&&h.headers.append("x-ch-no-bypass",NO_BYPASS);let g=i.match(/\.(.*)/);if(null!==g&&(g=g[1]),-1!==r.indexOf(g))return console.log("Static file detected. Going straight to origin."),await fetch(h);let m,y=c.search;y&&(m=n.queryStringParse(decodeURIComponent(y))),console.log(m);let w,{"ch-code":b,"ch-id":v,"ch-public-key":$}=m||{};b&&"undefined"!==b&&"null"!==b||(b=""),console.log(m),m&&(delete m["ch-code"],delete m["ch-id"],delete m["ch-public-key"]),console.log(m),m&&0!==Object.keys(m).length?(m=Object.keys(m).map(e=>e+"="+m[e]).join("&"),m="?"+m):m=null,console.log(m),w=m?encodeURIComponent(`https://${a}${i}${m}`):encodeURIComponent(`https://${a}${i}`);let P,R=n.parseCookies(u).crowdhandler;P=v||(R||null);const k=API_ENDPOINT;let O,S={headers:{"content-type":"application/json","x-api-key":API_KEY},method:void 0};P?(S.method="GET",O=await fetch(`${k}/requests/${P}?url=${w}&agent=${encodeURIComponent(p)}&ip=${encodeURIComponent(d)}&lang=${encodeURIComponent(f)}`,S)):(S.body=JSON.stringify({agent:p,ip:d,lang:f,url:l}),S.method="POST",O=await fetch(k+"/requests",S));const j=s.processResponse,x=await j(O);let I,_,T;switch(!0!==x.success?(console.error(`API response returned a ${x.status} response with message ${x.statusText}`),I=s.dummyResponseData.result):(I=x.body.result,console.log(I)),1!==I.promoted&&2!==I.status?(_=!0,T=`https://wait.crowdhandler.com/${I.slug}?url=${w}&ch-code=${b}&ch-id=${I.token}&ch-public-key=${API_KEY}`):1!==I.promoted&&2===I.status?(_=!0,T=`https://wait.crowdhandler.com?url=${w}&ch-code=${b}&ch-id=${P}&ch-public-key=${API_KEY}`):_=!1,_){case!0:return console.log("redirecting..."),Response.redirect(T,void 0);case!1:console.log("continue...")}const A=await fetch(h);let E=new Response(A.body,{status:A.status,statusText:A.statusText,headers:A.headers});!0===/(.*\d+.*)/.test(I.token)&&E.headers.append("set-cookie",`crowdhandler=${I.token}; path=/; Secure; HttpOnly`),E.headers.append("set-cookie","crowdhandler_integration=cloudflare; path=/; Secure");const U=Date.now(),C=I.responseID;return e.waitUntil(new Promise(e=>{e(async function(){if(C){S.body=JSON.stringify({httpCode:A.status,sampleRate:100,time:U-o}),S.method="PUT",O=await fetch(`${k}/responses/${C}`,S);const e=s.processResponse;return await e(O)}}())})),E}addEventListener("fetch",e=>{e.respondWith(r(e))})}]);