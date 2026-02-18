import{j as e,S as B,I as Mr,T as N,U as en,N as gt,a as Ge,b as Nn,C as Br,c as Hr,B as K,d as Fr,F as $,A as ye,e as ue,f as Ur,g as qr,L as Ye,h as tn,u as Wr,i as Vr,k as Jr,l as Gr}from"./vendor-primer-Cp2w2YFd.js";import{b,u as Ln,O as Tn,f as Lt,g as Yr,L as Se,h as Kr,i as Xr,j as Zr}from"./vendor-react-BQyrhFMj.js";import{C as oe,V as d,T as m,D as Z,R as Pe,B as $e,a as Qr,b as wt,P as es,S as nn,F as y,c as be,d as Q,e as fe,A as rn,M as ve}from"./vendor-reshaped-DIoD2FDs.js";import{o as ts,M as An,p as Oe,l as Ce,k as De,q as Tt,r as st,s as Me,t as Ie,u as ke,v as At,w as Rt,x as Rn,H as Pt,y as ot,F as ns,z as rs,m as ss,L as os,B as as,R as at,D as Pn,E as $n,J as is,K as cs,N as ls,O as ds,Q as zn,U as On,V as us,W as ps,c as sn,Y as hs,Z as ms,b as gs,_ as fs,$ as on,a0 as Ue}from"./vendor-octicons-CjKpnuJU.js";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function s(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(r){if(r.ep)return;r.ep=!0;const a=s(r);fetch(r.href,a)}})();function Xe(t,n){const s={...t};for(const o of Object.keys(n)){const r=n[o],a=t[o];r!==null&&typeof r=="object"&&!Array.isArray(r)&&a!==null&&typeof a=="object"&&!Array.isArray(a)?s[o]=Xe(a,r):s[o]=r}return s}let J={scenes:{},objects:{},records:{}};function bs(t){if(!t||typeof t!="object")throw new Error("[storyboard-core] init() requires { scenes, objects, records }");J={scenes:t.scenes||{},objects:t.objects||{},records:t.records||{}}}function _t(t,n){if(n&&J[n]?.[t]!=null)return J[n][t];if(!n){for(const s of["scenes","objects","records"])if(J[s]?.[t]!=null)return J[s][t]}if(n==="scenes"||!n){const s=t.toLowerCase();for(const o of Object.keys(J.scenes))if(o.toLowerCase()===s)return J.scenes[o]}throw new Error(`Data file not found: ${t}${n?` (type: ${n})`:""}`)}function Te(t,n=new Set){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(o=>Te(o,n));if(t.$ref&&typeof t.$ref=="string"){const o=t.$ref;if(n.has(o))throw new Error(`Circular $ref detected: ${o}`);n.add(o);const r=_t(o,"objects");return Te(r,n)}const s={};for(const[o,r]of Object.entries(t))s[o]=Te(r,n);return s}function xs(t){if(J.scenes[t]!=null)return!0;const n=t.toLowerCase();for(const s of Object.keys(J.scenes))if(s.toLowerCase()===n)return!0;return!1}function ys(t="default"){let n;try{n=_t(t,"scenes")}catch{throw new Error(`Failed to load scene: ${t}`)}if(Array.isArray(n.$global)){const s=n.$global;delete n.$global;let o={};for(const r of s)try{let a=_t(r);a=Te(a),o=Xe(o,a)}catch(a){console.warn(`Failed to load $global: ${r}`,a)}n=Xe(o,n)}return n=Te(n),structuredClone(n)}function $t(t){const n=J.records[t];if(n==null)throw new Error(`Record not found: ${t}`);if(!Array.isArray(n))throw new Error(`Record "${t}" must be an array, got ${typeof n}`);return structuredClone(n)}function vs(t,n){return $t(t).find(o=>o.id===n)??null}function Dn(t,n){if(t==null||typeof n!="string"||n==="")return;const s=n.split(".");let o=t;for(const r of s){if(o==null||typeof o!="object")return;o=o[r]}return o}function ze(t){if(Array.isArray(t))return t.map(ze);if(t!==null&&typeof t=="object"){const n={};for(const s of Object.keys(t))n[s]=ze(t[s]);return n}return t}function Ze(t,n,s){const o=n.split(".");let r=t;for(let a=0;a<o.length-1;a++){const i=o[a];(r[i]==null||typeof r[i]!="object")&&(r[i]=/^\d+$/.test(o[a+1])?[]:{}),r=r[i]}r[o[o.length-1]]=s}function it(){const t=window.location.hash.replace(/^#/,"");return new URLSearchParams(t)}function Mn(t){const n=t.toString();window.location.hash=n}function Bn(t){return it().get(t)}function he(t,n){const s=it();s.set(t,String(n)),Mn(s)}function Hn(){const t=it(),n={};for(const[s,o]of t.entries())n[s]=o;return n}function Qe(t){const n=it();n.delete(t),Mn(n)}const ct="storyboard:";function lt(t){try{return localStorage.getItem(ct+t)}catch{return null}}function W(t,n){try{localStorage.setItem(ct+t,String(n)),zt()}catch{}}function et(t){try{localStorage.removeItem(ct+t),zt()}catch{}}function Fn(t){const n=()=>{Un(),t()};return window.addEventListener("storage",n),window.addEventListener("storyboard-storage",n),()=>{window.removeEventListener("storage",n),window.removeEventListener("storyboard-storage",n)}}let Le=null;function Un(){Le=null}function qn(){if(Le!==null)return Le;try{const t=[];for(let n=0;n<localStorage.length;n++){const s=localStorage.key(n);s&&s.startsWith(ct)&&t.push(s+"="+localStorage.getItem(s))}return Le=t.sort().join("&"),Le}catch{return""}}function zt(){Un(),window.dispatchEvent(new Event("storyboard-storage"))}const Ot="__hide__",tt="historyState",je="currentState",xe="nextState",an=200;function Ae(){return lt(Ot)==="1"}function js(){Be(),W(Ot,"1");const t=new URL(window.location.href);t.searchParams.delete("hide"),t.hash="",window.history.replaceState(window.history.state,"",t.toString())}function ws(){const t=He();if(t){window.location.hash="";const n=new URLSearchParams(t);for(const[s,o]of n.entries())he(s,o)}et(Ot),Cs("show")}function dt(){return window.location.pathname}function Wn(){return new URLSearchParams(window.location.hash.replace(/^#/,"")).toString()}function Be(t,n){const s=t!==void 0?t:Wn(),o=n!==void 0?n:dt(),r=ut(),a=pt();if(a!==null&&r[a]){const[,c,h]=r[a];if(c===o&&h===s)return}const i=a!==null?r.slice(0,a+1):r,l=i.length,u=[l,o,s],p=[...i,u];if(p.length>an){const c=p.slice(p.length-an);for(let h=0;h<c.length;h++)c[h]=[h,c[h][1],c[h][2]];W(tt,JSON.stringify(c)),W(je,String(c.length-1))}else W(tt,JSON.stringify(p)),W(je,String(l));et(xe)}function ut(){const t=lt(tt);if(!t)return[];try{const n=JSON.parse(t);return Array.isArray(n)?n:[]}catch{return[]}}function pt(){const t=lt(je);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function _s(){const t=lt(xe);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function He(){const t=pt();if(t===null)return null;const n=ut();return n[t]?n[t][2]:null}function Vn(){const t=pt();if(t===null)return null;const n=ut();return n[t]?n[t][1]:null}function Jn(t){const n=He();return n?new URLSearchParams(n).get(t):null}function cn(t,n){const s=He()||"",o=new URLSearchParams(s);o.set(t,String(n)),Be(o.toString(),Vn()||dt())}function ln(t){const n=He()||"",s=new URLSearchParams(n);s.delete(t),Be(s.toString(),Vn()||dt())}function Ss(){const t=He();if(!t)return{};const n=new URLSearchParams(t),s={};for(const[o,r]of n.entries())s[o]=r;return s}function dn(){if(Ae())return;const t=dt(),n=Wn(),s=ut(),o=pt();if(!n&&!t&&s.length===0)return;const r=s.findIndex(([,l,u])=>l===t&&u===n);if(r===-1){Be(n,t);return}if(r===o)return;const a=o!==null?o-1:null,i=_s();if(a!==null&&r===a)W(xe,String(o)),W(je,String(r));else if(i!==null&&r===i){const l=i+1;s[l]?W(xe,String(l)):et(xe),W(je,String(r))}else{et(xe),W(je,String(r));const l=s.slice(0,r+1);W(tt,JSON.stringify(l))}zt()}function ks(){Be(),window.addEventListener("hashchange",()=>dn()),window.addEventListener("popstate",()=>dn())}function Cs(t){const n=new URL(window.location.href);n.searchParams.has(t)&&(n.searchParams.delete(t),window.history.replaceState(window.history.state,"",n.toString()))}function nt(){const t=new URL(window.location.href);if(t.searchParams.has("hide")){js();return}if(t.searchParams.has("show")){ws();return}}function Is(){nt(),window.addEventListener("popstate",()=>nt())}function ht(t){return window.addEventListener("hashchange",t),()=>window.removeEventListener("hashchange",t)}function Dt(){return window.location.hash}let we=null;function Es(t){if(!t||!t.comments){we=null;return}const n=t.comments;we={repo:{owner:n.repo?.owner??"",name:n.repo?.name??""},discussions:{category:n.discussions?.category??"Storyboard Comments"}}}function Gn(){return we}function Yn(){return we!==null&&we.repo.owner!==""&&we.repo.name!==""}const Ns={navigation:{$ref:"navigation"},user:{name:"John Doe",username:"johndoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"}},Ls={user:{$ref:"jane-doe"},navigation:{$ref:"navigation"},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"},signup:{fullName:"",email:"",password:"",organization:{name:"",size:"",role:""},workspace:{region:"",plan:"starter",newsletter:!1,agreeTerms:!1}}},Ts={$global:["security-advisory-navigation"],advisory:{$ref:"security-advisory"}},As={$global:["finch-pearl-navigation"],repositories:{$ref:"finch-pearl-repositories"}},Rs={id:10,title:"Remote code injection in Log4j",breadcrumb:"Dependabot alerts",state:"fixed",openedAgo:"4 years ago",fixedAgo:"3 years ago",package:{name:"org.apache.logging.log4j:log4j-core",ecosystem:"Maven",affectedVersions:">= 2.13.0, < 2.15.0",patchedVersion:"2.15.0"},severity:{level:"Critical",score:"10.0 / 10",cvssMetrics:[{label:"Attack vector",value:"Network"},{label:"Attack complexity",value:"Low"},{label:"Privileges required",value:"None"},{label:"User interaction",value:"None"},{label:"Scope",value:"Changed"},{label:"Confidentiality",value:"High"},{label:"Integrity",value:"High"},{label:"Availability",value:"High"}],cvssVector:"CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H/E:H"},epss:{score:"94.358%",percentile:"100th percentile"},tags:["Patch available"],weaknesses:["CWE-20","CWE-400","CWE-502","CWE-917"],cveId:"CVE-2021-44228",ghsaId:"GHSA-jfh8-c2jp-5v3q",timeline:[{actor:"dependabot",actorAvatar:"https://avatars.githubusercontent.com/in/29110?v=4",isBot:!0,action:"opened this",timeAgo:"4 years ago"},{actor:"dependabot",actorAvatar:"https://avatars.githubusercontent.com/in/29110?v=4",isBot:!0,action:"closed this as completed",timeAgo:"3 years ago"}]},Ps={topnav:[{icon:"code",label:"Code",url:"#"},{icon:"issue-opened",label:"Issues",url:"#"},{icon:"git-pull-request",label:"Pull requests",url:"#"},{icon:"people",label:"Agents",url:"#"},{icon:"play",label:"Actions",url:"#"},{icon:"project",label:"Projects",url:"#"},{icon:"star",label:"Models",url:"#"},{icon:"book",label:"Wiki",url:"#"},{icon:"shield",label:"Security",url:"#",counter:95,current:!0},{icon:"graph",label:"Insights",url:"#"},{icon:"gear",label:"Settings",url:"#"}]},$s={primary:[{label:"Overview",url:"/Overview",icon:"home"},{label:"Issues",url:"/Issues",icon:"issue-opened"},{label:"Pull Requests",url:"#",icon:"git-pull-request"},{label:"Discussions",url:"#",icon:"comment-discussion"}],secondary:[{label:"Settings",url:"#",icon:"gear"},{label:"Help",url:"#",icon:"question"}]},zs={name:"Jane Doe",username:"janedoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},Os=[{name:"test-webdriverio-update-copilot-issue",description:"",language:null,forks:0,stars:0,url:"#"},{name:"dependabot-copilot-autofix",description:"Testing Autofix using Copilot Workspaces",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"alona-copilot",description:"",language:null,forks:0,stars:0,url:"#"},{name:"spike-dependabot-snapshot-action",description:"Copilot-driven spike into using Dependabot as a dependency detector",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"ghas-copilot-geekmasher",description:"",language:"JavaScript",forks:0,stars:0,url:"#"},{name:"copilot-autofix-demo-by-ot",description:"",language:"JavaScript",forks:0,stars:0,url:"#"}],Ds={topnav:[{icon:"home",label:"Overview",url:"/Overview"},{icon:"repo",label:"Repositories",url:"/Repositories",counter:"5k+",current:!0},{icon:"project",label:"Projects",url:"#",counter:25},{icon:"package",label:"Packages",url:"#",counter:21},{icon:"people",label:"Teams",url:"#",counter:132},{icon:"person",label:"People",url:"#",counter:571},{icon:"shield",label:"Security",url:"#"},{icon:"graph",label:"Insights",url:"#"},{icon:"gear",label:"Settings",url:"#"}],sidenav:[{label:"All",url:"#",icon:"repo",current:!0},{label:"Contributed by me",url:"#",icon:"git-pull-request"},{label:"Adminable by me",url:"#",icon:"person"},{label:"Public",url:"#",icon:"eye"},{label:"Internal",url:"#",icon:"lock"},{label:"Private",url:"#",icon:"lock"},{label:"Sources",url:"#",icon:"code"},{label:"Forks",url:"#",icon:"repo-forked"},{label:"Archived",url:"#",icon:"archive"},{label:"Templates",url:"#",icon:"repo-template"}]},Ms=[{id:"refactor-auth-sso",identifier:"FIL-10",title:"Refactor authentication flow to support SSO providers",description:"Our current auth flow only supports email/password login. We need to extend it to support SSO providers (Google, Okta, Azure AD) for enterprise customers.",status:"todo",priority:"high",labels:["Auth","Backend","Feature"],assignee:null,project:null,estimate:5,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-17T10:50:00Z",acceptanceCriteria:["Users can authenticate via Google OAuth 2.0","Users can authenticate via SAML-based SSO (Okta, Azure AD)","Existing email/password flow remains unchanged","Session tokens are issued consistently regardless of auth method","Admin panel includes SSO configuration settings"],technicalNotes:["Use the existing AuthService class as the base","Add a provider strategy pattern to abstract login methods","Store provider metadata in the identity_providers table","Redirect URI callback must handle both web and mobile clients"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"10min ago"}]},{id:"fix-rate-limiter-bypass",identifier:"FIL-9",title:"Fix rate limiter bypass on batch endpoints",description:"The rate limiter can be bypassed by splitting a large request into multiple smaller batch calls. Each sub-request is counted as a single hit instead of being weighted by payload size.",status:"in_progress",priority:"urgent",labels:["Bug","Security","Backend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Platform Infrastructure",estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-16T14:20:00Z",acceptanceCriteria:["Batch endpoints count each item in the payload toward the rate limit","Rate limit headers reflect weighted counts","Existing single-request endpoints are unaffected"],technicalNotes:["Update RateLimiterMiddleware to accept a weight function","Batch controller should pass payload.length as weight","Add integration tests for weighted rate limiting"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 day ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"6 hours ago",body:"Started investigating — the middleware doesn't have access to parsed body at the point it runs. May need to restructure."}]},{id:"add-webhook-retry-logic",identifier:"FIL-8",title:"Add exponential backoff retry logic for webhook deliveries",description:"Webhook deliveries currently fail silently on timeout. We need retry logic with exponential backoff and a dead-letter queue for persistently failing endpoints.",status:"todo",priority:"medium",labels:["Feature","Backend"],assignee:null,project:"Platform Infrastructure",estimate:8,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-15T09:00:00Z",acceptanceCriteria:["Failed webhook deliveries are retried up to 5 times","Retry intervals follow exponential backoff (1s, 2s, 4s, 8s, 16s)","After all retries, the event is moved to a dead-letter queue","Delivery status is visible in the admin dashboard"],technicalNotes:["Use the existing job queue (BullMQ) for retry scheduling","Add a webhook_deliveries table to track attempts","Dead-letter events should be replayable from the admin UI"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"2 days ago"}]},{id:"dashboard-loading-skeleton",identifier:"FIL-7",title:"Add loading skeletons to dashboard widgets",description:"Dashboard widgets show a blank space while data is loading. Add skeleton loaders to improve perceived performance.",status:"done",priority:"low",labels:["Feature","Frontend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Dashboard",estimate:2,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-12T16:30:00Z",acceptanceCriteria:["All dashboard cards show skeleton loaders while fetching data","Skeleton matches the shape of the loaded content","Transition from skeleton to content is smooth"],technicalNotes:["Use Reshaped Skeleton component","Wrap each StatCard in a loading boundary"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"5 days ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"3 days ago",body:"Done — merged in FIL-7-skeletons branch."}]},{id:"migrate-env-config",identifier:"FIL-6",title:"Migrate environment config to typed schema validation",description:"Environment variables are currently accessed via raw process.env lookups with no validation. Migrate to a typed config schema using zod so missing or malformed values are caught at startup.",status:"todo",priority:"medium",labels:["Backend","DevEx"],assignee:null,project:null,estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-10T11:00:00Z",acceptanceCriteria:["All environment variables are defined in a single config schema","Server fails fast on startup if required variables are missing","Types are inferred from the schema — no manual type assertions"],technicalNotes:["Use zod for schema definition and parsing","Create src/config.ts as the single source of truth","Replace all process.env.X references with config.X"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 week ago"}]}],Bs=[{id:"welcome-to-storyboard",title:"Welcome to Storyboard",date:"2026-02-14",author:"Jane Doe",summary:"An introduction to building prototypes with Storyboard — the meta-framework for design system exploration.",body:`Storyboard is a prototyping meta-framework that lets you build interactive UI prototypes powered by real data. Instead of hard-coding sample content, you define data files that feed into your pages automatically.

Each page can load a scene (its data context), reference shared objects, and even render parameterized content from record collections — like this very blog post.

Get started by creating a \`.scene.json\` file and a page component. The data flows in, and you focus on the design.`},{id:"data-driven-prototyping",title:"Data-Driven Prototyping",date:"2026-02-13",author:"Jane Doe",summary:"How scenes, objects, and records work together to power realistic prototypes.",body:`Traditional prototyping tools force you to duplicate content across screens. Storyboard takes a different approach: your data lives in JSON files, and pages consume it through hooks.

**Scenes** provide the full data context for a page. **Objects** are reusable fragments — a user profile, a navigation config — that scenes reference via \`$ref\`. **Records** are collections that power parameterized pages, like blog posts or product listings.

This separation means you can swap data without touching UI code, test edge cases by editing JSON, and share data fragments across multiple pages.`},{id:"design-system-exploration",title:"Exploring Design Systems",date:"2026-02-12",author:"Jane Doe",summary:"Using Storyboard to explore and compare design systems like Primer and Reshaped.",body:`One of Storyboard's strengths is its design system agnosticism. While it ships with Primer React as the default, you can bring any design system — Reshaped, Radix, Chakra, or your own.

Each page is independent: one page can use Primer components while another uses Reshaped. This makes Storyboard ideal for comparing design systems side by side, exploring component APIs, and building proof-of-concept pages before committing to a system.

The key is that the data layer stays the same regardless of which components render it.`}],Hs={"other-scene":Ns,default:Ls,SecurityAdvisory:Ts,Repositories:As},Fs={"security-advisory":Rs,"security-advisory-navigation":Ps,navigation:$s,"jane-doe":zs,"finch-pearl-repositories":Os,"finch-pearl-navigation":Ds},Us={issues:Ms,posts:Bs};bs({scenes:Hs,objects:Fs,records:Us});const mt=b.createContext(null);function qs(){return new URLSearchParams(window.location.search).get("scene")}function Ws(){const t=window.location.pathname.replace(/\/+$/,"")||"/";return t==="/"?"index":t.split("/").pop()||"index"}function Vs({sceneName:t,recordName:n,recordParam:s,children:o}){const r=Ws(),a=qs()||t||(xs(r)?r:"default"),i=Ln(),{data:l,error:u}=b.useMemo(()=>{try{let c=ys(a);if(n&&s&&i[s]){const h=vs(n,i[s]);h&&(c=Xe(c,{record:h}))}return{data:c,error:null}}catch(c){return{data:null,error:c.message}}},[a,n,s,i]),p={data:l,error:u,loading:!1,sceneName:a};return u?e.jsxs("span",{style:{color:"var(--fgColor-danger, #f85149)"},children:["Error loading scene: ",u]}):e.jsx(mt.Provider,{value:p,children:o})}function z(t){const n=b.useContext(mt);if(n===null)throw new Error("useSceneData must be used within a <StoryboardProvider>");const{data:s,loading:o,error:r}=n,a=b.useSyncExternalStore(ht,Dt),i=b.useSyncExternalStore(Fn,qn);return b.useMemo(()=>{if(o||r||s==null)return;const u=Ae(),p=u?Jn:Bn,c=u?Ss:Hn;if(!t){const R=c(),O=Object.keys(R);if(O.length===0)return s;const D=ze(s);for(const H of O)Ze(D,H,R[H]);return D}const h=p(t);if(h!==null)return h;const g=t+".",x=c(),I=Object.keys(x).filter(R=>R.startsWith(g)),w=Dn(s,t);if(I.length>0&&w!==void 0){const R=ze(w);for(const O of I){const D=O.slice(g.length);Ze(R,D,x[O])}return R}return w===void 0?(console.warn(`[useSceneData] Path "${t}" not found in scene data.`),{}):w},[s,o,r,t,a,i])}function v(t){const n=b.useContext(mt);if(n===null)throw new Error("useOverride must be used within a <StoryboardProvider>");const{data:s}=n,o=Ae(),r=s!=null?Dn(s,t):void 0,a=b.useCallback(()=>Bn(t),[t]),i=b.useSyncExternalStore(ht,a);b.useSyncExternalStore(Fn,qn);let l;if(o){const c=Jn(t);l=c!==null?c:r}else l=i!==null?i:r;const u=b.useCallback(c=>{Ae()||he(t,c),cn(t,c)},[t]),p=b.useCallback(()=>{Ae()||Qe(t),ln(t)},[t]);return[l,u,p]}function Js(){const t=b.useContext(mt);if(t===null)throw new Error("useScene must be used within a <StoryboardProvider>");const n=b.useCallback(s=>{const o=new URL(window.location.href);o.searchParams.set("scene",s),window.location.href=o.toString()},[]);return{sceneName:t.sceneName,switchScene:n}}function Kn(t,n){const s=Hn(),o=`record.${n}.`,r=Object.keys(s).filter(l=>l.startsWith(o));if(r.length===0)return t;const a=ze(t),i={};for(const l of r){const u=l.slice(o.length),p=u.indexOf(".");if(p===-1)continue;const c=u.slice(0,p),h=u.slice(p+1);i[c]||(i[c]={}),i[c][h]=s[l]}for(const[l,u]of Object.entries(i)){const p=a.find(c=>c.id===l);if(p)for(const[c,h]of Object.entries(u))Ze(p,c,h);else{const c={id:l};for(const[h,g]of Object.entries(u))Ze(c,h,g);a.push(c)}}return a}function Xn(t,n="id"){const o=Ln()[n],r=b.useSyncExternalStore(ht,Dt);return b.useMemo(()=>{if(!o)return null;try{const a=$t(t);return Kn(a,t).find(l=>l[n]===o)??null}catch(a){return console.error(`[useRecord] ${a.message}`),null}},[t,n,o,r])}function Zn(t){const n=b.useSyncExternalStore(ht,Dt);return b.useMemo(()=>{try{const s=$t(t);return Kn(s,t)}catch(s){return console.error(`[useRecords] ${s.message}`),[]}},[t,n])}function le(t,n,s){return v(`record.${t}.${n}.${s}`)}function Gs(t,n=""){const s=n.replace(/\/+$/,"");document.addEventListener("click",r=>{if(r.metaKey||r.ctrlKey||r.shiftKey||r.altKey)return;const a=r.target.closest("a[href]");if(!a||a.target==="_blank")return;const i=new URL(a.href,window.location.origin);if(i.origin!==window.location.origin)return;const l=window.location.hash,u=l&&l!=="#",c=i.hash&&i.hash!=="#"?i.hash:u?l:"";let h=i.pathname;s&&h.startsWith(s)&&(h=h.slice(s.length)||"/"),r.preventDefault(),t.navigate(h+i.search+c),setTimeout(nt,0)});const o=t.navigate.bind(t);t.navigate=(r,a)=>{const i=window.location.hash;return i&&i!=="#"&&typeof r=="string"&&!r.includes("#")&&(r=r+i),o(r,a).then(u=>(nt(),u))}}const Fe=b.createContext(null);function Ys(){return e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:"var(--bgColor-default, #0d1117)"},children:[e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",style:{animation:"spin 0.8s linear infinite"},children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"var(--fgColor-muted, #484f58)",strokeWidth:"2.5",opacity:"0.25"}),e.jsx("path",{d:"M12 2a10 10 0 0 1 10 10",stroke:"var(--fgColor-default, #e6edf3)",strokeWidth:"2.5",strokeLinecap:"round"})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg) } }"})]})}function Ks(){return e.jsx(Vs,{children:e.jsx(b.Suspense,{fallback:e.jsx(Ys,{}),children:e.jsx(Tn,{})})})}const Xs=Object.freeze(Object.defineProperty({__proto__:null,default:Ks},Symbol.toStringTag,{value:"Module"})),Zs="_navItem_ec50i_1",Qs="_active_ec50i_16",un={navItem:Zs,active:Qs},eo=[{label:"Overview",path:"/Dashboard"},{label:"Issues",path:"/issues"},{label:"Projects",path:"/Dashboard"},{label:"Views",path:"/Dashboard"}];function rt({orgName:t,activePage:n,userInfo:s}){const o=Lt();return e.jsx(oe,{padding:4,children:e.jsxs(d,{direction:"column",gap:2,children:[e.jsx(m,{variant:"featured-3",weight:"bold",children:t||"—"}),e.jsx(Z,{}),e.jsx("nav",{children:e.jsx(d,{direction:"column",gap:0,children:eo.map(r=>e.jsx("button",{type:"button",className:`${un.navItem} ${n===r.label?un.active:""}`,onClick:()=>o(r.path),children:e.jsx(m,{variant:"body-3",weight:n===r.label?"bold":"regular",children:r.label})},r.label))})}),s&&e.jsxs(e.Fragment,{children:[e.jsx(Z,{}),e.jsxs(d,{direction:"column",gap:1,paddingTop:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:s.name||"—"}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:s.role||"—"})]})]})]})})}function me(t){return t==null||t===""?"—":String(t)}function qe({label:t,value:n,change:s,color:o}){return e.jsx(oe,{padding:5,children:e.jsxs(d,{direction:"column",gap:2,children:[e.jsx(m,{variant:"body-3",color:"neutral-faded",children:t}),e.jsx(m,{variant:"featured-2",weight:"bold",children:n}),e.jsx(m,{variant:"caption-1",color:o||"positive",children:s})]})})}function Ee({label:t,value:n,max:s,color:o}){return e.jsxs(d,{direction:"column",gap:1,children:[e.jsxs(d,{direction:"row",justify:"space-between",children:[e.jsx(m,{variant:"body-3",children:t}),e.jsx(m,{variant:"body-3",weight:"medium",children:n})]}),e.jsx(es,{value:typeof s=="number"?parseFloat(n)/s*100:parseFloat(n),color:o,size:"small",attributes:{"aria-label":t}})]})}const to=[{label:"Team standup",time:"Today, 10:00"},{label:"Architecture review",time:"Today, 11:30"},{label:"Lunch",time:"Today, 12:30"},{label:"Sprint planning",time:"Today, 14:00"},{label:"Deploy v2.4",time:"Today, 17:00"}];function no(){const t=z("signup.fullName"),n=z("signup.organization.name"),s=z("signup.organization.size"),o=z("signup.organization.role"),r=z("signup.workspace.region"),a=z("signup.workspace.plan");return e.jsx(Pe,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(d,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(d,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(d.Item,{columns:2,children:e.jsx(rt,{orgName:me(n),activePage:"Overview",userInfo:{name:me(t),role:me(o)}})}),e.jsx(d.Item,{columns:10,direction:"column",align:"center",justify:"center",children:e.jsxs(d,{direction:"column",maxWidth:"80%",gap:4,children:[e.jsxs(d,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(m,{variant:"featured-2",weight:"bold",children:"Overview"}),e.jsxs(d,{direction:"row",gap:2,align:"center",children:[e.jsxs($e,{color:"positive",children:[me(a)," plan"]}),e.jsx($e,{variant:"faded",children:me(r)})]})]}),e.jsxs(d,{direction:"row",gap:3,children:[e.jsx(d.Item,{columns:3,children:e.jsx(qe,{label:"Active Users",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(d.Item,{columns:3,children:e.jsx(qe,{label:"Deployments",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(d.Item,{columns:3,children:e.jsx(qe,{label:"New Members",value:"1",change:"That's you!",color:"primary"})}),e.jsx(d.Item,{columns:3,children:e.jsx(qe,{label:"Team Size",value:me(s),change:"Current plan capacity",color:"primary"})})]}),e.jsxs(d,{direction:"row",gap:4,children:[e.jsx(d.Item,{columns:5,children:e.jsxs(d,{direction:"column",gap:4,children:[e.jsx(oe,{padding:4,children:e.jsx(Qr,{})}),e.jsx(oe,{padding:5,children:e.jsxs(d,{direction:"column",gap:3,children:[e.jsx(m,{variant:"body-2",weight:"bold",children:"Schedule"}),e.jsx(d,{direction:"column",gap:2,children:to.map(i=>e.jsx(wt,{name:`schedule-${i.label}`,children:e.jsxs(d,{direction:"column",children:[e.jsx(m,{variant:"body-3",children:i.label}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:i.time})]})},i.label))})]})})]})}),e.jsx(d.Item,{grow:!0,children:e.jsxs(d,{direction:"column",gap:4,children:[e.jsx(oe,{padding:5,children:e.jsxs(d,{direction:"column",gap:4,children:[e.jsx(m,{variant:"body-2",weight:"bold",children:"Metrics"}),e.jsx(Ee,{label:"Performance",value:"0",max:100,color:"neutral-faded"}),e.jsx(Ee,{label:"Monthly revenue goal",value:"0",max:100,color:"neutral-faded"}),e.jsx(Ee,{label:"Error rate",value:"0",max:100,color:"neutral-faded"}),e.jsx(Ee,{label:"User acquisition",value:"0",max:100,color:"neutral-faded"}),e.jsx(Ee,{label:"Releases shipped",value:"0",max:100,color:"neutral-faded"})]})}),e.jsx(oe,{padding:5,children:e.jsxs(d,{direction:"column",gap:3,children:[e.jsx(m,{variant:"body-2",weight:"bold",children:"Recent activity"}),e.jsx(Z,{}),e.jsxs(d,{direction:"column",gap:4,align:"center",paddingBlock:6,children:[e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"No activity yet"}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Deployments and events will appear here once your workspace is active."})]})]})})]})})]})]})})]})})})}const ro=Object.freeze(Object.defineProperty({__proto__:null,default:no},Symbol.toStringTag,{value:"Module"}));var ft={exports:{}},bt,pn;function so(){if(pn)return bt;pn=1;var t="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";return bt=t,bt}var xt,hn;function oo(){if(hn)return xt;hn=1;var t=so();function n(){}function s(){}return s.resetWarningCache=n,xt=function(){function o(i,l,u,p,c,h){if(h!==t){var g=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw g.name="Invariant Violation",g}}o.isRequired=o;function r(){return o}var a={array:o,bigint:o,bool:o,func:o,number:o,object:o,string:o,symbol:o,any:o,arrayOf:r,element:o,elementType:o,instanceOf:r,node:o,objectOf:r,oneOf:r,oneOfType:r,shape:r,exact:r,checkPropTypes:s,resetWarningCache:n};return a.PropTypes=a,a},xt}var mn;function ao(){return mn||(mn=1,ft.exports=oo()()),ft.exports}var io=ao();const G=Yr(io),co="_header_1282e_1",lo="_headerContent_1282e_8",uo="_titleWrapper_1282e_17",po="_separator_1282e_21",ho="_subtitle_1282e_25",Ne={header:co,headerContent:lo,titleWrapper:uo,separator:po,subtitle:ho},mo=[{icon:Oe,label:"Code",current:!0},{icon:Ce,label:"Issues",counter:30},{icon:De,label:"Pull Requests",counter:3},{icon:Tt,label:"Discussions"},{icon:st,label:"Actions"},{icon:Me,label:"Projects",counter:7},{icon:Ie,label:"Security",counter:12},{icon:ke,label:"Insights"}];function Qn({items:t=mo,title:n,subtitle:s}){return e.jsxs(B,{as:"header",className:Ne.header,children:[e.jsxs("div",{className:Ne.headerContent,children:[e.jsx(Mr,{icon:ts,"aria-label":"Open global navigation menu",unsafeDisableTooltip:!0}),e.jsx(An,{size:32}),e.jsxs(B,{direction:"horizontal",gap:"condensed",className:Ne.titleWrapper,children:[e.jsx("span",{children:n||"title"}),s&&e.jsxs(e.Fragment,{children:[e.jsx(N,{className:Ne.separator,children:"/"}),e.jsx(N,{className:Ne.subtitle,children:s||"subtitle"})]})]})]}),e.jsx(en,{"aria-label":"Repository",children:t.map(o=>e.jsx(en.Item,{icon:o.icon,"aria-current":o.current?"page":void 0,counter:o.counter,href:o.url,children:o.label},o.label))})]})}Qn.propTypes={items:G.arrayOf(G.shape({icon:G.elementType,label:G.string.isRequired,current:G.bool,counter:G.number,url:G.string})),title:G.string,subtitle:G.string};const go=[{icon:Ce,label:"Open issues",url:"#"},{icon:At,label:"Your issues",url:"#"},{icon:Rt,label:"Assigned to you",url:"#",current:!0},{icon:Rn,label:"Mentioning you",url:"#"}];function fo({items:t=go}){return e.jsx(gt,{"aria-label":"Navigation",children:t.map(n=>e.jsxs(gt.Item,{href:n.url,"aria-current":n.current?"page":void 0,children:[n.icon&&e.jsx(gt.LeadingVisual,{children:e.jsx(n.icon,{})}),n.label]},n.label))})}const bo="_wrapper_74lhx_1",xo="_navigation_74lhx_7",yo="_main_74lhx_13",vo="_container_74lhx_22",We={wrapper:bo,navigation:xo,main:yo,container:vo};function ae({children:t,title:n,subtitle:s,topnav:o,sidenav:r}){return e.jsxs(B,{className:We.container,children:[e.jsx(Qn,{title:n,subtitle:s,items:o}),e.jsxs("div",{className:We.wrapper,children:[r&&e.jsx("aside",{className:We.navigation,children:e.jsx(fo,{items:r})}),e.jsx("main",{className:We.main,children:t})]})]})}function Re({name:t,onChange:n,value:s,...o}){const r=b.useContext(Fe),a=r?.prefix&&t?`${r.prefix}.${t}`:t,[i]=v(a||""),[l,u]=b.useState(i??""),p=!!r&&!!t;b.useEffect(()=>{if(p)return r.subscribe(t,g=>u(g))},[p,r,t]),b.useEffect(()=>{p&&i!=null&&(u(i),r.setDraft(t,i))},[]);const c=g=>{p&&(u(g.target.value),r.setDraft(t,g.target.value)),n&&n(g)},h=p?l:s;return e.jsx(Ge,{name:t,value:h,onChange:c,...o})}function de({name:t,onChange:n,value:s,children:o,...r}){const a=b.useContext(Fe),i=a?.prefix&&t?`${a.prefix}.${t}`:t,[l]=v(i||""),[u,p]=b.useState(l??""),c=!!a&&!!t;b.useEffect(()=>{if(c)return a.subscribe(t,x=>p(x))},[c,a,t]),b.useEffect(()=>{c&&l!=null&&(p(l),a.setDraft(t,l))},[]);const h=x=>{c&&(p(x.target.value),a.setDraft(t,x.target.value)),n&&n(x)},g=c?u:s;return e.jsx(Nn,{name:t,value:g,onChange:h,...r,children:o})}de.Option=Nn.Option;function jo({name:t,onChange:n,checked:s,...o}){const r=b.useContext(Fe),a=r?.prefix&&t?`${r.prefix}.${t}`:t,[i]=v(a||""),l=i==="true"||i===!0,[u,p]=b.useState(l),c=!!r&&!!t;b.useEffect(()=>{if(c)return r.subscribe(t,x=>p(x==="true"||x===!0))},[c,r,t]),b.useEffect(()=>{if(c&&i!=null){const x=i==="true"||i===!0;p(x),r.setDraft(t,x?"true":"false")}},[]);const h=x=>{c&&(p(x.target.checked),r.setDraft(t,x.target.checked?"true":"false")),n&&n(x)},g=c?u:s;return e.jsx(Br,{name:t,checked:g,onChange:h,...o})}function er({name:t,onChange:n,value:s,...o}){const r=b.useContext(Fe),a=r?.prefix&&t?`${r.prefix}.${t}`:t,[i]=v(a||""),[l,u]=b.useState(i??""),p=!!r&&!!t;b.useEffect(()=>{if(p)return r.subscribe(t,g=>u(g))},[p,r,t]),b.useEffect(()=>{p&&i!=null&&(u(i),r.setDraft(t,i))},[]);const c=g=>{p&&(u(g.target.value),r.setDraft(t,g.target.value)),n&&n(g)},h=p?l:s;return e.jsx(Hr,{name:t,value:h,onChange:c,...o})}function tr({data:t,onSubmit:n,children:s,...o}){const r=t||null,a=b.useRef({}),i=b.useRef({}),l=b.useCallback(g=>a.current[g],[]),u=b.useCallback((g,x)=>{a.current[g]=x;const I=i.current[g];I&&I(x)},[]),p=b.useCallback((g,x)=>(i.current[g]=x,()=>{delete i.current[g]}),[]),c=g=>{if(g.preventDefault(),r)for(const[x,I]of Object.entries(a.current))he(`${r}.${x}`,I);n&&n(g)},h={prefix:r,getDraft:l,setDraft:u,subscribe:p};return e.jsx(Fe.Provider,{value:h,children:e.jsx("form",{...o,onSubmit:c,children:s})})}const wo="_container_1ykvj_1",_o="_title_1ykvj_5",So="_codeBlock_1ykvj_11",ko="_form_1ykvj_38",ge={container:wo,title:_o,codeBlock:So,form:ko};function Co(){const[t,n,s]=v("user.name"),[o,r,a]=v("user.username"),[i,,l]=v("user.profile.bio"),[u,,p]=v("user.profile.location"),{sceneName:c,switchScene:h}=Js(),g=c==="default"?"other-scene":"default",x=()=>{s(),a(),l(),p()};return e.jsxs("div",{className:ge.container,children:[e.jsx("h2",{className:ge.title,children:"useOverride Demo"}),e.jsxs("p",{children:["Add ",e.jsx("code",{children:"#user.name=Alice"})," to the URL hash to override any value."]}),e.jsxs("section",{children:[e.jsx(N,{as:"h3",fontWeight:"bold",children:"Scene"}),e.jsxs("pre",{className:ge.codeBlock,children:["current: ",c]}),e.jsxs(K,{size:"small",onClick:()=>h(g),children:['Switch to "',g,'"']})]}),e.jsxs("section",{children:[e.jsx(N,{as:"h3",fontWeight:"bold",children:"User"}),e.jsxs("pre",{className:ge.codeBlock,children:[t," (",o,")"]}),e.jsxs("pre",{className:ge.codeBlock,children:[i," · ",u]}),e.jsx(N,{as:"h4",fontWeight:"semibold",fontSize:1,children:"Switch User"}),e.jsxs(Fr,{children:[e.jsx(K,{size:"small",onClick:()=>n("Alice Chen"),children:"Update name"}),e.jsx(K,{size:"small",onClick:()=>r("alice123"),children:"Update username"})]}),e.jsx(K,{size:"small",variant:"danger",onClick:x,style:{marginLeft:"8px"},children:"Reset"})]}),e.jsx("a",{href:"/storyboard/Overview",children:"hello"}),e.jsxs("section",{children:[e.jsx(N,{as:"h3",fontWeight:"bold",children:"Edit User"}),e.jsxs(tr,{data:"user",className:ge.form,children:[e.jsxs($,{children:[e.jsx($.Label,{children:"Name"}),e.jsx(Re,{name:"name",placeholder:"Name",size:"small"})]}),e.jsxs($,{children:[e.jsx($.Label,{children:"Username"}),e.jsx(Re,{name:"username",placeholder:"Username",size:"small"})]}),e.jsxs($,{children:[e.jsx($.Label,{children:"Bio"}),e.jsx(er,{name:"profile.bio",placeholder:"Bio"})]}),e.jsxs($,{children:[e.jsx($.Label,{children:"Location"}),e.jsx(Re,{name:"profile.location",placeholder:"Location",size:"small"})]}),e.jsx(K,{type:"submit",size:"small",children:"Save"})]})]})]})}const Io=[{icon:Pt,label:"Home",url:"/"},{icon:ot,label:"Forms",url:"/Forms",current:!0}];function Eo(){const[,,t]=v("checkout");return e.jsxs(ae,{title:"Storyboard",subtitle:"Forms",topnav:Io,children:[e.jsx(N,{as:"h1",fontSize:"larger",children:"Form Components Demo"}),e.jsx(N,{as:"p",color:"fg.muted",children:"Type in the fields below, then click Submit to persist values in the URL hash. Refresh the page or share the URL to restore state."}),e.jsx(tr,{data:"checkout",children:e.jsxs(B,{direction:"vertical",gap:"normal",padding:"normal",children:[e.jsxs($,{children:[e.jsx($.Label,{children:"Email"}),e.jsx(Re,{name:"email",placeholder:"you@example.com"})]}),e.jsxs($,{children:[e.jsx($.Label,{children:"Full Name"}),e.jsx(Re,{name:"name",placeholder:"Jane Doe"})]}),e.jsxs($,{children:[e.jsx($.Label,{children:"Shipping Address"}),e.jsx(er,{name:"address",placeholder:"123 Main St..."})]}),e.jsxs($,{children:[e.jsx($.Label,{children:"Country"}),e.jsxs(de,{name:"country",children:[e.jsx(de.Option,{value:"",children:"Select a country"}),e.jsx(de.Option,{value:"us",children:"United States"}),e.jsx(de.Option,{value:"ca",children:"Canada"}),e.jsx(de.Option,{value:"uk",children:"United Kingdom"}),e.jsx(de.Option,{value:"de",children:"Germany"})]})]}),e.jsxs($,{children:[e.jsx(jo,{name:"newsletter"}),e.jsx($.Label,{children:"Subscribe to newsletter"})]}),e.jsxs(B,{direction:"horizontal",gap:"condensed",children:[e.jsx(K,{type:"submit",variant:"primary",children:"Submit"}),e.jsx(K,{type:"button",variant:"danger",onClick:()=>t(),children:"Reset"})]})]})})]})}const No=Object.freeze(Object.defineProperty({__proto__:null,default:Eo},Symbol.toStringTag,{value:"Module"})),Lo=[{icon:Oe,label:"Code",url:"/"},{icon:Ce,label:"Issues",counter:10,url:"#issues",current:!0},{icon:De,label:"Pull Requests",counter:3,url:"/overview"},{icon:Tt,label:"Discussions"},{icon:st,label:"Actions"},{icon:Me,label:"Projects",counter:7},{icon:Ie,label:"Security",counter:12},{icon:ke,label:"Insights"}],To=[{icon:Ce,label:"Open issues",url:""},{icon:At,label:"Your issues",url:""},{icon:Rt,label:"Assigned to you",url:"",current:!0},{icon:Rn,label:"Mentioning you",url:""}];function Ao(){return e.jsx(ae,{title:"Primer",subtitle:"React",topnav:Lo,sidenav:To,children:"This is the issues page"})}const Ro=Object.freeze(Object.defineProperty({__proto__:null,default:Ao},Symbol.toStringTag,{value:"Module"})),Po="_title_1bvkv_1",$o="_card_1bvkv_4",zo="_cardText_1bvkv_12",yt={title:Po,card:$o,cardText:zo},Oo=[{icon:Pt,label:"Overview",url:"/",current:!0},{icon:Ce,label:"Organizations",url:"#issues"},{icon:De,label:"People"},{icon:Tt,label:"Policies"},{icon:st,label:"GitHub Connect"},{icon:Me,label:"Code Security",counter:7},{icon:Ie,label:"Billing & Licensing",counter:12},{icon:ke,label:"Settings"},{icon:ke,label:"Compliance"}];function Do(){return e.jsxs(ae,{title:"Primer",subtitle:"React",topnav:Oo,children:[e.jsx(N,{as:"h1",className:yt.title,fontSize:"larger",children:"Overview"}),e.jsxs("div",{className:yt.card,children:[e.jsx(N,{as:"p",className:yt.cardText,fontSize:"medium",children:"This is a card in the overview"}),e.jsx(K,{children:"Edit"})]})]})}const Mo=Object.freeze(Object.defineProperty({__proto__:null,default:Do},Symbol.toStringTag,{value:"Module"})),Bo="_content_qz2dt_1",Ho="_pageHeader_qz2dt_6",Fo="_pageTitle_qz2dt_13",Uo="_filterBar_qz2dt_19",qo="_filterInput_qz2dt_26",Wo="_searchAction_qz2dt_30",Vo="_listHeader_qz2dt_34",Jo="_repoCount_qz2dt_44",Go="_listControls_qz2dt_49",Yo="_sortButton_qz2dt_55",Ko="_viewToggle_qz2dt_59",Xo="_viewButton_qz2dt_66",Zo="_viewButtonActive_qz2dt_81",Qo="_repoList_qz2dt_86",ea="_repoItem_qz2dt_95",ta="_repoInfo_qz2dt_107",na="_repoIcon_qz2dt_114",ra="_repoName_qz2dt_119",sa="_repoDescription_qz2dt_131",oa="_repoMeta_qz2dt_139",aa="_metaItem_qz2dt_148",ia="_language_qz2dt_154",ca="_languageDot_qz2dt_160",C={content:Bo,pageHeader:Ho,pageTitle:Fo,filterBar:Uo,filterInput:qo,searchAction:Wo,listHeader:Vo,repoCount:Jo,listControls:Go,sortButton:Yo,viewToggle:Ko,viewButton:Xo,viewButtonActive:Zo,repoList:Qo,repoItem:ea,repoInfo:ta,repoIcon:na,repoName:ra,repoDescription:sa,repoMeta:oa,metaItem:aa,language:ia,languageDot:ca},la={home:Pt,repo:at,project:Me,package:On,people:zn,person:Rt,shield:Ie,graph:ke,gear:ot,"git-pull-request":De,eye:ds,lock:ls,code:Oe,"repo-forked":Pn,archive:cs,"repo-template":is};function gn(t){return typeof t=="string"?la[t]||at:t}function da(){const t=z("topnav"),n=Array.isArray(t)?t.map(i=>({...i,icon:gn(i.icon)})):[],s=z("sidenav"),o=Array.isArray(s)?s.map(i=>({...i,icon:gn(i.icon)})):[],r=z("repositories"),a=Array.isArray(r)?r:[];return e.jsx(ae,{title:"dsp-testing",topnav:n,sidenav:o,children:e.jsxs("div",{className:C.content,children:[e.jsxs("header",{className:C.pageHeader,children:[e.jsx("h2",{className:C.pageTitle,children:"All"}),e.jsx(K,{variant:"primary",children:"New repository"})]}),e.jsxs("div",{className:C.filterBar,children:[e.jsx(Ge,{leadingVisual:ns,placeholder:"Filter",value:"copilot",className:C.filterInput,trailingAction:e.jsx(Ge.Action,{icon:rs,"aria-label":"Clear filter"})}),e.jsx(Ge,{leadingVisual:ss,placeholder:"","aria-label":"Search repositories",className:C.searchAction})]}),e.jsxs("div",{className:C.listHeader,children:[e.jsx("span",{className:C.repoCount,children:e.jsxs("strong",{children:[a.length," repositories"]})}),e.jsxs("div",{className:C.listControls,children:[e.jsxs(ye,{children:[e.jsx(ye.Button,{size:"small",className:C.sortButton,children:"Last pushed"}),e.jsx(ye.Overlay,{children:e.jsxs(ue,{children:[e.jsx(ue.Item,{children:"Last pushed"}),e.jsx(ue.Item,{children:"Name"}),e.jsx(ue.Item,{children:"Stars"})]})})]}),e.jsxs("div",{className:C.viewToggle,children:[e.jsx("button",{className:`${C.viewButton} ${C.viewButtonActive}`,"aria-label":"List view",children:e.jsx(os,{size:16})}),e.jsx("button",{className:C.viewButton,"aria-label":"Grid view",children:e.jsx(as,{size:16})})]})]})]}),e.jsx("ul",{className:C.repoList,children:a.map(i=>e.jsxs("li",{className:C.repoItem,children:[e.jsxs("div",{className:C.repoInfo,children:[e.jsx(at,{size:16,className:C.repoIcon}),e.jsx("a",{href:i.url,className:C.repoName,children:i.name}),i.description&&e.jsx("span",{className:C.repoDescription,children:i.description})]}),e.jsxs("div",{className:C.repoMeta,children:[i.language&&e.jsxs("span",{className:C.language,children:[e.jsx("span",{className:C.languageDot}),i.language]}),e.jsx("span",{className:C.metaItem,children:e.jsx(ot,{size:16})}),e.jsxs("span",{className:C.metaItem,children:[e.jsx(Pn,{size:16})," ",i.forks]}),e.jsxs("span",{className:C.metaItem,children:[e.jsx($n,{size:16})," ",i.stars]})]})]},i.name))})]})})}const ua=Object.freeze(Object.defineProperty({__proto__:null,default:da},Symbol.toStringTag,{value:"Module"})),pa="_pageWrapper_1x2wf_1",ha="_breadcrumb_1x2wf_7",ma="_breadcrumbLink_1x2wf_15",ga="_breadcrumbSeparator_1x2wf_27",fa="_breadcrumbCurrent_1x2wf_31",ba="_pageTitle_1x2wf_36",xa="_issueNumber_1x2wf_42",ya="_stateMeta_1x2wf_48",va="_metaText_1x2wf_56",ja="_contentLayout_1x2wf_66",wa="_mainContent_1x2wf_73",_a="_packageTable_1x2wf_78",Sa="_packageColumn_1x2wf_88",ka="_packageLabel_1x2wf_94",Ca="_packageValue_1x2wf_99",Ia="_packageCode_1x2wf_107",Ea="_copyIcon_1x2wf_112",Na="_advisoryBody_1x2wf_118",La="_timeline_1x2wf_165",Ta="_timelineItem_1x2wf_173",Aa="_timelineBadge_1x2wf_179",Ra="_openedIcon_1x2wf_185",Pa="_closedIcon_1x2wf_189",$a="_timelineText_1x2wf_193",za="_botLabel_1x2wf_205",Oa="_sidebar_1x2wf_210",Da="_sidebarSection_1x2wf_216",Ma="_sidebarHeading_1x2wf_228",Ba="_severityScore_1x2wf_234",Ha="_criticalLabel_1x2wf_240",Fa="_scoreText_1x2wf_244",Ua="_metricsHeading_1x2wf_250",qa="_metricsTable_1x2wf_257",Wa="_metricLabel_1x2wf_274",Va="_metricValue_1x2wf_278",Ja="_learnMore_1x2wf_284",Ga="_cvssVector_1x2wf_294",Ya="_epssScore_1x2wf_301",Ka="_tagList_1x2wf_308",Xa="_tag_1x2wf_308",Za="_weaknessList_1x2wf_319",Qa="_weaknessItem_1x2wf_328",ei="_sidebarValue_1x2wf_334",ti="_sidebarLink_1x2wf_340",ni="_contributeText_1x2wf_353",ri="_contributeLink_1x2wf_358",f={pageWrapper:pa,breadcrumb:ha,breadcrumbLink:ma,breadcrumbSeparator:ga,breadcrumbCurrent:fa,pageTitle:ba,issueNumber:xa,stateMeta:ya,metaText:va,contentLayout:ja,mainContent:wa,packageTable:_a,packageColumn:Sa,packageLabel:ka,packageValue:Ca,packageCode:Ia,copyIcon:Ea,advisoryBody:Na,timeline:La,timelineItem:Ta,timelineBadge:Aa,openedIcon:Ra,closedIcon:Pa,timelineText:$a,botLabel:za,sidebar:Oa,sidebarSection:Da,sidebarHeading:Ma,severityScore:Ba,criticalLabel:Ha,scoreText:Fa,metricsHeading:Ua,metricsTable:qa,metricLabel:Wa,metricValue:Va,learnMore:Ja,cvssVector:Ga,epssScore:Ya,tagList:Ka,tag:Xa,weaknessList:Za,weaknessItem:Qa,sidebarValue:ei,sidebarLink:ti,contributeText:ni,contributeLink:ri},si={code:Oe,"issue-opened":Ce,"git-pull-request":De,people:zn,play:st,project:Me,star:$n,book:us,shield:Ie,graph:ke,gear:ot};function oi(){const t=z("topnav"),n=Array.isArray(t)?t.map(c=>({...c,icon:si[c.icon]||Oe})):[],s=z("advisory")||{},o=s.package||{},r=s.severity||{},a=Array.isArray(r.cvssMetrics)?r.cvssMetrics:[],i=Array.isArray(s.tags)?s.tags:[],l=Array.isArray(s.weaknesses)?s.weaknesses:[],u=Array.isArray(s.timeline)?s.timeline:[],p=s.epss||{};return e.jsx(ae,{title:"octodemo",subtitle:"test-se-fs-gitogether-repo",topnav:n,children:e.jsxs("div",{className:f.pageWrapper,children:[e.jsxs("nav",{className:f.breadcrumb,children:[e.jsxs("a",{href:"#",className:f.breadcrumbLink,children:[e.jsx(ps,{size:16}),e.jsx("span",{children:s.breadcrumb})]}),e.jsx("span",{className:f.breadcrumbSeparator,children:"/"}),e.jsxs("span",{className:f.breadcrumbCurrent,children:["#",s.id]})]}),e.jsxs("h1",{className:f.pageTitle,children:[s.title," ",e.jsxs("span",{className:f.issueNumber,children:["#",s.id]})]}),e.jsxs("div",{className:f.stateMeta,children:[e.jsxs(Ur,{status:"issueClosed",variant:"small",children:[e.jsx(sn,{size:16})," Fixed"]}),e.jsxs("span",{className:f.metaText,children:["Opened ",s.openedAgo," on ",e.jsx("strong",{children:o.name})," (",o.ecosystem,") · · · Fixed ",s.fixedAgo]})]}),e.jsxs("div",{className:f.contentLayout,children:[e.jsxs("div",{className:f.mainContent,children:[e.jsxs("div",{className:f.packageTable,children:[e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Package"}),e.jsxs("span",{className:f.packageValue,children:[e.jsx(On,{size:16})," ",o.name," (",o.ecosystem,")"]})]}),e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Affected versions"}),e.jsx("code",{className:f.packageCode,children:o.affectedVersions})]}),e.jsxs("div",{className:f.packageColumn,children:[e.jsx("span",{className:f.packageLabel,children:"Patched version"}),e.jsxs("span",{className:f.packageValue,children:[e.jsx("strong",{children:o.patchedVersion})," ",e.jsx(hs,{size:16,className:f.copyIcon})]})]})]}),e.jsxs("article",{className:f.advisoryBody,children:[e.jsx("h2",{children:"Summary"}),e.jsx("p",{children:"Log4j versions prior to 2.16.0 are subject to a remote code execution vulnerability via the ldap JNDI parser."}),e.jsxs("p",{children:["As per ",e.jsx("a",{href:"#",children:"Apache's Log4j security guide"}),": Apache Log4j2 <=2.14.1 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints. An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers when message lookup substitution is enabled. From log4j 2.16.0, this behavior has been disabled by default."]}),e.jsxs("p",{children:["Log4j version 2.15.0 contained an earlier fix for the vulnerability, but that patch did not disable attacker-controlled JNDI lookups in all situations. For more information, see the ",e.jsx("code",{children:"Updated advice for version 2.16.0"})," section of this advisory."]}),e.jsx("h2",{children:"Impact"}),e.jsx("p",{children:"Logging untrusted or user controlled data with a vulnerable version of Log4J may result in Remote Code Execution (RCE) against your application. This includes untrusted data included in logged errors such as exception traces, authentication failures, and other unexpected vectors of user controlled input."}),e.jsx("h2",{children:"Affected versions"}),e.jsx("p",{children:"Any Log4J version prior to v2.15.0 is affected to this specific issue."}),e.jsx("p",{children:"The v1 branch of Log4J which is considered End Of Life (EOL) is vulnerable to other RCE vectors so the recommendation is to still update to 2.16.0 where possible."}),e.jsx("h2",{children:"Security releases"}),e.jsx("p",{children:"Additional backports of this fix have been made available in versions 2.3.1, 2.12.2, and 2.12.3"}),e.jsx("h2",{children:"Affected packages"}),e.jsxs("p",{children:["Only the ",e.jsx("code",{children:"org.apache.logging.log4j:log4j-core"})," package is directly affected by this vulnerability. The ",e.jsx("code",{children:"org.apache.logging.log4j:log4j-api"})," should be kept at the same version as the ",e.jsx("code",{children:"org.apache.logging.log4j-core"})," package to ensure compatability if in use."]}),e.jsx("h2",{children:"Remediation Advice"}),e.jsx("h3",{children:"Updated advice for version 2.16.0"}),e.jsxs("p",{children:["The Apache Logging Services team provided updated mitigation advice upon the release of version 2.16.0, which ",e.jsx("a",{href:"#",children:"disables JNDI by default and completely removes support for message lookups"}),"."]}),e.jsxs("p",{children:["Even in version 2.15.0, lookups used in layouts to provide specific pieces of context information will still recursively resolve, possibly triggering JNDI lookups. This problem is being tracked as ",e.jsx("a",{href:"#",children:"CVE-2021-45046"}),". More information is available on the ",e.jsx("a",{href:"#",children:"GitHub Security Advisory for CVE-2021-45046"}),"."]}),e.jsxs("p",{children:["Users who want to avoid attacker-controlled JNDI lookups but cannot upgrade to 2.16.0 must ",e.jsx("a",{href:"#",children:"ensure that no such lookups resolve to attacker-provided data and ensure that the JndiLookup class is not loaded"}),"."]}),e.jsx("p",{children:"Please note that Log4J v1 is End Of Life (EOL) and will not receive patches for this issue. Log4J v1 is also vulnerable to other RCE vectors and we recommend you migrate to Log4J 2.16.0 where possible."})]}),e.jsx("div",{className:f.timeline,children:u.map((c,h)=>e.jsxs("div",{className:f.timelineItem,children:[e.jsx("div",{className:f.timelineBadge,children:c.action.includes("closed")?e.jsx(sn,{size:16,className:f.closedIcon}):e.jsx(Ie,{size:16,className:f.openedIcon})}),e.jsx(qr,{src:c.actorAvatar,size:20,alt:c.actor}),e.jsxs("span",{className:f.timelineText,children:[e.jsx("strong",{children:c.actor}),c.isBot&&e.jsx(Ye,{size:"small",className:f.botLabel,children:"bot"})," ",c.action," ",c.timeAgo]})]},h))})]}),e.jsxs("aside",{className:f.sidebar,children:[e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Severity"}),e.jsxs("div",{className:f.severityScore,children:[e.jsx(Ye,{variant:"danger",className:f.criticalLabel,children:r.level}),e.jsx("span",{className:f.scoreText,children:r.score})]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h4",{className:f.metricsHeading,children:"CVSS v3 base metrics"}),e.jsx("table",{className:f.metricsTable,children:e.jsx("tbody",{children:a.map(c=>e.jsxs("tr",{children:[e.jsx("td",{className:f.metricLabel,children:c.label}),e.jsx("td",{className:f.metricValue,children:c.value})]},c.label))})}),e.jsx("a",{href:"#",className:f.learnMore,children:"Learn more about base metrics"}),e.jsx("p",{className:f.cvssVector,children:r.cvssVector})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"EPSS score"}),e.jsxs("p",{className:f.epssScore,children:[p.score," (",p.percentile,")"]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Tags"}),e.jsx("div",{className:f.tagList,children:i.map(c=>e.jsx(Ye,{className:f.tag,children:c},c))})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"Weaknesses"}),e.jsx("ul",{className:f.weaknessList,children:l.map(c=>e.jsxs("li",{className:f.weaknessItem,children:["▸ ",c]},c))})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"CVE ID"}),e.jsx("p",{className:f.sidebarValue,children:s.cveId})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("h3",{className:f.sidebarHeading,children:"GHSA ID"}),e.jsx("p",{className:f.sidebarValue,children:s.ghsaId})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsxs("a",{href:"#",className:f.sidebarLink,children:[e.jsx(ms,{size:16})," See advisory in GitHub Advisory Database"]}),e.jsxs("a",{href:"#",className:f.sidebarLink,children:[e.jsx(at,{size:16})," See all of your affected repositories"]})]}),e.jsxs("div",{className:f.sidebarSection,children:[e.jsx("p",{className:f.contributeText,children:"See something to contribute?"}),e.jsx("a",{href:"#",className:f.contributeLink,children:"Suggest improvements for this advisory on the GitHub Advisory Database."})]})]})]})]})})}const ai=Object.freeze(Object.defineProperty({__proto__:null,default:oi},Symbol.toStringTag,{value:"Module"})),vt=["Account","Organization","Workspace","Review"];function te(t){return typeof t=="string"?t:""}function fn(t){return t===!0||t==="true"}function Ve({name:t,defaultValue:n,onCommit:s,...o}){const r=b.useRef(n);return e.jsx(fe,{name:t,defaultValue:n,onChange:({value:a})=>{r.current=a},onBlur:()=>s(r.current),...o})}function ii(){const t=Lt(),[n,s]=v("signup.step"),o=Math.min(Math.max(parseInt(n,10)||0,0),vt.length-1),r=_=>{const P=typeof _=="function"?_(o):_;s(String(P))},[a,i,l]=v("signup.errors.fullName"),[u,p,c]=v("signup.errors.email"),[h,g,x]=v("signup.errors.password"),[I,w,R]=v("signup.errors.orgName"),[O,D,H]=v("signup.errors.orgSize"),[ce,ee,j]=v("signup.errors.role"),[L,A,E]=v("signup.errors.region"),[M,T,F]=v("signup.errors.plan"),[V,U,jr]=v("signup.errors.agreeTerms"),S={fullName:a,email:u,password:h,orgName:I,orgSize:O,role:ce,region:L,plan:M,agreeTerms:V},wr={fullName:i,email:p,password:g,orgName:w,orgSize:D,role:ee,region:A,plan:T,agreeTerms:U},_r={fullName:l,email:c,password:x,orgName:R,orgSize:H,role:j,region:E,plan:F,agreeTerms:jr},Sr=()=>Object.values(_r).forEach(_=>_()),Ft=_=>{Sr(),Object.entries(_).forEach(([P,Dr])=>wr[P]?.(Dr))},[Ut,kr]=v("signup.fullName"),[qt,Cr]=v("signup.email"),[Wt,Ir]=v("signup.password"),[Vt,Er]=v("signup.organization.name"),[Jt,Nr]=v("signup.organization.size"),[Gt,Lr]=v("signup.organization.role"),[Yt,Tr]=v("signup.workspace.region"),[Kt,Ar]=v("signup.workspace.plan"),[Xt,Rr]=v("signup.workspace.newsletter"),[Zt,Pr]=v("signup.workspace.agreeTerms"),k=b.useMemo(()=>({fullName:te(Ut),email:te(qt),password:te(Wt),orgName:te(Vt),orgSize:te(Jt),role:te(Gt),region:te(Yt),plan:te(Kt)||"starter",newsletter:fn(Xt),agreeTerms:fn(Zt)}),[Ut,qt,Wt,Vt,Jt,Gt,Yt,Kt,Xt,Zt]);function Qt(_){const P={};return _===0&&(k.fullName.trim()||(P.fullName="Full name is required."),k.email.trim()||(P.email="Email is required."),k.password.trim()||(P.password="Password is required.")),_===1&&(k.orgName.trim()||(P.orgName="Organization name is required."),k.orgSize.trim()||(P.orgSize="Organization size is required."),k.role.trim()||(P.role="Role is required.")),_===2&&(k.region.trim()||(P.region="Region is required."),k.plan.trim()||(P.plan="Plan is required."),k.agreeTerms||(P.agreeTerms="You must accept terms to continue.")),Ft(P),Object.keys(P).length===0}function $r(){Qt(o)&&r(_=>Math.min(_+1,vt.length-1))}function zr(){Ft({}),r(_=>Math.max(_-1,0))}function Or(){if(!Qt(2)){r(2);return}t("/Dashboard")}return e.jsx(Pe,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(d,{backgroundColor:"page",minHeight:"100vh",padding:6,align:"center",justify:"center",children:e.jsxs(d,{maxWidth:"560px",width:"100%",direction:"column",gap:6,children:[e.jsxs(d,{direction:"column",gap:2,children:[e.jsx(m,{variant:"featured-1",weight:"bold",children:"Create your cloud account"}),e.jsx(m,{variant:"body-2",color:"neutral-faded",children:"Complete the onboarding flow to configure your account and organization."})]}),e.jsx(nn,{activeId:String(o),children:vt.map((_,P)=>e.jsx(nn.Item,{id:String(P),title:_,completed:P<o,subtitle:`Step ${P+1}`},_))}),e.jsx(oe,{padding:6,children:e.jsxs(d,{direction:"column",gap:5,children:[o===0&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!S.fullName,children:[e.jsx(y.Label,{children:"Full name"}),e.jsx(Ve,{name:"fullName",defaultValue:k.fullName,placeholder:"Jane Doe",onCommit:kr}),S.fullName&&e.jsx(y.Error,{children:S.fullName})]}),e.jsxs(y,{hasError:!!S.email,children:[e.jsx(y.Label,{children:"Email"}),e.jsx(Ve,{name:"email",defaultValue:k.email,placeholder:"jane@acme.cloud",onCommit:Cr}),S.email&&e.jsx(y.Error,{children:S.email})]}),e.jsxs(y,{hasError:!!S.password,children:[e.jsx(y.Label,{children:"Password"}),e.jsx(Ve,{name:"password",defaultValue:k.password,onCommit:Ir,inputAttributes:{type:"password"}}),S.password&&e.jsx(y.Error,{children:S.password})]})]}),o===1&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!S.orgName,children:[e.jsx(y.Label,{children:"Organization name"}),e.jsx(Ve,{name:"orgName",defaultValue:k.orgName,placeholder:"Acme Cloud",onCommit:Er}),S.orgName&&e.jsx(y.Error,{children:S.orgName})]}),e.jsxs(y,{hasError:!!S.orgSize,children:[e.jsx(y.Label,{children:"Organization size"}),e.jsxs(be,{name:"orgSize",value:k.orgSize,placeholder:"Select size",onChange:({value:_})=>Nr(_),children:[e.jsx("option",{value:"1-10",children:"1–10 employees"}),e.jsx("option",{value:"11-50",children:"11–50 employees"}),e.jsx("option",{value:"51-250",children:"51–250 employees"}),e.jsx("option",{value:"251+",children:"251+ employees"})]}),S.orgSize&&e.jsx(y.Error,{children:S.orgSize})]}),e.jsxs(y,{hasError:!!S.role,children:[e.jsx(y.Label,{children:"Your role"}),e.jsxs(be,{name:"role",value:k.role,placeholder:"Select role",onChange:({value:_})=>Lr(_),children:[e.jsx("option",{value:"founder",children:"Founder"}),e.jsx("option",{value:"engineering-manager",children:"Engineering Manager"}),e.jsx("option",{value:"developer",children:"Developer"}),e.jsx("option",{value:"platform-admin",children:"Platform Admin"})]}),S.role&&e.jsx(y.Error,{children:S.role})]})]}),o===2&&e.jsxs(e.Fragment,{children:[e.jsxs(y,{hasError:!!S.region,children:[e.jsx(y.Label,{children:"Primary region"}),e.jsxs(be,{name:"region",value:k.region,placeholder:"Select region",onChange:({value:_})=>Tr(_),children:[e.jsx("option",{value:"us-east-1",children:"US East"}),e.jsx("option",{value:"us-west-2",children:"US West"}),e.jsx("option",{value:"eu-west-1",children:"EU West"}),e.jsx("option",{value:"ap-southeast-1",children:"AP Southeast"})]}),S.region&&e.jsx(y.Error,{children:S.region})]}),e.jsxs(y,{hasError:!!S.plan,children:[e.jsx(y.Label,{children:"Starting plan"}),e.jsxs(be,{name:"plan",value:k.plan,onChange:({value:_})=>Ar(_),children:[e.jsx("option",{value:"starter",children:"Starter"}),e.jsx("option",{value:"growth",children:"Growth"}),e.jsx("option",{value:"enterprise",children:"Enterprise"})]}),S.plan&&e.jsx(y.Error,{children:S.plan})]}),e.jsx(wt,{name:"newsletter",checked:k.newsletter,onChange:({checked:_})=>Rr(_?"true":"false"),children:"Email me product updates and onboarding tips"}),e.jsxs(y,{hasError:!!S.agreeTerms,children:[e.jsx(wt,{name:"agreeTerms",checked:k.agreeTerms,onChange:({checked:_})=>Pr(_?"true":"false"),children:"I agree to the Terms of Service and Privacy Policy"}),S.agreeTerms&&e.jsx(y.Error,{children:S.agreeTerms})]})]}),o===3&&e.jsxs(d,{direction:"column",gap:4,children:[e.jsx(m,{variant:"featured-3",weight:"bold",children:"Review your configuration"}),e.jsxs(d,{direction:"column",gap:3,children:[e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Name"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.fullName})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Email"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.email})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Organization"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.orgName})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Team size"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.orgSize})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Role"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.role})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Region"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.region})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Plan"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.plan})})]}),e.jsxs(d,{direction:"row",align:"center",children:[e.jsx(d.Item,{columns:4,children:e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Newsletter"})}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-2",children:k.newsletter?"Yes":"No"})})]})]})]}),e.jsxs(d,{direction:"row",justify:"end",gap:3,children:[o>0&&e.jsx(Q,{variant:"ghost",onClick:zr,children:"Back"}),o<3&&e.jsx(Q,{color:"primary",onClick:$r,children:"Continue"}),o===3&&e.jsx(Q,{color:"primary",onClick:Or,children:"Create account"})]})]})})]})})})}const ci=Object.freeze(Object.defineProperty({__proto__:null,default:ii},Symbol.toStringTag,{value:"Module"})),li="/storyboard/branch--comments-system/assets/mona-loading-a6vFIHDd.gif",di="_container_1dofh_1",ui="_contentBox_1dofh_12",pi="_codeLine_1dofh_21",hi="_iconWrapper_1dofh_26",mi="_codeText_1dofh_32",gi="_monaWrapper_1dofh_39",fi="_footerHeader_1dofh_45",bi="_tipsText_1dofh_50",xi="_warningText_1dofh_55",X={container:di,contentBox:ui,codeLine:pi,iconWrapper:hi,codeText:mi,monaWrapper:gi,footerHeader:fi,tipsText:bi,warningText:xi};function yi(){return e.jsxs("div",{className:X.container,children:[e.jsx(An,{size:24}),e.jsx(Co,{}),e.jsxs(B,{padding:"spacious",className:X.contentBox,children:[e.jsx(bn,{icon:gs,iconColor:"success.fg",children:"Mona's playground successfully initialised..."}),e.jsxs(bn,{icon:fs,iconColor:"accent.fg",children:["Visit ",e.jsx(N,{className:X.warningText,children:"src/Playground.js"})," ","and start building your own layouts using Primer."]}),e.jsx("div",{className:X.monaWrapper,children:e.jsx("img",{src:li,alt:"mona",width:48,height:48})})]}),e.jsx(vi,{})]})}function bn({icon:t,iconColor:n,children:s}){return e.jsxs(B,{direction:"horizontal",className:X.codeLine,children:[e.jsx(B,{className:X.iconWrapper,children:e.jsx(t,{size:16})}),e.jsx(N,{as:"p",className:X.codeText,children:s})]})}function vi(){return e.jsxs(B,{gap:"condensed",children:[e.jsxs(B,{direction:"horizontal",className:X.footerHeader,children:[e.jsx(At,{size:18}),e.jsx(N,{className:X.tipsText,children:"Tips"})]}),e.jsxs(N,{children:["Before you get started check out our"," ",e.jsx(tn,{href:"https://primer.style/react",target:"_blank",children:"Primer React Documentation"})," ","and"," ",e.jsx(tn,{href:"https://ui.githubapp.com/storybook/?path=/docs/templates-readme--docs&globals=viewport:narrow",target:"_blank",children:"Primer Templates (staff only)"})]})]})}const ji="_container_m20cu_1",wi="_buttonWrapper_m20cu_7",_i="_label_m20cu_12",jt={container:ji,buttonWrapper:wi,label:_i};function nr(){const{setDayScheme:t,setNightScheme:n,colorScheme:s}=Wr(),o=i=>{t(i),n(i)},r=[{name:"Light",value:"light",icon:on},{name:"Light colorblind",value:"light_colorblind",icon:on},{name:"Dark",value:"dark",icon:Ue},{name:"Dark colorblind",value:"dark_colorblind",icon:Ue},{name:"Dark high contrast",value:"dark_high_contrast",icon:Ue},{name:"Dark Dimmed",value:"dark_dimmed",icon:Ue}],a=r.find(i=>i.value===s);return e.jsx(B,{padding:"normal",className:jt.container,children:e.jsx(B,{className:jt.buttonWrapper,children:e.jsxs(ye,{children:[e.jsxs(ye.Button,{size:"small",children:[e.jsx(a.icon,{}),e.jsxs(B,{className:jt.label,children:[" ",a.name]})]}),e.jsx(ye.Overlay,{align:"right",children:e.jsx(ue,{showDividers:!0,children:e.jsx(ue.Group,{selectionVariant:"single",children:r.map(i=>e.jsx(ue.Item,{href:"#",selected:i.value===s,onSelect:()=>o(i.value),children:i.name},i.value))})})})]})})})}function Si(){return e.jsxs(e.Fragment,{children:[e.jsx(yi,{}),e.jsx(nr,{})]})}const ki=Object.freeze(Object.defineProperty({__proto__:null,default:Si},Symbol.toStringTag,{value:"Module"})),rr={todo:"Todo",in_progress:"In Progress",done:"Done",cancelled:"Cancelled"},sr={urgent:"Urgent",high:"High",medium:"Medium",low:"Low"},Ci=Object.entries(rr),Ii=Object.entries(sr);function or({prefix:t}){const[n,s]=v(`${t}.title`),[o,r]=v(`${t}.description`),[a,i]=v(`${t}.status`),[l,u]=v(`${t}.priority`),[p,c]=v(`${t}.assignee`),[h,g]=v(`${t}.project`),[x,I]=v(`${t}.estimate`);return e.jsxs(d,{direction:"column",gap:4,children:[e.jsxs(y,{children:[e.jsx(y.Label,{children:"Title"}),e.jsx(fe,{name:"title",value:n??"",onChange:({value:w})=>s(w)})]}),e.jsxs(y,{children:[e.jsx(y.Label,{children:"Description"}),e.jsx(fe,{name:"description",multiline:!0,value:o??"",onChange:({value:w})=>r(w),inputAttributes:{rows:3}})]}),e.jsxs(d,{direction:"row",gap:4,children:[e.jsx(d.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Status"}),e.jsx(be,{name:"status",value:a??"todo",onChange:({value:w})=>i(w),children:Ci.map(([w,R])=>e.jsx("option",{value:w,children:R},w))})]})}),e.jsx(d.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Priority"}),e.jsx(be,{name:"priority",value:l??"medium",onChange:({value:w})=>u(w),children:Ii.map(([w,R])=>e.jsx("option",{value:w,children:R},w))})]})})]}),e.jsxs(d,{direction:"row",gap:4,children:[e.jsx(d.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Assignee"}),e.jsx(fe,{name:"assignee",placeholder:"Username",value:p??"",onChange:({value:w})=>c(w)})]})}),e.jsx(d.Item,{grow:!0,children:e.jsxs(y,{children:[e.jsx(y.Label,{children:"Project"}),e.jsx(fe,{name:"project",placeholder:"Project name",value:h??"",onChange:({value:w})=>g(w)})]})})]}),e.jsxs(y,{children:[e.jsx(y.Label,{children:"Estimate (points)"}),e.jsx(fe,{name:"estimate",placeholder:"e.g. 5",value:x??"",onChange:({value:w})=>I(w)})]})]})}const Ei={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},Je=["title","description","status","priority","assignee","project","estimate"];function Ni({issue:t,active:n,onClose:s}){const o={title:le("issues",t.id,"title"),description:le("issues",t.id,"description"),status:le("issues",t.id,"status"),priority:le("issues",t.id,"priority"),assignee:le("issues",t.id,"assignee"),project:le("issues",t.id,"project"),estimate:le("issues",t.id,"estimate")},r=()=>{Je.forEach(l=>{he(`draft.edit.${l}`,t[l]??"")})},a=()=>{const l=new URLSearchParams(window.location.hash.replace(/^#/,""));Je.forEach(u=>{const[,p]=o[u];p(l.get(`draft.edit.${u}`)??"")}),Je.forEach(u=>Qe(`draft.edit.${u}`)),s({reason:"save"})},i=()=>{Je.forEach(l=>Qe(`draft.edit.${l}`)),s({reason:"cancel"})};return e.jsxs(ve,{active:n,onClose:i,onOpen:r,size:"600px",padding:6,position:"center",children:[e.jsx(ve.Title,{children:"Edit Issue"}),e.jsx(ve.Subtitle,{children:t.identifier}),e.jsxs(d,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(or,{prefix:"draft.edit"}),e.jsxs(d,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(Q,{variant:"outline",onClick:i,children:"Cancel"}),e.jsx(Q,{color:"primary",onClick:a,children:"Save"})]})]})]})}function Li(){const[t,n,s]=v("ui.editModal"),o=t==="true",r=Xn("issues","id"),a=z("signup.organization.name"),i=z("signup.fullName"),l=z("signup.organization.role");return r?e.jsx(Pe,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(d,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(d,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(d.Item,{columns:2,children:e.jsx(rt,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(d.Item,{grow:!0,children:e.jsxs(d,{direction:"row",gap:8,align:"start",children:[e.jsx(d.Item,{grow:!0,children:e.jsxs(d,{direction:"column",gap:4,maxWidth:"720px",children:[e.jsxs(d,{direction:"row",gap:2,align:"center",justify:"space-between",children:[e.jsxs(d,{direction:"row",gap:2,align:"center",children:[e.jsx(Se,{to:"/issues",style:{textDecoration:"none"},children:e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:a||"Workspace"})}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"›"}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:r.identifier})]}),e.jsx(Q,{variant:"outline",size:"small",onClick:()=>n("true"),children:"Edit issue"})]}),e.jsx(Ni,{issue:r,active:o,onClose:()=>s()}),e.jsx(m,{variant:"featured-1",weight:"bold",children:r.title}),r.description&&e.jsx(m,{variant:"body-2",color:"neutral-faded",children:r.description}),r.acceptanceCriteria?.length>0&&e.jsxs(d,{direction:"column",gap:2,children:[e.jsx(m,{variant:"body-2",weight:"bold",children:"Acceptance Criteria"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:r.acceptanceCriteria.map((u,p)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(m,{variant:"body-3",children:u})},p))})]}),r.technicalNotes?.length>0&&e.jsxs(d,{direction:"column",gap:2,children:[e.jsx(m,{variant:"body-2",weight:"bold",children:"Technical Notes"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:r.technicalNotes.map((u,p)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(m,{variant:"body-3",children:u})},p))})]}),e.jsx(Z,{}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"+ Add sub-issues"}),e.jsx(Z,{}),e.jsxs(d,{direction:"column",gap:3,children:[e.jsx(m,{variant:"body-2",weight:"bold",children:"Activity"}),(r.activity||[]).map((u,p)=>e.jsxs(d,{direction:"row",gap:3,align:"center",children:[e.jsx(rn,{src:u.avatar,initials:u.user?.[0]?.toUpperCase(),size:6}),e.jsxs(d,{direction:"column",children:[e.jsxs(m,{variant:"body-3",children:[e.jsx(m,{weight:"medium",children:u.user}),u.type==="created"&&" created the issue",u.type==="comment"&&":"]}),u.body&&e.jsx(m,{variant:"body-3",color:"neutral-faded",children:u.body}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:u.time})]})]},p))]})]})}),e.jsx(d.Item,{columns:3,children:e.jsx(oe,{padding:4,children:e.jsxs(d,{direction:"column",gap:4,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:"Properties"}),e.jsx(Z,{}),e.jsxs(d,{direction:"column",gap:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Status"}),e.jsx(m,{variant:"body-3",children:rr[r.status]||r.status})]}),e.jsxs(d,{direction:"column",gap:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Priority"}),e.jsx(m,{variant:"body-3",children:sr[r.priority]||r.priority})]}),e.jsxs(d,{direction:"column",gap:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Assignee"}),r.assignee?e.jsxs(d,{direction:"row",gap:2,align:"center",children:[e.jsx(rn,{src:r.assigneeAvatar,initials:r.assignee?.[0]?.toUpperCase(),size:5}),e.jsx(m,{variant:"body-3",children:r.assignee})]}):e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"Assign"})]}),e.jsxs(d,{direction:"column",gap:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Labels"}),e.jsx(d,{direction:"row",gap:1,wrap:!0,children:(r.labels||[]).map(u=>e.jsx($e,{size:"small",color:Ei[u]||"neutral",children:u},u))})]}),e.jsxs(d,{direction:"column",gap:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Project"}),e.jsx(m,{variant:"body-3",color:r.project?void 0:"neutral-faded",children:r.project||"Add to project"})]}),r.estimate&&e.jsxs(d,{direction:"column",gap:1,children:[e.jsx(m,{variant:"caption-1",color:"neutral-faded",children:"Estimate"}),e.jsxs(m,{variant:"body-3",children:[r.estimate," points"]})]})]})})})]})})]})})}):e.jsx(Pe,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(d,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(d,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(d.Item,{columns:2,children:e.jsx(rt,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(d.Item,{grow:!0,children:e.jsxs(d,{direction:"column",gap:4,align:"center",paddingBlock:16,children:[e.jsx(m,{variant:"featured-2",weight:"bold",children:"Issue not found"}),e.jsx(m,{variant:"body-3",color:"neutral-faded",children:"The issue you're looking for doesn't exist."}),e.jsx(Se,{to:"/issues",children:"← Back to all issues"})]})})]})})})}const Ti=Object.freeze(Object.defineProperty({__proto__:null,default:Li},Symbol.toStringTag,{value:"Module"})),Ai="_issueRow_1cpdh_1",Ri={issueRow:Ai},Pi={todo:"○",in_progress:"◐",done:"●",cancelled:"✕"},$i={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},zi={title:"",description:"",status:"todo",priority:"medium",assignee:"",project:"",estimate:""},St=["title","description","status","priority","assignee","project","estimate"];function xn(t){St.forEach(n=>Qe(`${t}.${n}`))}function Oi({active:t,onClose:n,issueCount:s}){const[o]=v("draft.create.title"),r=Lt(),a=`FIL-${s+1}`,i=()=>{St.forEach(p=>{he(`draft.create.${p}`,zi[p])})},l=()=>{if(!(o??"").trim())return;const p=o.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`new-issue-${s+1}`;St.forEach(c=>{const h=new URLSearchParams(window.location.hash.replace(/^#/,"")).get(`draft.create.${c}`)??"";he(`record.issues.${p}.${c}`,h)}),he(`record.issues.${p}.identifier`,a),xn("draft.create"),n({reason:"save"}),r(`/issues/${p}`)},u=()=>{xn("draft.create"),n({reason:"cancel"})};return e.jsxs(ve,{active:t,onClose:u,onOpen:i,size:"600px",padding:6,position:"center",children:[e.jsx(ve.Title,{children:"Create Issue"}),e.jsx(ve.Subtitle,{children:a}),e.jsxs(d,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(or,{prefix:"draft.create"}),e.jsxs(d,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(Q,{variant:"outline",onClick:u,children:"Cancel"}),e.jsx(Q,{color:"primary",onClick:l,children:"Save"})]})]})]})}function Di(){const[t,n,s]=v("ui.createModal"),o=t==="true",r=Zn("issues"),a=z("signup.organization.name"),i=z("signup.fullName"),l=z("signup.organization.role"),u=r.filter(c=>c.status!=="done"&&c.status!=="cancelled"),p=r.filter(c=>c.status==="done"||c.status==="cancelled");return e.jsx(Pe,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(d,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(d,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(d.Item,{columns:2,children:e.jsx(rt,{orgName:a,activePage:"Issues",userInfo:{name:i,role:l}})}),e.jsx(d.Item,{grow:!0,children:e.jsxs(d,{direction:"column",gap:4,maxWidth:"900px",children:[e.jsxs(d,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(m,{variant:"featured-2",weight:"bold",children:"Issues"}),e.jsxs(d,{direction:"row",gap:2,align:"center",children:[e.jsxs($e,{color:"neutral",children:[r.length," total"]}),e.jsx(Q,{size:"small",color:"primary",onClick:()=>n("true"),children:"Create issue"})]})]}),e.jsx(Oi,{active:o,onClose:()=>s(),issueCount:r.length}),e.jsxs(d,{direction:"column",gap:0,children:[e.jsx(d,{paddingBlock:2,paddingInline:3,children:e.jsxs(m,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Open · ",u.length]})}),e.jsx(Z,{}),u.map(c=>e.jsx(yn,{issue:c},c.id))]}),p.length>0&&e.jsxs(d,{direction:"column",gap:0,children:[e.jsx(d,{paddingBlock:2,paddingInline:3,children:e.jsxs(m,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Closed · ",p.length]})}),e.jsx(Z,{}),p.map(c=>e.jsx(yn,{issue:c},c.id))]})]})})]})})})}function yn({issue:t}){return e.jsxs(e.Fragment,{children:[e.jsx(Se,{to:`/issues/${t.id}`,className:Ri.issueRow,children:e.jsxs(d,{direction:"row",align:"center",gap:3,padding:3,children:[e.jsx(m,{variant:"body-3",color:"neutral-faded",attributes:{style:{minWidth:20}},children:Pi[t.status]||"○"}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",attributes:{style:{minWidth:50}},children:t.identifier}),e.jsx(d.Item,{grow:!0,children:e.jsx(m,{variant:"body-3",children:t.title})}),e.jsx(d,{direction:"row",gap:1,children:(t.labels||[]).map(n=>e.jsx($e,{size:"small",color:$i[n]||"neutral",children:n},n))}),e.jsx(m,{variant:"caption-1",color:"neutral-faded",attributes:{style:{textTransform:"capitalize"}},children:t.priority})]})}),e.jsx(Z,{})]})}const Mi=Object.freeze(Object.defineProperty({__proto__:null,default:Di},Symbol.toStringTag,{value:"Module"}));function Bi(){const t=Xn("posts","id");return t?e.jsx(ae,{title:"Blog",subtitle:t.title,children:e.jsxs("article",{style:{maxWidth:"720px",padding:"2rem"},children:[e.jsxs("header",{children:[e.jsx(N,{as:"h1",sx:{fontSize:4,mb:2},children:t.title}),e.jsxs(N,{as:"p",color:"fg.muted",sx:{mb:3},children:[t.author," · ",t.date]}),t.summary&&e.jsx(Ye,{variant:"accent",sx:{mb:3},children:t.summary})]}),e.jsx(N,{as:"div",sx:{mt:3,lineHeight:1.6},children:(t.body||"").split(`

`).map((n,s)=>e.jsx("p",{children:n},s))}),e.jsx("footer",{style:{marginTop:"2rem",borderTop:"1px solid var(--borderColor-muted)",paddingTop:"1rem"},children:e.jsx(Se,{to:"/posts",children:"← Back to all posts"})})]})}):e.jsx(ae,{title:"Blog",subtitle:"Post",children:e.jsxs("section",{style:{padding:"2rem"},children:[e.jsx(N,{as:"h1",children:"Post not found"}),e.jsx(N,{as:"p",color:"fg.muted",children:"The post you're looking for doesn't exist."}),e.jsx(Se,{to:"/posts",children:"← Back to all posts"})]})})}const Hi=Object.freeze(Object.defineProperty({__proto__:null,default:Bi},Symbol.toStringTag,{value:"Module"}));function Fi(){const t=Zn("posts");return e.jsx(ae,{title:"Blog",subtitle:"All Posts",children:e.jsxs("section",{style:{maxWidth:"720px",padding:"2rem"},children:[e.jsx(N,{as:"h1",sx:{fontSize:4,mb:3},children:"Blog"}),t.map(n=>e.jsxs("article",{style:{marginBottom:"1.5rem",paddingBottom:"1.5rem",borderBottom:"1px solid var(--borderColor-muted)"},children:[e.jsx(Se,{to:`/posts/${n.id}`,style:{textDecoration:"none"},children:e.jsx(N,{as:"h2",sx:{fontSize:2,color:"accent.fg"},children:n.title})}),e.jsxs(N,{as:"p",color:"fg.muted",sx:{fontSize:1,mt:1},children:[n.author," · ",n.date]}),n.summary&&e.jsx(N,{as:"p",sx:{mt:1},children:n.summary})]},n.id))]})})}const Ui=Object.freeze(Object.defineProperty({__proto__:null,default:Fi},Symbol.toStringTag,{value:"Module"}));var ne={route:[/^.*\/src\/pages\/|\.(jsx|tsx|mdx)$/g,""],splat:[/\[\.{3}\w+\]/g,"*"],param:[/\[([^\]]+)\]/g,":$1"],slash:[/^index$|\./g,"/"],optional:[/^-(:?[\w-]+|\*)/,"$1?"]},qi=t=>Object.keys(t).reduce((n,s)=>{const o=s.replace(...ne.route);return{...n,[o]:t[s]}},{}),Wi=(t,n)=>Object.keys(t).filter(o=>!o.includes("/_")||/_layout\.(jsx|tsx)$/.test(o)).reduce((o,r)=>{const a=t[r],i={id:r.replace(...ne.route),...n(a,r)},l=r.replace(...ne.route).replace(...ne.splat).replace(...ne.param).split("/").filter(Boolean);return l.reduce((u,p,c)=>{const h=p.replace(...ne.slash).replace(...ne.optional),g=c===0,x=c===l.length-1&&l.length>1,I=!g&&!x,w=p==="_layout",R=/\([\w-]+\)/.test(h),O=/^\w|\//.test(h)?"unshift":"push";if(g&&l.length===1)return o.push({path:h,...i}),u;if(g||I){const D=g?o:u.children,H=D?.find(ee=>ee.path===h||ee.id?.replace("/_layout","").split("/").pop()===h),ce=R?i?.component?{id:h,path:"/"}:{id:h}:{path:h};return H?H.children??=[]:D?.[O]({...ce,children:[]}),H||D?.[O==="unshift"?0:D.length-1]}return w?Object.assign(u,i):(x&&u?.children?.[O](i?.index?i:{path:h,...i}),u)},{}),o},[]),Vi=t=>Object.keys(t).reduce((n,s)=>{const o=s.replace(...ne.route).replace(/\+|\([\w-]+\)\//g,"").replace(/(\/)?index/g,"").replace(/\./g,"/");return{...n,[`/${o}`]:t[s]?.default}},{}),Ji=Object.assign({"/src/pages/_app.jsx":Xs}),Gi=Object.assign({}),Yi=Object.assign({"/src/pages/Dashboard.jsx":ro,"/src/pages/Forms.jsx":No,"/src/pages/Issues.jsx":Ro,"/src/pages/Overview.jsx":Mo,"/src/pages/Repositories.jsx":ua,"/src/pages/SecurityAdvisory.jsx":ai,"/src/pages/Signup.jsx":ci,"/src/pages/index.jsx":ki,"/src/pages/issues/[id].jsx":Ti,"/src/pages/issues/index.jsx":Mi,"/src/pages/posts/[id].jsx":Hi,"/src/pages/posts/index.jsx":Ui}),ar=qi(Ji),Ki=Vi(Gi),Xi=Wi(Yi,(t,n)=>{const s=/index\.(jsx|tsx|mdx)$/.test(n)&&!n.includes("pages/index")?{index:!0}:{},o=t?.default||b.Fragment;return{...s,Component:()=>t?.Pending?e.jsx(b.Suspense,{fallback:e.jsx(t.Pending,{}),children:e.jsx(o,{})}):e.jsx(o,{}),ErrorBoundary:t?.Catch,loader:t?.Loader,action:t?.Action}}),_e=ar?._app,Zi=ar?.["404"],Qi=_e?.default||Tn,ec=()=>{const t=Ki[Kr().state?.modal]||b.Fragment;return e.jsx(t,{})},kt=()=>e.jsxs(e.Fragment,{children:[e.jsx(Qi,{})," ",e.jsx(ec,{})]}),tc=()=>_e?.Pending?e.jsx(b.Suspense,{fallback:e.jsx(_e.Pending,{}),children:e.jsx(kt,{})}):e.jsx(kt,{}),nc={Component:_e?.default?tc:kt,ErrorBoundary:_e?.Catch,loader:_e?.Loader},rc={path:"*",Component:Zi?.default||b.Fragment},sc=[{...nc,children:[...Xi,rc]}];const ir="sb-comments-token",cr="sb-comments-user";function lr(){try{return localStorage.getItem(ir)}catch{return null}}function oc(t){localStorage.setItem(ir,t)}function dr(){try{const t=localStorage.getItem(cr);return t?JSON.parse(t):null}catch{return null}}async function ac(t){const n=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!n.ok)throw new Error("Invalid token — GitHub returned "+n.status);const s=await n.json(),o={login:s.login,avatarUrl:s.avatar_url};return localStorage.setItem(cr,JSON.stringify(o)),o}function Mt(){return lr()!==null}let pe=!1;const Ct=new Set;function Ke(){return pe}function ic(){return Yn()?!pe&&!Mt()?(console.warn("[storyboard] Sign in first to use comments"),!1):(pe=!pe,ur(),pe):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}function cc(t){pe=t,ur()}function lc(t){return Ct.add(t),()=>Ct.delete(t)}function ur(){for(const t of Ct)t(pe)}const vn=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function It(t){if(!t)return{meta:null,text:""};const n=t.match(vn);if(!n)return{meta:null,text:t.trim()};try{const s=JSON.parse(n[1]),o=t.replace(vn,"").trim();return{meta:s,text:o}}catch{return{meta:null,text:t.trim()}}}function Et(t,n){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${n}`}function dc(t,n){const{meta:s,text:o}=It(t),r={...s,...n};return Et(r,o)}const uc="https://api.github.com/graphql";async function ie(t,n={},s={}){const{retries:o=2}=s,r=lr();if(!r)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let i=0;i<=o;i++)try{const l=await fetch(uc,{method:"POST",headers:{Authorization:`bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:n})});if(l.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!l.ok)throw new Error(`GitHub API error: ${l.status} ${l.statusText}`);const u=await l.json();if(u.errors?.length)throw new Error(`GraphQL error: ${u.errors.map(p=>p.message).join(", ")}`);return u.data}catch(l){if(a=l,l.message.includes("401")||l.message.includes("Not authenticated")||l.message.includes("invalid or expired"))throw l;i<o&&await new Promise(u=>setTimeout(u,1e3*(i+1)))}throw a}const pc=`
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
`,hc=`
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
`,mc=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,gc=`
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
`,fc=`
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
`,bc=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,xc=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,yc=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`;async function pr(t){const n=Gn(),o=`"${`Comments: ${t}`}" in:title repo:${n.repo.owner}/${n.repo.name}`,a=(await ie(pc,{query:o})).search?.nodes?.[0];if(!a)return null;const i=(a.comments?.nodes??[]).map(l=>{const{meta:u,text:p}=It(l.body);return{...l,meta:u,text:p,replies:(l.replies?.nodes??[]).map(c=>{const{meta:h,text:g}=It(c.body);return{...c,meta:h,text:g}})}});return{...a,comments:i}}async function vc(){const t=Gn(),n=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),s=await ie(hc,{owner:t.repo.owner,name:t.repo.name,slug:n}),o=s.repository?.id;let r=s.repository?.discussionCategory?.id;if(r||(r=s.repository?.discussionCategories?.nodes?.find(i=>i.name===t.discussions.category)?.id),!o||!r)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:o,categoryId:r}}async function jc(t,n,s,o){let r=await pr(t);if(!r){const{repositoryId:l,categoryId:u}=await vc(),p=`Comments: ${t}`,c=Et({route:t,createdAt:new Date().toISOString()},"");r=(await ie(mc,{repositoryId:l,categoryId:u,title:p,body:c})).createDiscussion.discussion}const a=Et({x:Math.round(n*10)/10,y:Math.round(s*10)/10},o);return(await ie(gc,{discussionId:r.id,body:a})).addDiscussionComment.comment}async function wc(t,n,s){return(await ie(fc,{discussionId:t,replyToId:n,body:s})).addDiscussionComment.comment}async function _c(t,n,s,o){const r=dc(n,{x:Math.round(s*10)/10,y:Math.round(o*10)/10});return(await ie(bc,{commentId:t,body:r})).updateDiscussionComment.comment}async function Sc(t,n){await ie(xc,{subjectId:t,content:n})}async function kc(t,n){await ie(yc,{subjectId:t,content:n})}const jn="sb-composer-style";function Cc(){if(document.getElementById(jn))return;const t=document.createElement("style");t.id=jn,t.textContent=`
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

    .sb-comment-pin {
      position: absolute;
      z-index: 100000;
      width: 28px;
      height: 28px;
      margin-left: -14px;
      margin-top: -14px;
      border-radius: 50%;
      background: #238636;
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      transition: transform 100ms ease;
    }
    .sb-comment-pin:hover {
      transform: scale(1.15);
    }
    .sb-comment-pin[data-resolved="true"] {
      background: #8b949e;
    }
  `,document.head.appendChild(t)}function Ic(t,n,s,o,r={}){Cc();const a=dr(),i=document.createElement("div");i.className="sb-composer",i.style.left=`${n}%`,i.style.top=`${s}%`,i.style.transform="translate(12px, -50%)",i.innerHTML=`
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
  `,t.appendChild(i);const l=i.querySelector(".sb-composer-textarea"),u=i.querySelector('[data-action="submit"]');function p(){i.remove()}function c(){p(),r.onCancel?.()}async function h(){const g=l.value.trim();if(!g){l.focus();return}u.disabled=!0,u.textContent="Posting…";try{const x=await jc(o,n,s,g);p(),r.onSubmit?.(x)}catch(x){u.disabled=!1,u.textContent="Comment",console.error("[storyboard] Failed to post comment:",x);let I=i.querySelector(".sb-composer-error");I||(I=document.createElement("div"),I.className="sb-composer-error",I.style.cssText="padding: 4px 12px 8px; font-size: 12px; color: #f85149;",i.querySelector(".sb-composer-footer").before(I)),I.textContent=x.message}}return i.querySelector('[data-action="cancel"]').addEventListener("click",c),u.addEventListener("click",h),l.addEventListener("keydown",g=>{g.key==="Enter"&&(g.metaKey||g.ctrlKey)&&(g.preventDefault(),h()),g.key==="Escape"&&(g.preventDefault(),g.stopPropagation(),c())}),i.addEventListener("click",g=>g.stopPropagation()),requestAnimationFrame(()=>l.focus()),{el:i,destroy:p}}const wn="sb-auth-modal",_n="sb-auth-modal-style";function Ec(){if(document.getElementById(_n))return;const t=document.createElement("style");t.id=_n,t.textContent=`
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
  `,document.head.appendChild(t)}function Nc(){return Ec(),new Promise(t=>{const n=document.getElementById(wn);n&&n.remove();const s=document.createElement("div");s.id=wn,s.className="sb-auth-backdrop";const o=document.createElement("div");o.className="sb-auth-modal",o.innerHTML=`
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
    `,s.appendChild(o),document.body.appendChild(s);const r=o.querySelector("#sb-auth-token-input"),a=o.querySelector('[data-action="submit"]'),i=o.querySelector('[data-slot="feedback"]');function l(c){s.remove(),t(c)}s.addEventListener("click",c=>{c.target===s&&l(null)}),o.querySelectorAll('[data-action="close"]').forEach(c=>{c.addEventListener("click",()=>l(null))});function u(c){c.key==="Escape"&&(c.preventDefault(),c.stopPropagation(),window.removeEventListener("keydown",u,!0),l(null))}window.addEventListener("keydown",u,!0);async function p(){const c=r.value.trim();if(!c){r.focus();return}a.disabled=!0,a.textContent="Validating…",i.innerHTML="";try{const h=await ac(c);oc(c),i.innerHTML=`
          <div class="sb-auth-success">
            <img class="sb-auth-avatar" src="${h.avatarUrl}" alt="${h.login}" />
            <div class="sb-auth-user-info">
              ${h.login}
              <span>✓ Signed in</span>
            </div>
          </div>
        `,a.textContent="Done",a.disabled=!1,a.onclick=()=>{window.removeEventListener("keydown",u,!0),l(h)}}catch(h){i.innerHTML=`<div class="sb-auth-error">${h.message}</div>`,a.disabled=!1,a.textContent="Sign in"}}a.addEventListener("click",p),r.addEventListener("keydown",c=>{c.key==="Enter"&&p()}),requestAnimationFrame(()=>r.focus())})}const Sn="sb-comment-window-style",hr={THUMBS_UP:"👍",THUMBS_DOWN:"👎",LAUGH:"😄",HOORAY:"🎉",CONFUSED:"😕",HEART:"❤️",ROCKET:"🚀",EYES:"👀"};function Lc(){if(document.getElementById(Sn))return;const t=document.createElement("style");t.id=Sn,t.textContent=`
    .sb-comment-window {
      position: absolute;
      z-index: 100001;
      width: 320px;
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
      gap: 3px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #30363d;
      background: none;
      color: #8b949e;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: border-color 100ms, background 100ms;
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
      border-radius: 999px;
      border: 1px solid transparent;
      background: none;
      color: #8b949e;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      position: relative;
    }
    .sb-reaction-add-btn:hover {
      border-color: #30363d;
      background: #21262d;
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
  `,document.head.appendChild(t)}function kn(t){return new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Cn(t){const n=document.createElement("div");n.className=t.replies?"sb-comment-window-reactions":"sb-reply-reactions";function s(){n.innerHTML="";const o=t.reactionGroups??[];for(const a of o){if(a.users?.totalCount===0&&!a.viewerHasReacted)continue;const i=a.users?.totalCount??0;if(i===0)continue;const l=document.createElement("button");l.className="sb-reaction-pill",l.dataset.active=String(!!a.viewerHasReacted),l.innerHTML=`<span>${hr[a.content]??a.content}</span><span>${i}</span>`,l.addEventListener("click",u=>{u.stopPropagation(),mr(t,a.content,a,s)}),n.appendChild(l)}const r=document.createElement("button");r.className="sb-reaction-add-btn",r.textContent="😀+",r.addEventListener("click",a=>{a.stopPropagation(),Tc(r,t,s)}),n.appendChild(r)}return s(),n}function Tc(t,n,s){const o=t.querySelector(".sb-reaction-picker");if(o){o.remove();return}const r=document.createElement("div");r.className="sb-reaction-picker";for(const[i,l]of Object.entries(hr)){const u=n.reactionGroups??[],p=u.some(h=>h.content===i&&h.viewerHasReacted),c=document.createElement("button");c.className="sb-reaction-picker-btn",c.dataset.active=String(p),c.textContent=l,c.addEventListener("click",h=>{h.stopPropagation();const g=u.find(x=>x.content===i);mr(n,i,g,s),r.remove()}),r.appendChild(c)}t.appendChild(r);function a(i){!r.contains(i.target)&&i.target!==t&&(r.remove(),document.removeEventListener("click",a,!0))}setTimeout(()=>document.addEventListener("click",a,!0),0)}async function mr(t,n,s,o){const r=s?.viewerHasReacted??!1;t.reactionGroups||(t.reactionGroups=[]),r&&s?(s.users={totalCount:Math.max(0,(s.users?.totalCount??1)-1)},s.viewerHasReacted=!1,s.users.totalCount===0&&(t.reactionGroups=t.reactionGroups.filter(a=>a.content!==n))):s?(s.users={totalCount:(s.users?.totalCount??0)+1},s.viewerHasReacted=!0):t.reactionGroups.push({content:n,users:{totalCount:1},viewerHasReacted:!0}),o();try{r?await kc(t.id,n):await Sc(t.id,n)}catch(a){console.error("[storyboard] Reaction toggle failed:",a)}}let Y=null;function Ac(t,n,s,o={}){Lc(),Y&&(Y.destroy(),Y=null);const r=dr(),a=document.createElement("div");a.className="sb-comment-window",a.style.left=`${n.meta?.x??0}%`,a.style.top=`${n.meta?.y??0}%`,a.style.transform="translate(12px, -50%)";const i=document.createElement("div");i.className="sb-comment-window-header";const l=document.createElement("div");if(l.className="sb-comment-window-header-left",n.author?.avatarUrl){const j=document.createElement("img");j.className="sb-comment-window-avatar",j.src=n.author.avatarUrl,j.alt=n.author.login??"",l.appendChild(j)}const u=document.createElement("span");if(u.className="sb-comment-window-author",u.textContent=n.author?.login??"unknown",l.appendChild(u),n.createdAt){const j=document.createElement("span");j.className="sb-comment-window-time",j.textContent=kn(n.createdAt),l.appendChild(j)}i.appendChild(l);const p=document.createElement("button");p.className="sb-comment-window-close",p.innerHTML="×",p.setAttribute("aria-label","Close"),p.addEventListener("click",j=>{j.stopPropagation(),ee()}),i.appendChild(p),a.appendChild(i);const c=document.createElement("div");c.className="sb-comment-window-body";const h=document.createElement("p");h.className="sb-comment-window-text",h.textContent=n.text??"",c.appendChild(h),c.appendChild(Cn(n));const g=n.replies??[];if(g.length>0){const j=document.createElement("div");j.className="sb-comment-window-replies";const L=document.createElement("div");L.className="sb-comment-window-replies-label",L.textContent=`${g.length} ${g.length===1?"Reply":"Replies"}`,j.appendChild(L);for(const A of g){const E=document.createElement("div");if(E.className="sb-reply-item",A.author?.avatarUrl){const U=document.createElement("img");U.className="sb-reply-avatar",U.src=A.author.avatarUrl,U.alt=A.author.login??"",E.appendChild(U)}const M=document.createElement("div");M.className="sb-reply-content";const T=document.createElement("div");T.className="sb-reply-meta";const F=document.createElement("span");if(F.className="sb-reply-author",F.textContent=A.author?.login??"unknown",T.appendChild(F),A.createdAt){const U=document.createElement("span");U.className="sb-reply-time",U.textContent=kn(A.createdAt),T.appendChild(U)}M.appendChild(T);const V=document.createElement("p");V.className="sb-reply-text",V.textContent=A.text??A.body??"",M.appendChild(V),M.appendChild(Cn(A)),E.appendChild(M),j.appendChild(E)}c.appendChild(j)}if(a.appendChild(c),r&&s){const j=document.createElement("div");j.className="sb-comment-window-reply-form";const L=document.createElement("textarea");L.className="sb-reply-textarea",L.placeholder="Reply…",j.appendChild(L);const A=document.createElement("div");A.className="sb-reply-form-actions";const E=document.createElement("button");E.className="sb-reply-submit-btn",E.textContent="Reply",E.disabled=!0,L.addEventListener("input",()=>{E.disabled=!L.value.trim()});async function M(){const T=L.value.trim();if(T){E.disabled=!0,E.textContent="Posting…";try{await wc(s.id,n.id,T),L.value="",E.textContent="Reply",o.onMove?.()}catch(F){console.error("[storyboard] Failed to post reply:",F),E.textContent="Reply",E.disabled=!1}}}E.addEventListener("click",M),L.addEventListener("keydown",T=>{T.key==="Enter"&&(T.metaKey||T.ctrlKey)&&(T.preventDefault(),M()),T.key==="Escape"&&(T.preventDefault(),T.stopPropagation())}),A.appendChild(E),j.appendChild(A),a.appendChild(j)}let x=!1,I=0,w=0,R=0,O=0;function D(j){if(j.target.closest(".sb-comment-window-close"))return;x=!0,I=j.clientX,w=j.clientY;const L=t.getBoundingClientRect();R=parseFloat(a.style.left)/100*L.width,O=parseFloat(a.style.top)/100*L.height,document.addEventListener("mousemove",H),document.addEventListener("mouseup",ce),j.preventDefault()}function H(j){if(!x)return;const L=j.clientX-I,A=j.clientY-w,E=t.getBoundingClientRect(),M=R+L,T=O+A,F=Math.round(M/E.width*1e3)/10,V=Math.round(T/E.height*1e3)/10;a.style.left=`${F}%`,a.style.top=`${V}%`}async function ce(j){if(!x)return;x=!1,document.removeEventListener("mousemove",H),document.removeEventListener("mouseup",ce);const L=t.getBoundingClientRect(),A=j.clientX-I,E=j.clientY-w,M=R+A,T=O+E,F=Math.round(M/L.width*1e3)/10,V=Math.round(T/L.height*1e3)/10;if(Math.abs(A)>2||Math.abs(E)>2){n.meta={...n.meta,x:F,y:V};try{await _c(n.id,n._rawBody??"",F,V),o.onMove?.()}catch(U){console.error("[storyboard] Failed to move comment:",U)}}}i.addEventListener("mousedown",D),a.addEventListener("click",j=>j.stopPropagation()),t.appendChild(a);function ee(){document.removeEventListener("mousemove",H),document.removeEventListener("mouseup",ce),a.remove(),Y?.el===a&&(Y=null),o.onClose?.()}return Y={el:a,destroy:ee},{el:a,destroy:ee}}function gr(){Y&&(Y.destroy(),Y=null)}const Rc='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>',In="sb-comment-mode-style";function Pc(){if(document.getElementById(In))return;const t=document.createElement("style");t.id=In,t.textContent=`
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${Rc}") 4 2, crosshair;
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
  `,document.head.appendChild(t)}let se=null,re=null,q=null,Nt=[],fr=null;function br(){return document.querySelector("main")||document.body}function Bt(){if(re)return re;const t=br();return getComputedStyle(t).position==="static"&&(t.style.position="relative"),re=document.createElement("div"),re.className="sb-comment-overlay",t.appendChild(re),re}function $c(){se||(se=document.createElement("div"),se.className="sb-comment-mode-banner",se.innerHTML="Comment mode — click to place a comment. Press <kbd>C</kbd> or <kbd>Esc</kbd> to exit.",document.body.appendChild(se))}function zc(){se&&(se.remove(),se=null)}function xr(){return window.location.pathname}function yr(){for(const t of Nt)t.remove();Nt=[]}function Oc(t,n,s){const o=document.createElement("div");return o.className="sb-comment-pin",o.style.left=`${n.meta?.x??0}%`,o.style.top=`${n.meta?.y??0}%`,o.textContent=s+1,n.meta?.resolved&&o.setAttribute("data-resolved","true"),o.title=`${n.author?.login??"unknown"}: ${n.text?.slice(0,80)??""}`,n._rawBody=n.body,o.addEventListener("click",r=>{r.stopPropagation(),q&&(q.destroy(),q=null),Ac(t,n,fr,{onClose:()=>{},onMove:()=>Ht()})}),t.appendChild(o),Nt.push(o),o}async function Ht(){if(!Mt())return;const t=Bt();yr();try{const n=await pr(xr());if(fr=n,!n?.comments?.length)return;n.comments.forEach((s,o)=>{s.meta?.x!=null&&s.meta?.y!=null&&Oc(t,s,o)})}catch(n){console.warn("[storyboard] Could not load comments:",n.message)}}function Dc(t){if(!Ke()||t.target.closest(".sb-composer")||t.target.closest(".sb-comment-pin")||t.target.closest(".sb-comment-window"))return;gr(),q&&(q.destroy(),q=null);const n=br(),s=n.getBoundingClientRect(),o=Math.round((t.clientX-s.left)/s.width*1e3)/10,r=Math.round((t.clientY-s.top+n.scrollTop)/n.scrollHeight*1e3)/10,a=Bt();q=Ic(a,o,r,xr(),{onCancel:()=>{q=null},onSubmit:()=>{q=null,Ht()}})}function Mc(t){t?(document.body.classList.add("sb-comment-mode"),$c(),Bt().classList.add("active"),Ht()):(document.body.classList.remove("sb-comment-mode"),zc(),q&&(q.destroy(),q=null),gr(),yr(),re&&re.classList.remove("active"))}let En=!1;function Bc(){En||(En=!0,Pc(),lc(Mc),document.addEventListener("click",t=>{Ke()&&(t.target.closest(".sb-devtools-wrapper")||t.target.closest(".sb-auth-backdrop")||Dc(t))}),window.addEventListener("keydown",t=>{const n=t.target.tagName;if(!(n==="INPUT"||n==="TEXTAREA"||n==="SELECT"||t.target.isContentEditable)){if(t.key==="c"&&!t.metaKey&&!t.ctrlKey&&!t.altKey){if(!Yn())return;if(t.preventDefault(),!Ke()&&!Mt()){Nc();return}ic()}t.key==="Escape"&&Ke()&&(t.preventDefault(),cc(!1))}}))}const Hc={repo:{owner:"dfosco",name:"storyboard"},discussions:{category:"General"}},Fc={comments:Hc},vr=Xr(sc,{basename:"/storyboard/branch--comments-system/"});Gs(vr,"/storyboard/branch--comments-system/");Is();ks();Es(Fc);Bc();const Uc=document.getElementById("root"),qc=Vr.createRoot(Uc);qc.render(e.jsx(b.StrictMode,{children:e.jsx(Jr,{colorMode:"auto",children:e.jsxs(Gr,{children:[e.jsx(nr,{}),e.jsx(Zr,{router:vr})]})})}));
