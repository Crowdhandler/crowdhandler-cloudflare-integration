!function(e){var t={};function o(n){if(t[n])return t[n].exports;var s=t[n]={i:n,l:!1,exports:{}};return e[n].call(s.exports,s,s.exports,o),s.l=!0,s.exports}o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)o.d(n,s,function(t){return e[t]}.bind(null,s));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=0)}([function(e,t,o){"use strict";o.r(t);var n={creativeAssetExtensions:["avi","css","csv","eot","gif","ico","jpg","js","json","map","mov","mp4","mpeg","mpg","ogg","ogv","ott","pdf","png","svg","ttf","webmanifest","wmv","woff","woff2","xml"],lottery:function(e){return Math.round(Math.random()*parseInt(e))},parseCookies:function(e){const t={};return e.cookie&&e.cookie.split(";").forEach(e=>{if(e){const o=e.split("=");t[o[0].trim()]=o[1].trim()}}),t},queryStringParse:function(e){const t=new URLSearchParams(e);let o={};for(let e of t)o[e[0]]=e[1];return o}};const s={result:{status:2,token:null,title:null,position:null,live_position:null,promoted:null,urlRedirect:null,onsale:null,message:null,slug:null,priority:null,priorityAvailable:null,logo:null,responseID:null,captchaRequired:null,ttl:null}};var r={processResponse:async function(e){let t,o={};return t=await e,t?(200!==t.status?o.body=s:o.body=await e.json(),o.status=t.status,o.statusText=t.statusText,o.success=t.ok,o):(o.body=s,o.status=null,o.statusText="Communication failure between Cloudflare and the CrowdHandler API occured.",o.success=!1,o)}};async function c(e){const{request:t}=e,o=Date.now(),s=n.creativeAssetExtensions,c=t.url,a=new URL(c),l=a.hostname,i=a.pathname,u=Object.fromEntries(t.headers),d=u["cf-connecting-ip"],p=u["user-agent"];let h;try{h=u["accept-language"].split(",")[0]}catch(e){console.log("Failed to find a valid accept-language value"),console.log(e)}const f=new Request(c,{body:t.body,headers:t.headers,method:t.method,redirect:t.redirect});"undefined"!=typeof NO_BYPASS&&f.headers.append("x-ch-no-bypass",NO_BYPASS);let y,m=!1;"undefined"!=typeof FAIL_TRUST&&"true"===FAIL_TRUST&&(m=!0),"undefined"!=typeof SAFETY_NET_SLUG&&(y=SAFETY_NET_SLUG);let g=i.match(/\.(.*)/);if(null!==g&&(g=g[1]),-1!==s.indexOf(g))return console.log("Static file detected. Going straight to origin."),await fetch(f);let w,b=a.search;b&&(w=n.queryStringParse(decodeURIComponent(b)));let $,{"ch-code":S,"ch-id":v,"ch-public-key":k}=w||{};S&&"undefined"!==S&&"null"!==S||(S=""),w&&(delete w["ch-code"],delete w["ch-id"],delete w["ch-public-key"]),w&&0!==Object.keys(w).length?(w=Object.keys(w).map(e=>e+"="+w[e]).join("&"),w="?"+w):w=null,$=w?encodeURIComponent(`https://${l}${i}${w}`):encodeURIComponent(`https://${l}${i}`);let P,_=n.parseCookies(u).crowdhandler;P=v||(_||null);const R=API_ENDPOINT;let T,I={headers:{"content-type":"application/json","x-api-key":API_KEY},method:void 0};if(P){I.method="GET";try{T=await fetch(`${R}/requests/${P}?url=${$}&agent=${encodeURIComponent(p)}&ip=${encodeURIComponent(d)}&lang=${encodeURIComponent(h)}`,I)}catch(e){console.error(e)}}else{I.body=JSON.stringify({agent:p,ip:d,lang:h,url:c}),I.method="POST";try{T=await fetch(R+"/requests",I)}catch(e){console.error(e)}}const O=r.processResponse,x=await O(T);let j,A,E;switch(!0!==x.success?(console.error(`API response returned a ${x.status} response with error ${x.statusText}`),j=x.body.result,console.log(j)):(j=x.body.result,console.log(j)),1!==j.promoted&&2!==j.status?(A=!0,E=`https://wait.crowdhandler.com/${j.slug}?url=${$}&ch-code=${S}&ch-id=${j.token}&ch-public-key=${API_KEY}`):!0!==m&&1!==j.promoted&&2===j.status?(A=!0,E=y?`https://wait.crowdhandler.com/${y}?url=${$}&ch-code=${S}&ch-id=${P}&ch-public-key=${API_KEY}`:`https://wait.crowdhandler.com?url=${$}&ch-code=${S}&ch-id=${P}&ch-public-key=${API_KEY}`):A=!1,A){case!0:return console.log("redirecting..."),j.token?new Response(null,{status:302,headers:{Location:E,"Set-Cookie":`crowdhandler=${j.token}; path=/; Secure; HttpOnly`}}):new Response(null,{status:302,headers:{Location:E}});case!1:console.log("continue...")}const U=await fetch(f);let C=new Response(U.body,{status:U.status,statusText:U.statusText,headers:U.headers});!0===/(.*\d+.*)/.test(j.token)&&C.headers.append("set-cookie",`crowdhandler=${j.token}; path=/; Secure; HttpOnly`),C.headers.append("set-cookie","crowdhandler_integration=cloudflare; path=/; Secure");const L=Date.now(),N=j.responseID;return e.waitUntil(new Promise(e=>{e(async function(){if(N&&0===n.lottery(2)){I.body=JSON.stringify({httpCode:U.status,sampleRate:3,time:L-o}),I.method="PUT",T=await fetch(`${R}/responses/${N}`,I);const e=r.processResponse;return await e(T)}}())})),C}addEventListener("fetch",e=>{e.respondWith(c(e))})}]);