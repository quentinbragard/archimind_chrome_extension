/*! For license information please see bundle.js.LICENSE.txt */
(()=>{"use strict";function t(t){var e=t.getAttribute("data-testid"),r=e?e.match(/conversation-turn-(\d+)/):null;return r?parseInt(r[1],10):null}function e(t){return new Promise((function(e){var r=setInterval((function(){var n='article[data-testid="conversation-turn-'.concat(t,'"] div[data-message-author-role="assistant"]'),o=document.querySelector(n);o&&o.innerText.trim().length>0&&(clearInterval(r),e(o))}),500);setTimeout((function(){clearInterval(r),e(null)}),1e4)}))}function r(t){return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},r(t)}function n(){n=function(){return e};var t,e={},o=Object.prototype,a=o.hasOwnProperty,i=Object.defineProperty||function(t,e,r){t[e]=r.value},c="function"==typeof Symbol?Symbol:{},u=c.iterator||"@@iterator",s=c.asyncIterator||"@@asyncIterator",l=c.toStringTag||"@@toStringTag";function f(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{f({},"")}catch(t){f=function(t,e,r){return t[e]=r}}function h(t,e,r,n){var o=e&&e.prototype instanceof b?e:b,a=Object.create(o.prototype),c=new C(n||[]);return i(a,"_invoke",{value:N(t,r,c)}),a}function d(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=h;var v="suspendedStart",p="suspendedYield",y="executing",g="completed",m={};function b(){}function w(){}function E(){}var x={};f(x,u,(function(){return this}));var S=Object.getPrototypeOf,L=S&&S(S(P([])));L&&L!==o&&a.call(L,u)&&(x=L);var I=E.prototype=b.prototype=Object.create(x);function T(t){["next","throw","return"].forEach((function(e){f(t,e,(function(t){return this._invoke(e,t)}))}))}function _(t,e){function n(o,i,c,u){var s=d(t[o],t,i);if("throw"!==s.type){var l=s.arg,f=l.value;return f&&"object"==r(f)&&a.call(f,"__await")?e.resolve(f.__await).then((function(t){n("next",t,c,u)}),(function(t){n("throw",t,c,u)})):e.resolve(f).then((function(t){l.value=t,c(l)}),(function(t){return n("throw",t,c,u)}))}u(s.arg)}var o;i(this,"_invoke",{value:function(t,r){function a(){return new e((function(e,o){n(t,r,e,o)}))}return o=o?o.then(a,a):a()}})}function N(e,r,n){var o=v;return function(a,i){if(o===y)throw Error("Generator is already running");if(o===g){if("throw"===a)throw i;return{value:t,done:!0}}for(n.method=a,n.arg=i;;){var c=n.delegate;if(c){var u=O(c,n);if(u){if(u===m)continue;return u}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===v)throw o=g,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=y;var s=d(e,r,n);if("normal"===s.type){if(o=n.done?g:p,s.arg===m)continue;return{value:s.arg,done:n.done}}"throw"===s.type&&(o=g,n.method="throw",n.arg=s.arg)}}}function O(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,O(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),m;var a=d(o,e.iterator,r.arg);if("throw"===a.type)return r.method="throw",r.arg=a.arg,r.delegate=null,m;var i=a.arg;return i?i.done?(r[e.resultName]=i.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,m):i:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,m)}function A(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function k(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function C(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(A,this),this.reset(!0)}function P(e){if(e||""===e){var n=e[u];if(n)return n.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function r(){for(;++o<e.length;)if(a.call(e,o))return r.value=e[o],r.done=!1,r;return r.value=t,r.done=!0,r};return i.next=i}}throw new TypeError(r(e)+" is not iterable")}return w.prototype=E,i(I,"constructor",{value:E,configurable:!0}),i(E,"constructor",{value:w,configurable:!0}),w.displayName=f(E,l,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===w||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,E):(t.__proto__=E,f(t,l,"GeneratorFunction")),t.prototype=Object.create(I),t},e.awrap=function(t){return{__await:t}},T(_.prototype),f(_.prototype,s,(function(){return this})),e.AsyncIterator=_,e.async=function(t,r,n,o,a){void 0===a&&(a=Promise);var i=new _(h(t,r,n,o),a);return e.isGeneratorFunction(r)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},T(I),f(I,l,"Generator"),f(I,u,(function(){return this})),f(I,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=P,C.prototype={constructor:C,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(k),!e)for(var r in this)"t"===r.charAt(0)&&a.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function n(n,o){return c.type="throw",c.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],c=i.completion;if("root"===i.tryLoc)return n("end");if(i.tryLoc<=this.prev){var u=a.call(i,"catchLoc"),s=a.call(i,"finallyLoc");if(u&&s){if(this.prev<i.catchLoc)return n(i.catchLoc,!0);if(this.prev<i.finallyLoc)return n(i.finallyLoc)}else if(u){if(this.prev<i.catchLoc)return n(i.catchLoc,!0)}else{if(!s)throw Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return n(i.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&a.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var o=n;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=t,i.arg=e,o?(this.method="next",this.next=o.finallyLoc,m):this.complete(i)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),m},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),k(r),m}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;k(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:P(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),m}},e}function o(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(t){if("string"==typeof t)return a(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?a(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return{s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,c=!0,u=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return c=t.done,t},e:function(t){u=!0,i=t},f:function(){try{c||null==r.return||r.return()}finally{if(u)throw i}}}}function a(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function i(t,e,r,n,o,a,i){try{var c=t[a](i),u=c.value}catch(t){return void r(t)}c.done?e(u):Promise.resolve(u).then(n,o)}function c(){var r;return r=n().mark((function r(a,i){var c,u,s,l;return n().wrap((function(r){for(;;)switch(r.prev=r.next){case 0:c=document.querySelectorAll('article[data-testid^="conversation-turn-"]'),u=o(c),r.prev=2,l=n().mark((function r(){var o,c,u,l,f;return n().wrap((function(r){for(;;)switch(r.prev=r.next){case 0:if(o=s.value,console.log("ARTICLE",o),c=t(o),console.log("TURN NUMBER",c),!(c&&c>a)){r.next=13;break}if(!(u=o.querySelector('div[data-message-author-role="user"]'))){r.next=12;break}return l=u.innerText.trim(),f=u.getAttribute("data-message-id"),r.next=11,i({type:"user",message:l,rank:c,messageId:f});case 11:e(c+1).then((function(t){if(t){var e=t.innerText.trim(),r=t.getAttribute("data-message-id");i({type:"assistant",message:e,rank:c+1,messageId:r})}}));case 12:c>a&&(a=c);case 13:case"end":return r.stop()}}),r)})),u.s();case 5:if((s=u.n()).done){r.next=9;break}return r.delegateYield(l(),"t0",7);case 7:r.next=5;break;case 9:r.next=14;break;case 11:r.prev=11,r.t1=r.catch(2),u.e(r.t1);case 14:return r.prev=14,u.f(),r.finish(14);case 17:return r.abrupt("return",a);case 18:case"end":return r.stop()}}),r,null,[[2,11,14,17]])})),c=function(){var t=this,e=arguments;return new Promise((function(n,o){var a=r.apply(t,e);function c(t){i(a,n,o,c,u,"next",t)}function u(t){i(a,n,o,c,u,"throw",t)}c(void 0)}))},c.apply(this,arguments)}var u=0;console.log("LAST PROCESSED TURN",u);var s={savedChatName:null,globalProviderChatId:null};function l(t){var e=t.type,r=t.message,n=t.rank,o=t.messageId;return new Promise((function(t,a){if(!r)return console.warn("Skipping empty ".concat(e," message for messageId: ").concat(o)),t();if(console.log("CHECKING CHAT HISTORY"),s=function(t){var e=document.querySelector('li[data-testid="history-item-0"] > div[style*="var(--sidebar-surface-tertiary)"]');if(!e)return t;var r=e.innerText.trim();if(t.savedChatName===r)return t;var n=e.closest("li");if(!n)return t;var o=n.querySelector("a[href]");if(o){var a=o.getAttribute("href").match(/\/c\/([^\/\?]+)/);a&&(t.globalProviderChatId=a[1])}return t.savedChatName=r,chrome.storage.sync.get("supabaseUserId",(function(e){var n=e.supabaseUserId||"default_user";chrome.runtime.sendMessage({type:"SAVE_CHAT",data:{user_id:n,provider_chat_id:t.globalProviderChatId,title:r,provider_name:"chatGPT"}},(function(){}))})),t}(s)||s,console.log("CHAT HISTORY CHECKED"),!s.globalProviderChatId)return console.warn("Waiting for provider_chat_id before sending ".concat(e," message.")),void setTimeout((function(){return l({type:e,message:r,rank:n,messageId:o}).then(t).catch(a)}),2e3);console.log("Sending ".concat(e," message:"),r);var i=n-1;chrome.runtime.sendMessage({type:"SAVE_MESSAGE",data:{messageType:e,message:r,rank:i,messageId:o,providerChatId:s.globalProviderChatId}},(function(r){r&&r.success?(console.log("Successfully saved ".concat(e," message.")),t()):(console.error("Failed to save ".concat(e," message:"),null==r?void 0:r.error),a(null==r?void 0:r.error))}))}))}new MutationObserver((function(e){console.log("MUTATION OBSERVER"),e.forEach((function(e){e.addedNodes.forEach((function(e){if(e.nodeType===Node.ELEMENT_NODE&&e.matches('article[data-testid^="conversation-turn-"]')){console.log("NODE",e);var r=e.querySelector('div[data-message-author-role="user"]'),n=e.querySelector('div[data-message-author-role="assistant"]'),o=t(e);console.log("TURN NUMBER====================",o),(r||n&&3===o)&&(console.log("Relevant article detected, processing..."),function(t,e){return c.apply(this,arguments)}(u,l).then((function(t){u=t})).catch((function(){})))}}))}))})).observe(document.body,{childList:!0,subtree:!0})})();