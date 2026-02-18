const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CommentOverlay-lH-aPAr7.js","assets/vendor-primer-BK6UB-si.js","assets/vendor-react-BQyrhFMj.js","assets/vendor-octicons-BtAiKi0j.js","assets/vendor-primer-BEAryH55.css","assets/vendor-reshaped-BDP14DwY.js","assets/vendor-reshaped-CHiksvd1.css"])))=>i.map(i=>d[i]);
import{j as e,T as et,S as rr,C as ds,a as us,b as A,B as se,c as ps,F as B,d as q,L as Cn,u as hs,A as Ce,e as be,I as ms,U as En,N as Et,f as gs,g as fs,h as tt,i as bs,k as xs,l as vs}from"./vendor-primer-BK6UB-si.js";import{b,u as sr,L as ye,O as or,f as Ut,g as ys,h as js,i as ws,j as _s}from"./vendor-react-BQyrhFMj.js";import{C as pe,V as p,T as g,D as ae,R as Be,B as He,a as Ss,b as Rt,P as ks,S as In,F as y,c as Se,d as ie,e as _e,A as Nn,M as Ee}from"./vendor-reshaped-BDP14DwY.js";import{M as ar,b as Cs,o as Es,p as Ft,q as Ln,r as Ye,s as Is,t as Fe,l as Pe,k as Ve,u as Vt,v as ht,w as qe,x as Ae,y as Te,z as qt,B as ir,H as Wt,D as mt,F as Ns,E as Ls,m as Ts,L as Ps,J as As,R as gt,K as cr,N as lr,O as Rs,Q as $s,U as Os,V as Ds,W as dr,Y as ur,Z as zs,_ as Ms,c as Tn,$ as Bs,a0 as Hs}from"./vendor-octicons-BtAiKi0j.js";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function s(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(r){if(r.ep)return;r.ep=!0;const a=s(r);fetch(r.href,a)}})();function rt(t,n){const s={...t};for(const o of Object.keys(n)){const r=n[o],a=t[o];r!==null&&typeof r=="object"&&!Array.isArray(r)&&a!==null&&typeof a=="object"&&!Array.isArray(a)?s[o]=rt(a,r):s[o]=r}return s}let Q={scenes:{},objects:{},records:{}};function Us(t){if(!t||typeof t!="object")throw new Error("[storyboard-core] init() requires { scenes, objects, records }");Q={scenes:t.scenes||{},objects:t.objects||{},records:t.records||{}}}function $t(t,n){if(n&&Q[n]?.[t]!=null)return Q[n][t];if(!n){for(const s of["scenes","objects","records"])if(Q[s]?.[t]!=null)return Q[s][t]}if(n==="scenes"||!n){const s=t.toLowerCase();for(const o of Object.keys(Q.scenes))if(o.toLowerCase()===s)return Q.scenes[o]}throw new Error(`Data file not found: ${t}${n?` (type: ${n})`:""}`)}function De(t,n=new Set){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(o=>De(o,n));if(t.$ref&&typeof t.$ref=="string"){const o=t.$ref;if(n.has(o))throw new Error(`Circular $ref detected: ${o}`);n.add(o);const r=$t(o,"objects");return De(r,n)}const s={};for(const[o,r]of Object.entries(t))s[o]=De(r,n);return s}function Fs(t){if(Q.scenes[t]!=null)return!0;const n=t.toLowerCase();for(const s of Object.keys(Q.scenes))if(s.toLowerCase()===n)return!0;return!1}function ft(t="default"){let n;try{n=$t(t,"scenes")}catch{throw new Error(`Failed to load scene: ${t}`)}if(Array.isArray(n.$global)){const s=n.$global;delete n.$global;let o={};for(const r of s)try{let a=$t(r);a=De(a),o=rt(o,a)}catch(a){console.warn(`Failed to load $global: ${r}`,a)}n=rt(o,n)}return n=De(n),structuredClone(n)}function Jt(t){const n=Q.records[t];if(n==null)throw new Error(`Record not found: ${t}`);if(!Array.isArray(n))throw new Error(`Record "${t}" must be an array, got ${typeof n}`);return structuredClone(n)}function Vs(t,n){return Jt(t).find(o=>o.id===n)??null}function pr(t,n){if(t==null||typeof n!="string"||n==="")return;const s=n.split(".");let o=t;for(const r of s){if(o==null||typeof o!="object")return;o=o[r]}return o}function Ue(t){if(Array.isArray(t))return t.map(Ue);if(t!==null&&typeof t=="object"){const n={};for(const s of Object.keys(t))n[s]=Ue(t[s]);return n}return t}function st(t,n,s){const o=n.split(".");let r=t;for(let a=0;a<o.length-1;a++){const i=o[a];(r[i]==null||typeof r[i]!="object")&&(r[i]=/^\d+$/.test(o[a+1])?[]:{}),r=r[i]}r[o[o.length-1]]=s}function bt(){const t=window.location.hash.replace(/^#/,"");return new URLSearchParams(t)}function hr(t){const n=t.toString();window.location.hash=n}function mr(t){return bt().get(t)}function ve(t,n){const s=bt();s.set(t,String(n)),hr(s)}function gr(){const t=bt(),n={};for(const[s,o]of t.entries())n[s]=o;return n}function ot(t){const n=bt();n.delete(t),hr(n)}const xt="storyboard:";function vt(t){try{return localStorage.getItem(xt+t)}catch{return null}}function X(t,n){try{localStorage.setItem(xt+t,String(n)),Gt()}catch{}}function at(t){try{localStorage.removeItem(xt+t),Gt()}catch{}}function fr(t){const n=()=>{br(),t()};return window.addEventListener("storage",n),window.addEventListener("storyboard-storage",n),()=>{window.removeEventListener("storage",n),window.removeEventListener("storyboard-storage",n)}}let Oe=null;function br(){Oe=null}function xr(){if(Oe!==null)return Oe;try{const t=[];for(let n=0;n<localStorage.length;n++){const s=localStorage.key(n);s&&s.startsWith(xt)&&t.push(s+"="+localStorage.getItem(s))}return Oe=t.sort().join("&"),Oe}catch{return""}}function Gt(){br(),window.dispatchEvent(new Event("storyboard-storage"))}const Yt="__hide__",it="historyState",Ie="currentState",ke="nextState",Pn=200;function ze(){return vt(Yt)==="1"}function qs(){We(),X(Yt,"1");const t=new URL(window.location.href);t.searchParams.delete("hide"),t.hash="",window.history.replaceState(window.history.state,"",t.toString())}function Ws(){const t=Je();if(t){window.location.hash="";const n=new URLSearchParams(t);for(const[s,o]of n.entries())ve(s,o)}at(Yt),Ks("show")}function yt(){return window.location.pathname}function vr(){return new URLSearchParams(window.location.hash.replace(/^#/,"")).toString()}function We(t,n){const s=t!==void 0?t:vr(),o=n!==void 0?n:yt(),r=jt(),a=wt();if(a!==null&&r[a]){const[,c,h]=r[a];if(c===o&&h===s)return}const i=a!==null?r.slice(0,a+1):r,l=i.length,d=[l,o,s],u=[...i,d];if(u.length>Pn){const c=u.slice(u.length-Pn);for(let h=0;h<c.length;h++)c[h]=[h,c[h][1],c[h][2]];X(it,JSON.stringify(c)),X(Ie,String(c.length-1))}else X(it,JSON.stringify(u)),X(Ie,String(l));at(ke)}function jt(){const t=vt(it);if(!t)return[];try{const n=JSON.parse(t);return Array.isArray(n)?n:[]}catch{return[]}}function wt(){const t=vt(Ie);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function Js(){const t=vt(ke);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function Je(){const t=wt();if(t===null)return null;const n=jt();return n[t]?n[t][2]:null}function yr(){const t=wt();if(t===null)return null;const n=jt();return n[t]?n[t][1]:null}function jr(t){const n=Je();return n?new URLSearchParams(n).get(t):null}function An(t,n){const s=Je()||"",o=new URLSearchParams(s);o.set(t,String(n)),We(o.toString(),yr()||yt())}function Rn(t){const n=Je()||"",s=new URLSearchParams(n);s.delete(t),We(s.toString(),yr()||yt())}function Gs(){const t=Je();if(!t)return{};const n=new URLSearchParams(t),s={};for(const[o,r]of n.entries())s[o]=r;return s}function $n(){if(ze())return;const t=yt(),n=vr(),s=jt(),o=wt();if(!n&&!t&&s.length===0)return;const r=s.findIndex(([,l,d])=>l===t&&d===n);if(r===-1){We(n,t);return}if(r===o)return;const a=o!==null?o-1:null,i=Js();if(a!==null&&r===a)X(ke,String(o)),X(Ie,String(r));else if(i!==null&&r===i){const l=i+1;s[l]?X(ke,String(l)):at(ke),X(Ie,String(r))}else{at(ke),X(Ie,String(r));const l=s.slice(0,r+1);X(it,JSON.stringify(l))}Gt()}function Ys(){We(),window.addEventListener("hashchange",()=>$n()),window.addEventListener("popstate",()=>$n())}function Ks(t){const n=new URL(window.location.href);n.searchParams.has(t)&&(n.searchParams.delete(t),window.history.replaceState(window.history.state,"",n.toString()))}function ct(){const t=new URL(window.location.href);if(t.searchParams.has("hide")){qs();return}if(t.searchParams.has("show")){Ws();return}}function Xs(){ct(),window.addEventListener("popstate",()=>ct())}function _t(t){return window.addEventListener("hashchange",t),()=>window.removeEventListener("hashchange",t)}function Kt(){return window.location.hash}const Zs="modulepreload",Qs=function(t){return"/storyboard-source/"+t},On={},D=function(n,s,o){let r=Promise.resolve();if(s&&s.length>0){let d=function(u){return Promise.all(u.map(c=>Promise.resolve(c).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");r=d(s.map(u=>{if(u=Qs(u),u in On)return;On[u]=!0;const c=u.endsWith(".css"),h=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${h}`))return;const m=document.createElement("link");if(m.rel=c?"stylesheet":Zs,c||(m.as="script"),m.crossOrigin="",m.href=u,l&&m.setAttribute("nonce",l),document.head.appendChild(m),c)return new Promise((x,_)=>{m.addEventListener("load",x),m.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${u}`)))})}))}function a(i){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=i,window.dispatchEvent(l),!l.defaultPrevented)throw i}return r.then(i=>{for(const l of i||[])l.status==="rejected"&&a(l.reason);return n().catch(a)})};let Ne=null;function eo(t){if(!t||!t.comments){Ne=null;return}const n=t.comments;Ne={repo:{owner:n.repo?.owner??"",name:n.repo?.name??""},discussions:{category:n.discussions?.category??"Storyboard Comments"}}}function Xt(){return Ne}function lt(){return Ne!==null&&Ne.repo.owner!==""&&Ne.repo.name!==""}const to=`
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
`,no='<svg viewBox="0 0 16 16"><path d="M5 5.782V2.5h-.25a.75.75 0 010-1.5h6.5a.75.75 0 010 1.5H11v3.282l3.666 5.86C15.619 13.04 14.552 15 12.46 15H3.54c-2.092 0-3.159-1.96-2.206-3.358zM6.5 2.5v3.782a.75.75 0 01-.107.384L3.2 12.5h9.6l-3.193-5.834A.75.75 0 019.5 6.282V2.5z"/></svg>',ro='<svg viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',so='<svg viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>',oo='<svg viewBox="0 0 16 16"><path d="M8.5 1.75a.75.75 0 0 0-1.5 0V3H1.75a.75.75 0 0 0 0 1.5H3v6H1.75a.75.75 0 0 0 0 1.5H7v1.25a.75.75 0 0 0 1.5 0V12h5.25a.75.75 0 0 0 0-1.5H12v-6h1.75a.75.75 0 0 0 0-1.5H8.5Zm2 8.75h-5a.25.25 0 0 1-.25-.25v-4.5A.25.25 0 0 1 5.5 5.5h5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Z"/></svg>',ao='<svg viewBox="0 0 16 16"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>';function io(){return new URLSearchParams(window.location.search).get("scene")||"default"}function co(t={}){const n=t.container||document.body,s=t.basePath||"/";if(n.querySelector(".sb-devtools-wrapper"))return;const o=document.createElement("style");o.textContent=to,document.head.appendChild(o);let r=!0,a=!1;const i=document.createElement("div");i.className="sb-devtools-wrapper";const l=document.createElement("button");l.className="sb-devtools-trigger",l.setAttribute("aria-label","Storyboard DevTools"),l.innerHTML=no;const d=document.createElement("div");d.className="sb-devtools-menu";const u=document.createElement("button");u.className="sb-devtools-menu-item",u.innerHTML=`${oo} Viewfinder`;const c=document.createElement("button");c.className="sb-devtools-menu-item",c.innerHTML=`${ro} Show scene info`;const h=document.createElement("button");h.className="sb-devtools-menu-item",h.innerHTML=`${so} Reset all params`;const m=document.createElement("div");m.className="sb-devtools-hint",m.innerHTML="Press <code>⌘ + .</code> to hide",d.appendChild(u),d.appendChild(c),d.appendChild(h);function x(){d.querySelectorAll("[data-sb-comment-menu-item]").forEach(k=>k.remove()),lt()&&D(async()=>{const{getCommentsMenuItems:k}=await import("./CommentOverlay-lH-aPAr7.js");return{getCommentsMenuItems:k}},__vite__mapDeps([0,1,2,3,4,5,6])).then(({getCommentsMenuItems:k})=>{const $=k(),M=m;for(const F of $){const H=document.createElement("button");H.className="sb-devtools-menu-item",H.setAttribute("data-sb-comment-menu-item",""),H.innerHTML=`<span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${F.icon}</span> ${F.label}`,H.addEventListener("click",()=>{a=!1,d.classList.remove("open"),F.onClick()}),d.insertBefore(H,M)}})}l.addEventListener("click",x),d.appendChild(m),i.appendChild(d),i.appendChild(l),n.appendChild(i);let _=null;function S(){a=!1,d.classList.remove("open"),_&&_.remove();const k=io();let $="",M=null;try{$=JSON.stringify(ft(k),null,2)}catch(Y){M=Y.message}_=document.createElement("div"),_.className="sb-devtools-overlay";const F=document.createElement("div");F.className="sb-devtools-backdrop",F.addEventListener("click",T);const H=document.createElement("div");H.className="sb-devtools-panel";const Z=document.createElement("div");Z.className="sb-devtools-panel-header",Z.innerHTML=`<span class="sb-devtools-panel-title">Scene: ${k}</span>`;const G=document.createElement("button");G.className="sb-devtools-panel-close",G.setAttribute("aria-label","Close panel"),G.innerHTML=ao,G.addEventListener("click",T),Z.appendChild(G);const te=document.createElement("div");if(te.className="sb-devtools-panel-body",M)te.innerHTML=`<span class="sb-devtools-error">${M}</span>`;else{const Y=document.createElement("pre");Y.className="sb-devtools-code",Y.textContent=$,te.appendChild(Y)}H.appendChild(Z),H.appendChild(te),_.appendChild(F),_.appendChild(H),n.appendChild(_)}function T(){_&&(_.remove(),_=null)}l.addEventListener("click",()=>{a=!a,d.classList.toggle("open",a)}),c.addEventListener("click",S),u.addEventListener("click",()=>{a=!1,d.classList.remove("open"),window.location.href=s+"viewfinder"}),h.addEventListener("click",()=>{window.location.hash="",a=!1,d.classList.remove("open")}),document.addEventListener("click",k=>{a&&!i.contains(k.target)&&(a=!1,d.classList.remove("open"))}),window.addEventListener("keydown",k=>{k.key==="."&&(k.metaKey||k.ctrlKey)&&(k.preventDefault(),r=!r,i.style.display=r?"":"none",r||(a=!1,d.classList.remove("open"),T()))})}function lo(t){let n=0;for(let s=0;s<t.length;s++)n=(n<<5)-n+t.charCodeAt(s)|0;return Math.abs(n)}function uo(t,n=[]){for(const s of n)if(s.toLowerCase()===t.toLowerCase())return`/${s}?scene=${encodeURIComponent(t)}`;try{const s=ft(t),o=s?.sceneMeta?.route||s?.route;if(o)return`${o.startsWith("/")?o:`/${o}`}?scene=${encodeURIComponent(t)}`}catch{}return`/?scene=${encodeURIComponent(t)}`}function po(t){try{return ft(t)?.sceneMeta||null}catch{return null}}const ho={sceneMeta:{route:"/example"},navigation:{$ref:"navigation"},user:{name:"John Doe",username:"johndoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"}},mo={sceneMeta:{route:"/example",author:"dfosco"},user:{$ref:"jane-doe"},navigation:{$ref:"navigation"},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"},signup:{fullName:"",email:"",password:"",organization:{name:"",size:"",role:""},workspace:{region:"",plan:"starter",newsletter:!1,agreeTerms:!1}}},go={$global:["security-advisory-navigation"],advisory:{$ref:"security-advisory"}},fo={$global:["finch-pearl-navigation"],repositories:{$ref:"finch-pearl-repositories"}},bo={id:10,title:"Remote code injection in Log4j",breadcrumb:"Dependabot alerts",state:"fixed",openedAgo:"4 years ago",fixedAgo:"3 years ago",package:{name:"org.apache.logging.log4j:log4j-core",ecosystem:"Maven",affectedVersions:">= 2.13.0, < 2.15.0",patchedVersion:"2.15.0"},severity:{level:"Critical",score:"10.0 / 10",cvssMetrics:[{label:"Attack vector",value:"Network"},{label:"Attack complexity",value:"Low"},{label:"Privileges required",value:"None"},{label:"User interaction",value:"None"},{label:"Scope",value:"Changed"},{label:"Confidentiality",value:"High"},{label:"Integrity",value:"High"},{label:"Availability",value:"High"}],cvssVector:"CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H/E:H"},epss:{score:"94.358%",percentile:"100th percentile"},tags:["Patch available"],weaknesses:["CWE-20","CWE-400","CWE-502","CWE-917"],cveId:"CVE-2021-44228",ghsaId:"GHSA-jfh8-c2jp-5v3q",timeline:[{actor:"dependabot",actorAvatar:"https://avatars.githubusercontent.com/in/29110?v=4",isBot:!0,action:"opened this",timeAgo:"4 years ago"},{actor:"dependabot",actorAvatar:"https://avatars.githubusercontent.com/in/29110?v=4",isBot:!0,action:"closed this as completed",timeAgo:"3 years ago"}]},xo={topnav:[{icon:"code",label:"Code",url:"#"},{icon:"issue-opened",label:"Issues",url:"#"},{icon:"git-pull-request",label:"Pull requests",url:"#"},{icon:"people",label:"Agents",url:"#"},{icon:"play",label:"Actions",url:"#"},{icon:"project",label:"Projects",url:"#"},{icon:"star",label:"Models",url:"#"},{icon:"book",label:"Wiki",url:"#"},{icon:"shield",label:"Security",url:"#",counter:95,current:!0},{icon:"graph",label:"Insights",url:"#"},{icon:"gear",label:"Settings",url:"#"}]},vo={primary:[{label:"Overview",url:"/Overview",icon:"home"},{label:"Issues",url:"/Issues",icon:"issue-opened"},{label:"Pull Requests",url:"#",icon:"git-pull-request"},{label:"Discussions",url:"#",icon:"comment-discussion"}],secondary:[{label:"Settings",url:"#",icon:"gear"},{label:"Help",url:"#",icon:"question"}]},yo={name:"Jane Doe",username:"janedoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},jo=[{name:"test-webdriverio-update-copilot-issue",description:"",language:null,forks:0,stars:0,url:"#"},{name:"dependabot-copilot-autofix",description:"Testing Autofix using Copilot Workspaces",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"alona-copilot",description:"",language:null,forks:0,stars:0,url:"#"},{name:"spike-dependabot-snapshot-action",description:"Copilot-driven spike into using Dependabot as a dependency detector",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"ghas-copilot-geekmasher",description:"",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"copilot-autofix-demo-by-ot",description:"",language:"JavaScript",forks:0,stars:0,url:"#"}],wo={topnav:[{icon:"home",label:"Overview",url:"/Overview"},{icon:"repo",label:"Repositories",url:"/Repositories",counter:"5k+",current:!0},{icon:"project",label:"Projects",url:"#",counter:25},{icon:"package",label:"Packages",url:"#",counter:21},{icon:"people",label:"Teams",url:"#",counter:132},{icon:"person",label:"People",url:"#",counter:571},{icon:"shield",label:"Security",url:"#"},{icon:"graph",label:"Insights",url:"#"},{icon:"gear",label:"Settings",url:"#"}],sidenav:[{label:"All",url:"#",icon:"repo",current:!0},{label:"Contributed by me",url:"#",icon:"git-pull-request"},{label:"Adminable by me",url:"#",icon:"person"},{label:"Public",url:"#",icon:"eye"},{label:"Internal",url:"#",icon:"lock"},{label:"Private",url:"#",icon:"lock"},{label:"Sources",url:"#",icon:"code"},{label:"Forks",url:"#",icon:"repo-forked"},{label:"Archived",url:"#",icon:"archive"},{label:"Templates",url:"#",icon:"repo-template"}]},_o=[{id:"refactor-auth-sso",identifier:"FIL-10",title:"Refactor authentication flow to support SSO providers",description:"Our current auth flow only supports email/password login. We need to extend it to support SSO providers (Google, Okta, Azure AD) for enterprise customers.",status:"todo",priority:"high",labels:["Auth","Backend","Feature"],assignee:null,project:null,estimate:5,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-17T10:50:00Z",acceptanceCriteria:["Users can authenticate via Google OAuth 2.0","Users can authenticate via SAML-based SSO (Okta, Azure AD)","Existing email/password flow remains unchanged","Session tokens are issued consistently regardless of auth method","Admin panel includes SSO configuration settings"],technicalNotes:["Use the existing AuthService class as the base","Add a provider strategy pattern to abstract login methods","Store provider metadata in the identity_providers table","Redirect URI callback must handle both web and mobile clients"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"10min ago"}]},{id:"fix-rate-limiter-bypass",identifier:"FIL-9",title:"Fix rate limiter bypass on batch endpoints",description:"The rate limiter can be bypassed by splitting a large request into multiple smaller batch calls. Each sub-request is counted as a single hit instead of being weighted by payload size.",status:"in_progress",priority:"urgent",labels:["Bug","Security","Backend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Platform Infrastructure",estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-16T14:20:00Z",acceptanceCriteria:["Batch endpoints count each item in the payload toward the rate limit","Rate limit headers reflect weighted counts","Existing single-request endpoints are unaffected"],technicalNotes:["Update RateLimiterMiddleware to accept a weight function","Batch controller should pass payload.length as weight","Add integration tests for weighted rate limiting"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 day ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"6 hours ago",body:"Started investigating — the middleware doesn't have access to parsed body at the point it runs. May need to restructure."}]},{id:"add-webhook-retry-logic",identifier:"FIL-8",title:"Add exponential backoff retry logic for webhook deliveries",description:"Webhook deliveries currently fail silently on timeout. We need retry logic with exponential backoff and a dead-letter queue for persistently failing endpoints.",status:"todo",priority:"medium",labels:["Feature","Backend"],assignee:null,project:"Platform Infrastructure",estimate:8,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-15T09:00:00Z",acceptanceCriteria:["Failed webhook deliveries are retried up to 5 times","Retry intervals follow exponential backoff (1s, 2s, 4s, 8s, 16s)","After all retries, the event is moved to a dead-letter queue","Delivery status is visible in the admin dashboard"],technicalNotes:["Use the existing job queue (BullMQ) for retry scheduling","Add a webhook_deliveries table to track attempts","Dead-letter events should be replayable from the admin UI"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"2 days ago"}]},{id:"dashboard-loading-skeleton",identifier:"FIL-7",title:"Add loading skeletons to dashboard widgets",description:"Dashboard widgets show a blank space while data is loading. Add skeleton loaders to improve perceived performance.",status:"done",priority:"low",labels:["Feature","Frontend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Dashboard",estimate:2,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-12T16:30:00Z",acceptanceCriteria:["All dashboard cards show skeleton loaders while fetching data","Skeleton matches the shape of the loaded content","Transition from skeleton to content is smooth"],technicalNotes:["Use Reshaped Skeleton component","Wrap each StatCard in a loading boundary"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"5 days ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"3 days ago",body:"Done — merged in FIL-7-skeletons branch."}]},{id:"migrate-env-config",identifier:"FIL-6",title:"Migrate environment config to typed schema validation",description:"Environment variables are currently accessed via raw process.env lookups with no validation. Migrate to a typed config schema using zod so missing or malformed values are caught at startup.",status:"todo",priority:"medium",labels:["Backend","DevEx"],assignee:null,project:null,estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-10T11:00:00Z",acceptanceCriteria:["All environment variables are defined in a single config schema","Server fails fast on startup if required variables are missing","Types are inferred from the schema — no manual type assertions"],technicalNotes:["Use zod for schema definition and parsing","Create src/config.ts as the single source of truth","Replace all process.env.X references with config.X"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 week ago"}]}],So=[{id:"welcome-to-storyboard",title:"Welcome to Storyboard",date:"2026-02-14",author:"Jane Doe",summary:"An introduction to building prototypes with Storyboard — the meta-framework for design system exploration.",body:`Storyboard is a prototyping meta-framework that lets you build interactive UI prototypes powered by real data. Instead of hard-coding sample content, you define data files that feed into your pages automatically.

Each page can load a scene (its data context), reference shared objects, and even render parameterized content from record collections — like this very blog post.

Get started by creating a \`.scene.json\` file and a page component. The data flows in, and you focus on the design.`},{id:"data-driven-prototyping",title:"Data-Driven Prototyping",date:"2026-02-13",author:"Jane Doe",summary:"How scenes, objects, and records work together to power realistic prototypes.",body:`Traditional prototyping tools force you to duplicate content across screens. Storyboard takes a different approach: your data lives in JSON files, and pages consume it through hooks.

**Scenes** provide the full data context for a page. **Objects** are reusable fragments — a user profile, a navigation config — that scenes reference via \`$ref\`. **Records** are collections that power parameterized pages, like blog posts or product listings.

This separation means you can swap data without touching UI code, test edge cases by editing JSON, and share data fragments across multiple pages.`},{id:"design-system-exploration",title:"Exploring Design Systems",date:"2026-02-12",author:"Jane Doe",summary:"Using Storyboard to explore and compare design systems like Primer and Reshaped.",body:`One of Storyboard's strengths is its design system agnosticism. While it ships with Primer React as the default, you can bring any design system — Reshaped, Radix, Chakra, or your own.

Each page is independent: one page can use Primer components while another uses Reshaped. This makes Storyboard ideal for comparing design systems side by side, exploring component APIs, and building proof-of-concept pages before committing to a system.

The key is that the data layer stays the same regardless of which components render it.`}],Zt={"other-scene":ho,default:mo,SecurityAdvisory:go,Repositories:fo},ko={"security-advisory":bo,"security-advisory-navigation":xo,navigation:vo,"jane-doe":yo,"finch-pearl-repositories":jo,"finch-pearl-navigation":wo},Co={issues:_o,posts:So};Us({scenes:Zt,objects:ko,records:Co});const St=b.createContext(null);function Eo(){return new URLSearchParams(window.location.search).get("scene")}function Io(){const t=window.location.pathname.replace(/\/+$/,"")||"/";return t==="/"?"index":t.split("/").pop()||"index"}function No({sceneName:t,recordName:n,recordParam:s,children:o}){const r=Io(),a=Eo()||t||(Fs(r)?r:"default"),i=sr(),{data:l,error:d}=b.useMemo(()=>{try{let c=ft(a);if(n&&s&&i[s]){const h=Vs(n,i[s]);h&&(c=rt(c,{record:h}))}return{data:c,error:null}}catch(c){return{data:null,error:c.message}}},[a,n,s,i]),u={data:l,error:d,loading:!1,sceneName:a};return d?e.jsxs("span",{style:{color:"var(--fgColor-danger, #f85149)"},children:["Error loading scene: ",d]}):e.jsx(St.Provider,{value:u,children:o})}function U(t){const n=b.useContext(St);if(n===null)throw new Error("useSceneData must be used within a <StoryboardProvider>");const{data:s,loading:o,error:r}=n,a=b.useSyncExternalStore(_t,Kt),i=b.useSyncExternalStore(fr,xr);return b.useMemo(()=>{if(o||r||s==null)return;const d=ze(),u=d?jr:mr,c=d?Gs:gr;if(!t){const T=c(),k=Object.keys(T);if(k.length===0)return s;const $=Ue(s);for(const M of k)st($,M,T[M]);return $}const h=u(t);if(h!==null)return h;const m=t+".",x=c(),_=Object.keys(x).filter(T=>T.startsWith(m)),S=pr(s,t);if(_.length>0&&S!==void 0){const T=Ue(S);for(const k of _){const $=k.slice(m.length);st(T,$,x[k])}return T}return S===void 0?(console.warn(`[useSceneData] Path "${t}" not found in scene data.`),{}):S},[s,o,r,t,a,i])}function j(t){const n=b.useContext(St);if(n===null)throw new Error("useOverride must be used within a <StoryboardProvider>");const{data:s}=n,o=ze(),r=s!=null?pr(s,t):void 0,a=b.useCallback(()=>mr(t),[t]),i=b.useSyncExternalStore(_t,a);b.useSyncExternalStore(fr,xr);let l;if(o){const c=jr(t);l=c!==null?c:r}else l=i!==null?i:r;const d=b.useCallback(c=>{ze()||ve(t,c),An(t,c)},[t]),u=b.useCallback(()=>{ze()||ot(t),Rn(t)},[t]);return[l,d,u]}function Lo(){const t=b.useContext(St);if(t===null)throw new Error("useScene must be used within a <StoryboardProvider>");const n=b.useCallback(s=>{const o=new URL(window.location.href);o.searchParams.set("scene",s),window.location.href=o.toString()},[]);return{sceneName:t.sceneName,switchScene:n}}function wr(t,n){const s=gr(),o=`record.${n}.`,r=Object.keys(s).filter(l=>l.startsWith(o));if(r.length===0)return t;const a=Ue(t),i={};for(const l of r){const d=l.slice(o.length),u=d.indexOf(".");if(u===-1)continue;const c=d.slice(0,u),h=d.slice(u+1);i[c]||(i[c]={}),i[c][h]=s[l]}for(const[l,d]of Object.entries(i)){const u=a.find(c=>c.id===l);if(u)for(const[c,h]of Object.entries(d))st(u,c,h);else{const c={id:l};for(const[h,m]of Object.entries(d))st(c,h,m);a.push(c)}}return a}function _r(t,n="id"){const o=sr()[n],r=b.useSyncExternalStore(_t,Kt);return b.useMemo(()=>{if(!o)return null;try{const a=Jt(t);return wr(a,t).find(l=>l[n]===o)??null}catch(a){return console.error(`[useRecord] ${a.message}`),null}},[t,n,o,r])}function Sr(t){const n=b.useSyncExternalStore(_t,Kt);return b.useMemo(()=>{try{const s=Jt(t);return wr(s,t)}catch(s){return console.error(`[useRecords] ${s.message}`),[]}},[t,n])}function ge(t,n,s){return j(`record.${t}.${n}.${s}`)}function To(t,n=""){const s=n.replace(/\/+$/,"");document.addEventListener("click",r=>{if(r.metaKey||r.ctrlKey||r.shiftKey||r.altKey)return;const a=r.target.closest("a[href]");if(!a||a.target==="_blank")return;const i=new URL(a.href,window.location.origin);if(i.origin!==window.location.origin)return;const l=window.location.hash,d=l&&l!=="#",c=i.hash&&i.hash!=="#"?i.hash:d?l:"";let h=i.pathname;s&&h.startsWith(s)&&(h=h.slice(s.length)||"/"),r.preventDefault(),t.navigate(h+i.search+c),setTimeout(ct,0)});const o=t.navigate.bind(t);t.navigate=(r,a)=>{const i=window.location.hash;return i&&i!=="#"&&typeof r=="string"&&!r.includes("#")&&(r=r+i),o(r,a).then(d=>(ct(),d))}}const Ge=b.createContext(null),Po="_container_1j46h_1",Ao="_header_1j46h_8",Ro="_title_1j46h_13",$o="_subtitle_1j46h_21",Oo="_grid_1j46h_27",Do="_card_1j46h_35",zo="_thumbnail_1j46h_51",Mo="_cardBody_1j46h_71",Bo="_sceneName_1j46h_76",Ho="_empty_1j46h_83",Uo="_sectionTitle_1j46h_92",Fo="_branchSection_1j46h_102",Vo="_branchMeta_1j46h_106",qo="_author_1j46h_113",Wo="_authorAvatar_1j46h_120",Jo="_authorName_1j46h_126",R={container:Po,header:Ao,title:Ro,subtitle:$o,grid:Oo,card:Do,thumbnail:zo,cardBody:Mo,sceneName:Bo,empty:Ho,sectionTitle:Uo,branchSection:Fo,branchMeta:Vo,author:qo,authorAvatar:Wo,authorName:Jo};function Dn({name:t}){const n=lo(t),s=[];for(let r=0;r<12;r++){const a=n*(r+1),i=(a*7+r*31)%320,l=(a*13+r*17)%200,d=20+a*(r+3)%80,u=8+a*(r+7)%40,c=.06+a*(r+2)%20/100,h=r%3===0?"var(--placeholder-accent)":r%3===1?"var(--placeholder-fg)":"var(--placeholder-muted)";s.push(e.jsx("rect",{x:i,y:l,width:d,height:u,rx:2,fill:h,opacity:c},r))}const o=[];for(let r=0;r<6;r++){const i=10+n*(r+5)%180;o.push(e.jsx("line",{x1:0,y1:i,x2:320,y2:i,stroke:"var(--placeholder-grid)",strokeWidth:.5,opacity:.4},`h${r}`))}for(let r=0;r<8;r++){const i=10+n*(r+9)%300;o.push(e.jsx("line",{x1:i,y1:0,x2:i,y2:200,stroke:"var(--placeholder-grid)",strokeWidth:.5,opacity:.3},`v${r}`))}return e.jsxs("svg",{viewBox:"0 0 320 200",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",children:[e.jsx("rect",{width:"320",height:"200",fill:"var(--placeholder-bg)"}),o,s]})}function kr({scenes:t={},pageModules:n={},basePath:s,title:o="Viewfinder"}){const[r,a]=b.useState(null),i=b.useMemo(()=>Object.keys(t),[t]),l=b.useMemo(()=>Object.keys(n).map(u=>u.replace("/src/pages/","").replace(".jsx","")).filter(u=>!u.startsWith("_")&&u!=="index"&&u!=="viewfinder"),[n]),d=b.useMemo(()=>(s||"/storyboard-source/").replace(/\/[^/]*\/$/,"/"),[s]);return b.useEffect(()=>{const u=`${d}branches.json`;fetch(u).then(c=>c.ok?c.json():[]).then(c=>a(Array.isArray(c)?c:[])).catch(()=>a([]))},[d]),e.jsxs("div",{className:R.container,children:[e.jsxs("header",{className:R.header,children:[e.jsx("h1",{className:R.title,children:o}),e.jsxs("p",{className:R.subtitle,children:[i.length," scene",i.length!==1?"s":"",r&&r.length>0?` · ${r.length} branch preview${r.length!==1?"s":""}`:""]})]}),i.length===0?e.jsxs("p",{className:R.empty,children:["No scenes found. Add a ",e.jsx("code",{children:"*.scene.json"})," file to get started."]}):e.jsxs("section",{children:[e.jsx("h2",{className:R.sectionTitle,children:"Scenes"}),e.jsx("div",{className:R.grid,children:i.map(u=>{const c=po(u);return e.jsxs(ye,{to:uo(u,l),className:R.card,children:[e.jsx("div",{className:R.thumbnail,children:e.jsx(Dn,{name:u})}),e.jsxs("div",{className:R.cardBody,children:[e.jsx("p",{className:R.sceneName,children:u}),c?.author&&e.jsxs("div",{className:R.author,children:[e.jsx("img",{src:`https://github.com/${c.author}.png?size=32`,alt:c.author,className:R.authorAvatar}),e.jsx("span",{className:R.authorName,children:c.author})]})]})]},u)})})]}),r&&r.length>0&&e.jsxs("section",{className:R.branchSection,children:[e.jsx("h2",{className:R.sectionTitle,children:"Branch Previews"}),e.jsx("div",{className:R.grid,children:r.map(u=>e.jsxs("a",{href:`${d}${u.folder}/`,className:R.card,children:[e.jsx("div",{className:R.thumbnail,children:e.jsx(Dn,{name:u.branch})}),e.jsxs("div",{className:R.cardBody,children:[e.jsx("p",{className:R.sceneName,children:u.branch}),e.jsx("p",{className:R.branchMeta,children:u.folder})]})]},u.folder))})]})]})}function Go(){return e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:"var(--bgColor-default, #0d1117)"},children:[e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",style:{animation:"spin 0.8s linear infinite"},children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"var(--fgColor-muted, #484f58)",strokeWidth:"2.5",opacity:"0.25"}),e.jsx("path",{d:"M12 2a10 10 0 0 1 10 10",stroke:"var(--fgColor-default, #e6edf3)",strokeWidth:"2.5",strokeLinecap:"round"})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg) } }"})]})}function Yo(){return e.jsx(No,{children:e.jsx(b.Suspense,{fallback:e.jsx(Go,{}),children:e.jsx(or,{})})})}const Qt=Object.freeze(Object.defineProperty({__proto__:null,default:Yo},Symbol.toStringTag,{value:"Module"})),Ko="_navItem_ec50i_1",Xo="_active_ec50i_16",zn={navItem:Ko,active:Xo},Zo=[{label:"Overview",path:"/Dashboard"},{label:"Issues",path:"/issues"},{label:"Projects",path:"/Dashboard"},{label:"Views",path:"/Dashboard"}];function dt({orgName:t,activePage:n,userInfo:s}){const o=Ut();return e.jsx(pe,{padding:4,children:e.jsxs(p,{direction:"column",gap:2,children:[e.jsx(g,{variant:"featured-3",weight:"bold",children:t||"—"}),e.jsx(ae,{}),e.jsx("nav",{children:e.jsx(p,{direction:"column",gap:0,children:Zo.map(r=>e.jsx("button",{type:"button",className:`${zn.navItem} ${n===r.label?zn.active:""}`,onClick:()=>o(r.path),children:e.jsx(g,{variant:"body-3",weight:n===r.label?"bold":"regular",children:r.label})},r.label))})}),s&&e.jsxs(e.Fragment,{children:[e.jsx(ae,{}),e.jsxs(p,{direction:"column",gap:1,paddingTop:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:s.name||"—"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:s.role||"—"})]})]})]})})}function je(t){return t==null||t===""?"—":String(t)}function Ke({label:t,value:n,change:s,color:o}){return e.jsx(pe,{padding:5,children:e.jsxs(p,{direction:"column",gap:2,children:[e.jsx(g,{variant:"body-3",color:"neutral-faded",children:t}),e.jsx(g,{variant:"featured-2",weight:"bold",children:n}),e.jsx(g,{variant:"caption-1",color:o||"positive",children:s})]})})}function Re({label:t,value:n,max:s,color:o}){return e.jsxs(p,{direction:"column",gap:1,children:[e.jsxs(p,{direction:"row",justify:"space-between",children:[e.jsx(g,{variant:"body-3",children:t}),e.jsx(g,{variant:"body-3",weight:"medium",children:n})]}),e.jsx(ks,{value:typeof s=="number"?parseFloat(n)/s*100:parseFloat(n),color:o,size:"small",attributes:{"aria-label":t}})]})}const Qo=[{label:"Team standup",time:"Today, 10:00"},{label:"Architecture review",time:"Today, 11:30"},{label:"Lunch",time:"Today, 12:30"},{label:"Sprint planning",time:"Today, 14:00"},{label:"Deploy v2.4",time:"Today, 17:00"}];function ea(){const t=U("signup.fullName"),n=U("signup.organization.name"),s=U("signup.organization.size"),o=U("signup.organization.role"),r=U("signup.workspace.region"),a=U("signup.workspace.plan");return e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(p,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(p,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(p.Item,{columns:2,children:e.jsx(dt,{orgName:je(n),activePage:"Overview",userInfo:{name:je(t),role:je(o)}})}),e.jsx(p.Item,{columns:10,direction:"column",align:"center",justify:"center",children:e.jsxs(p,{direction:"column",maxWidth:"80%",gap:4,children:[e.jsxs(p,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(g,{variant:"featured-2",weight:"bold",children:"Overview"}),e.jsxs(p,{direction:"row",gap:2,align:"center",children:[e.jsxs(He,{color:"positive",children:[je(a)," plan"]}),e.jsx(He,{variant:"faded",children:je(r)})]})]}),e.jsxs(p,{direction:"row",gap:3,children:[e.jsx(p.Item,{columns:3,children:e.jsx(Ke,{label:"Active Users",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(p.Item,{columns:3,children:e.jsx(Ke,{label:"Deployments",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(p.Item,{columns:3,children:e.jsx(Ke,{label:"New Members",value:"1",change:"That's you!",color:"primary"})}),e.jsx(p.Item,{columns:3,children:e.jsx(Ke,{label:"Team Size",value:je(s),change:"Current plan capacity",color:"primary"})})]}),e.jsxs(p,{direction:"row",gap:4,children:[e.jsx(p.Item,{columns:5,children:e.jsxs(p,{direction:"column",gap:4,children:[e.jsx(pe,{padding:4,children:e.jsx(Ss,{})}),e.jsx(pe,{padding:5,children:e.jsxs(p,{direction:"column",gap:3,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Schedule"}),e.jsx(p,{direction:"column",gap:2,children:Qo.map(i=>e.jsx(Rt,{name:`schedule-${i.label}`,children:e.jsxs(p,{direction:"column",children:[e.jsx(g,{variant:"body-3",children:i.label}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:i.time})]})},i.label))})]})})]})}),e.jsx(p.Item,{grow:!0,children:e.jsxs(p,{direction:"column",gap:4,children:[e.jsx(pe,{padding:5,children:e.jsxs(p,{direction:"column",gap:4,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Metrics"}),e.jsx(Re,{label:"Performance",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"Monthly revenue goal",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"Error rate",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"User acquisition",value:"0",max:100,color:"neutral-faded"}),e.jsx(Re,{label:"Releases shipped",value:"0",max:100,color:"neutral-faded"})]})}),e.jsx(pe,{padding:5,children:e.jsxs(p,{direction:"column",gap:3,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Recent activity"}),e.jsx(ae,{}),e.jsxs(p,{direction:"column",gap:4,align:"center",paddingBlock:6,children:[e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"No activity yet"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Deployments and events will appear here once your workspace is active."})]})]})})]})})]})]})})]})})})}const en=Object.freeze(Object.defineProperty({__proto__:null,default:ea},Symbol.toStringTag,{value:"Module"})),ta="/storyboard-source/assets/mona-loading-a6vFIHDd.gif",na="_container_1dofh_1",ra="_contentBox_1dofh_12",sa="_codeLine_1dofh_21",oa="_iconWrapper_1dofh_26",aa="_codeText_1dofh_32",ia="_monaWrapper_1dofh_39",ca="_footerHeader_1dofh_45",la="_tipsText_1dofh_50",da="_warningText_1dofh_55",oe={container:na,contentBox:ra,codeLine:sa,iconWrapper:oa,codeText:aa,monaWrapper:ia,footerHeader:ca,tipsText:la,warningText:da};function Me({name:t,onChange:n,value:s,...o}){const r=b.useContext(Ge),a=r?.prefix&&t?`${r.prefix}.${t}`:t,[i]=j(a||""),[l,d]=b.useState(i??""),u=!!r&&!!t;b.useEffect(()=>{if(u)return r.subscribe(t,m=>d(m))},[u,r,t]),b.useEffect(()=>{u&&i!=null&&(d(i),r.setDraft(t,i))},[]);const c=m=>{u&&(d(m.target.value),r.setDraft(t,m.target.value)),n&&n(m)},h=u?l:s;return e.jsx(et,{name:t,value:h,onChange:c,...o})}function fe({name:t,onChange:n,value:s,children:o,...r}){const a=b.useContext(Ge),i=a?.prefix&&t?`${a.prefix}.${t}`:t,[l]=j(i||""),[d,u]=b.useState(l??""),c=!!a&&!!t;b.useEffect(()=>{if(c)return a.subscribe(t,x=>u(x))},[c,a,t]),b.useEffect(()=>{c&&l!=null&&(u(l),a.setDraft(t,l))},[]);const h=x=>{c&&(u(x.target.value),a.setDraft(t,x.target.value)),n&&n(x)},m=c?d:s;return e.jsx(rr,{name:t,value:m,onChange:h,...r,children:o})}fe.Option=rr.Option;function ua({name:t,onChange:n,checked:s,...o}){const r=b.useContext(Ge),a=r?.prefix&&t?`${r.prefix}.${t}`:t,[i]=j(a||""),l=i==="true"||i===!0,[d,u]=b.useState(l),c=!!r&&!!t;b.useEffect(()=>{if(c)return r.subscribe(t,x=>u(x==="true"||x===!0))},[c,r,t]),b.useEffect(()=>{if(c&&i!=null){const x=i==="true"||i===!0;u(x),r.setDraft(t,x?"true":"false")}},[]);const h=x=>{c&&(u(x.target.checked),r.setDraft(t,x.target.checked?"true":"false")),n&&n(x)},m=c?d:s;return e.jsx(ds,{name:t,checked:m,onChange:h,...o})}function Cr({name:t,onChange:n,value:s,...o}){const r=b.useContext(Ge),a=r?.prefix&&t?`${r.prefix}.${t}`:t,[i]=j(a||""),[l,d]=b.useState(i??""),u=!!r&&!!t;b.useEffect(()=>{if(u)return r.subscribe(t,m=>d(m))},[u,r,t]),b.useEffect(()=>{u&&i!=null&&(d(i),r.setDraft(t,i))},[]);const c=m=>{u&&(d(m.target.value),r.setDraft(t,m.target.value)),n&&n(m)},h=u?l:s;return e.jsx(us,{name:t,value:h,onChange:c,...o})}function Er({data:t,onSubmit:n,children:s,...o}){const r=t||null,a=b.useRef({}),i=b.useRef({}),l=b.useCallback(m=>a.current[m],[]),d=b.useCallback((m,x)=>{a.current[m]=x;const _=i.current[m];_&&_(x)},[]),u=b.useCallback((m,x)=>(i.current[m]=x,()=>{delete i.current[m]}),[]),c=m=>{if(m.preventDefault(),r)for(const[x,_]of Object.entries(a.current))ve(`${r}.${x}`,_);n&&n(m)},h={prefix:r,getDraft:l,setDraft:d,subscribe:u};return e.jsx(Ge.Provider,{value:h,children:e.jsx("form",{...o,onSubmit:c,children:s})})}const pa="_container_1ykvj_1",ha="_title_1ykvj_5",ma="_codeBlock_1ykvj_11",ga="_form_1ykvj_38",we={container:pa,title:ha,codeBlock:ma,form:ga};function fa(){const[t,n,s]=j("user.name"),[o,r,a]=j("user.username"),[i,,l]=j("user.profile.bio"),[d,,u]=j("user.profile.location"),{sceneName:c,switchScene:h}=Lo(),m=c==="default"?"other-scene":"default",x=()=>{s(),a(),l(),u()};return e.jsxs("div",{className:we.container,children:[e.jsx("h2",{className:we.title,children:"useOverride Demo"}),e.jsxs("p",{children:["Add ",e.jsx("code",{children:"#user.name=Alice"})," to the URL hash to override any value."]}),e.jsxs("section",{children:[e.jsx(A,{as:"h3",fontWeight:"bold",children:"Scene"}),e.jsxs("pre",{className:we.codeBlock,children:["current: ",c]}),e.jsxs(se,{size:"small",onClick:()=>h(m),children:['Switch to "',m,'"']})]}),e.jsxs("section",{children:[e.jsx(A,{as:"h3",fontWeight:"bold",children:"User"}),e.jsxs("pre",{className:we.codeBlock,children:[t," (",o,")"]}),e.jsxs("pre",{className:we.codeBlock,children:[i," · ",d]}),e.jsx(A,{as:"h4",fontWeight:"semibold",fontSize:1,children:"Switch User"}),e.jsxs(ps,{children:[e.jsx(se,{size:"small",onClick:()=>n("Alice Chen"),children:"Update name"}),e.jsx(se,{size:"small",onClick:()=>r("alice123"),children:"Update username"})]}),e.jsx(se,{size:"small",variant:"danger",onClick:x,style:{marginLeft:"8px"},children:"Reset"})]}),e.jsx("a",{href:"/storyboard-source/Overview",children:"hello"}),e.jsxs("section",{children:[e.jsx(A,{as:"h3",fontWeight:"bold",children:"Edit User"}),e.jsxs(Er,{data:"user",className:we.form,children:[e.jsxs(B,{children:[e.jsx(B.Label,{children:"Name"}),e.jsx(Me,{name:"name",placeholder:"Name",size:"small"})]}),e.jsxs(B,{children:[e.jsx(B.Label,{children:"Username"}),e.jsx(Me,{name:"username",placeholder:"Username",size:"small"})]}),e.jsxs(B,{children:[e.jsx(B.Label,{children:"Bio"}),e.jsx(Cr,{name:"profile.bio",placeholder:"Bio"})]}),e.jsxs(B,{children:[e.jsx(B.Label,{children:"Location"}),e.jsx(Me,{name:"profile.location",placeholder:"Location",size:"small"})]}),e.jsx(se,{type:"submit",size:"small",children:"Save"})]})]})]})}function ba(){return e.jsxs("div",{className:oe.container,children:[e.jsx(ar,{size:24}),e.jsx(fa,{}),e.jsxs(q,{padding:"spacious",className:oe.contentBox,children:[e.jsx(Mn,{icon:Cs,iconColor:"success.fg",children:"Mona's playground successfully initialised..."}),e.jsxs(Mn,{icon:Es,iconColor:"accent.fg",children:["Visit ",e.jsx(A,{className:oe.warningText,children:"src/Playground.js"})," ","and start building your own layouts using Primer."]}),e.jsx("div",{className:oe.monaWrapper,children:e.jsx("img",{src:ta,alt:"mona",width:48,height:48})})]}),e.jsx(xa,{})]})}function Mn({icon:t,iconColor:n,children:s}){return e.jsxs(q,{direction:"horizontal",className:oe.codeLine,children:[e.jsx(q,{className:oe.iconWrapper,children:e.jsx(t,{size:16})}),e.jsx(A,{as:"p",className:oe.codeText,children:s})]})}function xa(){return e.jsxs(q,{gap:"condensed",children:[e.jsxs(q,{direction:"horizontal",className:oe.footerHeader,children:[e.jsx(Ft,{size:18}),e.jsx(A,{className:oe.tipsText,children:"Tips"})]}),e.jsxs(A,{children:["Before you get started check out our"," ",e.jsx(Cn,{href:"https://primer.style/react",target:"_blank",children:"Primer React Documentation"})," ","and"," ",e.jsx(Cn,{href:"https://ui.githubapp.com/storybook/?path=/docs/templates-readme--docs&globals=viewport:narrow",target:"_blank",children:"Primer Templates (staff only)"})]})]})}const va="_container_m20cu_1",ya="_buttonWrapper_m20cu_7",ja="_label_m20cu_12",It={container:va,buttonWrapper:ya,label:ja};function Ir(){const{setDayScheme:t,setNightScheme:n,colorScheme:s}=hs(),o=i=>{t(i),n(i)},r=[{name:"Light",value:"light",icon:Ln},{name:"Light colorblind",value:"light_colorblind",icon:Ln},{name:"Dark",value:"dark",icon:Ye},{name:"Dark colorblind",value:"dark_colorblind",icon:Ye},{name:"Dark high contrast",value:"dark_high_contrast",icon:Ye},{name:"Dark Dimmed",value:"dark_dimmed",icon:Ye}],a=r.find(i=>i.value===s);return e.jsx(q,{padding:"normal",className:It.container,children:e.jsx(q,{className:It.buttonWrapper,children:e.jsxs(Ce,{children:[e.jsxs(Ce.Button,{size:"small",children:[e.jsx(a.icon,{}),e.jsxs(q,{className:It.label,children:[" ",a.name]})]}),e.jsx(Ce.Overlay,{align:"right",children:e.jsx(be,{showDividers:!0,children:e.jsx(be.Group,{selectionVariant:"single",children:r.map(i=>e.jsx(be.Item,{href:"#",selected:i.value===s,onSelect:()=>o(i.value),children:i.name},i.value))})})})]})})})}function wa(){return e.jsxs(e.Fragment,{children:[e.jsx(ba,{}),e.jsx(Ir,{})]})}const tn=Object.freeze(Object.defineProperty({__proto__:null,default:wa},Symbol.toStringTag,{value:"Module"}));var Nt={exports:{}},Lt,Bn;function _a(){if(Bn)return Lt;Bn=1;var t="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";return Lt=t,Lt}var Tt,Hn;function Sa(){if(Hn)return Tt;Hn=1;var t=_a();function n(){}function s(){}return s.resetWarningCache=n,Tt=function(){function o(i,l,d,u,c,h){if(h!==t){var m=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw m.name="Invariant Violation",m}}o.isRequired=o;function r(){return o}var a={array:o,bigint:o,bool:o,func:o,number:o,object:o,string:o,symbol:o,any:o,arrayOf:r,element:o,elementType:o,instanceOf:r,node:o,objectOf:r,oneOf:r,oneOfType:r,shape:r,exact:r,checkPropTypes:s,resetWarningCache:n};return a.PropTypes=a,a},Tt}var Un;function ka(){return Un||(Un=1,Nt.exports=Sa()()),Nt.exports}var Ca=ka();const ne=ys(Ca),Ea="_header_1282e_1",Ia="_headerContent_1282e_8",Na="_titleWrapper_1282e_17",La="_separator_1282e_21",Ta="_subtitle_1282e_25",$e={header:Ea,headerContent:Ia,titleWrapper:Na,separator:La,subtitle:Ta},Pa=[{icon:Fe,label:"Code",current:!0},{icon:Pe,label:"Issues",counter:30},{icon:Ve,label:"Pull Requests",counter:3},{icon:Vt,label:"Discussions"},{icon:ht,label:"Actions"},{icon:qe,label:"Projects",counter:7},{icon:Ae,label:"Security",counter:12},{icon:Te,label:"Insights"}];function Nr({items:t=Pa,title:n,subtitle:s}){return e.jsxs(q,{as:"header",className:$e.header,children:[e.jsxs("div",{className:$e.headerContent,children:[e.jsx(ms,{icon:Is,"aria-label":"Open global navigation menu",unsafeDisableTooltip:!0}),e.jsx(ar,{size:32}),e.jsxs(q,{direction:"horizontal",gap:"condensed",className:$e.titleWrapper,children:[e.jsx("span",{children:n||"title"}),s&&e.jsxs(e.Fragment,{children:[e.jsx(A,{className:$e.separator,children:"/"}),e.jsx(A,{className:$e.subtitle,children:s||"subtitle"})]})]})]}),e.jsx(En,{"aria-label":"Repository",children:t.map(o=>e.jsx(En.Item,{icon:o.icon,"aria-current":o.current?"page":void 0,counter:o.counter,href:o.url,children:o.label},o.label))})]})}Nr.propTypes={items:ne.arrayOf(ne.shape({icon:ne.elementType,label:ne.string.isRequired,current:ne.bool,counter:ne.number,url:ne.string})),title:ne.string,subtitle:ne.string};const Aa=[{icon:Pe,label:"Open issues",url:"#"},{icon:Ft,label:"Your issues",url:"#"},{icon:qt,label:"Assigned to you",url:"#",current:!0},{icon:ir,label:"Mentioning you",url:"#"}];function Ra({items:t=Aa}){return e.jsx(Et,{"aria-label":"Navigation",children:t.map(n=>e.jsxs(Et.Item,{href:n.url,"aria-current":n.current?"page":void 0,children:[n.icon&&e.jsx(Et.LeadingVisual,{children:e.jsx(n.icon,{})}),n.label]},n.label))})}const $a="_wrapper_74lhx_1",Oa="_navigation_74lhx_7",Da="_main_74lhx_13",za="_container_74lhx_22",Xe={wrapper:$a,navigation:Oa,main:Da,container:za};function he({children:t,title:n,subtitle:s,topnav:o,sidenav:r}){return e.jsxs(q,{className:Xe.container,children:[e.jsx(Nr,{title:n,subtitle:s,items:o}),e.jsxs("div",{className:Xe.wrapper,children:[r&&e.jsx("aside",{className:Xe.navigation,children:e.jsx(Ra,{items:r})}),e.jsx("main",{className:Xe.main,children:t})]})]})}const Ma=[{icon:Wt,label:"Home",url:"/"},{icon:mt,label:"Forms",url:"/Forms",current:!0}];function Ba(){const[,,t]=j("checkout");return e.jsxs(he,{title:"Storyboard",subtitle:"Forms",topnav:Ma,children:[e.jsx(A,{as:"h1",fontSize:"larger",children:"Form Components Demo"}),e.jsx(A,{as:"p",color:"fg.muted",children:"Type in the fields below, then click Submit to persist values in the URL hash. Refresh the page or share the URL to restore state."}),e.jsx(Er,{data:"checkout",children:e.jsxs(q,{direction:"vertical",gap:"normal",padding:"normal",children:[e.jsxs(B,{children:[e.jsx(B.Label,{children:"Email"}),e.jsx(Me,{name:"email",placeholder:"you@example.com"})]}),e.jsxs(B,{children:[e.jsx(B.Label,{children:"Full Name"}),e.jsx(Me,{name:"name",placeholder:"Jane Doe"})]}),e.jsxs(B,{children:[e.jsx(B.Label,{children:"Shipping Address"}),e.jsx(Cr,{name:"address",placeholder:"123 Main St..."})]}),e.jsxs(B,{children:[e.jsx(B.Label,{children:"Country"}),e.jsxs(fe,{name:"country",children:[e.jsx(fe.Option,{value:"",children:"Select a country"}),e.jsx(fe.Option,{value:"us",children:"United States"}),e.jsx(fe.Option,{value:"ca",children:"Canada"}),e.jsx(fe.Option,{value:"uk",children:"United Kingdom"}),e.jsx(fe.Option,{value:"de",children:"Germany"})]})]}),e.jsxs(B,{children:[e.jsx(ua,{name:"newsletter"}),e.jsx(B.Label,{children:"Subscribe to newsletter"})]}),e.jsxs(q,{direction:"horizontal",gap:"condensed",children:[e.jsx(se,{type:"submit",variant:"primary",children:"Submit"}),e.jsx(se,{type:"button",variant:"danger",onClick:()=>t(),children:"Reset"})]})]})})]})}const nn=Object.freeze(Object.defineProperty({__proto__:null,default:Ba},Symbol.toStringTag,{value:"Module"})),Ha=[{icon:Fe,label:"Code",url:"/"},{icon:Pe,label:"Issues",counter:10,url:"#issues",current:!0},{icon:Ve,label:"Pull Requests",counter:3,url:"/overview"},{icon:Vt,label:"Discussions"},{icon:ht,label:"Actions"},{icon:qe,label:"Projects",counter:7},{icon:Ae,label:"Security",counter:12},{icon:Te,label:"Insights"}],Ua=[{icon:Pe,label:"Open issues",url:""},{icon:Ft,label:"Your issues",url:""},{icon:qt,label:"Assigned to you",url:"",current:!0},{icon:ir,label:"Mentioning you",url:""}];function Fa(){return e.jsx(he,{title:"Primer",subtitle:"React",topnav:Ha,sidenav:Ua,children:"This is the issues page"})}const rn=Object.freeze(Object.defineProperty({__proto__:null,default:Fa},Symbol.toStringTag,{value:"Module"})),Va="_title_1bvkv_1",qa="_card_1bvkv_4",Wa="_cardText_1bvkv_12",Pt={title:Va,card:qa,cardText:Wa},Ja=[{icon:Wt,label:"Overview",url:"/",current:!0},{icon:Pe,label:"Organizations",url:"#issues"},{icon:Ve,label:"People"},{icon:Vt,label:"Policies"},{icon:ht,label:"GitHub Connect"},{icon:qe,label:"Code Security",counter:7},{icon:Ae,label:"Billing & Licensing",counter:12},{icon:Te,label:"Settings"},{icon:Te,label:"Compliance"}];function Ga(){return e.jsxs(he,{title:"Primer",subtitle:"React",topnav:Ja,children:[e.jsx(A,{as:"h1",className:Pt.title,fontSize:"larger",children:"Overview"}),e.jsxs("div",{className:Pt.card,children:[e.jsx(A,{as:"p",className:Pt.cardText,fontSize:"medium",children:"This is a card in the overview"}),e.jsx(se,{children:"Edit"})]})]})}const sn=Object.freeze(Object.defineProperty({__proto__:null,default:Ga},Symbol.toStringTag,{value:"Module"})),Ya="_content_qz2dt_1",Ka="_pageHeader_qz2dt_6",Xa="_pageTitle_qz2dt_13",Za="_filterBar_qz2dt_19",Qa="_filterInput_qz2dt_26",ei="_searchAction_qz2dt_30",ti="_listHeader_qz2dt_34",ni="_repoCount_qz2dt_44",ri="_listControls_qz2dt_49",si="_sortButton_qz2dt_55",oi="_viewToggle_qz2dt_59",ai="_viewButton_qz2dt_66",ii="_viewButtonActive_qz2dt_81",ci="_repoList_qz2dt_86",li="_repoItem_qz2dt_95",di="_repoInfo_qz2dt_107",ui="_repoIcon_qz2dt_114",pi="_repoName_qz2dt_119",hi="_repoDescription_qz2dt_131",mi="_repoMeta_qz2dt_139",gi="_metaItem_qz2dt_148",fi="_language_qz2dt_154",bi="_languageDot_qz2dt_160",N={content:Ya,pageHeader:Ka,pageTitle:Xa,filterBar:Za,filterInput:Qa,searchAction:ei,listHeader:ti,repoCount:ni,listControls:ri,sortButton:si,viewToggle:oi,viewButton:ai,viewButtonActive:ii,repoList:ci,repoItem:li,repoInfo:di,repoIcon:ui,repoName:pi,repoDescription:hi,repoMeta:mi,metaItem:gi,language:fi,languageDot:bi},xi={home:Wt,repo:gt,project:qe,package:ur,people:dr,person:qt,shield:Ae,graph:Te,gear:mt,"git-pull-request":Ve,eye:Ds,lock:Os,code:Fe,"repo-forked":cr,archive:$s,"repo-template":Rs};function Fn(t){return typeof t=="string"?xi[t]||gt:t}function vi(){const t=U("topnav"),n=Array.isArray(t)?t.map(i=>({...i,icon:Fn(i.icon)})):[],s=U("sidenav"),o=Array.isArray(s)?s.map(i=>({...i,icon:Fn(i.icon)})):[],r=U("repositories"),a=Array.isArray(r)?r:[];return e.jsx(he,{title:"dsp-testing",topnav:n,sidenav:o,children:e.jsxs("div",{className:N.content,children:[e.jsxs("header",{className:N.pageHeader,children:[e.jsx("h2",{className:N.pageTitle,children:"All"}),e.jsx(se,{variant:"primary",children:"New repository"})]}),e.jsxs("div",{className:N.filterBar,children:[e.jsx(et,{leadingVisual:Ns,placeholder:"Filter",value:"copilot",className:N.filterInput,trailingAction:e.jsx(et.Action,{icon:Ls,"aria-label":"Clear filter"})}),e.jsx(et,{leadingVisual:Ts,placeholder:"","aria-label":"Search repositories",className:N.searchAction})]}),e.jsxs("div",{className:N.listHeader,children:[e.jsx("span",{className:N.repoCount,children:e.jsxs("strong",{children:[a.length," repositories"]})}),e.jsxs("div",{className:N.listControls,children:[e.jsxs(Ce,{children:[e.jsx(Ce.Button,{size:"small",className:N.sortButton,children:"Last pushed"}),e.jsx(Ce.Overlay,{children:e.jsxs(be,{children:[e.jsx(be.Item,{children:"Last pushed"}),e.jsx(be.Item,{children:"Name"}),e.jsx(be.Item,{children:"Stars"})]})})]}),e.jsxs("div",{className:N.viewToggle,children:[e.jsx("button",{className:`${N.viewButton} ${N.viewButtonActive}`,"aria-label":"List view",children:e.jsx(Ps,{size:16})}),e.jsx("button",{className:N.viewButton,"aria-label":"Grid view",children:e.jsx(As,{size:16})})]})]})]}),e.jsx("ul",{className:N.repoList,children:a.map(i=>e.jsxs("li",{className:N.repoItem,children:[e.jsxs("div",{className:N.repoInfo,children:[e.jsx(gt,{size:16,className:N.repoIcon}),e.jsx("a",{href:i.url,className:N.repoName,children:i.name}),i.description&&e.jsx("span",{className:N.repoDescription,children:i.description})]}),e.jsxs("div",{className:N.repoMeta,children:[i.language&&e.jsxs("span",{className:N.language,children:[e.jsx("span",{className:N.languageDot}),i.language]}),e.jsx("span",{className:N.metaItem,children:e.jsx(mt,{size:16})}),e.jsxs("span",{className:N.metaItem,children:[e.jsx(cr,{size:16})," ",i.forks]}),e.jsxs("span",{className:N.metaItem,children:[e.jsx(lr,{size:16})," ",i.stars]})]})]},i.name))})]})})}const on=Object.freeze(Object.defineProperty({__proto__:null,default:vi},Symbol.toStringTag,{value:"Module"})),yi="_pageWrapper_1x2wf_1",ji="_breadcrumb_1x2wf_7",wi="_breadcrumbLink_1x2wf_15",_i="_breadcrumbSeparator_1x2wf_27",Si="_breadcrumbCurrent_1x2wf_31",ki="_pageTitle_1x2wf_36",Ci="_issueNumber_1x2wf_42",Ei="_stateMeta_1x2wf_48",Ii="_metaText_1x2wf_56",Ni="_contentLayout_1x2wf_66",Li="_mainContent_1x2wf_73",Ti="_packageTable_1x2wf_78",Pi="_packageColumn_1x2wf_88",Ai="_packageLabel_1x2wf_94",Ri="_packageValue_1x2wf_99",$i="_packageCode_1x2wf_107",Oi="_copyIcon_1x2wf_112",Di="_advisoryBody_1x2wf_118",zi="_timeline_1x2wf_165",Mi="_timelineItem_1x2wf_173",Bi="_timelineBadge_1x2wf_179",Hi="_openedIcon_1x2wf_185",Ui="_closedIcon_1x2wf_189",Fi="_timelineText_1x2wf_193",Vi="_botLabel_1x2wf_205",qi="_sidebar_1x2wf_210",Wi="_sidebarSection_1x2wf_216",Ji="_sidebarHeading_1x2wf_228",Gi="_severityScore_1x2wf_234",Yi="_criticalLabel_1x2wf_240",Ki="_scoreText_1x2wf_244",Xi="_metricsHeading_1x2wf_250",Zi="_metricsTable_1x2wf_257",Qi="_metricLabel_1x2wf_274",ec="_metricValue_1x2wf_278",tc="_learnMore_1x2wf_284",nc="_cvssVector_1x2wf_294",rc="_epssScore_1x2wf_301",sc="_tagList_1x2wf_308",oc="_tag_1x2wf_308",ac="_weaknessList_1x2wf_319",ic="_weaknessItem_1x2wf_328",cc="_sidebarValue_1x2wf_334",lc="_sidebarLink_1x2wf_340",dc="_contributeText_1x2wf_353",uc="_contributeLink_1x2wf_358",f={pageWrapper:yi,breadcrumb:ji,breadcrumbLink:wi,breadcrumbSeparator:_i,breadcrumbCurrent:Si,pageTitle:ki,issueNumber:Ci,stateMeta:Ei,metaText:Ii,contentLayout:Ni,mainContent:Li,packageTable:Ti,packageColumn:Pi,packageLabel:Ai,packageValue:Ri,packageCode:$i,copyIcon:Oi,advisoryBody:Di,timeline:zi,timelineItem:Mi,timelineBadge:Bi,openedIcon:Hi,closedIcon:Ui,timelineText:Fi,botLabel:Vi,sidebar:qi,sidebarSection:Wi,sidebarHeading:Ji,severityScore:Gi,criticalLabel:Yi,scoreText:Ki,metricsHeading:Xi,metricsTable:Zi,metricLabel:Qi,metricValue:ec,learnMore:tc,cvssVector:nc,epssScore:rc,tagList:sc,tag:oc,weaknessList:ac,weaknessItem:ic,sidebarValue:cc,sidebarLink:lc,contributeText:dc,contributeLink:uc},pc={code:Fe,"issue-opened":Pe,"git-pull-request":Ve,people:dr,play:ht,project:qe,star:lr,book:zs,shield:Ae,graph:Te,gear:mt};function hc(){const t=U("topnav"),n=Array.isArray(t)?t.map(c=>({...c,icon:pc[c.icon]||Fe})):[],s=U("advisory")||{},o=s.package||{},r=s.severity||{},a=Array.isArray(r.cvssMetrics)?r.cvssMetrics:[],i=Array.isArray(s.tags)?s.tags:[],l=Array.isArray(s.weaknesses)?s.weaknesses:[],d=Array.isArray(s.timeline)?s.timeline:[],u=s.epss||{};return e.jsx(he,{title:"octodemo",subtitle:"test-se-fs-gitogether-repo",topnav:n,children:e.jsxs("div",{className:f.pageWrapper,children:[e.jsxs("nav",{className:f.breadcrumb,children:[e.jsxs("a",{href:"#",className:f.breadcrumbLink,children:[e.jsx(Ms,{size:16}),e.jsx("span",{children:s.breadcrumb})]}),e.jsx("span",{className:f.breadcrumbSeparator,children:"/"}),e.jsxs("span",{className:f.breadcrumbCurrent,children:["#",s.id]})]}),e.jsxs("h1",{className:f.pageTitle,children:[s.title," ",e.jsxs("span",{className:f.issueNumber,children:["#",s.id]})]}),e.jsxs("div",{className:f.stateMeta,children:[e.jsxs(gs,{status:"issueClosed",variant:"small",children:[e.jsx(Tn,{size:16})," Fixed"]}),e.jsxs("span",{className:f.metaText,children:["Opened ",s.openedAgo," on ",e.jsx("strong",{children:o.name})," (",o.ecosystem,") · · · Fixed ",s.fixedAgo]})]}),e.jsxs("div",{className:f.contentLayout,children:[e.jsxs("div",{className:f.mainContent,children:[e.jsxs("div",{className:f.packageTable,children:[e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Package"}),e.jsxs("span",{className:f.packageValue,children:[e.jsx(ur,{size:16})," ",o.name," (",o.ecosystem,")"]})]}),e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Affected versions"}),e.jsx("code",{className:f.packageCode,children:o.affectedVersions})]}),e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Patched version"}),e.jsxs("span",{className:f.packageValue,children:[e.jsx("strong",{children:o.patchedVersion})," ",e.jsx(Bs,{size:16,className:f.copyIcon})]})]})]}),e.jsxs("article",{className:f.advisoryBody,children:[e.jsx("h2",{children:"Summary"}),e.jsx("p",{children:"Log4j versions prior to 2.16.0 are subject to a remote code execution vulnerability via the ldap JNDI parser."}),e.jsxs("p",{children:["As per ",e.jsx("a",{href:"#",children:"Apache's Log4j security guide"}),": Apache Log4j2 <=2.14.1 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints. An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers when message lookup substitution is enabled. From log4j 2.16.0, this behavior has been disabled by default."]}),e.jsxs("p",{children:["Log4j version 2.15.0 contained an earlier fix for the vulnerability, but that patch did not disable attacker-controlled JNDI lookups in all situations. For more information, see the ",e.jsx("code",{children:"Updated advice for version 2.16.0"})," section of this advisory."]}),e.jsx("h2",{children:"Impact"}),e.jsx("p",{children:"Logging untrusted or user controlled data with a vulnerable version of Log4J may result in Remote Code Execution (RCE) against your application. This includes untrusted data included in logged errors such as exception traces, authentication failures, and other unexpected vectors of user controlled input."}),e.jsx("h2",{children:"Affected versions"}),e.jsx("p",{children:"Any Log4J version prior to v2.15.0 is affected to this specific issue."}),e.jsx("p",{children:"The v1 branch of Log4J which is considered End Of Life (EOL) is vulnerable to other RCE vectors so the recommendation is to still update to 2.16.0 where possible."}),e.jsx("h2",{children:"Security releases"}),e.jsx("p",{children:"Additional backports of this fix have been made available in versions 2.3.1, 2.12.2, and 2.12.3"}),e.jsx("h2",{children:"Affected packages"}),e.jsxs("p",{children:["Only the ",e.jsx("code",{children:"org.apache.logging.log4j:log4j-core"})," package is directly affected by this vulnerability. The ",e.jsx("code",{children:"org.apache.logging.log4j:log4j-api"})," should be kept at the same version as the ",e.jsx("code",{children:"org.apache.logging.log4j-core"})," package to ensure compatability if in use."]}),e.jsx("h2",{children:"Remediation Advice"}),e.jsx("h3",{children:"Updated advice for version 2.16.0"}),e.jsxs("p",{children:["The Apache Logging Services team provided updated mitigation advice upon the release of version 2.16.0, which ",e.jsx("a",{href:"#",children:"disables JNDI by default and completely removes support for message lookups"}),"."]}),e.jsxs("p",{children:["Even in version 2.15.0, lookups used in layouts to provide specific pieces of context information will still recursively resolve, possibly triggering JNDI lookups. This problem is being tracked as ",e.jsx("a",{href:"#",children:"CVE-2021-45046"}),". More information is available on the ",e.jsx("a",{href:"#",children:"GitHub Security Advisory for CVE-2021-45046"}),"."]}),e.jsxs("p",{children:["Users who want to avoid attacker-controlled JNDI lookups but cannot upgrade to 2.16.0 must ",e.jsx("a",{href:"#",children:"ensure that no such lookups resolve to attacker-provided data and ensure that the JndiLookup class is not loaded"}),"."]}),e.jsx("p",{children:"Please note that Log4J v1 is End Of Life (EOL) and will not receive patches for this issue. Log4J v1 is also vulnerable to other RCE vectors and we recommend you migrate to Log4J 2.16.0 where possible."})]}),e.jsx("div",{className:f.timeline,children:d.map((c,h)=>e.jsxs("div",{className:f.timelineItem,children:[e.jsx("div",{className:f.timelineBadge,children:c.action.includes("closed")?e.jsx(Tn,{size:16,className:f.closedIcon}):e.jsx(Ae,{size:16,className:f.openedIcon})}),e.jsx(fs,{src:c.actorAvatar,size:20,alt:c.actor}),e.jsxs("span",{className:f.timelineText,children:[e.jsx("strong",{children:c.actor}),c.isBot&&e.jsx(tt,{size:"small",className:f.botLabel,children:"bot"})," ",c.action," ",c.timeAgo]})]},h))})]}),e.jsxs("aside",{className:f.sidebar,children:[e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Severity"}),e.jsxs("div",{className:f.severityScore,children:[e.jsx(tt,{variant:"danger",className:f.criticalLabel,children:r.level}),e.jsx("span",{className:f.scoreText,children:r.score})]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h4",{className:f.metricsHeading,children:"CVSS v3 base metrics"}),e.jsx("table",{className:f.metricsTable,children:e.jsx("tbody",{children:a.map(c=>e.jsxs("tr",{children:[e.jsx("td",{className:f.metricLabel,children:c.label}),e.jsx("td",{className:f.metricValue,children:c.value})]},c.label))})}),e.jsx("a",{href:"#",className:f.learnMore,children:"Learn more about base metrics"}),e.jsx("p",{className:f.cvssVector,children:r.cvssVector})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"EPSS score"}),e.jsxs("p",{className:f.epssScore,children:[u.score," (",u.percentile,")"]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Tags"}),e.jsx("div",{className:f.tagList,children:i.map(c=>e.jsx(tt,{className:f.tag,children:c},c))})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Weaknesses"}),e.jsx("ul",{className:f.weaknessList,children:l.map(c=>e.jsxs("li",{className:f.weaknessItem,children:["▸ ",c]},c))})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"CVE ID"}),e.jsx("p",{className:f.sidebarValue,children:s.cveId})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"GHSA ID"}),e.jsx("p",{className:f.sidebarValue,children:s.ghsaId})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsxs("a",{href:"#",className:f.sidebarLink,children:[e.jsx(Hs,{size:16})," See advisory in GitHub Advisory Database"]}),e.jsxs("a",{href:"#",className:f.sidebarLink,children:[e.jsx(gt,{size:16})," See all of your affected repositories"]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("p",{className:f.contributeText,children:"See something to contribute?"}),e.jsx("a",{href:"#",className:f.contributeLink,children:"Suggest improvements for this advisory on the GitHub Advisory Database."})]})]})]})]})})}const an=Object.freeze(Object.defineProperty({__proto__:null,default:hc},Symbol.toStringTag,{value:"Module"})),At=["Account","Organization","Workspace","Review"];function ce(t){return typeof t=="string"?t:""}function Vn(t){return t===!0||t==="true"}function Ze({name:t,defaultValue:n,onCommit:s,...o}){const r=b.useRef(n);return e.jsx(_e,{name:t,defaultValue:n,onChange:({value:a})=>{r.current=a},onBlur:()=>s(r.current),...o})}function mc(){const t=Ut(),[n,s]=j("signup.step"),o=Math.min(Math.max(parseInt(n,10)||0,0),At.length-1),r=C=>{const z=typeof C=="function"?C(o):C;s(String(z))},[a,i,l]=j("signup.errors.fullName"),[d,u,c]=j("signup.errors.email"),[h,m,x]=j("signup.errors.password"),[_,S,T]=j("signup.errors.orgName"),[k,$,M]=j("signup.errors.orgSize"),[F,H,Z]=j("signup.errors.role"),[G,te,Y]=j("signup.errors.region"),[v,E,L]=j("signup.errors.plan"),[P,V,O]=j("signup.errors.agreeTerms"),w={fullName:a,email:d,password:h,orgName:_,orgSize:k,role:F,region:G,plan:v,agreeTerms:P},K={fullName:i,email:u,password:m,orgName:S,orgSize:$,role:H,region:te,plan:E,agreeTerms:V},W={fullName:l,email:c,password:x,orgName:T,orgSize:M,role:Z,region:Y,plan:L,agreeTerms:O},me=()=>Object.values(W).forEach(C=>C()),mn=C=>{me(),Object.entries(C).forEach(([z,ls])=>K[z]?.(ls))},[gn,Kr]=j("signup.fullName"),[fn,Xr]=j("signup.email"),[bn,Zr]=j("signup.password"),[xn,Qr]=j("signup.organization.name"),[vn,es]=j("signup.organization.size"),[yn,ts]=j("signup.organization.role"),[jn,ns]=j("signup.workspace.region"),[wn,rs]=j("signup.workspace.plan"),[_n,ss]=j("signup.workspace.newsletter"),[Sn,os]=j("signup.workspace.agreeTerms"),I=b.useMemo(()=>({fullName:ce(gn),email:ce(fn),password:ce(bn),orgName:ce(xn),orgSize:ce(vn),role:ce(yn),region:ce(jn),plan:ce(wn)||"starter",newsletter:Vn(_n),agreeTerms:Vn(Sn)}),[gn,fn,bn,xn,vn,yn,jn,wn,_n,Sn]);function kn(C){const z={};return C===0&&(I.fullName.trim()||(z.fullName="Full name is required."),I.email.trim()||(z.email="Email is required."),I.password.trim()||(z.password="Password is required.")),C===1&&(I.orgName.trim()||(z.orgName="Organization name is required."),I.orgSize.trim()||(z.orgSize="Organization size is required."),I.role.trim()||(z.role="Role is required.")),C===2&&(I.region.trim()||(z.region="Region is required."),I.plan.trim()||(z.plan="Plan is required."),I.agreeTerms||(z.agreeTerms="You must accept terms to continue.")),mn(z),Object.keys(z).length===0}function as(){kn(o)&&r(C=>Math.min(C+1,At.length-1))}function is(){mn({}),r(C=>Math.max(C-1,0))}function cs(){if(!kn(2)){r(2);return}t("/Dashboard")}return e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(p,{backgroundColor:"page",minHeight:"100vh",padding:6,align:"center",justify:"center",children:e.jsxs(p,{maxWidth:"560px",width:"100%",direction:"column",gap:6,children:[e.jsxs(p,{direction:"column",gap:2,children:[e.jsx(g,{variant:"featured-1",weight:"bold",children:"Create your cloud account"}),e.jsx(g,{variant:"body-2",color:"neutral-faded",children:"Complete the onboarding flow to configure your account and organization."})]}),e.jsx(In,{activeId:String(o),children:At.map((C,z)=>e.jsx(In.Item,{id:String(z),title:C,completed:z<o,subtitle:`Step ${z+1}`},C))}),e.jsx(pe,{padding:6,children:e.jsxs(p,{direction:"column",gap:5,children:[o===0&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!w.fullName,children:[e.jsx(y.Label,{children:"Full name"}),e.jsx(Ze,{name:"fullName",defaultValue:I.fullName,placeholder:"Jane Doe",onCommit:Kr}),w.fullName&&e.jsx(y.Error,{children:w.fullName})]}),e.jsxs(y,{hasError:!!w.email,children:[e.jsx(y.Label,{children:"Email"}),e.jsx(Ze,{name:"email",defaultValue:I.email,placeholder:"jane@acme.cloud",onCommit:Xr}),w.email&&e.jsx(y.Error,{children:w.email})]}),e.jsxs(y,{hasError:!!w.password,children:[e.jsx(y.Label,{children:"Password"}),e.jsx(Ze,{name:"password",defaultValue:I.password,onCommit:Zr,inputAttributes:{type:"password"}}),w.password&&e.jsx(y.Error,{children:w.password})]})]}),o===1&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!w.orgName,children:[e.jsx(y.Label,{children:"Organization name"}),e.jsx(Ze,{name:"orgName",defaultValue:I.orgName,placeholder:"Acme Cloud",onCommit:Qr}),w.orgName&&e.jsx(y.Error,{children:w.orgName})]}),e.jsxs(y,{hasError:!!w.orgSize,children:[e.jsx(y.Label,{children:"Organization size"}),e.jsxs(Se,{name:"orgSize",value:I.orgSize,placeholder:"Select size",onChange:({value:C})=>es(C),children:[e.jsx("option",{value:"1-10",children:"1–10 employees"}),e.jsx("option",{value:"11-50",children:"11–50 employees"}),e.jsx("option",{value:"51-250",children:"51–250 employees"}),e.jsx("option",{value:"251+",children:"251+ employees"})]}),w.orgSize&&e.jsx(y.Error,{children:w.orgSize})]}),e.jsxs(y,{hasError:!!w.role,children:[e.jsx(y.Label,{children:"Your role"}),e.jsxs(Se,{name:"role",value:I.role,placeholder:"Select role",onChange:({value:C})=>ts(C),children:[e.jsx("option",{value:"founder",children:"Founder"}),e.jsx("option",{value:"engineering-manager",children:"Engineering Manager"}),e.jsx("option",{value:"developer",children:"Developer"}),e.jsx("option",{value:"platform-admin",children:"Platform Admin"})]}),w.role&&e.jsx(y.Error,{children:w.role})]})]}),o===2&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!w.region,children:[e.jsx(y.Label,{children:"Primary region"}),e.jsxs(Se,{name:"region",value:I.region,placeholder:"Select region",onChange:({value:C})=>ns(C),children:[e.jsx("option",{value:"us-east-1",children:"US East"}),e.jsx("option",{value:"us-west-2",children:"US West"}),e.jsx("option",{value:"eu-west-1",children:"EU West"}),e.jsx("option",{value:"ap-southeast-1",children:"AP Southeast"})]}),w.region&&e.jsx(y.Error,{children:w.region})]}),e.jsxs(y,{hasError:!!w.plan,children:[e.jsx(y.Label,{children:"Starting plan"}),e.jsxs(Se,{name:"plan",value:I.plan,onChange:({value:C})=>rs(C),children:[e.jsx("option",{value:"starter",children:"Starter"}),e.jsx("option",{value:"growth",children:"Growth"}),e.jsx("option",{value:"enterprise",children:"Enterprise"})]}),w.plan&&e.jsx(y.Error,{children:w.plan})]}),e.jsx(Rt,{name:"newsletter",checked:I.newsletter,onChange:({checked:C})=>ss(C?"true":"false"),children:"Email me product updates and onboarding tips"}),e.jsxs(y,{hasError:!!w.agreeTerms,children:[e.jsx(Rt,{name:"agreeTerms",checked:I.agreeTerms,onChange:({checked:C})=>os(C?"true":"false"),children:"I agree to the Terms of Service and Privacy Policy"}),w.agreeTerms&&e.jsx(y.Error,{children:w.agreeTerms})]})]}),o===3&&e.jsxs(p,{direction:"column",gap:4,children:[e.jsx(g,{variant:"featured-3",weight:"bold",children:"Review your configuration"}),e.jsxs(p,{direction:"column",gap:3,children:[e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Name"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.fullName})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Email"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.email})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Organization"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.orgName})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Team size"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.orgSize})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Role"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.role})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Region"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.region})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Plan"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.plan})})]}),e.jsxs(p,{direction:"row",align:"center",children:[e.jsx(p.Item,{columns:4,children:e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Newsletter"})}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-2",children:I.newsletter?"Yes":"No"})})]})]})]}),e.jsxs(p,{direction:"row",justify:"end",gap:3,children:[o>0&&e.jsx(ie,{variant:"ghost",onClick:is,children:"Back"}),o<3&&e.jsx(ie,{color:"primary",onClick:as,children:"Continue"}),o===3&&e.jsx(ie,{color:"primary",onClick:cs,children:"Create account"})]})]})})]})})})}const cn=Object.freeze(Object.defineProperty({__proto__:null,default:mc},Symbol.toStringTag,{value:"Module"})),gc=Object.assign({"/src/pages/Dashboard.jsx":()=>D(()=>Promise.resolve().then(()=>en),void 0),"/src/pages/Example.jsx":()=>D(()=>Promise.resolve().then(()=>tn),void 0),"/src/pages/Forms.jsx":()=>D(()=>Promise.resolve().then(()=>nn),void 0),"/src/pages/Issues.jsx":()=>D(()=>Promise.resolve().then(()=>rn),void 0),"/src/pages/Overview.jsx":()=>D(()=>Promise.resolve().then(()=>sn),void 0),"/src/pages/Repositories.jsx":()=>D(()=>Promise.resolve().then(()=>on),void 0),"/src/pages/SecurityAdvisory.jsx":()=>D(()=>Promise.resolve().then(()=>an),void 0),"/src/pages/Signup.jsx":()=>D(()=>Promise.resolve().then(()=>cn),void 0),"/src/pages/_app.jsx":()=>D(()=>Promise.resolve().then(()=>Qt),void 0),"/src/pages/viewfinder.jsx":()=>D(()=>Promise.resolve().then(()=>Rr),void 0)});function fc(){return e.jsx(kr,{scenes:Zt,pageModules:gc,basePath:"/storyboard-source/"})}const Lr=Object.freeze(Object.defineProperty({__proto__:null,default:fc},Symbol.toStringTag,{value:"Module"})),Tr={todo:"Todo",in_progress:"In Progress",done:"Done",cancelled:"Cancelled"},Pr={urgent:"Urgent",high:"High",medium:"Medium",low:"Low"},bc=Object.entries(Tr),xc=Object.entries(Pr);function Ar({prefix:t}){const[n,s]=j(`${t}.title`),[o,r]=j(`${t}.description`),[a,i]=j(`${t}.status`),[l,d]=j(`${t}.priority`),[u,c]=j(`${t}.assignee`),[h,m]=j(`${t}.project`),[x,_]=j(`${t}.estimate`);return e.jsxs(p,{direction:"column",gap:4,children:[e.jsxs(y,{children:[e.jsx(y.Label,{children:"Title"}),e.jsx(_e,{name:"title",value:n??"",onChange:({value:S})=>s(S)})]}),e.jsxs(y,{children:[e.jsx(y.Label,{children:"Description"}),e.jsx(_e,{name:"description",multiline:!0,value:o??"",onChange:({value:S})=>r(S),inputAttributes:{rows:3}})]}),e.jsxs(p,{direction:"row",gap:4,children:[e.jsx(p.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Status"}),e.jsx(Se,{name:"status",value:a??"todo",onChange:({value:S})=>i(S),children:bc.map(([S,T])=>e.jsx("option",{value:S,children:T},S))})]})}),e.jsx(p.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Priority"}),e.jsx(Se,{name:"priority",value:l??"medium",onChange:({value:S})=>d(S),children:xc.map(([S,T])=>e.jsx("option",{value:S,children:T},S))})]})})]}),e.jsxs(p,{direction:"row",gap:4,children:[e.jsx(p.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Assignee"}),e.jsx(_e,{name:"assignee",placeholder:"Username",value:u??"",onChange:({value:S})=>c(S)})]})}),e.jsx(p.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Project"}),e.jsx(_e,{name:"project",placeholder:"Project name",value:h??"",onChange:({value:S})=>m(S)})]})})]}),e.jsxs(y,{children:[e.jsx(y.Label,{children:"Estimate (points)"}),e.jsx(_e,{name:"estimate",placeholder:"e.g. 5",value:x??"",onChange:({value:S})=>_(S)})]})]})}const vc={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},Qe=["title","description","status","priority","assignee","project","estimate"];function yc({issue:t,active:n,onClose:s}){const o={title:ge("issues",t.id,"title"),description:ge("issues",t.id,"description"),status:ge("issues",t.id,"status"),priority:ge("issues",t.id,"priority"),assignee:ge("issues",t.id,"assignee"),project:ge("issues",t.id,"project"),estimate:ge("issues",t.id,"estimate")},r=()=>{Qe.forEach(l=>{ve(`draft.edit.${l}`,t[l]??"")})},a=()=>{const l=new URLSearchParams(window.location.hash.replace(/^#/,""));Qe.forEach(d=>{const[,u]=o[d];u(l.get(`draft.edit.${d}`)??"")}),Qe.forEach(d=>ot(`draft.edit.${d}`)),s({reason:"save"})},i=()=>{Qe.forEach(l=>ot(`draft.edit.${l}`)),s({reason:"cancel"})};return e.jsxs(Ee,{active:n,onClose:i,onOpen:r,size:"600px",padding:6,position:"center",children:[e.jsx(Ee.Title,{children:"Edit Issue"}),e.jsx(Ee.Subtitle,{children:t.identifier}),e.jsxs(p,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(Ar,{prefix:"draft.edit"}),e.jsxs(p,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(ie,{variant:"outline",onClick:i,children:"Cancel"}),e.jsx(ie,{color:"primary",onClick:a,children:"Save"})]})]})]})}function jc(){const[t,n,s]=j("ui.editModal"),o=t==="true",r=_r("issues","id"),a=U("signup.organization.name"),i=U("signup.fullName"),l=U("signup.organization.role");return r?e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(p,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(p,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(p.Item,{columns:2,children:e.jsx(dt,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(p.Item,{grow:!0,children:e.jsxs(p,{direction:"row",gap:8,align:"start",children:[e.jsx(p.Item,{grow:!0,children:e.jsxs(p,{direction:"column",gap:4,maxWidth:"720px",children:[e.jsxs(p,{direction:"row",gap:2,align:"center",justify:"space-between",children:[e.jsxs(p,{direction:"row",gap:2,align:"center",children:[e.jsx(ye,{to:"/issues",style:{textDecoration:"none"},children:e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:a||"Workspace"})}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"›"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:r.identifier})]}),e.jsx(ie,{variant:"outline",size:"small",onClick:()=>n("true"),children:"Edit issue"})]}),e.jsx(yc,{issue:r,active:o,onClose:()=>s()}),e.jsx(g,{variant:"featured-1",weight:"bold",children:r.title}),r.description&&e.jsx(g,{variant:"body-2",color:"neutral-faded",children:r.description}),r.acceptanceCriteria?.length>0&&e.jsxs(p,{direction:"column",gap:2,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Acceptance Criteria"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:r.acceptanceCriteria.map((d,u)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(g,{variant:"body-3",children:d})},u))})]}),r.technicalNotes?.length>0&&e.jsxs(p,{direction:"column",gap:2,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Technical Notes"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:r.technicalNotes.map((d,u)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(g,{variant:"body-3",children:d})},u))})]}),e.jsx(ae,{}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"+ Add sub-issues"}),e.jsx(ae,{}),e.jsxs(p,{direction:"column",gap:3,children:[e.jsx(g,{variant:"body-2",weight:"bold",children:"Activity"}),(r.activity||[]).map((d,u)=>e.jsxs(p,{direction:"row",gap:3,align:"center",children:[e.jsx(Nn,{src:d.avatar,initials:d.user?.[0]?.toUpperCase(),size:6}),e.jsxs(p,{direction:"column",children:[e.jsxs(g,{variant:"body-3",children:[e.jsx(g,{weight:"medium",children:d.user}),d.type==="created"&&" created the issue",d.type==="comment"&&":"]}),d.body&&e.jsx(g,{variant:"body-3",color:"neutral-faded",children:d.body}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:d.time})]})]},u))]})]})}),e.jsx(p.Item,{columns:3,children:e.jsx(pe,{padding:4,children:e.jsxs(p,{direction:"column",gap:4,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:"Properties"}),e.jsx(ae,{}),e.jsxs(p,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Status"}),e.jsx(g,{variant:"body-3",children:Tr[r.status]||r.status})]}),e.jsxs(p,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Priority"}),e.jsx(g,{variant:"body-3",children:Pr[r.priority]||r.priority})]}),e.jsxs(p,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Assignee"}),r.assignee?e.jsxs(p,{direction:"row",gap:2,align:"center",children:[e.jsx(Nn,{src:r.assigneeAvatar,initials:r.assignee?.[0]?.toUpperCase(),size:5}),e.jsx(g,{variant:"body-3",children:r.assignee})]}):e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"Assign"})]}),e.jsxs(p,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Labels"}),e.jsx(p,{direction:"row",gap:1,wrap:!0,children:(r.labels||[]).map(d=>e.jsx(He,{size:"small",color:vc[d]||"neutral",children:d},d))})]}),e.jsxs(p,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Project"}),e.jsx(g,{variant:"body-3",color:r.project?void 0:"neutral-faded",children:r.project||"Add to project"})]}),r.estimate&&e.jsxs(p,{direction:"column",gap:1,children:[e.jsx(g,{variant:"caption-1",color:"neutral-faded",children:"Estimate"}),e.jsxs(g,{variant:"body-3",children:[r.estimate," points"]})]})]})})})]})})]})})}):e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(p,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(p,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(p.Item,{columns:2,children:e.jsx(dt,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(p.Item,{grow:!0,children:e.jsxs(p,{direction:"column",gap:4,align:"center",paddingBlock:16,children:[e.jsx(g,{variant:"featured-2",weight:"bold",children:"Issue not found"}),e.jsx(g,{variant:"body-3",color:"neutral-faded",children:"The issue you're looking for doesn't exist."}),e.jsx(ye,{to:"/issues",children:"← Back to all issues"})]})})]})})})}const wc=Object.freeze(Object.defineProperty({__proto__:null,default:jc},Symbol.toStringTag,{value:"Module"})),_c="_issueRow_1cpdh_1",Sc={issueRow:_c},kc={todo:"○",in_progress:"◐",done:"●",cancelled:"✕"},Cc={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},Ec={title:"",description:"",status:"todo",priority:"medium",assignee:"",project:"",estimate:""},Ot=["title","description","status","priority","assignee","project","estimate"];function qn(t){Ot.forEach(n=>ot(`${t}.${n}`))}function Ic({active:t,onClose:n,issueCount:s}){const[o]=j("draft.create.title"),r=Ut(),a=`FIL-${s+1}`,i=()=>{Ot.forEach(u=>{ve(`draft.create.${u}`,Ec[u])})},l=()=>{if(!(o??"").trim())return;const u=o.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`new-issue-${s+1}`;Ot.forEach(c=>{const h=new URLSearchParams(window.location.hash.replace(/^#/,"")).get(`draft.create.${c}`)??"";ve(`record.issues.${u}.${c}`,h)}),ve(`record.issues.${u}.identifier`,a),qn("draft.create"),n({reason:"save"}),r(`/issues/${u}`)},d=()=>{qn("draft.create"),n({reason:"cancel"})};return e.jsxs(Ee,{active:t,onClose:d,onOpen:i,size:"600px",padding:6,position:"center",children:[e.jsx(Ee.Title,{children:"Create Issue"}),e.jsx(Ee.Subtitle,{children:a}),e.jsxs(p,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(Ar,{prefix:"draft.create"}),e.jsxs(p,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(ie,{variant:"outline",onClick:d,children:"Cancel"}),e.jsx(ie,{color:"primary",onClick:l,children:"Save"})]})]})]})}function Nc(){const[t,n,s]=j("ui.createModal"),o=t==="true",r=Sr("issues"),a=U("signup.organization.name"),i=U("signup.fullName"),l=U("signup.organization.role"),d=r.filter(c=>c.status!=="done"&&c.status!=="cancelled"),u=r.filter(c=>c.status==="done"||c.status==="cancelled");return e.jsx(Be,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(p,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(p,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(p.Item,{columns:2,children:e.jsx(dt,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(p.Item,{grow:!0,children:e.jsxs(p,{direction:"column",gap:4,maxWidth:"900px",children:[e.jsxs(p,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(g,{variant:"featured-2",weight:"bold",children:"Issues"}),e.jsxs(p,{direction:"row",gap:2,align:"center",children:[e.jsxs(He,{color:"neutral",children:[r.length," total"]}),e.jsx(ie,{size:"small",color:"primary",onClick:()=>n("true"),children:"Create issue"})]})]}),e.jsx(Ic,{active:o,onClose:()=>s(),issueCount:r.length}),e.jsxs(p,{direction:"column",gap:0,children:[e.jsx(p,{paddingBlock:2,paddingInline:3,children:e.jsxs(g,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Open · ",d.length]})}),e.jsx(ae,{}),d.map(c=>e.jsx(Wn,{issue:c},c.id))]}),u.length>0&&e.jsxs(p,{direction:"column",gap:0,children:[e.jsx(p,{paddingBlock:2,paddingInline:3,children:e.jsxs(g,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Closed · ",u.length]})}),e.jsx(ae,{}),u.map(c=>e.jsx(Wn,{issue:c},c.id))]})]})})]})})})}function Wn({issue:t}){return e.jsxs(e.Fragment,{children:[e.jsx(ye,{to:`/issues/${t.id}`,className:Sc.issueRow,children:e.jsxs(p,{direction:"row",align:"center",gap:3,padding:3,children:[e.jsx(g,{variant:"body-3",color:"neutral-faded",attributes:{style:{minWidth:20}},children:kc[t.status]||"○"}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",attributes:{style:{minWidth:50}},children:t.identifier}),e.jsx(p.Item,{grow:!0,children:e.jsx(g,{variant:"body-3",children:t.title})}),e.jsx(p,{direction:"row",gap:1,children:(t.labels||[]).map(n=>e.jsx(He,{size:"small",color:Cc[n]||"neutral",children:n},n))}),e.jsx(g,{variant:"caption-1",color:"neutral-faded",attributes:{style:{textTransform:"capitalize"}},children:t.priority})]})}),e.jsx(ae,{})]})}const Lc=Object.freeze(Object.defineProperty({__proto__:null,default:Nc},Symbol.toStringTag,{value:"Module"}));function Tc(){const t=_r("posts","id");return t?e.jsx(he,{title:"Blog",subtitle:t.title,children:e.jsxs("article",{style:{maxWidth:"720px",padding:"2rem"},children:[e.jsxs("header",{children:[e.jsx(A,{as:"h1",sx:{fontSize:4,mb:2},children:t.title}),e.jsxs(A,{as:"p",color:"fg.muted",sx:{mb:3},children:[t.author," · ",t.date]}),t.summary&&e.jsx(tt,{variant:"accent",sx:{mb:3},children:t.summary})]}),e.jsx(A,{as:"div",sx:{mt:3,lineHeight:1.6},children:(t.body||"").split(`

`).map((n,s)=>e.jsx("p",{children:n},s))}),e.jsx("footer",{style:{marginTop:"2rem",borderTop:"1px solid var(--borderColor-muted)",paddingTop:"1rem"},children:e.jsx(ye,{to:"/posts",children:"← Back to all posts"})})]})}):e.jsx(he,{title:"Blog",subtitle:"Post",children:e.jsxs("section",{style:{padding:"2rem"},children:[e.jsx(A,{as:"h1",children:"Post not found"}),e.jsx(A,{as:"p",color:"fg.muted",children:"The post you're looking for doesn't exist."}),e.jsx(ye,{to:"/posts",children:"← Back to all posts"})]})})}const Pc=Object.freeze(Object.defineProperty({__proto__:null,default:Tc},Symbol.toStringTag,{value:"Module"}));function Ac(){const t=Sr("posts");return e.jsx(he,{title:"Blog",subtitle:"All Posts",children:e.jsxs("section",{style:{maxWidth:"720px",padding:"2rem"},children:[e.jsx(A,{as:"h1",sx:{fontSize:4,mb:3},children:"Blog"}),t.map(n=>e.jsxs("article",{style:{marginBottom:"1.5rem",paddingBottom:"1.5rem",borderBottom:"1px solid var(--borderColor-muted)"},children:[e.jsx(ye,{to:`/posts/${n.id}`,style:{textDecoration:"none"},children:e.jsx(A,{as:"h2",sx:{fontSize:2,color:"accent.fg"},children:n.title})}),e.jsxs(A,{as:"p",color:"fg.muted",sx:{fontSize:1,mt:1},children:[n.author," · ",n.date]}),n.summary&&e.jsx(A,{as:"p",sx:{mt:1},children:n.summary})]},n.id))]})})}const Rc=Object.freeze(Object.defineProperty({__proto__:null,default:Ac},Symbol.toStringTag,{value:"Module"})),$c=Object.assign({"/src/pages/Dashboard.jsx":()=>D(()=>Promise.resolve().then(()=>en),void 0),"/src/pages/Example.jsx":()=>D(()=>Promise.resolve().then(()=>tn),void 0),"/src/pages/Forms.jsx":()=>D(()=>Promise.resolve().then(()=>nn),void 0),"/src/pages/Issues.jsx":()=>D(()=>Promise.resolve().then(()=>rn),void 0),"/src/pages/Overview.jsx":()=>D(()=>Promise.resolve().then(()=>sn),void 0),"/src/pages/Repositories.jsx":()=>D(()=>Promise.resolve().then(()=>on),void 0),"/src/pages/SecurityAdvisory.jsx":()=>D(()=>Promise.resolve().then(()=>an),void 0),"/src/pages/Signup.jsx":()=>D(()=>Promise.resolve().then(()=>cn),void 0),"/src/pages/_app.jsx":()=>D(()=>Promise.resolve().then(()=>Qt),void 0),"/src/pages/index.jsx":()=>D(()=>Promise.resolve().then(()=>Lr),void 0)});function Oc(){return e.jsx(kr,{scenes:Zt,pageModules:$c,basePath:"/storyboard-source/"})}const Rr=Object.freeze(Object.defineProperty({__proto__:null,default:Oc},Symbol.toStringTag,{value:"Module"}));var le={route:[/^.*\/src\/pages\/|\.(jsx|tsx|mdx)$/g,""],splat:[/\[\.{3}\w+\]/g,"*"],param:[/\[([^\]]+)\]/g,":$1"],slash:[/^index$|\./g,"/"],optional:[/^-(:?[\w-]+|\*)/,"$1?"]},Dc=t=>Object.keys(t).reduce((n,s)=>{const o=s.replace(...le.route);return{...n,[o]:t[s]}},{}),zc=(t,n)=>Object.keys(t).filter(o=>!o.includes("/_")||/_layout\.(jsx|tsx)$/.test(o)).reduce((o,r)=>{const a=t[r],i={id:r.replace(...le.route),...n(a,r)},l=r.replace(...le.route).replace(...le.splat).replace(...le.param).split("/").filter(Boolean);return l.reduce((d,u,c)=>{const h=u.replace(...le.slash).replace(...le.optional),m=c===0,x=c===l.length-1&&l.length>1,_=!m&&!x,S=u==="_layout",T=/\([\w-]+\)/.test(h),k=/^\w|\//.test(h)?"unshift":"push";if(m&&l.length===1)return o.push({path:h,...i}),d;if(m||_){const $=m?o:d.children,M=$?.find(H=>H.path===h||H.id?.replace("/_layout","").split("/").pop()===h),F=T?i?.component?{id:h,path:"/"}:{id:h}:{path:h};return M?M.children??=[]:$?.[k]({...F,children:[]}),M||$?.[k==="unshift"?0:$.length-1]}return S?Object.assign(d,i):(x&&d?.children?.[k](i?.index?i:{path:h,...i}),d)},{}),o},[]),Mc=t=>Object.keys(t).reduce((n,s)=>{const o=s.replace(...le.route).replace(/\+|\([\w-]+\)\//g,"").replace(/(\/)?index/g,"").replace(/\./g,"/");return{...n,[`/${o}`]:t[s]?.default}},{}),Bc=Object.assign({"/src/pages/_app.jsx":Qt}),Hc=Object.assign({}),Uc=Object.assign({"/src/pages/Dashboard.jsx":en,"/src/pages/Example.jsx":tn,"/src/pages/Forms.jsx":nn,"/src/pages/Issues.jsx":rn,"/src/pages/Overview.jsx":sn,"/src/pages/Repositories.jsx":on,"/src/pages/SecurityAdvisory.jsx":an,"/src/pages/Signup.jsx":cn,"/src/pages/index.jsx":Lr,"/src/pages/issues/[id].jsx":wc,"/src/pages/issues/index.jsx":Lc,"/src/pages/posts/[id].jsx":Pc,"/src/pages/posts/index.jsx":Rc,"/src/pages/viewfinder.jsx":Rr}),$r=Dc(Bc),Fc=Mc(Hc),Vc=zc(Uc,(t,n)=>{const s=/index\.(jsx|tsx|mdx)$/.test(n)&&!n.includes("pages/index")?{index:!0}:{},o=t?.default||b.Fragment;return{...s,Component:()=>t?.Pending?e.jsx(b.Suspense,{fallback:e.jsx(t.Pending,{}),children:e.jsx(o,{})}):e.jsx(o,{}),ErrorBoundary:t?.Catch,loader:t?.Loader,action:t?.Action}}),Le=$r?._app,qc=$r?.["404"],Wc=Le?.default||or,Jc=()=>{const t=Fc[js().state?.modal]||b.Fragment;return e.jsx(t,{})},Dt=()=>e.jsxs(e.Fragment,{children:[e.jsx(Wc,{})," ",e.jsx(Jc,{})]}),Gc=()=>Le?.Pending?e.jsx(b.Suspense,{fallback:e.jsx(Le.Pending,{}),children:e.jsx(Dt,{})}):e.jsx(Dt,{}),Yc={Component:Le?.default?Gc:Dt,ErrorBoundary:Le?.Catch,loader:Le?.Loader},Kc={path:"*",Component:qc?.default||b.Fragment},Xc=[{...Yc,children:[...Vc,Kc]}];const ln="sb-comments-token",dn="sb-comments-user";function Or(){try{return localStorage.getItem(ln)}catch{return null}}function Zc(t){localStorage.setItem(ln,t)}function Qc(){localStorage.removeItem(ln),localStorage.removeItem(dn)}function un(){try{const t=localStorage.getItem(dn);return t?JSON.parse(t):null}catch{return null}}async function el(t){const n=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!n.ok)throw new Error("Invalid token — GitHub returned "+n.status);const s=await n.json(),o={login:s.login,avatarUrl:s.avatar_url};return localStorage.setItem(dn,JSON.stringify(o)),o}function ut(){return Or()!==null}let xe=!1;const zt=new Set;function nt(){return xe}function tl(){return lt()?!xe&&!ut()?(console.warn("[storyboard] Sign in first to use comments"),!1):(xe=!xe,Dr(),xe):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}function Jn(t){xe=t,Dr()}function nl(t){return zt.add(t),()=>zt.delete(t)}function Dr(){for(const t of zt)t(xe)}const Gn=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function Mt(t){if(!t)return{meta:null,text:""};const n=t.match(Gn);if(!n)return{meta:null,text:t.trim()};try{const s=JSON.parse(n[1]),o=t.replace(Gn,"").trim();return{meta:s,text:o}}catch{return{meta:null,text:t.trim()}}}function Bt(t,n){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${n}`}function zr(t,n){const{meta:s,text:o}=Mt(t),r={...s,...n};return Bt(r,o)}const rl="https://api.github.com/graphql";async function ee(t,n={},s={}){const{retries:o=2}=s,r=Or();if(!r)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let i=0;i<=o;i++)try{const l=await fetch(rl,{method:"POST",headers:{Authorization:`bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:n})});if(l.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!l.ok)throw new Error(`GitHub API error: ${l.status} ${l.statusText}`);const d=await l.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(u=>u.message).join(", ")}`);return d.data}catch(l){if(a=l,l.message.includes("401")||l.message.includes("Not authenticated")||l.message.includes("invalid or expired"))throw l;i<o&&await new Promise(d=>setTimeout(d,1e3*(i+1)))}throw a}const sl=`
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
`,ol=`
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
`,al=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,il=`
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
`,cl=`
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
`,Mr=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,ll=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,dl=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,ul=`
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
`;async function Br(t){const n=Xt(),o=`"${`Comments: ${t}`}" in:title repo:${n.repo.owner}/${n.repo.name}`,a=(await ee(sl,{query:o})).search?.nodes?.[0];if(!a)return null;const i=(a.comments?.nodes??[]).map(l=>{const{meta:d,text:u}=Mt(l.body);return{...l,meta:d,text:u,replies:(l.replies?.nodes??[]).map(c=>{const{meta:h,text:m}=Mt(c.body);return{...c,meta:h,text:m}})}});return{...a,comments:i}}async function Hr(){const t=Xt(),n=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),s=await ee(ol,{owner:t.repo.owner,name:t.repo.name,slug:n}),o=s.repository?.id;let r=s.repository?.discussionCategory?.id;if(r||(r=s.repository?.discussionCategories?.nodes?.find(i=>i.name===t.discussions.category)?.id),!o||!r)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:o,categoryId:r}}async function pl(t,n,s,o){let r=await Br(t);if(!r){const{repositoryId:l,categoryId:d}=await Hr(),u=`Comments: ${t}`,c=Bt({route:t,createdAt:new Date().toISOString()},"");r=(await ee(al,{repositoryId:l,categoryId:d,title:u,body:c})).createDiscussion.discussion}const a=Bt({x:Math.round(n*10)/10,y:Math.round(s*10)/10},o);return(await ee(il,{discussionId:r.id,body:a})).addDiscussionComment.comment}async function hl(t,n,s){return(await ee(cl,{discussionId:t,replyToId:n,body:s})).addDiscussionComment.comment}async function ml(t,n){const s=zr(n,{resolved:!0});return(await ee(Mr,{commentId:t,body:s})).updateDiscussionComment.comment}async function gl(t,n,s,o){const r=zr(n,{x:Math.round(s*10)/10,y:Math.round(o*10)/10});return(await ee(Mr,{commentId:t,body:r})).updateDiscussionComment.comment}async function fl(t,n){await ee(ll,{subjectId:t,content:n})}async function bl(t,n){await ee(dl,{subjectId:t,content:n})}async function Bl(){const t=Xt(),{categoryId:n}=await Hr();return(await ee(ul,{owner:t.repo.owner,name:t.repo.name,categoryId:n})).repository?.discussions?.nodes??[]}const Yn="sb-composer-style";function xl(){if(document.getElementById(Yn))return;const t=document.createElement("style");t.id=Yn,t.textContent=`
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
  `,document.head.appendChild(t)}function vl(t,n,s,o,r={}){xl();const a=un(),i=document.createElement("div");i.className="sb-composer",i.style.left=`${n}%`,i.style.top=`${s}%`,i.style.transform="translate(12px, -50%)",i.innerHTML=`
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
  `,t.appendChild(i);const l=i.querySelector(".sb-composer-textarea"),d=i.querySelector('[data-action="submit"]');function u(){i.remove()}function c(){u(),r.onCancel?.()}async function h(){const m=l.value.trim();if(!m){l.focus();return}d.disabled=!0,d.textContent="Posting…";try{const x=await pl(o,n,s,m);u(),r.onSubmit?.(x)}catch(x){d.disabled=!1,d.textContent="Comment",console.error("[storyboard] Failed to post comment:",x);let _=i.querySelector(".sb-composer-error");_||(_=document.createElement("div"),_.className="sb-composer-error",_.style.cssText="padding: 4px 12px 8px; font-size: 12px; color: #f85149;",i.querySelector(".sb-composer-footer").before(_)),_.textContent=x.message}}return i.querySelector('[data-action="cancel"]').addEventListener("click",c),d.addEventListener("click",h),l.addEventListener("keydown",m=>{m.key==="Enter"&&(m.metaKey||m.ctrlKey)&&(m.preventDefault(),h()),m.key==="Escape"&&(m.preventDefault(),m.stopPropagation(),c())}),i.addEventListener("click",m=>m.stopPropagation()),requestAnimationFrame(()=>l.focus()),{el:i,destroy:u}}const Kn="sb-auth-modal",Xn="sb-auth-modal-style";function yl(){if(document.getElementById(Xn))return;const t=document.createElement("style");t.id=Xn,t.textContent=`
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
  `,document.head.appendChild(t)}function jl(){return yl(),new Promise(t=>{const n=document.getElementById(Kn);n&&n.remove();const s=document.createElement("div");s.id=Kn,s.className="sb-auth-backdrop";const o=document.createElement("div");o.className="sb-auth-modal",o.innerHTML=`
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
    `,s.appendChild(o),document.body.appendChild(s);const r=o.querySelector("#sb-auth-token-input"),a=o.querySelector('[data-action="submit"]'),i=o.querySelector('[data-slot="feedback"]');function l(c){s.remove(),t(c)}s.addEventListener("click",c=>{c.target===s&&l(null)}),o.querySelectorAll('[data-action="close"]').forEach(c=>{c.addEventListener("click",()=>l(null))});function d(c){c.key==="Escape"&&(c.preventDefault(),c.stopPropagation(),window.removeEventListener("keydown",d,!0),l(null))}window.addEventListener("keydown",d,!0);async function u(){const c=r.value.trim();if(!c){r.focus();return}a.disabled=!0,a.textContent="Validating…",i.innerHTML="";try{const h=await el(c);Zc(c),i.innerHTML=`
          <div class="sb-auth-success">
            <img class="sb-auth-avatar" src="${h.avatarUrl}" alt="${h.login}" />
            <div class="sb-auth-user-info">
              ${h.login}
              <span>✓ Signed in</span>
            </div>
          </div>
        `,a.textContent="Done",a.disabled=!1,a.onclick=()=>{window.removeEventListener("keydown",d,!0),l(h)}}catch(h){i.innerHTML=`<div class="sb-auth-error">${h.message}</div>`,a.disabled=!1,a.textContent="Sign in"}}a.addEventListener("click",u),r.addEventListener("keydown",c=>{c.key==="Enter"&&u()}),requestAnimationFrame(()=>r.focus())})}function Hl(){const t=un();Qc(),console.log(`[storyboard] Signed out${t?` (was ${t.login})`:""}`)}const Zn="sb-comment-window-style",Ur={THUMBS_UP:"👍",THUMBS_DOWN:"👎",LAUGH:"😄",HOORAY:"🎉",CONFUSED:"😕",HEART:"❤️",ROCKET:"🚀",EYES:"👀"};function wl(){if(document.getElementById(Zn))return;const t=document.createElement("style");t.id=Zn,t.textContent=`
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
  `,document.head.appendChild(t)}function Qn(t){return new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}function er(t){const n=document.createElement("div");n.className=t.replies?"sb-comment-window-reactions":"sb-reply-reactions";function s(){n.innerHTML="";const o=t.reactionGroups??[];for(const a of o){if(a.users?.totalCount===0&&!a.viewerHasReacted)continue;const i=a.users?.totalCount??0;if(i===0)continue;const l=document.createElement("button");l.className="sb-reaction-pill",l.dataset.active=String(!!a.viewerHasReacted),l.innerHTML=`<span>${Ur[a.content]??a.content}</span><span>${i}</span>`,l.addEventListener("click",d=>{d.stopPropagation(),Fr(t,a.content,a,s)}),n.appendChild(l)}const r=document.createElement("button");r.className="sb-reaction-add-btn",r.textContent="😀 +",r.addEventListener("click",a=>{a.stopPropagation(),_l(r,t,s)}),n.appendChild(r)}return s(),n}function _l(t,n,s){const o=t.querySelector(".sb-reaction-picker");if(o){o.remove();return}const r=document.createElement("div");r.className="sb-reaction-picker";for(const[i,l]of Object.entries(Ur)){const d=n.reactionGroups??[],u=d.some(h=>h.content===i&&h.viewerHasReacted),c=document.createElement("button");c.className="sb-reaction-picker-btn",c.dataset.active=String(u),c.textContent=l,c.addEventListener("click",h=>{h.stopPropagation();const m=d.find(x=>x.content===i);Fr(n,i,m,s),r.remove()}),r.appendChild(c)}t.appendChild(r);function a(i){!r.contains(i.target)&&i.target!==t&&(r.remove(),document.removeEventListener("click",a,!0))}setTimeout(()=>document.addEventListener("click",a,!0),0)}async function Fr(t,n,s,o){const r=s?.viewerHasReacted??!1;t.reactionGroups||(t.reactionGroups=[]),r&&s?(s.users={totalCount:Math.max(0,(s.users?.totalCount??1)-1)},s.viewerHasReacted=!1,s.users.totalCount===0&&(t.reactionGroups=t.reactionGroups.filter(a=>a.content!==n))):s?(s.users={totalCount:(s.users?.totalCount??0)+1},s.viewerHasReacted=!0):t.reactionGroups.push({content:n,users:{totalCount:1},viewerHasReacted:!0}),o();try{r?await bl(t.id,n):await fl(t.id,n)}catch(a){console.error("[storyboard] Reaction toggle failed:",a)}}let re=null;function Vr(t,n,s,o={}){wl(),re&&(re.destroy(),re=null);const r=un(),a=document.createElement("div");a.className="sb-comment-window",a.style.left=`${n.meta?.x??0}%`,a.style.top=`${n.meta?.y??0}%`,a.style.transform="translate(12px, -50%)";const i=document.createElement("div");i.className="sb-comment-window-header";const l=document.createElement("div");if(l.className="sb-comment-window-header-left",n.author?.avatarUrl){const v=document.createElement("img");v.className="sb-comment-window-avatar",v.src=n.author.avatarUrl,v.alt=n.author.login??"",l.appendChild(v)}const d=document.createElement("span");if(d.className="sb-comment-window-author",d.textContent=n.author?.login??"unknown",l.appendChild(d),n.createdAt){const v=document.createElement("span");v.className="sb-comment-window-time",v.textContent=Qn(n.createdAt),l.appendChild(v)}i.appendChild(l);const u=document.createElement("div");u.className="sb-comment-window-header-actions";const c=document.createElement("button");c.className="sb-comment-window-action-btn",c.setAttribute("aria-label",n.meta?.resolved?"Resolved":"Resolve"),c.title=n.meta?.resolved?"Resolved":"Resolve",c.textContent=n.meta?.resolved?"Resolved":"Resolve",n.meta?.resolved&&(c.dataset.resolved="true"),c.addEventListener("click",async v=>{if(v.stopPropagation(),!n.meta?.resolved){c.dataset.resolved="true",c.textContent="Resolved",c.title="Resolved";try{await ml(n.id,n._rawBody??n.body??""),n.meta={...n.meta,resolved:!0},o.onMove?.()}catch(E){console.error("[storyboard] Failed to resolve comment:",E),c.dataset.resolved="false",c.textContent="Resolve",c.title="Resolve"}}}),u.appendChild(c);const h=document.createElement("button");h.className="sb-comment-window-action-btn",h.setAttribute("aria-label","Copy link"),h.title="Copy link",h.textContent="Copy link",h.addEventListener("click",v=>{v.stopPropagation();const E=new URL(window.location.href);E.searchParams.set("comment",n.id),navigator.clipboard.writeText(E.toString()).then(()=>{h.dataset.copied="true",h.textContent="Copied!",h.title="Copied!",setTimeout(()=>{h.dataset.copied="false",h.textContent="Copy link",h.title="Copy link"},2e3)}).catch(()=>{const L=document.createElement("input");L.value=E.toString(),document.body.appendChild(L),L.select(),document.execCommand("copy"),L.remove()})}),u.appendChild(h);const m=document.createElement("button");m.className="sb-comment-window-close",m.innerHTML="×",m.setAttribute("aria-label","Close"),m.addEventListener("click",v=>{v.stopPropagation(),Y()}),u.appendChild(m),i.appendChild(u),a.appendChild(i);const x=document.createElement("div");x.className="sb-comment-window-body";const _=document.createElement("p");_.className="sb-comment-window-text",_.textContent=n.text??"",x.appendChild(_),x.appendChild(er(n));const S=n.replies??[];if(S.length>0){const v=document.createElement("div");v.className="sb-comment-window-replies";const E=document.createElement("div");E.className="sb-comment-window-replies-label",E.textContent=`${S.length} ${S.length===1?"Reply":"Replies"}`,v.appendChild(E);for(const L of S){const P=document.createElement("div");if(P.className="sb-reply-item",L.author?.avatarUrl){const W=document.createElement("img");W.className="sb-reply-avatar",W.src=L.author.avatarUrl,W.alt=L.author.login??"",P.appendChild(W)}const V=document.createElement("div");V.className="sb-reply-content";const O=document.createElement("div");O.className="sb-reply-meta";const w=document.createElement("span");if(w.className="sb-reply-author",w.textContent=L.author?.login??"unknown",O.appendChild(w),L.createdAt){const W=document.createElement("span");W.className="sb-reply-time",W.textContent=Qn(L.createdAt),O.appendChild(W)}V.appendChild(O);const K=document.createElement("p");K.className="sb-reply-text",K.textContent=L.text??L.body??"",V.appendChild(K),V.appendChild(er(L)),P.appendChild(V),v.appendChild(P)}x.appendChild(v)}if(a.appendChild(x),r&&s){const v=document.createElement("div");v.className="sb-comment-window-reply-form";const E=document.createElement("textarea");E.className="sb-reply-textarea",E.placeholder="Reply…",v.appendChild(E);const L=document.createElement("div");L.className="sb-reply-form-actions";const P=document.createElement("button");P.className="sb-reply-submit-btn",P.textContent="Reply",P.disabled=!0,E.addEventListener("input",()=>{P.disabled=!E.value.trim()});async function V(){const O=E.value.trim();if(O){P.disabled=!0,P.textContent="Posting…";try{await hl(s.id,n.id,O),E.value="",P.textContent="Reply",o.onMove?.()}catch(w){console.error("[storyboard] Failed to post reply:",w),P.textContent="Reply",P.disabled=!1}}}P.addEventListener("click",V),E.addEventListener("keydown",O=>{O.key==="Enter"&&(O.metaKey||O.ctrlKey)&&(O.preventDefault(),V()),O.key==="Escape"&&(O.preventDefault(),O.stopPropagation())}),L.appendChild(P),v.appendChild(L),a.appendChild(v)}let T=!1,k=0,$=0,M=0,F=0;function H(v){if(v.target.closest(".sb-comment-window-header-actions"))return;T=!0,k=v.clientX,$=v.clientY;const E=t.getBoundingClientRect();M=parseFloat(a.style.left)/100*E.width,F=parseFloat(a.style.top)/100*E.height,document.addEventListener("mousemove",Z),document.addEventListener("mouseup",G),v.preventDefault()}function Z(v){if(!T)return;const E=v.clientX-k,L=v.clientY-$,P=t.getBoundingClientRect(),V=M+E,O=F+L,w=Math.round(V/P.width*1e3)/10,K=Math.round(O/P.height*1e3)/10;a.style.left=`${w}%`,a.style.top=`${K}%`}async function G(v){if(!T)return;T=!1,document.removeEventListener("mousemove",Z),document.removeEventListener("mouseup",G);const E=t.getBoundingClientRect(),L=v.clientX-k,P=v.clientY-$,V=M+L,O=F+P,w=Math.round(V/E.width*1e3)/10,K=Math.round(O/E.height*1e3)/10;if(Math.abs(L)>2||Math.abs(P)>2){n.meta={...n.meta,x:w,y:K};const W=t.querySelectorAll(".sb-comment-pin");for(const me of W)if(me._commentId===n.id){me.style.left=`${w}%`,me.style.top=`${K}%`;break}try{await gl(n.id,n._rawBody??"",w,K),n._rawBody=null}catch(me){console.error("[storyboard] Failed to move comment:",me)}}}i.addEventListener("mousedown",H),a.addEventListener("click",v=>v.stopPropagation());const te=new URL(window.location.href);te.searchParams.set("comment",n.id),window.history.replaceState(null,"",te.toString()),t.appendChild(a);function Y(){document.removeEventListener("mousemove",Z),document.removeEventListener("mouseup",G),a.remove(),re?.el===a&&(re=null);const v=new URL(window.location.href);v.searchParams.delete("comment"),window.history.replaceState(null,"",v.toString()),o.onClose?.()}return re={el:a,destroy:Y},{el:a,destroy:Y}}function qr(){re&&(re.destroy(),re=null)}const Sl='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>',tr="sb-comment-mode-style";function kl(){if(document.getElementById(tr))return;const t=document.createElement("style");t.id=tr,t.textContent=`
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${Sl}") 4 2, crosshair;
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
  `,document.head.appendChild(t)}let ue=null,de=null,J=null,Ht=[],pt=null;function pn(){return document.querySelector("main")||document.body}function kt(){if(de)return de;const t=pn();return getComputedStyle(t).position==="static"&&(t.style.position="relative"),de=document.createElement("div"),de.className="sb-comment-overlay",t.appendChild(de),de}function Cl(){ue||(ue=document.createElement("div"),ue.className="sb-comment-mode-banner",ue.innerHTML="Comment mode — click to place a comment. Press <kbd>C</kbd> or <kbd>Esc</kbd> to exit.",document.body.appendChild(ue))}function El(){ue&&(ue.remove(),ue=null)}function Wr(){return window.location.pathname}function hn(){for(const t of Ht)t.remove();Ht=[]}function Jr(t,n,s){const o=document.createElement("div");o.className="sb-comment-pin",o.style.left=`${n.meta?.x??0}%`,o.style.top=`${n.meta?.y??0}%`;const r=s*137.5%360;if(o.style.setProperty("--pin-hue",String(Math.round(r))),n.author?.avatarUrl){const a=document.createElement("img");a.src=n.author.avatarUrl,a.alt=n.author.login??"",o.appendChild(a)}return n.meta?.resolved&&o.setAttribute("data-resolved","true"),o.title=`${n.author?.login??"unknown"}: ${n.text?.slice(0,80)??""}`,o._commentId=n.id,n._rawBody=n.body,o.addEventListener("click",a=>{a.stopPropagation(),J&&(J.destroy(),J=null),Vr(t,n,pt,{onClose:()=>{},onMove:()=>Ct()})}),t.appendChild(o),Ht.push(o),o}function Gr(){if(!pt?.comments?.length)return;const t=kt();hn(),pt.comments.forEach((n,s)=>{n.meta?.x!=null&&n.meta?.y!=null&&Jr(t,n,s)})}async function Ct(){if(!ut())return;const t=kt();Gr();try{const n=await Br(Wr());if(pt=n,hn(),!n?.comments?.length)return;n.comments.forEach((s,o)=>{s.meta?.x!=null&&s.meta?.y!=null&&Jr(t,s,o)}),Il(t,n)}catch(n){console.warn("[storyboard] Could not load comments:",n.message)}}function Il(t,n){const s=new URLSearchParams(window.location.search).get("comment");if(!s||!n?.comments?.length)return;const o=n.comments.find(r=>r.id===s);if(o){if(o.meta?.y!=null){const r=pn(),a=o.meta.y/100*r.scrollHeight,i=r.scrollTop||window.scrollY,l=i+window.innerHeight;if(a<i||a>l){const d=Math.max(0,a-window.innerHeight/3);window.scrollTo({top:d,behavior:"smooth"})}}o._rawBody=o.body,Vr(t,o,n,{onClose:()=>{},onMove:()=>Ct()})}}function Nl(t){if(!nt()||t.target.closest(".sb-composer")||t.target.closest(".sb-comment-pin")||t.target.closest(".sb-comment-window"))return;qr(),J&&(J.destroy(),J=null);const n=pn(),s=n.getBoundingClientRect(),o=Math.round((t.clientX-s.left)/s.width*1e3)/10,r=Math.round((t.clientY-s.top+n.scrollTop)/n.scrollHeight*1e3)/10,a=kt();J=vl(a,o,r,Wr(),{onCancel:()=>{J=null},onSubmit:()=>{J=null,Ct()}})}function Ll(t){t?(document.body.classList.add("sb-comment-mode"),Cl(),kt().classList.add("active"),Gr(),Ct()):(document.body.classList.remove("sb-comment-mode"),El(),J&&(J.destroy(),J=null),qr(),hn(),de&&de.classList.remove("active"))}let nr=!1;function Tl(){nr||(nr=!0,kl(),nl(Ll),document.addEventListener("click",t=>{nt()&&(t.target.closest(".sb-devtools-wrapper")||t.target.closest(".sb-auth-backdrop")||t.target.closest(".sb-comments-drawer")||t.target.closest(".sb-comments-drawer-backdrop")||Nl(t))}),window.addEventListener("keydown",t=>{const n=t.target.tagName;if(!(n==="INPUT"||n==="TEXTAREA"||n==="SELECT"||t.target.isContentEditable)){if(t.key==="c"&&!t.metaKey&&!t.ctrlKey&&!t.altKey){if(!lt())return;if(t.preventDefault(),!nt()&&!ut()){jl();return}tl()}t.key==="Escape"&&nt()&&(t.preventDefault(),Jn(!1))}}),lt()&&ut()&&new URLSearchParams(window.location.search).get("comment")&&Jn(!0))}const Pl={repo:{owner:"dfosco",name:"storyboard-source"},discussions:{category:"General"}},Al={comments:Pl},Yr=ws(Xc,{basename:"/storyboard-source/"});To(Yr,"/storyboard-source/");Xs();Ys();eo(Al);co({basePath:"/storyboard-source/"});Tl();const Rl=document.getElementById("root"),$l=bs.createRoot(Rl);$l.render(e.jsx(b.StrictMode,{children:e.jsx(xs,{colorMode:"auto",children:e.jsxs(vs,{children:[e.jsx(Ir,{}),e.jsx(_s,{router:Yr})]})})}));export{Hl as a,Br as f,ut as i,Bl as l,jl as o,Jn as s,tl as t};
