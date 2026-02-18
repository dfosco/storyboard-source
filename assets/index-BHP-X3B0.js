const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CommentOverlay-B86Jfavv.js","assets/vendor-primer-Cp2w2YFd.js","assets/vendor-react-BQyrhFMj.js","assets/vendor-octicons-CjKpnuJU.js","assets/vendor-primer-BEAryH55.css","assets/vendor-reshaped-DIoD2FDs.js","assets/vendor-reshaped-CHiksvd1.css"])))=>i.map(i=>d[i]);
import{j as e,S as q,I as lo,T as P,U as bn,N as Et,a as tt,b as Gn,C as uo,c as po,B as oe,d as ho,F as M,A as Ce,e as be,f as mo,g as go,L as nt,h as xn,u as fo,i as bo,k as xo,l as vo}from"./vendor-primer-Cp2w2YFd.js";import{b as x,u as Yn,O as Kn,f as Ut,g as yo,L as ye,h as jo,i as wo,j as _o}from"./vendor-react-BQyrhFMj.js";import{C as pe,V as u,T as g,D as ae,R as Be,B as He,a as So,b as Rt,P as ko,S as vn,F as y,c as Se,d as ie,e as _e,A as yn,M as Ee}from"./vendor-reshaped-DIoD2FDs.js";import{o as Co,M as Xn,p as Fe,l as Ae,k as qe,q as Ft,r as mt,s as Ve,t as Pe,u as Te,v as qt,w as Vt,x as Zn,H as Wt,y as gt,F as Eo,z as Io,m as No,L as Lo,B as To,R as ft,D as Qn,E as er,J as Ao,K as Po,N as Ro,O as $o,Q as tr,U as nr,V as Oo,W as zo,c as jn,Y as Do,Z as Mo,b as Bo,_ as Ho,$ as wn,a0 as Ye}from"./vendor-octicons-CjKpnuJU.js";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function r(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=r(o);fetch(o.href,a)}})();function ot(t,n){const r={...t};for(const s of Object.keys(n)){const o=n[s],a=t[s];o!==null&&typeof o=="object"&&!Array.isArray(o)&&a!==null&&typeof a=="object"&&!Array.isArray(a)?r[s]=ot(a,o):r[s]=o}return r}let Q={scenes:{},objects:{},records:{}};function Uo(t){if(!t||typeof t!="object")throw new Error("[storyboard-core] init() requires { scenes, objects, records }");Q={scenes:t.scenes||{},objects:t.objects||{},records:t.records||{}}}function $t(t,n){if(n&&Q[n]?.[t]!=null)return Q[n][t];if(!n){for(const r of["scenes","objects","records"])if(Q[r]?.[t]!=null)return Q[r][t]}if(n==="scenes"||!n){const r=t.toLowerCase();for(const s of Object.keys(Q.scenes))if(s.toLowerCase()===r)return Q.scenes[s]}throw new Error(`Data file not found: ${t}${n?` (type: ${n})`:""}`)}function ze(t,n=new Set){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(s=>ze(s,n));if(t.$ref&&typeof t.$ref=="string"){const s=t.$ref;if(n.has(s))throw new Error(`Circular $ref detected: ${s}`);n.add(s);const o=$t(s,"objects");return ze(o,n)}const r={};for(const[s,o]of Object.entries(t))r[s]=ze(o,n);return r}function Fo(t){if(Q.scenes[t]!=null)return!0;const n=t.toLowerCase();for(const r of Object.keys(Q.scenes))if(r.toLowerCase()===n)return!0;return!1}function Jt(t="default"){let n;try{n=$t(t,"scenes")}catch{throw new Error(`Failed to load scene: ${t}`)}if(Array.isArray(n.$global)){const r=n.$global;delete n.$global;let s={};for(const o of r)try{let a=$t(o);a=ze(a),s=ot(s,a)}catch(a){console.warn(`Failed to load $global: ${o}`,a)}n=ot(s,n)}return n=ze(n),structuredClone(n)}function Gt(t){const n=Q.records[t];if(n==null)throw new Error(`Record not found: ${t}`);if(!Array.isArray(n))throw new Error(`Record "${t}" must be an array, got ${typeof n}`);return structuredClone(n)}function qo(t,n){return Gt(t).find(s=>s.id===n)??null}function rr(t,n){if(t==null||typeof n!="string"||n==="")return;const r=n.split(".");let s=t;for(const o of r){if(s==null||typeof s!="object")return;s=s[o]}return s}function Ue(t){if(Array.isArray(t))return t.map(Ue);if(t!==null&&typeof t=="object"){const n={};for(const r of Object.keys(t))n[r]=Ue(t[r]);return n}return t}function st(t,n,r){const s=n.split(".");let o=t;for(let a=0;a<s.length-1;a++){const i=s[a];(o[i]==null||typeof o[i]!="object")&&(o[i]=/^\d+$/.test(s[a+1])?[]:{}),o=o[i]}o[s[s.length-1]]=r}function bt(){const t=window.location.hash.replace(/^#/,"");return new URLSearchParams(t)}function or(t){const n=t.toString();window.location.hash=n}function sr(t){return bt().get(t)}function ve(t,n){const r=bt();r.set(t,String(n)),or(r)}function ar(){const t=bt(),n={};for(const[r,s]of t.entries())n[r]=s;return n}function at(t){const n=bt();n.delete(t),or(n)}const xt="storyboard:";function vt(t){try{return localStorage.getItem(xt+t)}catch{return null}}function K(t,n){try{localStorage.setItem(xt+t,String(n)),Yt()}catch{}}function it(t){try{localStorage.removeItem(xt+t),Yt()}catch{}}function ir(t){const n=()=>{cr(),t()};return window.addEventListener("storage",n),window.addEventListener("storyboard-storage",n),()=>{window.removeEventListener("storage",n),window.removeEventListener("storyboard-storage",n)}}let Oe=null;function cr(){Oe=null}function lr(){if(Oe!==null)return Oe;try{const t=[];for(let n=0;n<localStorage.length;n++){const r=localStorage.key(n);r&&r.startsWith(xt)&&t.push(r+"="+localStorage.getItem(r))}return Oe=t.sort().join("&"),Oe}catch{return""}}function Yt(){cr(),window.dispatchEvent(new Event("storyboard-storage"))}const Kt="__hide__",ct="historyState",Ie="currentState",ke="nextState",_n=200;function De(){return vt(Kt)==="1"}function Vo(){We(),K(Kt,"1");const t=new URL(window.location.href);t.searchParams.delete("hide"),t.hash="",window.history.replaceState(window.history.state,"",t.toString())}function Wo(){const t=Je();if(t){window.location.hash="";const n=new URLSearchParams(t);for(const[r,s]of n.entries())ve(r,s)}it(Kt),Ko("show")}function yt(){return window.location.pathname}function dr(){return new URLSearchParams(window.location.hash.replace(/^#/,"")).toString()}function We(t,n){const r=t!==void 0?t:dr(),s=n!==void 0?n:yt(),o=jt(),a=wt();if(a!==null&&o[a]){const[,c,h]=o[a];if(c===s&&h===r)return}const i=a!==null?o.slice(0,a+1):o,l=i.length,d=[l,s,r],p=[...i,d];if(p.length>_n){const c=p.slice(p.length-_n);for(let h=0;h<c.length;h++)c[h]=[h,c[h][1],c[h][2]];K(ct,JSON.stringify(c)),K(Ie,String(c.length-1))}else K(ct,JSON.stringify(p)),K(Ie,String(l));it(ke)}function jt(){const t=vt(ct);if(!t)return[];try{const n=JSON.parse(t);return Array.isArray(n)?n:[]}catch{return[]}}function wt(){const t=vt(Ie);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function Jo(){const t=vt(ke);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function Je(){const t=wt();if(t===null)return null;const n=jt();return n[t]?n[t][2]:null}function ur(){const t=wt();if(t===null)return null;const n=jt();return n[t]?n[t][1]:null}function pr(t){const n=Je();return n?new URLSearchParams(n).get(t):null}function Sn(t,n){const r=Je()||"",s=new URLSearchParams(r);s.set(t,String(n)),We(s.toString(),ur()||yt())}function kn(t){const n=Je()||"",r=new URLSearchParams(n);r.delete(t),We(r.toString(),ur()||yt())}function Go(){const t=Je();if(!t)return{};const n=new URLSearchParams(t),r={};for(const[s,o]of n.entries())r[s]=o;return r}function Cn(){if(De())return;const t=yt(),n=dr(),r=jt(),s=wt();if(!n&&!t&&r.length===0)return;const o=r.findIndex(([,l,d])=>l===t&&d===n);if(o===-1){We(n,t);return}if(o===s)return;const a=s!==null?s-1:null,i=Jo();if(a!==null&&o===a)K(ke,String(s)),K(Ie,String(o));else if(i!==null&&o===i){const l=i+1;r[l]?K(ke,String(l)):it(ke),K(Ie,String(o))}else{it(ke),K(Ie,String(o));const l=r.slice(0,o+1);K(ct,JSON.stringify(l))}Yt()}function Yo(){We(),window.addEventListener("hashchange",()=>Cn()),window.addEventListener("popstate",()=>Cn())}function Ko(t){const n=new URL(window.location.href);n.searchParams.has(t)&&(n.searchParams.delete(t),window.history.replaceState(window.history.state,"",n.toString()))}function lt(){const t=new URL(window.location.href);if(t.searchParams.has("hide")){Vo();return}if(t.searchParams.has("show")){Wo();return}}function Xo(){lt(),window.addEventListener("popstate",()=>lt())}function _t(t){return window.addEventListener("hashchange",t),()=>window.removeEventListener("hashchange",t)}function Xt(){return window.location.hash}const Zo="modulepreload",Qo=function(t){return"/storyboard-source/"+t},En={},Z=function(n,r,s){let o=Promise.resolve();if(r&&r.length>0){let d=function(p){return Promise.all(p.map(c=>Promise.resolve(c).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");o=d(r.map(p=>{if(p=Qo(p),p in En)return;En[p]=!0;const c=p.endsWith(".css"),h=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${h}`))return;const m=document.createElement("link");if(m.rel=c?"stylesheet":Zo,c||(m.as="script"),m.crossOrigin="",m.href=p,l&&m.setAttribute("nonce",l),document.head.appendChild(m),c)return new Promise((b,_)=>{m.addEventListener("load",b),m.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${p}`)))})}))}function a(i){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=i,window.dispatchEvent(l),!l.defaultPrevented)throw i}return o.then(i=>{for(const l of i||[])l.status==="rejected"&&a(l.reason);return n().catch(a)})};let Ne=null;function es(t){if(!t||!t.comments){Ne=null;return}const n=t.comments;Ne={repo:{owner:n.repo?.owner??"",name:n.repo?.name??""},discussions:{category:n.discussions?.category??"Storyboard Comments"}}}function Zt(){return Ne}function dt(){return Ne!==null&&Ne.repo.owner!==""&&Ne.repo.name!==""}const ts=`
.sb-devtools-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.sb-devtools-trigger {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #161b22;
  color: #8b949e;
  border: 1px solid #30363d;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  transition: opacity 150ms ease, transform 150ms ease;
  user-select: none;
}
.sb-devtools-trigger:hover { transform: scale(1.05); }
.sb-devtools-trigger:active { transform: scale(0.97); }
.sb-devtools-trigger svg { width: 16px; height: 16px; fill: currentColor; }

.sb-devtools-menu {
  position: absolute;
  bottom: 56px;
  right: 0;
  min-width: 200px;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  display: none;
}
.sb-devtools-menu.open { display: block; }

.sb-devtools-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #c9d1d9;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}
.sb-devtools-menu-item:hover { background-color: #21262d; }
.sb-devtools-menu-item svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }

.sb-devtools-hint {
  padding: 6px 16px 8px;
  font-size: 12px;
  color: #484f58;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}

.sb-devtools-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: 80px;
}
.sb-devtools-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
}
.sb-devtools-panel {
  position: relative;
  width: 100%;
  max-width: 640px;
  max-height: 60vh;
  background-color: #0d1117;
  border: 1px solid #30363d;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.sb-devtools-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #21262d;
}
.sb-devtools-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
}
.sb-devtools-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #8b949e;
  cursor: pointer;
}
.sb-devtools-panel-close:hover { background-color: #21262d; color: #c9d1d9; }
.sb-devtools-panel-close svg { width: 16px; height: 16px; fill: currentColor; }
.sb-devtools-panel-body {
  overflow: auto;
  padding: 16px;
}
.sb-devtools-code {
  padding: 0;
  margin: 0;
  background: none;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  line-height: 1.5;
  color: #c9d1d9;
  white-space: pre-wrap;
  word-break: break-word;
}
.sb-devtools-error { color: #f85149; }
`,ns='<svg viewBox="0 0 16 16"><path d="M5 5.782V2.5h-.25a.75.75 0 010-1.5h6.5a.75.75 0 010 1.5H11v3.282l3.666 5.86C15.619 13.04 14.552 15 12.46 15H3.54c-2.092 0-3.159-1.96-2.206-3.358zM6.5 2.5v3.782a.75.75 0 01-.107.384L3.2 12.5h9.6l-3.193-5.834A.75.75 0 019.5 6.282V2.5z"/></svg>',rs='<svg viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',os='<svg viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>',ss='<svg viewBox="0 0 16 16"><path d="M8.5 1.75a.75.75 0 0 0-1.5 0V3H1.75a.75.75 0 0 0 0 1.5H3v6H1.75a.75.75 0 0 0 0 1.5H7v1.25a.75.75 0 0 0 1.5 0V12h5.25a.75.75 0 0 0 0-1.5H12v-6h1.75a.75.75 0 0 0 0-1.5H8.5Zm2 8.75h-5a.25.25 0 0 1-.25-.25v-4.5A.25.25 0 0 1 5.5 5.5h5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Z"/></svg>',as='<svg viewBox="0 0 16 16"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>';function is(){return new URLSearchParams(window.location.search).get("scene")||"default"}function cs(t={}){const n=t.container||document.body,r=t.basePath||"/";if(n.querySelector(".sb-devtools-wrapper"))return;const s=document.createElement("style");s.textContent=ts,document.head.appendChild(s);let o=!0,a=!1;const i=document.createElement("div");i.className="sb-devtools-wrapper";const l=document.createElement("button");l.className="sb-devtools-trigger",l.setAttribute("aria-label","Storyboard DevTools"),l.innerHTML=ns;const d=document.createElement("div");d.className="sb-devtools-menu";const p=document.createElement("button");p.className="sb-devtools-menu-item",p.innerHTML=`${ss} Viewfinder`;const c=document.createElement("button");c.className="sb-devtools-menu-item",c.innerHTML=`${rs} Show scene info`;const h=document.createElement("button");h.className="sb-devtools-menu-item",h.innerHTML=`${os} Reset all params`;const m=document.createElement("div");m.className="sb-devtools-hint",m.innerHTML="Press <code>⌘ + .</code> to hide",d.appendChild(p),d.appendChild(c),d.appendChild(h);function b(){d.querySelectorAll("[data-sb-comment-menu-item]").forEach(k=>k.remove()),dt()&&Z(async()=>{const{getCommentsMenuItems:k}=await import("./CommentOverlay-B86Jfavv.js");return{getCommentsMenuItems:k}},__vite__mapDeps([0,1,2,3,4,5,6])).then(({getCommentsMenuItems:k})=>{const R=k(),D=m;for(const U of R){const B=document.createElement("button");B.className="sb-devtools-menu-item",B.setAttribute("data-sb-comment-menu-item",""),B.innerHTML=`<span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${U.icon}</span> ${U.label}`,B.addEventListener("click",()=>{a=!1,d.classList.remove("open"),U.onClick()}),d.insertBefore(B,D)}})}l.addEventListener("click",b),d.appendChild(m),i.appendChild(d),i.appendChild(l),n.appendChild(i);let _=null;function S(){a=!1,d.classList.remove("open"),_&&_.remove();const k=is();let R="",D=null;try{R=JSON.stringify(Jt(k),null,2)}catch(G){D=G.message}_=document.createElement("div"),_.className="sb-devtools-overlay";const U=document.createElement("div");U.className="sb-devtools-backdrop",U.addEventListener("click",T);const B=document.createElement("div");B.className="sb-devtools-panel";const X=document.createElement("div");X.className="sb-devtools-panel-header",X.innerHTML=`<span class="sb-devtools-panel-title">Scene: ${k}</span>`;const J=document.createElement("button");J.className="sb-devtools-panel-close",J.setAttribute("aria-label","Close panel"),J.innerHTML=as,J.addEventListener("click",T),X.appendChild(J);const te=document.createElement("div");if(te.className="sb-devtools-panel-body",D)te.innerHTML=`<span class="sb-devtools-error">${D}</span>`;else{const G=document.createElement("pre");G.className="sb-devtools-code",G.textContent=R,te.appendChild(G)}B.appendChild(X),B.appendChild(te),_.appendChild(U),_.appendChild(B),n.appendChild(_)}function T(){_&&(_.remove(),_=null)}l.addEventListener("click",()=>{a=!a,d.classList.toggle("open",a)}),c.addEventListener("click",S),p.addEventListener("click",()=>{a=!1,d.classList.remove("open"),window.location.href=r+"viewfinder"}),h.addEventListener("click",()=>{window.location.hash="",a=!1,d.classList.remove("open")}),document.addEventListener("click",k=>{a&&!i.contains(k.target)&&(a=!1,d.classList.remove("open"))}),window.addEventListener("keydown",k=>{k.key==="."&&(k.metaKey||k.ctrlKey)&&(k.preventDefault(),o=!o,i.style.display=o?"":"none",o||(a=!1,d.classList.remove("open"),T()))})}function ls(t){let n=0;for(let r=0;r<t.length;r++)n=(n<<5)-n+t.charCodeAt(r)|0;return Math.abs(n)}function ds(t,n=[]){for(const r of n)if(r.toLowerCase()===t.toLowerCase())return`/${r}?scene=${encodeURIComponent(t)}`;try{const r=Jt(t);if(r?.route)return`${r.route.startsWith("/")?r.route:`/${r.route}`}?scene=${encodeURIComponent(t)}`}catch{}return`/?scene=${encodeURIComponent(t)}`}const us={navigation:{$ref:"navigation"},user:{name:"John Doe",username:"johndoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"}},ps={user:{$ref:"jane-doe"},navigation:{$ref:"navigation"},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"},signup:{fullName:"",email:"",password:"",organization:{name:"",size:"",role:""},workspace:{region:"",plan:"starter",newsletter:!1,agreeTerms:!1}}},hs={$global:["security-advisory-navigation"],advisory:{$ref:"security-advisory"}},ms={$global:["finch-pearl-navigation"],repositories:{$ref:"finch-pearl-repositories"}},gs={id:10,title:"Remote code injection in Log4j",breadcrumb:"Dependabot alerts",state:"fixed",openedAgo:"4 years ago",fixedAgo:"3 years ago",package:{name:"org.apache.logging.log4j:log4j-core",ecosystem:"Maven",affectedVersions:">= 2.13.0, < 2.15.0",patchedVersion:"2.15.0"},severity:{level:"Critical",score:"10.0 / 10",cvssMetrics:[{label:"Attack vector",value:"Network"},{label:"Attack complexity",value:"Low"},{label:"Privileges required",value:"None"},{label:"User interaction",value:"None"},{label:"Scope",value:"Changed"},{label:"Confidentiality",value:"High"},{label:"Integrity",value:"High"},{label:"Availability",value:"High"}],cvssVector:"CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H/E:H"},epss:{score:"94.358%",percentile:"100th percentile"},tags:["Patch available"],weaknesses:["CWE-20","CWE-400","CWE-502","CWE-917"],cveId:"CVE-2021-44228",ghsaId:"GHSA-jfh8-c2jp-5v3q",timeline:[{actor:"dependabot",actorAvatar:"https://avatars.githubusercontent.com/in/29110?v=4",isBot:!0,action:"opened this",timeAgo:"4 years ago"},{actor:"dependabot",actorAvatar:"https://avatars.githubusercontent.com/in/29110?v=4",isBot:!0,action:"closed this as completed",timeAgo:"3 years ago"}]},fs={topnav:[{icon:"code",label:"Code",url:"#"},{icon:"issue-opened",label:"Issues",url:"#"},{icon:"git-pull-request",label:"Pull requests",url:"#"},{icon:"people",label:"Agents",url:"#"},{icon:"play",label:"Actions",url:"#"},{icon:"project",label:"Projects",url:"#"},{icon:"star",label:"Models",url:"#"},{icon:"book",label:"Wiki",url:"#"},{icon:"shield",label:"Security",url:"#",counter:95,current:!0},{icon:"graph",label:"Insights",url:"#"},{icon:"gear",label:"Settings",url:"#"}]},bs={primary:[{label:"Overview",url:"/Overview",icon:"home"},{label:"Issues",url:"/Issues",icon:"issue-opened"},{label:"Pull Requests",url:"#",icon:"git-pull-request"},{label:"Discussions",url:"#",icon:"comment-discussion"}],secondary:[{label:"Settings",url:"#",icon:"gear"},{label:"Help",url:"#",icon:"question"}]},xs={name:"Jane Doe",username:"janedoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},vs=[{name:"test-webdriverio-update-copilot-issue",description:"",language:null,forks:0,stars:0,url:"#"},{name:"dependabot-copilot-autofix",description:"Testing Autofix using Copilot Workspaces",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"alona-copilot",description:"",language:null,forks:0,stars:0,url:"#"},{name:"spike-dependabot-snapshot-action",description:"Copilot-driven spike into using Dependabot as a dependency detector",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"ghas-copilot-geekmasher",description:"",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"copilot-autofix-demo-by-ot",description:"",language:"JavaScript",forks:0,stars:0,url:"#"}],ys={topnav:[{icon:"home",label:"Overview",url:"/Overview"},{icon:"repo",label:"Repositories",url:"/Repositories",counter:"5k+",current:!0},{icon:"project",label:"Projects",url:"#",counter:25},{icon:"package",label:"Packages",url:"#",counter:21},{icon:"people",label:"Teams",url:"#",counter:132},{icon:"person",label:"People",url:"#",counter:571},{icon:"shield",label:"Security",url:"#"},{icon:"graph",label:"Insights",url:"#"},{icon:"gear",label:"Settings",url:"#"}],sidenav:[{label:"All",url:"#",icon:"repo",current:!0},{label:"Contributed by me",url:"#",icon:"git-pull-request"},{label:"Adminable by me",url:"#",icon:"person"},{label:"Public",url:"#",icon:"eye"},{label:"Internal",url:"#",icon:"lock"},{label:"Private",url:"#",icon:"lock"},{label:"Sources",url:"#",icon:"code"},{label:"Forks",url:"#",icon:"repo-forked"},{label:"Archived",url:"#",icon:"archive"},{label:"Templates",url:"#",icon:"repo-template"}]},js=[{id:"refactor-auth-sso",identifier:"FIL-10",title:"Refactor authentication flow to support SSO providers",description:"Our current auth flow only supports email/password login. We need to extend it to support SSO providers (Google, Okta, Azure AD) for enterprise customers.",status:"todo",priority:"high",labels:["Auth","Backend","Feature"],assignee:null,project:null,estimate:5,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-17T10:50:00Z",acceptanceCriteria:["Users can authenticate via Google OAuth 2.0","Users can authenticate via SAML-based SSO (Okta, Azure AD)","Existing email/password flow remains unchanged","Session tokens are issued consistently regardless of auth method","Admin panel includes SSO configuration settings"],technicalNotes:["Use the existing AuthService class as the base","Add a provider strategy pattern to abstract login methods","Store provider metadata in the identity_providers table","Redirect URI callback must handle both web and mobile clients"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"10min ago"}]},{id:"fix-rate-limiter-bypass",identifier:"FIL-9",title:"Fix rate limiter bypass on batch endpoints",description:"The rate limiter can be bypassed by splitting a large request into multiple smaller batch calls. Each sub-request is counted as a single hit instead of being weighted by payload size.",status:"in_progress",priority:"urgent",labels:["Bug","Security","Backend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Platform Infrastructure",estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-16T14:20:00Z",acceptanceCriteria:["Batch endpoints count each item in the payload toward the rate limit","Rate limit headers reflect weighted counts","Existing single-request endpoints are unaffected"],technicalNotes:["Update RateLimiterMiddleware to accept a weight function","Batch controller should pass payload.length as weight","Add integration tests for weighted rate limiting"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 day ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"6 hours ago",body:"Started investigating — the middleware doesn't have access to parsed body at the point it runs. May need to restructure."}]},{id:"add-webhook-retry-logic",identifier:"FIL-8",title:"Add exponential backoff retry logic for webhook deliveries",description:"Webhook deliveries currently fail silently on timeout. We need retry logic with exponential backoff and a dead-letter queue for persistently failing endpoints.",status:"todo",priority:"medium",labels:["Feature","Backend"],assignee:null,project:"Platform Infrastructure",estimate:8,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-15T09:00:00Z",acceptanceCriteria:["Failed webhook deliveries are retried up to 5 times","Retry intervals follow exponential backoff (1s, 2s, 4s, 8s, 16s)","After all retries, the event is moved to a dead-letter queue","Delivery status is visible in the admin dashboard"],technicalNotes:["Use the existing job queue (BullMQ) for retry scheduling","Add a webhook_deliveries table to track attempts","Dead-letter events should be replayable from the admin UI"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"2 days ago"}]},{id:"dashboard-loading-skeleton",identifier:"FIL-7",title:"Add loading skeletons to dashboard widgets",description:"Dashboard widgets show a blank space while data is loading. Add skeleton loaders to improve perceived performance.",status:"done",priority:"low",labels:["Feature","Frontend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Dashboard",estimate:2,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-12T16:30:00Z",acceptanceCriteria:["All dashboard cards show skeleton loaders while fetching data","Skeleton matches the shape of the loaded content","Transition from skeleton to content is smooth"],technicalNotes:["Use Reshaped Skeleton component","Wrap each StatCard in a loading boundary"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"5 days ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"3 days ago",body:"Done — merged in FIL-7-skeletons branch."}]},{id:"migrate-env-config",identifier:"FIL-6",title:"Migrate environment config to typed schema validation",description:"Environment variables are currently accessed via raw process.env lookups with no validation. Migrate to a typed config schema using zod so missing or malformed values are caught at startup.",status:"todo",priority:"medium",labels:["Backend","DevEx"],assignee:null,project:null,estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-10T11:00:00Z",acceptanceCriteria:["All environment variables are defined in a single config schema","Server fails fast on startup if required variables are missing","Types are inferred from the schema — no manual type assertions"],technicalNotes:["Use zod for schema definition and parsing","Create src/config.ts as the single source of truth","Replace all process.env.X references with config.X"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 week ago"}]}],ws=[{id:"welcome-to-storyboard",title:"Welcome to Storyboard",date:"2026-02-14",author:"Jane Doe",summary:"An introduction to building prototypes with Storyboard — the meta-framework for design system exploration.",body:`Storyboard is a prototyping meta-framework that lets you build interactive UI prototypes powered by real data. Instead of hard-coding sample content, you define data files that feed into your pages automatically.

Each page can load a scene (its data context), reference shared objects, and even render parameterized content from record collections — like this very blog post.

Get started by creating a \`.scene.json\` file and a page component. The data flows in, and you focus on the design.`},{id:"data-driven-prototyping",title:"Data-Driven Prototyping",date:"2026-02-13",author:"Jane Doe",summary:"How scenes, objects, and records work together to power realistic prototypes.",body:`Traditional prototyping tools force you to duplicate content across screens. Storyboard takes a different approach: your data lives in JSON files, and pages consume it through hooks.

**Scenes** provide the full data context for a page. **Objects** are reusable fragments — a user profile, a navigation config — that scenes reference via \`$ref\`. **Records** are collections that power parameterized pages, like blog posts or product listings.

This separation means you can swap data without touching UI code, test edge cases by editing JSON, and share data fragments across multiple pages.`},{id:"design-system-exploration",title:"Exploring Design Systems",date:"2026-02-12",author:"Jane Doe",summary:"Using Storyboard to explore and compare design systems like Primer and Reshaped.",body:`One of Storyboard's strengths is its design system agnosticism. While it ships with Primer React as the default, you can bring any design system — Reshaped, Radix, Chakra, or your own.

Each page is independent: one page can use Primer components while another uses Reshaped. This makes Storyboard ideal for comparing design systems side by side, exploring component APIs, and building proof-of-concept pages before committing to a system.

The key is that the data layer stays the same regardless of which components render it.`}],hr={"other-scene":us,default:ps,SecurityAdvisory:hs,Repositories:ms},_s={"security-advisory":gs,"security-advisory-navigation":fs,navigation:bs,"jane-doe":xs,"finch-pearl-repositories":vs,"finch-pearl-navigation":ys},Ss={issues:js,posts:ws};Uo({scenes:hr,objects:_s,records:Ss});const St=x.createContext(null);function ks(){return new URLSearchParams(window.location.search).get("scene")}function Cs(){const t=window.location.pathname.replace(/\/+$/,"")||"/";return t==="/"?"index":t.split("/").pop()||"index"}function Es({sceneName:t,recordName:n,recordParam:r,children:s}){const o=Cs(),a=ks()||t||(Fo(o)?o:"default"),i=Yn(),{data:l,error:d}=x.useMemo(()=>{try{let c=Jt(a);if(n&&r&&i[r]){const h=qo(n,i[r]);h&&(c=ot(c,{record:h}))}return{data:c,error:null}}catch(c){return{data:null,error:c.message}}},[a,n,r,i]),p={data:l,error:d,loading:!1,sceneName:a};return d?e.jsxs("span",{style:{color:"var(--fgColor-danger, #f85149)"},children:["Error loading scene: ",d]}):e.jsx(St.Provider,{value:p,children:s})}function H(t){const n=x.useContext(St);if(n===null)throw new Error("useSceneData must be used within a <StoryboardProvider>");const{data:r,loading:s,error:o}=n,a=x.useSyncExternalStore(_t,Xt),i=x.useSyncExternalStore(ir,lr);return x.useMemo(()=>{if(s||o||r==null)return;const d=De(),p=d?pr:sr,c=d?Go:ar;if(!t){const T=c(),k=Object.keys(T);if(k.length===0)return r;const R=Ue(r);for(const D of k)st(R,D,T[D]);return R}const h=p(t);if(h!==null)return h;const m=t+".",b=c(),_=Object.keys(b).filter(T=>T.startsWith(m)),S=rr(r,t);if(_.length>0&&S!==void 0){const T=Ue(S);for(const k of _){const R=k.slice(m.length);st(T,R,b[k])}return T}return S===void 0?(console.warn(`[useSceneData] Path "${t}" not found in scene data.`),{}):S},[r,s,o,t,a,i])}function j(t){const n=x.useContext(St);if(n===null)throw new Error("useOverride must be used within a <StoryboardProvider>");const{data:r}=n,s=De(),o=r!=null?rr(r,t):void 0,a=x.useCallback(()=>sr(t),[t]),i=x.useSyncExternalStore(_t,a);x.useSyncExternalStore(ir,lr);let l;if(s){const c=pr(t);l=c!==null?c:o}else l=i!==null?i:o;const d=x.useCallback(c=>{De()||ve(t,c),Sn(t,c)},[t]),p=x.useCallback(()=>{De()||at(t),kn(t)},[t]);return[l,d,p]}function Is(){const t=x.useContext(St);if(t===null)throw new Error("useScene must be used within a <StoryboardProvider>");const n=x.useCallback(r=>{const s=new URL(window.location.href);s.searchParams.set("scene",r),window.location.href=s.toString()},[]);return{sceneName:t.sceneName,switchScene:n}}function mr(t,n){const r=ar(),s=`record.${n}.`,o=Object.keys(r).filter(l=>l.startsWith(s));if(o.length===0)return t;const a=Ue(t),i={};for(const l of o){const d=l.slice(s.length),p=d.indexOf(".");if(p===-1)continue;const c=d.slice(0,p),h=d.slice(p+1);i[c]||(i[c]={}),i[c][h]=r[l]}for(const[l,d]of Object.entries(i)){const p=a.find(c=>c.id===l);if(p)for(const[c,h]of Object.entries(d))st(p,c,h);else{const c={id:l};for(const[h,m]of Object.entries(d))st(c,h,m);a.push(c)}}return a}function gr(t,n="id"){const s=Yn()[n],o=x.useSyncExternalStore(_t,Xt);return x.useMemo(()=>{if(!s)return null;try{const a=Gt(t);return mr(a,t).find(l=>l[n]===s)??null}catch(a){return console.error(`[useRecord] ${a.message}`),null}},[t,n,s,o])}function fr(t){const n=x.useSyncExternalStore(_t,Xt);return x.useMemo(()=>{try{const r=Gt(t);return mr(r,t)}catch(r){return console.error(`[useRecords] ${r.message}`),[]}},[t,n])}function ge(t,n,r){return j(`record.${t}.${n}.${r}`)}function Ns(t,n=""){const r=n.replace(/\/+$/,"");document.addEventListener("click",o=>{if(o.metaKey||o.ctrlKey||o.shiftKey||o.altKey)return;const a=o.target.closest("a[href]");if(!a||a.target==="_blank")return;const i=new URL(a.href,window.location.origin);if(i.origin!==window.location.origin)return;const l=window.location.hash,d=l&&l!=="#",c=i.hash&&i.hash!=="#"?i.hash:d?l:"";let h=i.pathname;r&&h.startsWith(r)&&(h=h.slice(r.length)||"/"),o.preventDefault(),t.navigate(h+i.search+c),setTimeout(lt,0)});const s=t.navigate.bind(t);t.navigate=(o,a)=>{const i=window.location.hash;return i&&i!=="#"&&typeof o=="string"&&!o.includes("#")&&(o=o+i),s(o,a).then(d=>(lt(),d))}}const Ge=x.createContext(null);function Ls(){return e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:"var(--bgColor-default, #0d1117)"},children:[e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",style:{animation:"spin 0.8s linear infinite"},children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"var(--fgColor-muted, #484f58)",strokeWidth:"2.5",opacity:"0.25"}),e.jsx("path",{d:"M12 2a10 10 0 0 1 10 10",stroke:"var(--fgColor-default, #e6edf3)",strokeWidth:"2.5",strokeLinecap:"round"})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg) } }"})]})}function Ts(){return e.jsx(Es,{children:e.jsx(x.Suspense,{fallback:e.jsx(Ls,{}),children:e.jsx(Kn,{})})})}const br=Object.freeze(Object.defineProperty({__proto__:null,default:Ts},Symbol.toStringTag,{value:"Module"})),As="_navItem_ec50i_1",Ps="_active_ec50i_16",In={navItem:As,active:Ps},Rs=[{label:"Overview",path:"/Dashboard"},{label:"Issues",path:"/issues"},{label:"Projects",path:"/Dashboard"},{label:"Views",path:"/Dashboard"}];function ut({orgName:t,activePage:n,userInfo:r}){const s=Ut();return e.jsx(pe,{padding:4,children:e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(g,{variant:"featured-3",weight:"bold",children:t||"—"}),e.jsx(ae,{}),e.jsx("nav",{children:e.jsx(u,{direction:"column",gap:0,children:Rs.map(o=>e.jsx("button",{type:"button",className:`${In.navItem} ${n===o.label?In.active:""}`,onClick:()=>s(o.path),children:e.jsx(g,{variant:"body-3",weight:n===o.label?"bold":"regular",children:o.label})},o.label))})}),r&&e.jsxs(e.Fragment,{children:[e.jsx(ae,{}),e.jsxs(u,{direction:"column",gap:1,paddingTop:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:r.name||"—"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:r.role||"—"})]})]})]})})}function je(t){return t==null||t===""?"—":String(t)}function Ke({label:t,value:n,change:r,color:s}){return e.jsx(pe,{padding:5,children:e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(g,{variant:"body-3",color:"neutral-faded",children:t}),e.jsx(g,{variant:"featured-2",weight:"bold",children:n}),e.jsx(g,{variant:"caption-1",color:s||"positive",children:r})]})})}function Re({label:t,value:n,max:r,color:s}){return e.jsxs(u,{direction:"column",gap:1,children:[e.jsxs(u,{direction:"row",justify:"space-between",children:[e.jsx(g,{variant:"body-3",children:t}),e.jsx(g,{variant:"body-3",weight:"medium",children:n})]}),e.jsx(ko,{value:typeof r=="number"?parseFloat(n)/r*100:parseFloat(n),color:s,size:"small",attributes:{"aria-label":t}})]})}const $s=[{label:"Team standup",time:"Today, 10:00"},{label:"Architecture review",time:"Today, 11:30"},{label:"Lunch",time:"Today, 12:30"},{label:"Sprint planning",time:"Today, 14:00"},{label:"Deploy v2.4",time:"Today, 17:00"}];function Os(){const t=H("signup.fullName"),n=H("signup.organization.name"),r=H("signup.organization.size"),s=H("signup.organization.role"),o=H("signup.workspace.region"),a=H("signup.workspace.plan");return e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(ut,{orgName:je(n),activePage:"Overview",userInfo:{name:je(t),role:je(s)}})}),e.jsx(u.Item,{columns:10,direction:"column",align:"center",justify:"center",children:e.jsxs(u,{direction:"column",maxWidth:"80%",gap:4,children:[e.jsxs(u,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(g,{variant:"featured-2",weight:"bold",children:"Overview"}),e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsxs(He,{color:"positive",children:[je(a)," plan"]}),e.jsx(He,{variant:"faded",children:je(o)})]})]}),e.jsxs(u,{direction:"row",gap:3,children:[e.jsx(u.Item,{columns:3,children:e.jsx(Ke,{label:"Active Users",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(u.Item,{columns:3,children:e.jsx(Ke,{label:"Deployments",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(u.Item,{columns:3,children:e.jsx(Ke,{label:"New Members",value:"1",change:"That's you!",color:"primary"})}),e.jsx(u.Item,{columns:3,children:e.jsx(Ke,{label:"Team Size",value:je(r),change:"Current plan capacity",color:"primary"})})]}),e.jsxs(u,{direction:"row",gap:4,children:[e.jsx(u.Item,{columns:5,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(pe,{padding:4,children:e.jsx(So,{})}),e.jsx(pe,{padding:5,children:e.jsxs(u,{direction:"column",gap:3,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Schedule"}),e.jsx(u,{direction:"column",gap:2,children:$s.map(i=>e.jsx(Rt,{name:`schedule-${i.label}`,children:e.jsxs(u,{direction:"column",children:[e.jsx(g,{variant:"body-3",children:i.label}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:i.time})]})},i.label))})]})})]})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(pe,{padding:5,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Metrics"}),e.jsx(Re,{label:"Performance",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"Monthly revenue goal",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"Error rate",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"User acquisition",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"Releases shipped",value:"0",max:100,color:"neutral-faded"})]})}),e.jsx(pe,{padding:5,children:e.jsxs(u,{direction:"column",gap:3,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Recent activity"}),e.jsx(ae,{}),e.jsxs(u,{direction:"column",gap:4,align:"center",paddingBlock:6,children:[e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"No activity yet"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Deployments and events will appear here once your workspace is active."})]})]})})]})})]})]})})]})})})}const xr=Object.freeze(Object.defineProperty({__proto__:null,default:Os},Symbol.toStringTag,{value:"Module"}));var It={exports:{}},Nt,Nn;function zs(){if(Nn)return Nt;Nn=1;var t="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";return Nt=t,Nt}var Lt,Ln;function Ds(){if(Ln)return Lt;Ln=1;var t=zs();function n(){}function r(){}return r.resetWarningCache=n,Lt=function(){function s(i,l,d,p,c,h){if(h!==t){var m=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw m.name="Invariant Violation",m}}s.isRequired=s;function o(){return s}var a={array:s,bigint:s,bool:s,func:s,number:s,object:s,string:s,symbol:s,any:s,arrayOf:o,element:s,elementType:s,instanceOf:o,node:s,objectOf:o,oneOf:o,oneOfType:o,shape:o,exact:o,checkPropTypes:r,resetWarningCache:n};return a.PropTypes=a,a},Lt}var Tn;function Ms(){return Tn||(Tn=1,It.exports=Ds()()),It.exports}var Bs=Ms();const ne=yo(Bs),Hs="_header_1282e_1",Us="_headerContent_1282e_8",Fs="_titleWrapper_1282e_17",qs="_separator_1282e_21",Vs="_subtitle_1282e_25",$e={header:Hs,headerContent:Us,titleWrapper:Fs,separator:qs,subtitle:Vs},Ws=[{icon:Fe,label:"Code",current:!0},{icon:Ae,label:"Issues",counter:30},{icon:qe,label:"Pull Requests",counter:3},{icon:Ft,label:"Discussions"},{icon:mt,label:"Actions"},{icon:Ve,label:"Projects",counter:7},{icon:Pe,label:"Security",counter:12},{icon:Te,label:"Insights"}];function vr({items:t=Ws,title:n,subtitle:r}){return e.jsxs(q,{as:"header",className:$e.header,children:[e.jsxs("div",{className:$e.headerContent,children:[e.jsx(lo,{icon:Co,"aria-label":"Open global navigation menu",unsafeDisableTooltip:!0}),e.jsx(Xn,{size:32}),e.jsxs(q,{direction:"horizontal",gap:"condensed",className:$e.titleWrapper,children:[e.jsx("span",{children:n||"title"}),r&&e.jsxs(e.Fragment,{children:[e.jsx(P,{className:$e.separator,children:"/"}),e.jsx(P,{className:$e.subtitle,children:r||"subtitle"})]})]})]}),e.jsx(bn,{"aria-label":"Repository",children:t.map(s=>e.jsx(bn.Item,{icon:s.icon,"aria-current":s.current?"page":void 0,counter:s.counter,href:s.url,children:s.label},s.label))})]})}vr.propTypes={items:ne.arrayOf(ne.shape({icon:ne.elementType,label:ne.string.isRequired,current:ne.bool,counter:ne.number,url:ne.string})),title:ne.string,subtitle:ne.string};const Js=[{icon:Ae,label:"Open issues",url:"#"},{icon:qt,label:"Your issues",url:"#"},{icon:Vt,label:"Assigned to you",url:"#",current:!0},{icon:Zn,label:"Mentioning you",url:"#"}];function Gs({items:t=Js}){return e.jsx(Et,{"aria-label":"Navigation",children:t.map(n=>e.jsxs(Et.Item,{href:n.url,"aria-current":n.current?"page":void 0,children:[n.icon&&e.jsx(Et.LeadingVisual,{children:e.jsx(n.icon,{})}),n.label]},n.label))})}const Ys="_wrapper_74lhx_1",Ks="_navigation_74lhx_7",Xs="_main_74lhx_13",Zs="_container_74lhx_22",Xe={wrapper:Ys,navigation:Ks,main:Xs,container:Zs};function he({children:t,title:n,subtitle:r,topnav:s,sidenav:o}){return e.jsxs(q,{className:Xe.container,children:[e.jsx(vr,{title:n,subtitle:r,items:s}),e.jsxs("div",{className:Xe.wrapper,children:[o&&e.jsx("aside",{className:Xe.navigation,children:e.jsx(Gs,{items:o})}),e.jsx("main",{className:Xe.main,children:t})]})]})}function Me({name:t,onChange:n,value:r,...s}){const o=x.useContext(Ge),a=o?.prefix&&t?`${o.prefix}.${t}`:t,[i]=j(a||""),[l,d]=x.useState(i??""),p=!!o&&!!t;x.useEffect(()=>{if(p)return o.subscribe(t,m=>d(m))},[p,o,t]),x.useEffect(()=>{p&&i!=null&&(d(i),o.setDraft(t,i))},[]);const c=m=>{p&&(d(m.target.value),o.setDraft(t,m.target.value)),n&&n(m)},h=p?l:r;return e.jsx(tt,{name:t,value:h,onChange:c,...s})}function fe({name:t,onChange:n,value:r,children:s,...o}){const a=x.useContext(Ge),i=a?.prefix&&t?`${a.prefix}.${t}`:t,[l]=j(i||""),[d,p]=x.useState(l??""),c=!!a&&!!t;x.useEffect(()=>{if(c)return a.subscribe(t,b=>p(b))},[c,a,t]),x.useEffect(()=>{c&&l!=null&&(p(l),a.setDraft(t,l))},[]);const h=b=>{c&&(p(b.target.value),a.setDraft(t,b.target.value)),n&&n(b)},m=c?d:r;return e.jsx(Gn,{name:t,value:m,onChange:h,...o,children:s})}fe.Option=Gn.Option;function Qs({name:t,onChange:n,checked:r,...s}){const o=x.useContext(Ge),a=o?.prefix&&t?`${o.prefix}.${t}`:t,[i]=j(a||""),l=i==="true"||i===!0,[d,p]=x.useState(l),c=!!o&&!!t;x.useEffect(()=>{if(c)return o.subscribe(t,b=>p(b==="true"||b===!0))},[c,o,t]),x.useEffect(()=>{if(c&&i!=null){const b=i==="true"||i===!0;p(b),o.setDraft(t,b?"true":"false")}},[]);const h=b=>{c&&(p(b.target.checked),o.setDraft(t,b.target.checked?"true":"false")),n&&n(b)},m=c?d:r;return e.jsx(uo,{name:t,checked:m,onChange:h,...s})}function yr({name:t,onChange:n,value:r,...s}){const o=x.useContext(Ge),a=o?.prefix&&t?`${o.prefix}.${t}`:t,[i]=j(a||""),[l,d]=x.useState(i??""),p=!!o&&!!t;x.useEffect(()=>{if(p)return o.subscribe(t,m=>d(m))},[p,o,t]),x.useEffect(()=>{p&&i!=null&&(d(i),o.setDraft(t,i))},[]);const c=m=>{p&&(d(m.target.value),o.setDraft(t,m.target.value)),n&&n(m)},h=p?l:r;return e.jsx(po,{name:t,value:h,onChange:c,...s})}function jr({data:t,onSubmit:n,children:r,...s}){const o=t||null,a=x.useRef({}),i=x.useRef({}),l=x.useCallback(m=>a.current[m],[]),d=x.useCallback((m,b)=>{a.current[m]=b;const _=i.current[m];_&&_(b)},[]),p=x.useCallback((m,b)=>(i.current[m]=b,()=>{delete i.current[m]}),[]),c=m=>{if(m.preventDefault(),o)for(const[b,_]of Object.entries(a.current))ve(`${o}.${b}`,_);n&&n(m)},h={prefix:o,getDraft:l,setDraft:d,subscribe:p};return e.jsx(Ge.Provider,{value:h,children:e.jsx("form",{...s,onSubmit:c,children:r})})}const ea="_container_1ykvj_1",ta="_title_1ykvj_5",na="_codeBlock_1ykvj_11",ra="_form_1ykvj_38",we={container:ea,title:ta,codeBlock:na,form:ra};function oa(){const[t,n,r]=j("user.name"),[s,o,a]=j("user.username"),[i,,l]=j("user.profile.bio"),[d,,p]=j("user.profile.location"),{sceneName:c,switchScene:h}=Is(),m=c==="default"?"other-scene":"default",b=()=>{r(),a(),l(),p()};return e.jsxs("div",{className:we.container,children:[e.jsx("h2",{className:we.title,children:"useOverride Demo"}),e.jsxs("p",{children:["Add ",e.jsx("code",{children:"#user.name=Alice"})," to the URL hash to override any value."]}),e.jsxs("section",{children:[e.jsx(P,{as:"h3",fontWeight:"bold",children:"Scene"}),e.jsxs("pre",{className:we.codeBlock,children:["current: ",c]}),e.jsxs(oe,{size:"small",onClick:()=>h(m),children:['Switch to "',m,'"']})]}),e.jsxs("section",{children:[e.jsx(P,{as:"h3",fontWeight:"bold",children:"User"}),e.jsxs("pre",{className:we.codeBlock,children:[t," (",s,")"]}),e.jsxs("pre",{className:we.codeBlock,children:[i," · ",d]}),e.jsx(P,{as:"h4",fontWeight:"semibold",fontSize:1,children:"Switch User"}),e.jsxs(ho,{children:[e.jsx(oe,{size:"small",onClick:()=>n("Alice Chen"),children:"Update name"}),e.jsx(oe,{size:"small",onClick:()=>o("alice123"),children:"Update username"})]}),e.jsx(oe,{size:"small",variant:"danger",onClick:b,style:{marginLeft:"8px"},children:"Reset"})]}),e.jsx("a",{href:"/storyboard-source/Overview",children:"hello"}),e.jsxs("section",{children:[e.jsx(P,{as:"h3",fontWeight:"bold",children:"Edit User"}),e.jsxs(jr,{data:"user",className:we.form,children:[e.jsxs(M,{children:[e.jsx(M.Label,{children:"Name"}),e.jsx(Me,{name:"name",placeholder:"Name",size:"small"})]}),e.jsxs(M,{children:[e.jsx(M.Label,{children:"Username"}),e.jsx(Me,{name:"username",placeholder:"Username",size:"small"})]}),e.jsxs(M,{children:[e.jsx(M.Label,{children:"Bio"}),e.jsx(yr,{name:"profile.bio",placeholder:"Bio"})]}),e.jsxs(M,{children:[e.jsx(M.Label,{children:"Location"}),e.jsx(Me,{name:"profile.location",placeholder:"Location",size:"small"})]}),e.jsx(oe,{type:"submit",size:"small",children:"Save"})]})]})]})}const sa=[{icon:Wt,label:"Home",url:"/"},{icon:gt,label:"Forms",url:"/Forms",current:!0}];function aa(){const[,,t]=j("checkout");return e.jsxs(he,{title:"Storyboard",subtitle:"Forms",topnav:sa,children:[e.jsx(P,{as:"h1",fontSize:"larger",children:"Form Components Demo"}),e.jsx(P,{as:"p",color:"fg.muted",children:"Type in the fields below, then click Submit to persist values in the URL hash. Refresh the page or share the URL to restore state."}),e.jsx(jr,{data:"checkout",children:e.jsxs(q,{direction:"vertical",gap:"normal",padding:"normal",children:[e.jsxs(M,{children:[e.jsx(M.Label,{children:"Email"}),e.jsx(Me,{name:"email",placeholder:"you@example.com"})]}),e.jsxs(M,{children:[e.jsx(M.Label,{children:"Full Name"}),e.jsx(Me,{name:"name",placeholder:"Jane Doe"})]}),e.jsxs(M,{children:[e.jsx(M.Label,{children:"Shipping Address"}),e.jsx(yr,{name:"address",placeholder:"123 Main St..."})]}),e.jsxs(M,{children:[e.jsx(M.Label,{children:"Country"}),e.jsxs(fe,{name:"country",children:[e.jsx(fe.Option,{value:"",children:"Select a country"}),e.jsx(fe.Option,{value:"us",children:"United States"}),e.jsx(fe.Option,{value:"ca",children:"Canada"}),e.jsx(fe.Option,{value:"uk",children:"United Kingdom"}),e.jsx(fe.Option,{value:"de",children:"Germany"})]})]}),e.jsxs(M,{children:[e.jsx(Qs,{name:"newsletter"}),e.jsx(M.Label,{children:"Subscribe to newsletter"})]}),e.jsxs(q,{direction:"horizontal",gap:"condensed",children:[e.jsx(oe,{type:"submit",variant:"primary",children:"Submit"}),e.jsx(oe,{type:"button",variant:"danger",onClick:()=>t(),children:"Reset"})]})]})})]})}const wr=Object.freeze(Object.defineProperty({__proto__:null,default:aa},Symbol.toStringTag,{value:"Module"})),ia=[{icon:Fe,label:"Code",url:"/"},{icon:Ae,label:"Issues",counter:10,url:"#issues",current:!0},{icon:qe,label:"Pull Requests",counter:3,url:"/overview"},{icon:Ft,label:"Discussions"},{icon:mt,label:"Actions"},{icon:Ve,label:"Projects",counter:7},{icon:Pe,label:"Security",counter:12},{icon:Te,label:"Insights"}],ca=[{icon:Ae,label:"Open issues",url:""},{icon:qt,label:"Your issues",url:""},{icon:Vt,label:"Assigned to you",url:"",current:!0},{icon:Zn,label:"Mentioning you",url:""}];function la(){return e.jsx(he,{title:"Primer",subtitle:"React",topnav:ia,sidenav:ca,children:"This is the issues page"})}const _r=Object.freeze(Object.defineProperty({__proto__:null,default:la},Symbol.toStringTag,{value:"Module"})),da="_title_1bvkv_1",ua="_card_1bvkv_4",pa="_cardText_1bvkv_12",Tt={title:da,card:ua,cardText:pa},ha=[{icon:Wt,label:"Overview",url:"/",current:!0},{icon:Ae,label:"Organizations",url:"#issues"},{icon:qe,label:"People"},{icon:Ft,label:"Policies"},{icon:mt,label:"GitHub Connect"},{icon:Ve,label:"Code Security",counter:7},{icon:Pe,label:"Billing & Licensing",counter:12},{icon:Te,label:"Settings"},{icon:Te,label:"Compliance"}];function ma(){return e.jsxs(he,{title:"Primer",subtitle:"React",topnav:ha,children:[e.jsx(P,{as:"h1",className:Tt.title,fontSize:"larger",children:"Overview"}),e.jsxs("div",{className:Tt.card,children:[e.jsx(P,{as:"p",className:Tt.cardText,fontSize:"medium",children:"This is a card in the overview"}),e.jsx(oe,{children:"Edit"})]})]})}const Sr=Object.freeze(Object.defineProperty({__proto__:null,default:ma},Symbol.toStringTag,{value:"Module"})),ga="_content_qz2dt_1",fa="_pageHeader_qz2dt_6",ba="_pageTitle_qz2dt_13",xa="_filterBar_qz2dt_19",va="_filterInput_qz2dt_26",ya="_searchAction_qz2dt_30",ja="_listHeader_qz2dt_34",wa="_repoCount_qz2dt_44",_a="_listControls_qz2dt_49",Sa="_sortButton_qz2dt_55",ka="_viewToggle_qz2dt_59",Ca="_viewButton_qz2dt_66",Ea="_viewButtonActive_qz2dt_81",Ia="_repoList_qz2dt_86",Na="_repoItem_qz2dt_95",La="_repoInfo_qz2dt_107",Ta="_repoIcon_qz2dt_114",Aa="_repoName_qz2dt_119",Pa="_repoDescription_qz2dt_131",Ra="_repoMeta_qz2dt_139",$a="_metaItem_qz2dt_148",Oa="_language_qz2dt_154",za="_languageDot_qz2dt_160",N={content:ga,pageHeader:fa,pageTitle:ba,filterBar:xa,filterInput:va,searchAction:ya,listHeader:ja,repoCount:wa,listControls:_a,sortButton:Sa,viewToggle:ka,viewButton:Ca,viewButtonActive:Ea,repoList:Ia,repoItem:Na,repoInfo:La,repoIcon:Ta,repoName:Aa,repoDescription:Pa,repoMeta:Ra,metaItem:$a,language:Oa,languageDot:za},Da={home:Wt,repo:ft,project:Ve,package:nr,people:tr,person:Vt,shield:Pe,graph:Te,gear:gt,"git-pull-request":qe,eye:$o,lock:Ro,code:Fe,"repo-forked":Qn,archive:Po,"repo-template":Ao};function An(t){return typeof t=="string"?Da[t]||ft:t}function Ma(){const t=H("topnav"),n=Array.isArray(t)?t.map(i=>({...i,icon:An(i.icon)})):[],r=H("sidenav"),s=Array.isArray(r)?r.map(i=>({...i,icon:An(i.icon)})):[],o=H("repositories"),a=Array.isArray(o)?o:[];return e.jsx(he,{title:"dsp-testing",topnav:n,sidenav:s,children:e.jsxs("div",{className:N.content,children:[e.jsxs("header",{className:N.pageHeader,children:[e.jsx("h2",{className:N.pageTitle,children:"All"}),e.jsx(oe,{variant:"primary",children:"New repository"})]}),e.jsxs("div",{className:N.filterBar,children:[e.jsx(tt,{leadingVisual:Eo,placeholder:"Filter",value:"copilot",className:N.filterInput,trailingAction:e.jsx(tt.Action,{icon:Io,"aria-label":"Clear filter"})}),e.jsx(tt,{leadingVisual:No,placeholder:"","aria-label":"Search repositories",className:N.searchAction})]}),e.jsxs("div",{className:N.listHeader,children:[e.jsx("span",{className:N.repoCount,children:e.jsxs("strong",{children:[a.length," repositories"]})}),e.jsxs("div",{className:N.listControls,children:[e.jsxs(Ce,{children:[e.jsx(Ce.Button,{size:"small",className:N.sortButton,children:"Last pushed"}),e.jsx(Ce.Overlay,{children:e.jsxs(be,{children:[e.jsx(be.Item,{children:"Last pushed"}),e.jsx(be.Item,{children:"Name"}),e.jsx(be.Item,{children:"Stars"})]})})]}),e.jsxs("div",{className:N.viewToggle,children:[e.jsx("button",{className:`${N.viewButton} ${N.viewButtonActive}`,"aria-label":"List view",children:e.jsx(Lo,{size:16})}),e.jsx("button",{className:N.viewButton,"aria-label":"Grid view",children:e.jsx(To,{size:16})})]})]})]}),e.jsx("ul",{className:N.repoList,children:a.map(i=>e.jsxs("li",{className:N.repoItem,children:[e.jsxs("div",{className:N.repoInfo,children:[e.jsx(ft,{size:16,className:N.repoIcon}),e.jsx("a",{href:i.url,className:N.repoName,children:i.name}),i.description&&e.jsx("span",{className:N.repoDescription,children:i.description})]}),e.jsxs("div",{className:N.repoMeta,children:[i.language&&e.jsxs("span",{className:N.language,children:[e.jsx("span",{className:N.languageDot}),i.language]}),e.jsx("span",{className:N.metaItem,children:e.jsx(gt,{size:16})}),e.jsxs("span",{className:N.metaItem,children:[e.jsx(Qn,{size:16})," ",i.forks]}),e.jsxs("span",{className:N.metaItem,children:[e.jsx(er,{size:16})," ",i.stars]})]})]},i.name))})]})})}const kr=Object.freeze(Object.defineProperty({__proto__:null,default:Ma},Symbol.toStringTag,{value:"Module"})),Ba="_pageWrapper_1x2wf_1",Ha="_breadcrumb_1x2wf_7",Ua="_breadcrumbLink_1x2wf_15",Fa="_breadcrumbSeparator_1x2wf_27",qa="_breadcrumbCurrent_1x2wf_31",Va="_pageTitle_1x2wf_36",Wa="_issueNumber_1x2wf_42",Ja="_stateMeta_1x2wf_48",Ga="_metaText_1x2wf_56",Ya="_contentLayout_1x2wf_66",Ka="_mainContent_1x2wf_73",Xa="_packageTable_1x2wf_78",Za="_packageColumn_1x2wf_88",Qa="_packageLabel_1x2wf_94",ei="_packageValue_1x2wf_99",ti="_packageCode_1x2wf_107",ni="_copyIcon_1x2wf_112",ri="_advisoryBody_1x2wf_118",oi="_timeline_1x2wf_165",si="_timelineItem_1x2wf_173",ai="_timelineBadge_1x2wf_179",ii="_openedIcon_1x2wf_185",ci="_closedIcon_1x2wf_189",li="_timelineText_1x2wf_193",di="_botLabel_1x2wf_205",ui="_sidebar_1x2wf_210",pi="_sidebarSection_1x2wf_216",hi="_sidebarHeading_1x2wf_228",mi="_severityScore_1x2wf_234",gi="_criticalLabel_1x2wf_240",fi="_scoreText_1x2wf_244",bi="_metricsHeading_1x2wf_250",xi="_metricsTable_1x2wf_257",vi="_metricLabel_1x2wf_274",yi="_metricValue_1x2wf_278",ji="_learnMore_1x2wf_284",wi="_cvssVector_1x2wf_294",_i="_epssScore_1x2wf_301",Si="_tagList_1x2wf_308",ki="_tag_1x2wf_308",Ci="_weaknessList_1x2wf_319",Ei="_weaknessItem_1x2wf_328",Ii="_sidebarValue_1x2wf_334",Ni="_sidebarLink_1x2wf_340",Li="_contributeText_1x2wf_353",Ti="_contributeLink_1x2wf_358",f={pageWrapper:Ba,breadcrumb:Ha,breadcrumbLink:Ua,breadcrumbSeparator:Fa,breadcrumbCurrent:qa,pageTitle:Va,issueNumber:Wa,stateMeta:Ja,metaText:Ga,contentLayout:Ya,mainContent:Ka,packageTable:Xa,packageColumn:Za,packageLabel:Qa,packageValue:ei,packageCode:ti,copyIcon:ni,advisoryBody:ri,timeline:oi,timelineItem:si,timelineBadge:ai,openedIcon:ii,closedIcon:ci,timelineText:li,botLabel:di,sidebar:ui,sidebarSection:pi,sidebarHeading:hi,severityScore:mi,criticalLabel:gi,scoreText:fi,metricsHeading:bi,metricsTable:xi,metricLabel:vi,metricValue:yi,learnMore:ji,cvssVector:wi,epssScore:_i,tagList:Si,tag:ki,weaknessList:Ci,weaknessItem:Ei,sidebarValue:Ii,sidebarLink:Ni,contributeText:Li,contributeLink:Ti},Ai={code:Fe,"issue-opened":Ae,"git-pull-request":qe,people:tr,play:mt,project:Ve,star:er,book:Oo,shield:Pe,graph:Te,gear:gt};function Pi(){const t=H("topnav"),n=Array.isArray(t)?t.map(c=>({...c,icon:Ai[c.icon]||Fe})):[],r=H("advisory")||{},s=r.package||{},o=r.severity||{},a=Array.isArray(o.cvssMetrics)?o.cvssMetrics:[],i=Array.isArray(r.tags)?r.tags:[],l=Array.isArray(r.weaknesses)?r.weaknesses:[],d=Array.isArray(r.timeline)?r.timeline:[],p=r.epss||{};return e.jsx(he,{title:"octodemo",subtitle:"test-se-fs-gitogether-repo",topnav:n,children:e.jsxs("div",{className:f.pageWrapper,children:[e.jsxs("nav",{className:f.breadcrumb,children:[e.jsxs("a",{href:"#",className:f.breadcrumbLink,children:[e.jsx(zo,{size:16}),e.jsx("span",{children:r.breadcrumb})]}),e.jsx("span",{className:f.breadcrumbSeparator,children:"/"}),e.jsxs("span",{className:f.breadcrumbCurrent,children:["#",r.id]})]}),e.jsxs("h1",{className:f.pageTitle,children:[r.title," ",e.jsxs("span",{className:f.issueNumber,children:["#",r.id]})]}),e.jsxs("div",{className:f.stateMeta,children:[e.jsxs(mo,{status:"issueClosed",variant:"small",children:[e.jsx(jn,{size:16})," Fixed"]}),e.jsxs("span",{className:f.metaText,children:["Opened ",r.openedAgo," on ",e.jsx("strong",{children:s.name})," (",s.ecosystem,") · · · Fixed ",r.fixedAgo]})]}),e.jsxs("div",{className:f.contentLayout,children:[e.jsxs("div",{className:f.mainContent,children:[e.jsxs("div",{className:f.packageTable,children:[e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Package"}),e.jsxs("span",{className:f.packageValue,children:[e.jsx(nr,{size:16})," ",s.name," (",s.ecosystem,")"]})]}),e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Affected versions"}),e.jsx("code",{className:f.packageCode,children:s.affectedVersions})]}),e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Patched version"}),e.jsxs("span",{className:f.packageValue,children:[e.jsx("strong",{children:s.patchedVersion})," ",e.jsx(Do,{size:16,className:f.copyIcon})]})]})]}),e.jsxs("article",{className:f.advisoryBody,children:[e.jsx("h2",{children:"Summary"}),e.jsx("p",{children:"Log4j versions prior to 2.16.0 are subject to a remote code execution vulnerability via the ldap JNDI parser."}),e.jsxs("p",{children:["As per ",e.jsx("a",{href:"#",children:"Apache's Log4j security guide"}),": Apache Log4j2 <=2.14.1 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints. An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers when message lookup substitution is enabled. From log4j 2.16.0, this behavior has been disabled by default."]}),e.jsxs("p",{children:["Log4j version 2.15.0 contained an earlier fix for the vulnerability, but that patch did not disable attacker-controlled JNDI lookups in all situations. For more information, see the ",e.jsx("code",{children:"Updated advice for version 2.16.0"})," section of this advisory."]}),e.jsx("h2",{children:"Impact"}),e.jsx("p",{children:"Logging untrusted or user controlled data with a vulnerable version of Log4J may result in Remote Code Execution (RCE) against your application. This includes untrusted data included in logged errors such as exception traces, authentication failures, and other unexpected vectors of user controlled input."}),e.jsx("h2",{children:"Affected versions"}),e.jsx("p",{children:"Any Log4J version prior to v2.15.0 is affected to this specific issue."}),e.jsx("p",{children:"The v1 branch of Log4J which is considered End Of Life (EOL) is vulnerable to other RCE vectors so the recommendation is to still update to 2.16.0 where possible."}),e.jsx("h2",{children:"Security releases"}),e.jsx("p",{children:"Additional backports of this fix have been made available in versions 2.3.1, 2.12.2, and 2.12.3"}),e.jsx("h2",{children:"Affected packages"}),e.jsxs("p",{children:["Only the ",e.jsx("code",{children:"org.apache.logging.log4j:log4j-core"})," package is directly affected by this vulnerability. The ",e.jsx("code",{children:"org.apache.logging.log4j:log4j-api"})," should be kept at the same version as the ",e.jsx("code",{children:"org.apache.logging.log4j-core"})," package to ensure compatability if in use."]}),e.jsx("h2",{children:"Remediation Advice"}),e.jsx("h3",{children:"Updated advice for version 2.16.0"}),e.jsxs("p",{children:["The Apache Logging Services team provided updated mitigation advice upon the release of version 2.16.0, which ",e.jsx("a",{href:"#",children:"disables JNDI by default and completely removes support for message lookups"}),"."]}),e.jsxs("p",{children:["Even in version 2.15.0, lookups used in layouts to provide specific pieces of context information will still recursively resolve, possibly triggering JNDI lookups. This problem is being tracked as ",e.jsx("a",{href:"#",children:"CVE-2021-45046"}),". More information is available on the ",e.jsx("a",{href:"#",children:"GitHub Security Advisory for CVE-2021-45046"}),"."]}),e.jsxs("p",{children:["Users who want to avoid attacker-controlled JNDI lookups but cannot upgrade to 2.16.0 must ",e.jsx("a",{href:"#",children:"ensure that no such lookups resolve to attacker-provided data and ensure that the JndiLookup class is not loaded"}),"."]}),e.jsx("p",{children:"Please note that Log4J v1 is End Of Life (EOL) and will not receive patches for this issue. Log4J v1 is also vulnerable to other RCE vectors and we recommend you migrate to Log4J 2.16.0 where possible."})]}),e.jsx("div",{className:f.timeline,children:d.map((c,h)=>e.jsxs("div",{className:f.timelineItem,children:[e.jsx("div",{className:f.timelineBadge,children:c.action.includes("closed")?e.jsx(jn,{size:16,className:f.closedIcon}):e.jsx(Pe,{size:16,className:f.openedIcon})}),e.jsx(go,{src:c.actorAvatar,size:20,alt:c.actor}),e.jsxs("span",{className:f.timelineText,children:[e.jsx("strong",{children:c.actor}),c.isBot&&e.jsx(nt,{size:"small",className:f.botLabel,children:"bot"})," ",c.action," ",c.timeAgo]})]},h))})]}),e.jsxs("aside",{className:f.sidebar,children:[e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Severity"}),e.jsxs("div",{className:f.severityScore,children:[e.jsx(nt,{variant:"danger",className:f.criticalLabel,children:o.level}),e.jsx("span",{className:f.scoreText,children:o.score})]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h4",{className:f.metricsHeading,children:"CVSS v3 base metrics"}),e.jsx("table",{className:f.metricsTable,children:e.jsx("tbody",{children:a.map(c=>e.jsxs("tr",{children:[e.jsx("td",{className:f.metricLabel,children:c.label}),e.jsx("td",{className:f.metricValue,children:c.value})]},c.label))})}),e.jsx("a",{href:"#",className:f.learnMore,children:"Learn more about base metrics"}),e.jsx("p",{className:f.cvssVector,children:o.cvssVector})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"EPSS score"}),e.jsxs("p",{className:f.epssScore,children:[p.score," (",p.percentile,")"]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Tags"}),e.jsx("div",{className:f.tagList,children:i.map(c=>e.jsx(nt,{className:f.tag,children:c},c))})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Weaknesses"}),e.jsx("ul",{className:f.weaknessList,children:l.map(c=>e.jsxs("li",{className:f.weaknessItem,children:["▸ ",c]},c))})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"CVE ID"}),e.jsx("p",{className:f.sidebarValue,children:r.cveId})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"GHSA ID"}),e.jsx("p",{className:f.sidebarValue,children:r.ghsaId})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsxs("a",{href:"#",className:f.sidebarLink,children:[e.jsx(Mo,{size:16})," See advisory in GitHub Advisory Database"]}),e.jsxs("a",{href:"#",className:f.sidebarLink,children:[e.jsx(ft,{size:16})," See all of your affected repositories"]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("p",{className:f.contributeText,children:"See something to contribute?"}),e.jsx("a",{href:"#",className:f.contributeLink,children:"Suggest improvements for this advisory on the GitHub Advisory Database."})]})]})]})]})})}const Cr=Object.freeze(Object.defineProperty({__proto__:null,default:Pi},Symbol.toStringTag,{value:"Module"})),At=["Account","Organization","Workspace","Review"];function ce(t){return typeof t=="string"?t:""}function Pn(t){return t===!0||t==="true"}function Ze({name:t,defaultValue:n,onCommit:r,...s}){const o=x.useRef(n);return e.jsx(_e,{name:t,defaultValue:n,onChange:({value:a})=>{o.current=a},onBlur:()=>r(o.current),...s})}function Ri(){const t=Ut(),[n,r]=j("signup.step"),s=Math.min(Math.max(parseInt(n,10)||0,0),At.length-1),o=C=>{const O=typeof C=="function"?C(s):C;r(String(O))},[a,i,l]=j("signup.errors.fullName"),[d,p,c]=j("signup.errors.email"),[h,m,b]=j("signup.errors.password"),[_,S,T]=j("signup.errors.orgName"),[k,R,D]=j("signup.errors.orgSize"),[U,B,X]=j("signup.errors.role"),[J,te,G]=j("signup.errors.region"),[v,E,L]=j("signup.errors.plan"),[A,F,$]=j("signup.errors.agreeTerms"),w={fullName:a,email:d,password:h,orgName:_,orgSize:k,role:U,region:J,plan:v,agreeTerms:A},Y={fullName:i,email:p,password:m,orgName:S,orgSize:R,role:B,region:te,plan:E,agreeTerms:F},V={fullName:l,email:c,password:b,orgName:T,orgSize:D,role:X,region:G,plan:L,agreeTerms:$},me=()=>Object.values(V).forEach(C=>C()),on=C=>{me(),Object.entries(C).forEach(([O,co])=>Y[O]?.(co))},[sn,Yr]=j("signup.fullName"),[an,Kr]=j("signup.email"),[cn,Xr]=j("signup.password"),[ln,Zr]=j("signup.organization.name"),[dn,Qr]=j("signup.organization.size"),[un,eo]=j("signup.organization.role"),[pn,to]=j("signup.workspace.region"),[hn,no]=j("signup.workspace.plan"),[mn,ro]=j("signup.workspace.newsletter"),[gn,oo]=j("signup.workspace.agreeTerms"),I=x.useMemo(()=>({fullName:ce(sn),email:ce(an),password:ce(cn),orgName:ce(ln),orgSize:ce(dn),role:ce(un),region:ce(pn),plan:ce(hn)||"starter",newsletter:Pn(mn),agreeTerms:Pn(gn)}),[sn,an,cn,ln,dn,un,pn,hn,mn,gn]);function fn(C){const O={};return C===0&&(I.fullName.trim()||(O.fullName="Full name is required."),I.email.trim()||(O.email="Email is required."),I.password.trim()||(O.password="Password is required.")),C===1&&(I.orgName.trim()||(O.orgName="Organization name is required."),I.orgSize.trim()||(O.orgSize="Organization size is required."),I.role.trim()||(O.role="Role is required.")),C===2&&(I.region.trim()||(O.region="Region is required."),I.plan.trim()||(O.plan="Plan is required."),I.agreeTerms||(O.agreeTerms="You must accept terms to continue.")),on(O),Object.keys(O).length===0}function so(){fn(s)&&o(C=>Math.min(C+1,At.length-1))}function ao(){on({}),o(C=>Math.max(C-1,0))}function io(){if(!fn(2)){o(2);return}t("/Dashboard")}return e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:6,align:"center",justify:"center",children:e.jsxs(u,{maxWidth:"560px",width:"100%",direction:"column",gap:6,children:[e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(g,{variant:"featured-1",weight:"bold",children:"Create your cloud account"}),e.jsx(g,{variant:"body-2",color:"neutral-faded",children:"Complete the onboarding flow to configure your account and organization."})]}),e.jsx(vn,{activeId:String(s),children:At.map((C,O)=>e.jsx(vn.Item,{id:String(O),title:C,completed:O<s,subtitle:`Step ${O+1}`},C))}),e.jsx(pe,{padding:6,children:e.jsxs(u,{direction:"column",gap:5,children:[s===0&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!w.fullName,children:[e.jsx(y.Label,{children:"Full name"}),e.jsx(Ze,{name:"fullName",defaultValue:I.fullName,placeholder:"Jane Doe",onCommit:Yr}),w.fullName&&e.jsx(y.Error,{children:w.fullName})]}),e.jsxs(y,{hasError:!!w.email,children:[e.jsx(y.Label,{children:"Email"}),e.jsx(Ze,{name:"email",defaultValue:I.email,placeholder:"jane@acme.cloud",onCommit:Kr}),w.email&&e.jsx(y.Error,{children:w.email})]}),e.jsxs(y,{hasError:!!w.password,children:[e.jsx(y.Label,{children:"Password"}),e.jsx(Ze,{name:"password",defaultValue:I.password,onCommit:Xr,inputAttributes:{type:"password"}}),w.password&&e.jsx(y.Error,{children:w.password})]})]}),s===1&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!w.orgName,children:[e.jsx(y.Label,{children:"Organization name"}),e.jsx(Ze,{name:"orgName",defaultValue:I.orgName,placeholder:"Acme Cloud",onCommit:Zr}),w.orgName&&e.jsx(y.Error,{children:w.orgName})]}),e.jsxs(y,{hasError:!!w.orgSize,children:[e.jsx(y.Label,{children:"Organization size"}),e.jsxs(Se,{name:"orgSize",value:I.orgSize,placeholder:"Select size",onChange:({value:C})=>Qr(C),children:[e.jsx("option",{value:"1-10",children:"1–10 employees"}),e.jsx("option",{value:"11-50",children:"11–50 employees"}),e.jsx("option",{value:"51-250",children:"51–250 employees"}),e.jsx("option",{value:"251+",children:"251+ employees"})]}),w.orgSize&&e.jsx(y.Error,{children:w.orgSize})]}),e.jsxs(y,{hasError:!!w.role,children:[e.jsx(y.Label,{children:"Your role"}),e.jsxs(Se,{name:"role",value:I.role,placeholder:"Select role",onChange:({value:C})=>eo(C),children:[e.jsx("option",{value:"founder",children:"Founder"}),e.jsx("option",{value:"engineering-manager",children:"Engineering Manager"}),e.jsx("option",{value:"developer",children:"Developer"}),e.jsx("option",{value:"platform-admin",children:"Platform Admin"})]}),w.role&&e.jsx(y.Error,{children:w.role})]})]}),s===2&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!w.region,children:[e.jsx(y.Label,{children:"Primary region"}),e.jsxs(Se,{name:"region",value:I.region,placeholder:"Select region",onChange:({value:C})=>to(C),children:[e.jsx("option",{value:"us-east-1",children:"US East"}),e.jsx("option",{value:"us-west-2",children:"US West"}),e.jsx("option",{value:"eu-west-1",children:"EU West"}),e.jsx("option",{value:"ap-southeast-1",children:"AP Southeast"})]}),w.region&&e.jsx(y.Error,{children:w.region})]}),e.jsxs(y,{hasError:!!w.plan,children:[e.jsx(y.Label,{children:"Starting plan"}),e.jsxs(Se,{name:"plan",value:I.plan,onChange:({value:C})=>no(C),children:[e.jsx("option",{value:"starter",children:"Starter"}),e.jsx("option",{value:"growth",children:"Growth"}),e.jsx("option",{value:"enterprise",children:"Enterprise"})]}),w.plan&&e.jsx(y.Error,{children:w.plan})]}),e.jsx(Rt,{name:"newsletter",checked:I.newsletter,onChange:({checked:C})=>ro(C?"true":"false"),children:"Email me product updates and onboarding tips"}),e.jsxs(y,{hasError:!!w.agreeTerms,children:[e.jsx(Rt,{name:"agreeTerms",checked:I.agreeTerms,onChange:({checked:C})=>oo(C?"true":"false"),children:"I agree to the Terms of Service and Privacy Policy"}),w.agreeTerms&&e.jsx(y.Error,{children:w.agreeTerms})]})]}),s===3&&e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(g,{variant:"featured-3",weight:"bold",children:"Review your configuration"}),e.jsxs(u,{direction:"column",gap:3,children:[e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Name"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.fullName})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Email"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.email})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Organization"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.orgName})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Team size"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.orgSize})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Role"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.role})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Region"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.region})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Plan"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.plan})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Newsletter"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.newsletter?"Yes":"No"})})]})]})]}),e.jsxs(u,{direction:"row",justify:"end",gap:3,children:[s>0&&e.jsx(ie,{variant:"ghost",onClick:ao,children:"Back"}),s<3&&e.jsx(ie,{color:"primary",onClick:so,children:"Continue"}),s===3&&e.jsx(ie,{color:"primary",onClick:io,children:"Create account"})]})]})})]})})})}const Er=Object.freeze(Object.defineProperty({__proto__:null,default:Ri},Symbol.toStringTag,{value:"Module"})),$i="/storyboard-source/assets/mona-loading-a6vFIHDd.gif",Oi="_container_1dofh_1",zi="_contentBox_1dofh_12",Di="_codeLine_1dofh_21",Mi="_iconWrapper_1dofh_26",Bi="_codeText_1dofh_32",Hi="_monaWrapper_1dofh_39",Ui="_footerHeader_1dofh_45",Fi="_tipsText_1dofh_50",qi="_warningText_1dofh_55",se={container:Oi,contentBox:zi,codeLine:Di,iconWrapper:Mi,codeText:Bi,monaWrapper:Hi,footerHeader:Ui,tipsText:Fi,warningText:qi};function Vi(){return e.jsxs("div",{className:se.container,children:[e.jsx(Xn,{size:24}),e.jsx(oa,{}),e.jsxs(q,{padding:"spacious",className:se.contentBox,children:[e.jsx(Rn,{icon:Bo,iconColor:"success.fg",children:"Mona's playground successfully initialised..."}),e.jsxs(Rn,{icon:Ho,iconColor:"accent.fg",children:["Visit ",e.jsx(P,{className:se.warningText,children:"src/Playground.js"})," ","and start building your own layouts using Primer."]}),e.jsx("div",{className:se.monaWrapper,children:e.jsx("img",{src:$i,alt:"mona",width:48,height:48})})]}),e.jsx(Wi,{})]})}function Rn({icon:t,iconColor:n,children:r}){return e.jsxs(q,{direction:"horizontal",className:se.codeLine,children:[e.jsx(q,{className:se.iconWrapper,children:e.jsx(t,{size:16})}),e.jsx(P,{as:"p",className:se.codeText,children:r})]})}function Wi(){return e.jsxs(q,{gap:"condensed",children:[e.jsxs(q,{direction:"horizontal",className:se.footerHeader,children:[e.jsx(qt,{size:18}),e.jsx(P,{className:se.tipsText,children:"Tips"})]}),e.jsxs(P,{children:["Before you get started check out our"," ",e.jsx(xn,{href:"https://primer.style/react",target:"_blank",children:"Primer React Documentation"})," ","and"," ",e.jsx(xn,{href:"https://ui.githubapp.com/storybook/?path=/docs/templates-readme--docs&globals=viewport:narrow",target:"_blank",children:"Primer Templates (staff only)"})]})]})}const Ji="_container_m20cu_1",Gi="_buttonWrapper_m20cu_7",Yi="_label_m20cu_12",Pt={container:Ji,buttonWrapper:Gi,label:Yi};function Ir(){const{setDayScheme:t,setNightScheme:n,colorScheme:r}=fo(),s=i=>{t(i),n(i)},o=[{name:"Light",value:"light",icon:wn},{name:"Light colorblind",value:"light_colorblind",icon:wn},{name:"Dark",value:"dark",icon:Ye},{name:"Dark colorblind",value:"dark_colorblind",icon:Ye},{name:"Dark high contrast",value:"dark_high_contrast",icon:Ye},{name:"Dark Dimmed",value:"dark_dimmed",icon:Ye}],a=o.find(i=>i.value===r);return e.jsx(q,{padding:"normal",className:Pt.container,children:e.jsx(q,{className:Pt.buttonWrapper,children:e.jsxs(Ce,{children:[e.jsxs(Ce.Button,{size:"small",children:[e.jsx(a.icon,{}),e.jsxs(q,{className:Pt.label,children:[" ",a.name]})]}),e.jsx(Ce.Overlay,{align:"right",children:e.jsx(be,{showDividers:!0,children:e.jsx(be.Group,{selectionVariant:"single",children:o.map(i=>e.jsx(be.Item,{href:"#",selected:i.value===r,onSelect:()=>s(i.value),children:i.name},i.value))})})})]})})})}function Ki(){return e.jsxs(e.Fragment,{children:[e.jsx(Vi,{}),e.jsx(Ir,{})]})}const Nr=Object.freeze(Object.defineProperty({__proto__:null,default:Ki},Symbol.toStringTag,{value:"Module"})),Lr={todo:"Todo",in_progress:"In Progress",done:"Done",cancelled:"Cancelled"},Tr={urgent:"Urgent",high:"High",medium:"Medium",low:"Low"},Xi=Object.entries(Lr),Zi=Object.entries(Tr);function Ar({prefix:t}){const[n,r]=j(`${t}.title`),[s,o]=j(`${t}.description`),[a,i]=j(`${t}.status`),[l,d]=j(`${t}.priority`),[p,c]=j(`${t}.assignee`),[h,m]=j(`${t}.project`),[b,_]=j(`${t}.estimate`);return e.jsxs(u,{direction:"column",gap:4,children:[e.jsxs(y,{children:[e.jsx(y.Label,{children:"Title"}),e.jsx(_e,{name:"title",value:n??"",onChange:({value:S})=>r(S)})]}),e.jsxs(y,{children:[e.jsx(y.Label,{children:"Description"}),e.jsx(_e,{name:"description",multiline:!0,value:s??"",onChange:({value:S})=>o(S),inputAttributes:{rows:3}})]}),e.jsxs(u,{direction:"row",gap:4,children:[e.jsx(u.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Status"}),e.jsx(Se,{name:"status",value:a??"todo",onChange:({value:S})=>i(S),children:Xi.map(([S,T])=>e.jsx("option",{value:S,children:T},S))})]})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Priority"}),e.jsx(Se,{name:"priority",value:l??"medium",onChange:({value:S})=>d(S),children:Zi.map(([S,T])=>e.jsx("option",{value:S,children:T},S))})]})})]}),e.jsxs(u,{direction:"row",gap:4,children:[e.jsx(u.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Assignee"}),e.jsx(_e,{name:"assignee",placeholder:"Username",value:p??"",onChange:({value:S})=>c(S)})]})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Project"}),e.jsx(_e,{name:"project",placeholder:"Project name",value:h??"",onChange:({value:S})=>m(S)})]})})]}),e.jsxs(y,{children:[e.jsx(y.Label,{children:"Estimate (points)"}),e.jsx(_e,{name:"estimate",placeholder:"e.g. 5",value:b??"",onChange:({value:S})=>_(S)})]})]})}const Qi={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},Qe=["title","description","status","priority","assignee","project","estimate"];function ec({issue:t,active:n,onClose:r}){const s={title:ge("issues",t.id,"title"),description:ge("issues",t.id,"description"),status:ge("issues",t.id,"status"),priority:ge("issues",t.id,"priority"),assignee:ge("issues",t.id,"assignee"),project:ge("issues",t.id,"project"),estimate:ge("issues",t.id,"estimate")},o=()=>{Qe.forEach(l=>{ve(`draft.edit.${l}`,t[l]??"")})},a=()=>{const l=new URLSearchParams(window.location.hash.replace(/^#/,""));Qe.forEach(d=>{const[,p]=s[d];p(l.get(`draft.edit.${d}`)??"")}),Qe.forEach(d=>at(`draft.edit.${d}`)),r({reason:"save"})},i=()=>{Qe.forEach(l=>at(`draft.edit.${l}`)),r({reason:"cancel"})};return e.jsxs(Ee,{active:n,onClose:i,onOpen:o,size:"600px",padding:6,position:"center",children:[e.jsx(Ee.Title,{children:"Edit Issue"}),e.jsx(Ee.Subtitle,{children:t.identifier}),e.jsxs(u,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(Ar,{prefix:"draft.edit"}),e.jsxs(u,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(ie,{variant:"outline",onClick:i,children:"Cancel"}),e.jsx(ie,{color:"primary",onClick:a,children:"Save"})]})]})]})}function tc(){const[t,n,r]=j("ui.editModal"),s=t==="true",o=gr("issues","id"),a=H("signup.organization.name"),i=H("signup.fullName"),l=H("signup.organization.role");return o?e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(ut,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"row",gap:8,align:"start",children:[e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,maxWidth:"720px",children:[e.jsxs(u,{direction:"row",gap:2,align:"center",justify:"space-between",children:[e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsx(ye,{to:"/issues",style:{textDecoration:"none"},children:e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:a||"Workspace"})}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"›"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:o.identifier})]}),e.jsx(ie,{variant:"outline",size:"small",onClick:()=>n("true"),children:"Edit issue"})]}),e.jsx(ec,{issue:o,active:s,onClose:()=>r()}),e.jsx(g,{variant:"featured-1",weight:"bold",children:o.title}),o.description&&e.jsx(g,{variant:"body-2",color:"neutral-faded",children:o.description}),o.acceptanceCriteria?.length>0&&e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Acceptance Criteria"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:o.acceptanceCriteria.map((d,p)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(g,{variant:"body-3",children:d})},p))})]}),o.technicalNotes?.length>0&&e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Technical Notes"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:o.technicalNotes.map((d,p)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(g,{variant:"body-3",children:d})},p))})]}),e.jsx(ae,{}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"+ Add sub-issues"}),e.jsx(ae,{}),e.jsxs(u,{direction:"column",gap:3,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Activity"}),(o.activity||[]).map((d,p)=>e.jsxs(u,{direction:"row",gap:3,align:"center",children:[e.jsx(yn,{src:d.avatar,initials:d.user?.[0]?.toUpperCase(),size:6}),e.jsxs(u,{direction:"column",children:[e.jsxs(g,{variant:"body-3",children:[e.jsx(g,{weight:"medium",children:d.user}),d.type==="created"&&" created the issue",d.type==="comment"&&":"]}),d.body&&e.jsx(g,{variant:"body-3",color:"neutral-faded",children:d.body}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:d.time})]})]},p))]})]})}),e.jsx(u.Item,{columns:3,children:e.jsx(pe,{padding:4,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:"Properties"}),e.jsx(ae,{}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Status"}),e.jsx(g,{variant:"body-3",children:Lr[o.status]||o.status})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Priority"}),e.jsx(g,{variant:"body-3",children:Tr[o.priority]||o.priority})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Assignee"}),o.assignee?e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsx(yn,{src:o.assigneeAvatar,initials:o.assignee?.[0]?.toUpperCase(),size:5}),e.jsx(g,{variant:"body-3",children:o.assignee})]}):e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Assign"})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Labels"}),e.jsx(u,{direction:"row",gap:1,wrap:!0,children:(o.labels||[]).map(d=>e.jsx(He,{size:"small",color:Qi[d]||"neutral",children:d},d))})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Project"}),e.jsx(g,{variant:"body-3",color:o.project?void 0:"neutral-faded",children:o.project||"Add to project"})]}),o.estimate&&e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Estimate"}),e.jsxs(g,{variant:"body-3",children:[o.estimate," points"]})]})]})})})]})})]})})}):e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(ut,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,align:"center",paddingBlock:16,children:[e.jsx(g,{variant:"featured-2",weight:"bold",children:"Issue not found"}),e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"The issue you're looking for doesn't exist."}),e.jsx(ye,{to:"/issues",children:"← Back to all issues"})]})})]})})})}const nc=Object.freeze(Object.defineProperty({__proto__:null,default:tc},Symbol.toStringTag,{value:"Module"})),rc="_issueRow_1cpdh_1",oc={issueRow:rc},sc={todo:"○",in_progress:"◐",done:"●",cancelled:"✕"},ac={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},ic={title:"",description:"",status:"todo",priority:"medium",assignee:"",project:"",estimate:""},Ot=["title","description","status","priority","assignee","project","estimate"];function $n(t){Ot.forEach(n=>at(`${t}.${n}`))}function cc({active:t,onClose:n,issueCount:r}){const[s]=j("draft.create.title"),o=Ut(),a=`FIL-${r+1}`,i=()=>{Ot.forEach(p=>{ve(`draft.create.${p}`,ic[p])})},l=()=>{if(!(s??"").trim())return;const p=s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`new-issue-${r+1}`;Ot.forEach(c=>{const h=new URLSearchParams(window.location.hash.replace(/^#/,"")).get(`draft.create.${c}`)??"";ve(`record.issues.${p}.${c}`,h)}),ve(`record.issues.${p}.identifier`,a),$n("draft.create"),n({reason:"save"}),o(`/issues/${p}`)},d=()=>{$n("draft.create"),n({reason:"cancel"})};return e.jsxs(Ee,{active:t,onClose:d,onOpen:i,size:"600px",padding:6,position:"center",children:[e.jsx(Ee.Title,{children:"Create Issue"}),e.jsx(Ee.Subtitle,{children:a}),e.jsxs(u,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(Ar,{prefix:"draft.create"}),e.jsxs(u,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(ie,{variant:"outline",onClick:d,children:"Cancel"}),e.jsx(ie,{color:"primary",onClick:l,children:"Save"})]})]})]})}function lc(){const[t,n,r]=j("ui.createModal"),s=t==="true",o=fr("issues"),a=H("signup.organization.name"),i=H("signup.fullName"),l=H("signup.organization.role"),d=o.filter(c=>c.status!=="done"&&c.status!=="cancelled"),p=o.filter(c=>c.status==="done"||c.status==="cancelled");return e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(ut,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,maxWidth:"900px",children:[e.jsxs(u,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(g,{variant:"featured-2",weight:"bold",children:"Issues"}),e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsxs(He,{color:"neutral",children:[o.length," total"]}),e.jsx(ie,{size:"small",color:"primary",onClick:()=>n("true"),children:"Create issue"})]})]}),e.jsx(cc,{active:s,onClose:()=>r(),issueCount:o.length}),e.jsxs(u,{direction:"column",gap:0,children:[e.jsx(u,{paddingBlock:2,paddingInline:3,children:e.jsxs(g,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Open · ",d.length]})}),e.jsx(ae,{}),d.map(c=>e.jsx(On,{issue:c},c.id))]}),p.length>0&&e.jsxs(u,{direction:"column",gap:0,children:[e.jsx(u,{paddingBlock:2,paddingInline:3,children:e.jsxs(g,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Closed · ",p.length]})}),e.jsx(ae,{}),p.map(c=>e.jsx(On,{issue:c},c.id))]})]})})]})})})}function On({issue:t}){return e.jsxs(e.Fragment,{children:[e.jsx(ye,{to:`/issues/${t.id}`,className:oc.issueRow,children:e.jsxs(u,{direction:"row",align:"center",gap:3,padding:3,children:[e.jsx(g,{variant:"body-3",color:"neutral-faded",attributes:{style:{minWidth:20}},children:sc[t.status]||"○"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",attributes:{style:{minWidth:50}},children:t.identifier}),e.jsx(u.Item,{grow:!0,children:e.jsx(g,{variant:"body-3",children:t.title})}),e.jsx(u,{direction:"row",gap:1,children:(t.labels||[]).map(n=>e.jsx(He,{size:"small",color:ac[n]||"neutral",children:n},n))}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",attributes:{style:{textTransform:"capitalize"}},children:t.priority})]})}),e.jsx(ae,{})]})}const dc=Object.freeze(Object.defineProperty({__proto__:null,default:lc},Symbol.toStringTag,{value:"Module"}));function uc(){const t=gr("posts","id");return t?e.jsx(he,{title:"Blog",subtitle:t.title,children:e.jsxs("article",{style:{maxWidth:"720px",padding:"2rem"},children:[e.jsxs("header",{children:[e.jsx(P,{as:"h1",sx:{fontSize:4,mb:2},children:t.title}),e.jsxs(P,{as:"p",color:"fg.muted",sx:{mb:3},children:[t.author," · ",t.date]}),t.summary&&e.jsx(nt,{variant:"accent",sx:{mb:3},children:t.summary})]}),e.jsx(P,{as:"div",sx:{mt:3,lineHeight:1.6},children:(t.body||"").split(`

`).map((n,r)=>e.jsx("p",{children:n},r))}),e.jsx("footer",{style:{marginTop:"2rem",borderTop:"1px solid var(--borderColor-muted)",paddingTop:"1rem"},children:e.jsx(ye,{to:"/posts",children:"← Back to all posts"})})]})}):e.jsx(he,{title:"Blog",subtitle:"Post",children:e.jsxs("section",{style:{padding:"2rem"},children:[e.jsx(P,{as:"h1",children:"Post not found"}),e.jsx(P,{as:"p",color:"fg.muted",children:"The post you're looking for doesn't exist."}),e.jsx(ye,{to:"/posts",children:"← Back to all posts"})]})})}const pc=Object.freeze(Object.defineProperty({__proto__:null,default:uc},Symbol.toStringTag,{value:"Module"}));function hc(){const t=fr("posts");return e.jsx(he,{title:"Blog",subtitle:"All Posts",children:e.jsxs("section",{style:{maxWidth:"720px",padding:"2rem"},children:[e.jsx(P,{as:"h1",sx:{fontSize:4,mb:3},children:"Blog"}),t.map(n=>e.jsxs("article",{style:{marginBottom:"1.5rem",paddingBottom:"1.5rem",borderBottom:"1px solid var(--borderColor-muted)"},children:[e.jsx(ye,{to:`/posts/${n.id}`,style:{textDecoration:"none"},children:e.jsx(P,{as:"h2",sx:{fontSize:2,color:"accent.fg"},children:n.title})}),e.jsxs(P,{as:"p",color:"fg.muted",sx:{fontSize:1,mt:1},children:[n.author," · ",n.date]}),n.summary&&e.jsx(P,{as:"p",sx:{mt:1},children:n.summary})]},n.id))]})})}const mc=Object.freeze(Object.defineProperty({__proto__:null,default:hc},Symbol.toStringTag,{value:"Module"})),gc="_container_1cvh6_1",fc="_header_1cvh6_8",bc="_title_1cvh6_13",xc="_subtitle_1cvh6_21",vc="_grid_1cvh6_27",yc="_card_1cvh6_35",jc="_thumbnail_1cvh6_51",wc="_cardBody_1cvh6_71",_c="_sceneName_1cvh6_76",Sc="_empty_1cvh6_83",kc="_sectionTitle_1cvh6_92",Cc="_branchSection_1cvh6_102",Ec="_branchMeta_1cvh6_106",z={container:gc,header:fc,title:bc,subtitle:xc,grid:vc,card:yc,thumbnail:jc,cardBody:wc,sceneName:_c,empty:Sc,sectionTitle:kc,branchSection:Cc,branchMeta:Ec},Pr="/storyboard-source/".replace(/\/[^/]*\/$/,"/"),Ic=`${Pr}branches.json`,Nc=Object.assign({"/src/pages/Dashboard.jsx":()=>Z(()=>Promise.resolve().then(()=>xr),void 0),"/src/pages/Forms.jsx":()=>Z(()=>Promise.resolve().then(()=>wr),void 0),"/src/pages/Issues.jsx":()=>Z(()=>Promise.resolve().then(()=>_r),void 0),"/src/pages/Overview.jsx":()=>Z(()=>Promise.resolve().then(()=>Sr),void 0),"/src/pages/Repositories.jsx":()=>Z(()=>Promise.resolve().then(()=>kr),void 0),"/src/pages/SecurityAdvisory.jsx":()=>Z(()=>Promise.resolve().then(()=>Cr),void 0),"/src/pages/Signup.jsx":()=>Z(()=>Promise.resolve().then(()=>Er),void 0),"/src/pages/_app.jsx":()=>Z(()=>Promise.resolve().then(()=>br),void 0),"/src/pages/index.jsx":()=>Z(()=>Promise.resolve().then(()=>Nr),void 0)}),Lc=Object.keys(Nc).map(t=>t.replace("/src/pages/","").replace(".jsx","")).filter(t=>!t.startsWith("_")&&t!=="index"&&t!=="viewfinder");function zn({name:t}){const n=ls(t),r=[];for(let o=0;o<12;o++){const a=n*(o+1),i=(a*7+o*31)%320,l=(a*13+o*17)%200,d=20+a*(o+3)%80,p=8+a*(o+7)%40,c=.06+a*(o+2)%20/100,h=o%3===0?"var(--placeholder-accent)":o%3===1?"var(--placeholder-fg)":"var(--placeholder-muted)";r.push(e.jsx("rect",{x:i,y:l,width:d,height:p,rx:2,fill:h,opacity:c},o))}const s=[];for(let o=0;o<6;o++){const i=10+n*(o+5)%180;s.push(e.jsx("line",{x1:0,y1:i,x2:320,y2:i,stroke:"var(--placeholder-grid)",strokeWidth:.5,opacity:.4},`h${o}`))}for(let o=0;o<8;o++){const i=10+n*(o+9)%300;s.push(e.jsx("line",{x1:i,y1:0,x2:i,y2:200,stroke:"var(--placeholder-grid)",strokeWidth:.5,opacity:.3},`v${o}`))}return e.jsxs("svg",{viewBox:"0 0 320 200",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",children:[e.jsx("rect",{width:"320",height:"200",fill:"var(--placeholder-bg)"}),s,r]})}const et=Object.keys(hr);function Tc(){const[t,n]=x.useState(null);return x.useEffect(()=>{fetch(Ic).then(r=>r.ok?r.json():[]).then(r=>n(Array.isArray(r)?r:[])).catch(()=>n([]))},[]),e.jsxs("div",{className:z.container,children:[e.jsxs("header",{className:z.header,children:[e.jsx("h1",{className:z.title,children:"Viewfinder"}),e.jsxs("p",{className:z.subtitle,children:[et.length," scene",et.length!==1?"s":"",t&&t.length>0?` · ${t.length} branch preview${t.length!==1?"s":""}`:""]})]}),et.length===0?e.jsxs("p",{className:z.empty,children:["No scenes found. Add a ",e.jsx("code",{children:"*.scene.json"})," file to get started."]}):e.jsxs("section",{children:[e.jsx("h2",{className:z.sectionTitle,children:"Scenes"}),e.jsx("div",{className:z.grid,children:et.map(r=>e.jsxs(ye,{to:ds(r,Lc),className:z.card,children:[e.jsx("div",{className:z.thumbnail,children:e.jsx(zn,{name:r})}),e.jsx("div",{className:z.cardBody,children:e.jsx("p",{className:z.sceneName,children:r})})]},r))})]}),t&&t.length>0&&e.jsxs("section",{className:z.branchSection,children:[e.jsx("h2",{className:z.sectionTitle,children:"Branch Previews"}),e.jsx("div",{className:z.grid,children:t.map(r=>e.jsxs("a",{href:`${Pr}${r.folder}/`,className:z.card,children:[e.jsx("div",{className:z.thumbnail,children:e.jsx(zn,{name:r.branch})}),e.jsxs("div",{className:z.cardBody,children:[e.jsx("p",{className:z.sceneName,children:r.branch}),e.jsx("p",{className:z.branchMeta,children:r.folder})]})]},r.folder))})]})]})}const Ac=Object.freeze(Object.defineProperty({__proto__:null,default:Tc},Symbol.toStringTag,{value:"Module"}));var le={route:[/^.*\/src\/pages\/|\.(jsx|tsx|mdx)$/g,""],splat:[/\[\.{3}\w+\]/g,"*"],param:[/\[([^\]]+)\]/g,":$1"],slash:[/^index$|\./g,"/"],optional:[/^-(:?[\w-]+|\*)/,"$1?"]},Pc=t=>Object.keys(t).reduce((n,r)=>{const s=r.replace(...le.route);return{...n,[s]:t[r]}},{}),Rc=(t,n)=>Object.keys(t).filter(s=>!s.includes("/_")||/_layout\.(jsx|tsx)$/.test(s)).reduce((s,o)=>{const a=t[o],i={id:o.replace(...le.route),...n(a,o)},l=o.replace(...le.route).replace(...le.splat).replace(...le.param).split("/").filter(Boolean);return l.reduce((d,p,c)=>{const h=p.replace(...le.slash).replace(...le.optional),m=c===0,b=c===l.length-1&&l.length>1,_=!m&&!b,S=p==="_layout",T=/\([\w-]+\)/.test(h),k=/^\w|\//.test(h)?"unshift":"push";if(m&&l.length===1)return s.push({path:h,...i}),d;if(m||_){const R=m?s:d.children,D=R?.find(B=>B.path===h||B.id?.replace("/_layout","").split("/").pop()===h),U=T?i?.component?{id:h,path:"/"}:{id:h}:{path:h};return D?D.children??=[]:R?.[k]({...U,children:[]}),D||R?.[k==="unshift"?0:R.length-1]}return S?Object.assign(d,i):(b&&d?.children?.[k](i?.index?i:{path:h,...i}),d)},{}),s},[]),$c=t=>Object.keys(t).reduce((n,r)=>{const s=r.replace(...le.route).replace(/\+|\([\w-]+\)\//g,"").replace(/(\/)?index/g,"").replace(/\./g,"/");return{...n,[`/${s}`]:t[r]?.default}},{}),Oc=Object.assign({"/src/pages/_app.jsx":br}),zc=Object.assign({}),Dc=Object.assign({"/src/pages/Dashboard.jsx":xr,"/src/pages/Forms.jsx":wr,"/src/pages/Issues.jsx":_r,"/src/pages/Overview.jsx":Sr,"/src/pages/Repositories.jsx":kr,"/src/pages/SecurityAdvisory.jsx":Cr,"/src/pages/Signup.jsx":Er,"/src/pages/index.jsx":Nr,"/src/pages/issues/[id].jsx":nc,"/src/pages/issues/index.jsx":dc,"/src/pages/posts/[id].jsx":pc,"/src/pages/posts/index.jsx":mc,"/src/pages/viewfinder.jsx":Ac}),Rr=Pc(Oc),Mc=$c(zc),Bc=Rc(Dc,(t,n)=>{const r=/index\.(jsx|tsx|mdx)$/.test(n)&&!n.includes("pages/index")?{index:!0}:{},s=t?.default||x.Fragment;return{...r,Component:()=>t?.Pending?e.jsx(x.Suspense,{fallback:e.jsx(t.Pending,{}),children:e.jsx(s,{})}):e.jsx(s,{}),ErrorBoundary:t?.Catch,loader:t?.Loader,action:t?.Action}}),Le=Rr?._app,Hc=Rr?.["404"],Uc=Le?.default||Kn,Fc=()=>{const t=Mc[jo().state?.modal]||x.Fragment;return e.jsx(t,{})},zt=()=>e.jsxs(e.Fragment,{children:[e.jsx(Uc,{})," ",e.jsx(Fc,{})]}),qc=()=>Le?.Pending?e.jsx(x.Suspense,{fallback:e.jsx(Le.Pending,{}),children:e.jsx(zt,{})}):e.jsx(zt,{}),Vc={Component:Le?.default?qc:zt,ErrorBoundary:Le?.Catch,loader:Le?.Loader},Wc={path:"*",Component:Hc?.default||x.Fragment},Jc=[{...Vc,children:[...Bc,Wc]}];const Qt="sb-comments-token",en="sb-comments-user";function $r(){try{return localStorage.getItem(Qt)}catch{return null}}function Gc(t){localStorage.setItem(Qt,t)}function Yc(){localStorage.removeItem(Qt),localStorage.removeItem(en)}function tn(){try{const t=localStorage.getItem(en);return t?JSON.parse(t):null}catch{return null}}async function Kc(t){const n=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!n.ok)throw new Error("Invalid token — GitHub returned "+n.status);const r=await n.json(),s={login:r.login,avatarUrl:r.avatar_url};return localStorage.setItem(en,JSON.stringify(s)),s}function pt(){return $r()!==null}let xe=!1;const Dt=new Set;function rt(){return xe}function Xc(){return dt()?!xe&&!pt()?(console.warn("[storyboard] Sign in first to use comments"),!1):(xe=!xe,Or(),xe):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}function Dn(t){xe=t,Or()}function Zc(t){return Dt.add(t),()=>Dt.delete(t)}function Or(){for(const t of Dt)t(xe)}const Mn=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function Mt(t){if(!t)return{meta:null,text:""};const n=t.match(Mn);if(!n)return{meta:null,text:t.trim()};try{const r=JSON.parse(n[1]),s=t.replace(Mn,"").trim();return{meta:r,text:s}}catch{return{meta:null,text:t.trim()}}}function Bt(t,n){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${n}`}function zr(t,n){const{meta:r,text:s}=Mt(t),o={...r,...n};return Bt(o,s)}const Qc="https://api.github.com/graphql";async function ee(t,n={},r={}){const{retries:s=2}=r,o=$r();if(!o)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let i=0;i<=s;i++)try{const l=await fetch(Qc,{method:"POST",headers:{Authorization:`bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:n})});if(l.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!l.ok)throw new Error(`GitHub API error: ${l.status} ${l.statusText}`);const d=await l.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(p=>p.message).join(", ")}`);return d.data}catch(l){if(a=l,l.message.includes("401")||l.message.includes("Not authenticated")||l.message.includes("invalid or expired"))throw l;i<s&&await new Promise(d=>setTimeout(d,1e3*(i+1)))}throw a}const el=`
  query SearchDiscussion($query: String!) {
    search(query: $query, type: DISCUSSION, first: 1) {
      nodes {
        ... on Discussion {
          id
          title
          body
          url
          comments(first: 100) {
            nodes {
              id
              body
              createdAt
              author {
                login
                avatarUrl
              }
              replies(first: 50) {
                nodes {
                  id
                  body
                  createdAt
                  author {
                    login
                    avatarUrl
                  }
                  reactionGroups {
                    content
                    users(first: 0) { totalCount }
                    viewerHasReacted
                  }
                }
              }
              reactionGroups {
                content
                users(first: 0) { totalCount }
                viewerHasReacted
              }
            }
          }
        }
      }
    }
  }
`,tl=`
  query GetCategoryId($owner: String!, $name: String!, $slug: String!) {
    repository(owner: $owner, name: $name) {
      id
      discussionCategory(slug: $slug) {
        id
      }
      discussionCategories(first: 25) {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`,nl=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,rl=`
  mutation AddComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
      comment {
        id
        body
        createdAt
        author {
          login
          avatarUrl
        }
      }
    }
  }
`,ol=`
  mutation AddReply($discussionId: ID!, $replyToId: ID!, $body: String!) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body, replyToId: $replyToId }) {
      comment {
        id
        body
        createdAt
        author {
          login
          avatarUrl
        }
      }
    }
  }
`,Dr=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,sl=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,al=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,il=`
  query ListDiscussions($owner: String!, $name: String!, $categoryId: ID!) {
    repository(owner: $owner, name: $name) {
      discussions(first: 50, categoryId: $categoryId) {
        nodes {
          id
          title
          body
          url
          createdAt
          comments {
            totalCount
          }
        }
      }
    }
  }
`;async function Mr(t){const n=Zt(),s=`"${`Comments: ${t}`}" in:title repo:${n.repo.owner}/${n.repo.name}`,a=(await ee(el,{query:s})).search?.nodes?.[0];if(!a)return null;const i=(a.comments?.nodes??[]).map(l=>{const{meta:d,text:p}=Mt(l.body);return{...l,meta:d,text:p,replies:(l.replies?.nodes??[]).map(c=>{const{meta:h,text:m}=Mt(c.body);return{...c,meta:h,text:m}})}});return{...a,comments:i}}async function Br(){const t=Zt(),n=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),r=await ee(tl,{owner:t.repo.owner,name:t.repo.name,slug:n}),s=r.repository?.id;let o=r.repository?.discussionCategory?.id;if(o||(o=r.repository?.discussionCategories?.nodes?.find(i=>i.name===t.discussions.category)?.id),!s||!o)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:s,categoryId:o}}async function cl(t,n,r,s){let o=await Mr(t);if(!o){const{repositoryId:l,categoryId:d}=await Br(),p=`Comments: ${t}`,c=Bt({route:t,createdAt:new Date().toISOString()},"");o=(await ee(nl,{repositoryId:l,categoryId:d,title:p,body:c})).createDiscussion.discussion}const a=Bt({x:Math.round(n*10)/10,y:Math.round(r*10)/10},s);return(await ee(rl,{discussionId:o.id,body:a})).addDiscussionComment.comment}async function ll(t,n,r){return(await ee(ol,{discussionId:t,replyToId:n,body:r})).addDiscussionComment.comment}async function dl(t,n){const r=zr(n,{resolved:!0});return(await ee(Dr,{commentId:t,body:r})).updateDiscussionComment.comment}async function ul(t,n,r,s){const o=zr(n,{x:Math.round(r*10)/10,y:Math.round(s*10)/10});return(await ee(Dr,{commentId:t,body:o})).updateDiscussionComment.comment}async function pl(t,n){await ee(sl,{subjectId:t,content:n})}async function hl(t,n){await ee(al,{subjectId:t,content:n})}async function Ol(){const t=Zt(),{categoryId:n}=await Br();return(await ee(il,{owner:t.repo.owner,name:t.repo.name,categoryId:n})).repository?.discussions?.nodes??[]}const Bn="sb-composer-style";function ml(){if(document.getElementById(Bn))return;const t=document.createElement("style");t.id=Bn,t.textContent=`
    .sb-composer {
      position: absolute;
      z-index: 100001;
      display: flex;
      flex-direction: column;
      width: 280px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .sb-composer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 0;
    }

    .sb-composer-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-composer-username {
      font-size: 12px;
      color: #8b949e;
      font-weight: 500;
    }

    .sb-composer-body {
      padding: 8px 12px 12px;
    }

    .sb-composer-textarea {
      width: 100%;
      min-height: 60px;
      max-height: 160px;
      padding: 8px 10px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 13px;
      font-family: inherit;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-composer-textarea:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-composer-textarea::placeholder {
      color: #484f58;
    }

    .sb-composer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding: 0 12px 10px;
    }

    .sb-composer-btn {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .sb-composer-btn-cancel {
      background: none;
      color: #8b949e;
      border-color: #30363d;
    }
    .sb-composer-btn-cancel:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-composer-btn-submit {
      background: #238636;
      color: #fff;
    }
    .sb-composer-btn-submit:hover {
      background: #2ea043;
    }
    .sb-composer-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-composer-hint {
      padding: 0 12px 8px;
      font-size: 11px;
      color: #484f58;
    }
    .sb-composer-hint kbd {
      display: inline-block;
      padding: 0 4px;
      font-size: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      font-family: inherit;
    }
  `,document.head.appendChild(t)}function gl(t,n,r,s,o={}){ml();const a=tn(),i=document.createElement("div");i.className="sb-composer",i.style.left=`${n}%`,i.style.top=`${r}%`,i.style.transform="translate(12px, -50%)",i.innerHTML=`
    ${a?`
      <div class="sb-composer-header">
        <img class="sb-composer-avatar" src="${a.avatarUrl}" alt="${a.login}" />
        <span class="sb-composer-username">${a.login}</span>
      </div>
    `:""}
    <div class="sb-composer-body">
      <textarea class="sb-composer-textarea" placeholder="Leave a comment…" autofocus></textarea>
    </div>
    <div class="sb-composer-footer">
      <button class="sb-composer-btn sb-composer-btn-cancel" data-action="cancel">Cancel</button>
      <button class="sb-composer-btn sb-composer-btn-submit" data-action="submit">Comment</button>
    </div>
  `,t.appendChild(i);const l=i.querySelector(".sb-composer-textarea"),d=i.querySelector('[data-action="submit"]');function p(){i.remove()}function c(){p(),o.onCancel?.()}async function h(){const m=l.value.trim();if(!m){l.focus();return}d.disabled=!0,d.textContent="Posting…";try{const b=await cl(s,n,r,m);p(),o.onSubmit?.(b)}catch(b){d.disabled=!1,d.textContent="Comment",console.error("[storyboard] Failed to post comment:",b);let _=i.querySelector(".sb-composer-error");_||(_=document.createElement("div"),_.className="sb-composer-error",_.style.cssText="padding: 4px 12px 8px; font-size: 12px; color: #f85149;",i.querySelector(".sb-composer-footer").before(_)),_.textContent=b.message}}return i.querySelector('[data-action="cancel"]').addEventListener("click",c),d.addEventListener("click",h),l.addEventListener("keydown",m=>{m.key==="Enter"&&(m.metaKey||m.ctrlKey)&&(m.preventDefault(),h()),m.key==="Escape"&&(m.preventDefault(),m.stopPropagation(),c())}),i.addEventListener("click",m=>m.stopPropagation()),requestAnimationFrame(()=>l.focus()),{el:i,destroy:p}}const Hn="sb-auth-modal",Un="sb-auth-modal-style";function fl(){if(document.getElementById(Un))return;const t=document.createElement("style");t.id=Un,t.textContent=`
    .sb-auth-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .sb-auth-modal {
      width: 420px;
      max-width: calc(100vw - 32px);
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      color: #c9d1d9;
      overflow: hidden;
    }

    .sb-auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #21262d;
    }

    .sb-auth-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-auth-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .sb-auth-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-auth-body {
      padding: 20px;
    }

    .sb-auth-description {
      margin: 0 0 16px;
      font-size: 13px;
      color: #8b949e;
      line-height: 1.5;
    }

    .sb-auth-description a {
      color: #58a6ff;
      text-decoration: none;
    }
    .sb-auth-description a:hover {
      text-decoration: underline;
    }

    .sb-auth-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #c9d1d9;
    }

    .sb-auth-input {
      width: 100%;
      padding: 8px 12px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 14px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      outline: none;
      box-sizing: border-box;
    }
    .sb-auth-input:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-auth-input::placeholder {
      color: #484f58;
    }

    .sb-auth-scopes {
      margin: 12px 0 0;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 6px;
      font-size: 12px;
      color: #8b949e;
      line-height: 1.6;
    }
    .sb-auth-scopes code {
      display: inline-block;
      padding: 1px 5px;
      background: rgba(110, 118, 129, 0.15);
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-size: 11px;
      color: #c9d1d9;
    }

    .sb-auth-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid #21262d;
    }

    .sb-auth-btn {
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 100ms ease;
    }

    .sb-auth-btn-cancel {
      background: #21262d;
      border-color: #30363d;
      color: #c9d1d9;
    }
    .sb-auth-btn-cancel:hover {
      background: #30363d;
    }

    .sb-auth-btn-submit {
      background: #238636;
      color: #fff;
    }
    .sb-auth-btn-submit:hover {
      background: #2ea043;
    }
    .sb-auth-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-auth-error {
      margin: 10px 0 0;
      padding: 8px 12px;
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid rgba(248, 81, 73, 0.3);
      border-radius: 6px;
      font-size: 13px;
      color: #f85149;
    }

    .sb-auth-success {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
    }

    .sb-auth-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #30363d;
    }

    .sb-auth-user-info {
      font-size: 14px;
      color: #f0f6fc;
    }
    .sb-auth-user-info span {
      display: block;
      font-size: 12px;
      color: #3fb950;
      margin-top: 2px;
    }
  `,document.head.appendChild(t)}function bl(){return fl(),new Promise(t=>{const n=document.getElementById(Hn);n&&n.remove();const r=document.createElement("div");r.id=Hn,r.className="sb-auth-backdrop";const s=document.createElement("div");s.className="sb-auth-modal",s.innerHTML=`
      <div class="sb-auth-header">
        <h2>Sign in for comments</h2>
        <button class="sb-auth-close" data-action="close" aria-label="Close">×</button>
      </div>
      <div class="sb-auth-body">
        <p class="sb-auth-description">
          Enter a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">GitHub Personal Access Token</a>
          to leave comments on this prototype. Your token is stored locally in your browser.
        </p>
        <label class="sb-auth-label" for="sb-auth-token-input">Personal Access Token</label>
        <input class="sb-auth-input" id="sb-auth-token-input" type="password" placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" spellcheck="false" />
        <div class="sb-auth-scopes">Required scopes: <code>repo</code> <code>read:user</code></div>
        <div data-slot="feedback"></div>
      </div>
      <div class="sb-auth-footer">
        <button class="sb-auth-btn sb-auth-btn-cancel" data-action="close">Cancel</button>
        <button class="sb-auth-btn sb-auth-btn-submit" data-action="submit">Sign in</button>
      </div>
    `,r.appendChild(s),document.body.appendChild(r);const o=s.querySelector("#sb-auth-token-input"),a=s.querySelector('[data-action="submit"]'),i=s.querySelector('[data-slot="feedback"]');function l(c){r.remove(),t(c)}r.addEventListener("click",c=>{c.target===r&&l(null)}),s.querySelectorAll('[data-action="close"]').forEach(c=>{c.addEventListener("click",()=>l(null))});function d(c){c.key==="Escape"&&(c.preventDefault(),c.stopPropagation(),window.removeEventListener("keydown",d,!0),l(null))}window.addEventListener("keydown",d,!0);async function p(){const c=o.value.trim();if(!c){o.focus();return}a.disabled=!0,a.textContent="Validating…",i.innerHTML="";try{const h=await Kc(c);Gc(c),i.innerHTML=`
          <div class="sb-auth-success">
            <img class="sb-auth-avatar" src="${h.avatarUrl}" alt="${h.login}" />
            <div class="sb-auth-user-info">
              ${h.login}
              <span>✓ Signed in</span>
            </div>
          </div>
        `,a.textContent="Done",a.disabled=!1,a.onclick=()=>{window.removeEventListener("keydown",d,!0),l(h)}}catch(h){i.innerHTML=`<div class="sb-auth-error">${h.message}</div>`,a.disabled=!1,a.textContent="Sign in"}}a.addEventListener("click",p),o.addEventListener("keydown",c=>{c.key==="Enter"&&p()}),requestAnimationFrame(()=>o.focus())})}function zl(){const t=tn();Yc(),console.log(`[storyboard] Signed out${t?` (was ${t.login})`:""}`)}const Fn="sb-comment-window-style",Hr={THUMBS_UP:"👍",THUMBS_DOWN:"👎",LAUGH:"😄",HOORAY:"🎉",CONFUSED:"😕",HEART:"❤️",ROCKET:"🚀",EYES:"👀"};function xl(){if(document.getElementById(Fn))return;const t=document.createElement("style");t.id=Fn,t.textContent=`
    .sb-comment-window {
      position: absolute;
      z-index: 100001;
      width: 360px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .sb-comment-window-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #21262d;
      cursor: grab;
      user-select: none;
    }
    .sb-comment-window-header:active {
      cursor: grabbing;
    }

    .sb-comment-window-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sb-comment-window-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-comment-window-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-comment-window-time {
      font-size: 11px;
      color: #484f58;
      margin-left: 4px;
    }

    .sb-comment-window-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    }
    .sb-comment-window-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-comment-window-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .sb-comment-window-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .sb-comment-window-action-btn:hover {
      background: #21262d;
      color: #c9d1d9;
    }
    .sb-comment-window-action-btn[data-resolved="true"] {
      color: #3fb950;
    }
    .sb-comment-window-action-btn[data-copied="true"] {
      color: #3fb950;
    }

    .sb-comment-window-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .sb-comment-window-text {
      font-size: 13px;
      line-height: 1.5;
      color: #c9d1d9;
      margin: 0 0 8px;
      word-break: break-word;
    }

    .sb-comment-window-reactions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .sb-reaction-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #30363d;
      background: none;
      color: #8b949e;
      cursor: pointer;
      // font-size: 12px;
      font-family: inherit;
      transition: border-color 100ms, background 100ms;
    }
    .sb-reaction-pill span {
      // font-size: 12px;
   }
    .sb-reaction-pill:hover {
      border-color: #8b949e;
    }
    .sb-reaction-pill[data-active="true"] {
      border-color: rgba(88, 166, 255, 0.4);
      background: rgba(88, 166, 255, 0.1);
      color: #58a6ff;
    }

    .sb-reaction-add-btn {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      gap: 4px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: none;
      color: #8b949e;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      position: relative;
      border-color: #30363d;
      background: #21262d;
    }
    .sb-reaction-add-btn:hover {
      border: 1px solid rgba(88, 166, 255, 0.4);
      background: rgba(88, 166, 255, 0.1);
    }

    .sb-reaction-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: 4px;
      z-index: 10;
      display: flex;
      gap: 2px;
      padding: 4px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .sb-reaction-picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: none;
      font-size: 14px;
      cursor: pointer;
      transition: background 100ms;
    }
    .sb-reaction-picker-btn:hover {
      background: #21262d;
    }
    .sb-reaction-picker-btn[data-active="true"] {
      background: rgba(88, 166, 255, 0.15);
      box-shadow: inset 0 0 0 1px rgba(88, 166, 255, 0.4);
    }

    .sb-comment-window-replies {
      border-top: 1px solid #21262d;
      padding-top: 10px;
      margin-top: 4px;
    }

    .sb-comment-window-replies-label {
      font-size: 11px;
      font-weight: 600;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .sb-reply-item {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }

    .sb-reply-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-reply-content {
      flex: 1;
      min-width: 0;
    }

    .sb-reply-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }

    .sb-reply-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-reply-time {
      font-size: 11px;
      color: #484f58;
    }

    .sb-reply-text {
      font-size: 13px;
      line-height: 1.4;
      color: #c9d1d9;
      margin: 0;
      word-break: break-word;
    }

    .sb-reply-reactions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .sb-comment-window-reply-form {
      border-top: 1px solid #21262d;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sb-reply-textarea {
      width: 100%;
      min-height: 40px;
      max-height: 100px;
      padding: 6px 8px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 12px;
      font-family: inherit;
      line-height: 1.4;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-reply-textarea:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-reply-textarea::placeholder {
      color: #484f58;
    }

    .sb-reply-form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .sb-reply-submit-btn {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: none;
      background: #238636;
      color: #fff;
    }
    .sb-reply-submit-btn:hover {
      background: #2ea043;
    }
    .sb-reply-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,document.head.appendChild(t)}function qn(t){return new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Vn(t){const n=document.createElement("div");n.className=t.replies?"sb-comment-window-reactions":"sb-reply-reactions";function r(){n.innerHTML="";const s=t.reactionGroups??[];for(const a of s){if(a.users?.totalCount===0&&!a.viewerHasReacted)continue;const i=a.users?.totalCount??0;if(i===0)continue;const l=document.createElement("button");l.className="sb-reaction-pill",l.dataset.active=String(!!a.viewerHasReacted),l.innerHTML=`<span>${Hr[a.content]??a.content}</span><span>${i}</span>`,l.addEventListener("click",d=>{d.stopPropagation(),Ur(t,a.content,a,r)}),n.appendChild(l)}const o=document.createElement("button");o.className="sb-reaction-add-btn",o.textContent="😀 +",o.addEventListener("click",a=>{a.stopPropagation(),vl(o,t,r)}),n.appendChild(o)}return r(),n}function vl(t,n,r){const s=t.querySelector(".sb-reaction-picker");if(s){s.remove();return}const o=document.createElement("div");o.className="sb-reaction-picker";for(const[i,l]of Object.entries(Hr)){const d=n.reactionGroups??[],p=d.some(h=>h.content===i&&h.viewerHasReacted),c=document.createElement("button");c.className="sb-reaction-picker-btn",c.dataset.active=String(p),c.textContent=l,c.addEventListener("click",h=>{h.stopPropagation();const m=d.find(b=>b.content===i);Ur(n,i,m,r),o.remove()}),o.appendChild(c)}t.appendChild(o);function a(i){!o.contains(i.target)&&i.target!==t&&(o.remove(),document.removeEventListener("click",a,!0))}setTimeout(()=>document.addEventListener("click",a,!0),0)}async function Ur(t,n,r,s){const o=r?.viewerHasReacted??!1;t.reactionGroups||(t.reactionGroups=[]),o&&r?(r.users={totalCount:Math.max(0,(r.users?.totalCount??1)-1)},r.viewerHasReacted=!1,r.users.totalCount===0&&(t.reactionGroups=t.reactionGroups.filter(a=>a.content!==n))):r?(r.users={totalCount:(r.users?.totalCount??0)+1},r.viewerHasReacted=!0):t.reactionGroups.push({content:n,users:{totalCount:1},viewerHasReacted:!0}),s();try{o?await hl(t.id,n):await pl(t.id,n)}catch(a){console.error("[storyboard] Reaction toggle failed:",a)}}let re=null;function Fr(t,n,r,s={}){xl(),re&&(re.destroy(),re=null);const o=tn(),a=document.createElement("div");a.className="sb-comment-window",a.style.left=`${n.meta?.x??0}%`,a.style.top=`${n.meta?.y??0}%`,a.style.transform="translate(12px, -50%)";const i=document.createElement("div");i.className="sb-comment-window-header";const l=document.createElement("div");if(l.className="sb-comment-window-header-left",n.author?.avatarUrl){const v=document.createElement("img");v.className="sb-comment-window-avatar",v.src=n.author.avatarUrl,v.alt=n.author.login??"",l.appendChild(v)}const d=document.createElement("span");if(d.className="sb-comment-window-author",d.textContent=n.author?.login??"unknown",l.appendChild(d),n.createdAt){const v=document.createElement("span");v.className="sb-comment-window-time",v.textContent=qn(n.createdAt),l.appendChild(v)}i.appendChild(l);const p=document.createElement("div");p.className="sb-comment-window-header-actions";const c=document.createElement("button");c.className="sb-comment-window-action-btn",c.setAttribute("aria-label",n.meta?.resolved?"Resolved":"Resolve"),c.title=n.meta?.resolved?"Resolved":"Resolve",c.textContent=n.meta?.resolved?"Resolved":"Resolve",n.meta?.resolved&&(c.dataset.resolved="true"),c.addEventListener("click",async v=>{if(v.stopPropagation(),!n.meta?.resolved){c.dataset.resolved="true",c.textContent="Resolved",c.title="Resolved";try{await dl(n.id,n._rawBody??n.body??""),n.meta={...n.meta,resolved:!0},s.onMove?.()}catch(E){console.error("[storyboard] Failed to resolve comment:",E),c.dataset.resolved="false",c.textContent="Resolve",c.title="Resolve"}}}),p.appendChild(c);const h=document.createElement("button");h.className="sb-comment-window-action-btn",h.setAttribute("aria-label","Copy link"),h.title="Copy link",h.textContent="Copy link",h.addEventListener("click",v=>{v.stopPropagation();const E=new URL(window.location.href);E.searchParams.set("comment",n.id),navigator.clipboard.writeText(E.toString()).then(()=>{h.dataset.copied="true",h.textContent="Copied!",h.title="Copied!",setTimeout(()=>{h.dataset.copied="false",h.textContent="Copy link",h.title="Copy link"},2e3)}).catch(()=>{const L=document.createElement("input");L.value=E.toString(),document.body.appendChild(L),L.select(),document.execCommand("copy"),L.remove()})}),p.appendChild(h);const m=document.createElement("button");m.className="sb-comment-window-close",m.innerHTML="×",m.setAttribute("aria-label","Close"),m.addEventListener("click",v=>{v.stopPropagation(),G()}),p.appendChild(m),i.appendChild(p),a.appendChild(i);const b=document.createElement("div");b.className="sb-comment-window-body";const _=document.createElement("p");_.className="sb-comment-window-text",_.textContent=n.text??"",b.appendChild(_),b.appendChild(Vn(n));const S=n.replies??[];if(S.length>0){const v=document.createElement("div");v.className="sb-comment-window-replies";const E=document.createElement("div");E.className="sb-comment-window-replies-label",E.textContent=`${S.length} ${S.length===1?"Reply":"Replies"}`,v.appendChild(E);for(const L of S){const A=document.createElement("div");if(A.className="sb-reply-item",L.author?.avatarUrl){const V=document.createElement("img");V.className="sb-reply-avatar",V.src=L.author.avatarUrl,V.alt=L.author.login??"",A.appendChild(V)}const F=document.createElement("div");F.className="sb-reply-content";const $=document.createElement("div");$.className="sb-reply-meta";const w=document.createElement("span");if(w.className="sb-reply-author",w.textContent=L.author?.login??"unknown",$.appendChild(w),L.createdAt){const V=document.createElement("span");V.className="sb-reply-time",V.textContent=qn(L.createdAt),$.appendChild(V)}F.appendChild($);const Y=document.createElement("p");Y.className="sb-reply-text",Y.textContent=L.text??L.body??"",F.appendChild(Y),F.appendChild(Vn(L)),A.appendChild(F),v.appendChild(A)}b.appendChild(v)}if(a.appendChild(b),o&&r){const v=document.createElement("div");v.className="sb-comment-window-reply-form";const E=document.createElement("textarea");E.className="sb-reply-textarea",E.placeholder="Reply…",v.appendChild(E);const L=document.createElement("div");L.className="sb-reply-form-actions";const A=document.createElement("button");A.className="sb-reply-submit-btn",A.textContent="Reply",A.disabled=!0,E.addEventListener("input",()=>{A.disabled=!E.value.trim()});async function F(){const $=E.value.trim();if($){A.disabled=!0,A.textContent="Posting…";try{await ll(r.id,n.id,$),E.value="",A.textContent="Reply",s.onMove?.()}catch(w){console.error("[storyboard] Failed to post reply:",w),A.textContent="Reply",A.disabled=!1}}}A.addEventListener("click",F),E.addEventListener("keydown",$=>{$.key==="Enter"&&($.metaKey||$.ctrlKey)&&($.preventDefault(),F()),$.key==="Escape"&&($.preventDefault(),$.stopPropagation())}),L.appendChild(A),v.appendChild(L),a.appendChild(v)}let T=!1,k=0,R=0,D=0,U=0;function B(v){if(v.target.closest(".sb-comment-window-header-actions"))return;T=!0,k=v.clientX,R=v.clientY;const E=t.getBoundingClientRect();D=parseFloat(a.style.left)/100*E.width,U=parseFloat(a.style.top)/100*E.height,document.addEventListener("mousemove",X),document.addEventListener("mouseup",J),v.preventDefault()}function X(v){if(!T)return;const E=v.clientX-k,L=v.clientY-R,A=t.getBoundingClientRect(),F=D+E,$=U+L,w=Math.round(F/A.width*1e3)/10,Y=Math.round($/A.height*1e3)/10;a.style.left=`${w}%`,a.style.top=`${Y}%`}async function J(v){if(!T)return;T=!1,document.removeEventListener("mousemove",X),document.removeEventListener("mouseup",J);const E=t.getBoundingClientRect(),L=v.clientX-k,A=v.clientY-R,F=D+L,$=U+A,w=Math.round(F/E.width*1e3)/10,Y=Math.round($/E.height*1e3)/10;if(Math.abs(L)>2||Math.abs(A)>2){n.meta={...n.meta,x:w,y:Y};const V=t.querySelectorAll(".sb-comment-pin");for(const me of V)if(me._commentId===n.id){me.style.left=`${w}%`,me.style.top=`${Y}%`;break}try{await ul(n.id,n._rawBody??"",w,Y),n._rawBody=null}catch(me){console.error("[storyboard] Failed to move comment:",me)}}}i.addEventListener("mousedown",B),a.addEventListener("click",v=>v.stopPropagation());const te=new URL(window.location.href);te.searchParams.set("comment",n.id),window.history.replaceState(null,"",te.toString()),t.appendChild(a);function G(){document.removeEventListener("mousemove",X),document.removeEventListener("mouseup",J),a.remove(),re?.el===a&&(re=null);const v=new URL(window.location.href);v.searchParams.delete("comment"),window.history.replaceState(null,"",v.toString()),s.onClose?.()}return re={el:a,destroy:G},{el:a,destroy:G}}function qr(){re&&(re.destroy(),re=null)}const yl='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>',Wn="sb-comment-mode-style";function jl(){if(document.getElementById(Wn))return;const t=document.createElement("style");t.id=Wn,t.textContent=`
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${yl}") 4 2, crosshair;
    }
    .sb-comment-overlay {
      position: absolute;
      inset: 0;
      z-index: 99998;
      pointer-events: none;
    }
    .sb-comment-overlay.active {
      pointer-events: auto;
    }
    .sb-comment-mode-banner {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 6px 16px;
      border-radius: 8px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .sb-comment-mode-banner kbd {
      display: inline-block;
      padding: 1px 5px;
      font-size: 11px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
    }
    .sb-comment-pin {
      position: absolute;
      z-index: 100000;
      width: 32px;
      height: 32px;
      margin-left: -16px;
      margin-top: -16px;
      border-radius: 50%;
      background: #161b22;
      border: 3px solid hsl(var(--pin-hue, 140), 50%, 38%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      transition: transform 100ms ease;
      overflow: hidden;
    }
    .sb-comment-pin img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    .sb-comment-pin:hover {
      transform: scale(1.15);
    }
    .sb-comment-pin[data-resolved="true"] {
      border-color: #8b949e;
      opacity: 0.5;
    }
  `,document.head.appendChild(t)}let ue=null,de=null,W=null,Ht=[],ht=null;function nn(){return document.querySelector("main")||document.body}function kt(){if(de)return de;const t=nn();return getComputedStyle(t).position==="static"&&(t.style.position="relative"),de=document.createElement("div"),de.className="sb-comment-overlay",t.appendChild(de),de}function wl(){ue||(ue=document.createElement("div"),ue.className="sb-comment-mode-banner",ue.innerHTML="Comment mode — click to place a comment. Press <kbd>C</kbd> or <kbd>Esc</kbd> to exit.",document.body.appendChild(ue))}function _l(){ue&&(ue.remove(),ue=null)}function Vr(){return window.location.pathname}function rn(){for(const t of Ht)t.remove();Ht=[]}function Wr(t,n,r){const s=document.createElement("div");s.className="sb-comment-pin",s.style.left=`${n.meta?.x??0}%`,s.style.top=`${n.meta?.y??0}%`;const o=r*137.5%360;if(s.style.setProperty("--pin-hue",String(Math.round(o))),n.author?.avatarUrl){const a=document.createElement("img");a.src=n.author.avatarUrl,a.alt=n.author.login??"",s.appendChild(a)}return n.meta?.resolved&&s.setAttribute("data-resolved","true"),s.title=`${n.author?.login??"unknown"}: ${n.text?.slice(0,80)??""}`,s._commentId=n.id,n._rawBody=n.body,s.addEventListener("click",a=>{a.stopPropagation(),W&&(W.destroy(),W=null),Fr(t,n,ht,{onClose:()=>{},onMove:()=>Ct()})}),t.appendChild(s),Ht.push(s),s}function Jr(){if(!ht?.comments?.length)return;const t=kt();rn(),ht.comments.forEach((n,r)=>{n.meta?.x!=null&&n.meta?.y!=null&&Wr(t,n,r)})}async function Ct(){if(!pt())return;const t=kt();Jr();try{const n=await Mr(Vr());if(ht=n,rn(),!n?.comments?.length)return;n.comments.forEach((r,s)=>{r.meta?.x!=null&&r.meta?.y!=null&&Wr(t,r,s)}),Sl(t,n)}catch(n){console.warn("[storyboard] Could not load comments:",n.message)}}function Sl(t,n){const r=new URLSearchParams(window.location.search).get("comment");if(!r||!n?.comments?.length)return;const s=n.comments.find(o=>o.id===r);if(s){if(s.meta?.y!=null){const o=nn(),a=s.meta.y/100*o.scrollHeight,i=o.scrollTop||window.scrollY,l=i+window.innerHeight;if(a<i||a>l){const d=Math.max(0,a-window.innerHeight/3);window.scrollTo({top:d,behavior:"smooth"})}}s._rawBody=s.body,Fr(t,s,n,{onClose:()=>{},onMove:()=>Ct()})}}function kl(t){if(!rt()||t.target.closest(".sb-composer")||t.target.closest(".sb-comment-pin")||t.target.closest(".sb-comment-window"))return;qr(),W&&(W.destroy(),W=null);const n=nn(),r=n.getBoundingClientRect(),s=Math.round((t.clientX-r.left)/r.width*1e3)/10,o=Math.round((t.clientY-r.top+n.scrollTop)/n.scrollHeight*1e3)/10,a=kt();W=gl(a,s,o,Vr(),{onCancel:()=>{W=null},onSubmit:()=>{W=null,Ct()}})}function Cl(t){t?(document.body.classList.add("sb-comment-mode"),wl(),kt().classList.add("active"),Jr(),Ct()):(document.body.classList.remove("sb-comment-mode"),_l(),W&&(W.destroy(),W=null),qr(),rn(),de&&de.classList.remove("active"))}let Jn=!1;function El(){Jn||(Jn=!0,jl(),Zc(Cl),document.addEventListener("click",t=>{rt()&&(t.target.closest(".sb-devtools-wrapper")||t.target.closest(".sb-auth-backdrop")||t.target.closest(".sb-comments-drawer")||t.target.closest(".sb-comments-drawer-backdrop")||kl(t))}),window.addEventListener("keydown",t=>{const n=t.target.tagName;if(!(n==="INPUT"||n==="TEXTAREA"||n==="SELECT"||t.target.isContentEditable)){if(t.key==="c"&&!t.metaKey&&!t.ctrlKey&&!t.altKey){if(!dt())return;if(t.preventDefault(),!rt()&&!pt()){bl();return}Xc()}t.key==="Escape"&&rt()&&(t.preventDefault(),Dn(!1))}}),dt()&&pt()&&new URLSearchParams(window.location.search).get("comment")&&Dn(!0))}const Il={repo:{owner:"dfosco",name:"storyboard-source"},discussions:{category:"General"}},Nl={comments:Il},Gr=wo(Jc,{basename:"/storyboard-source/"});Ns(Gr,"/storyboard-source/");Xo();Yo();es(Nl);cs({basePath:"/storyboard-source/"});El();const Ll=document.getElementById("root"),Tl=bo.createRoot(Ll);Tl.render(e.jsx(x.StrictMode,{children:e.jsx(xo,{colorMode:"auto",children:e.jsxs(vo,{children:[e.jsx(Ir,{}),e.jsx(_o,{router:Gr})]})})}));export{zl as a,Mr as f,pt as i,Ol as l,bl as o,Dn as s,Xc as t};
