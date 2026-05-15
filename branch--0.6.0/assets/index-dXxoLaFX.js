var H=Object.defineProperty;var o=(t,e)=>H(t,"name",{value:e,configurable:!0});import{bp as g,bq as A,bo as k}from"./index-EVWa2G6q.js";const b="sb-comments-token",S="sb-comments-user",J="https://api.github.com/graphql";function w(){try{return localStorage.getItem(b)}catch{return null}}o(w,"getToken");function _(t){localStorage.setItem(b,t)}o(_,"setToken");function O(){localStorage.removeItem(b),localStorage.removeItem(S)}o(O,"clearToken");function x(){try{const t=localStorage.getItem(S);return t?JSON.parse(t):null}catch{return null}}o(x,"getCachedUser");async function M(t){const e=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!e.ok)throw new Error("Invalid token — GitHub returned "+e.status);const n=await e.json(),s=(e.headers.get("x-oauth-scopes")||"").split(",").map(a=>a.trim()).filter(Boolean),r={login:n.login,avatarUrl:n.avatar_url,scopes:s};return await L(t),localStorage.setItem(S,JSON.stringify(r)),r}o(M,"validateToken");async function L(t){const e=g();if(!e)return;const{owner:n,name:s}=e.repo;if(!n||!s)return;const r=`query { repository(owner: "${n}", name: "${s}") { id discussionCategories(first: 1) { nodes { id } } } }`,a=await fetch(J,{method:"POST",headers:{Authorization:`bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({query:r})});if(a.status===401)throw new Error("Token is invalid or expired.");if(!a.ok)throw new Error(`GitHub API error: ${a.status}`);const c=await a.json();if(c.errors?.length){const i=c.errors.map(d=>d.message).join(", ");throw i.includes("not accessible")||i.includes("insufficient")?new Error(`Token doesn't have access to ${n}/${s} discussions. Fine-grained tokens need "Discussions: Read and write". Classic tokens need the "repo" scope.`):new Error(`GitHub API error: ${i}`)}if(!c.data?.repository)throw new Error(`Repository ${n}/${s} not found. Check that the token has access to this repository.`);if(!c.data.repository.discussionCategories?.nodes?.length)throw new Error(`No discussion categories found in ${n}/${s}. Enable Discussions in the repository settings.`)}o(L,"validateTokenPermissions");function D(){return w()!==null}o(D,"isAuthenticated");const Ot=Object.freeze(Object.defineProperty({__proto__:null,clearToken:O,getCachedUser:x,getToken:w,isAuthenticated:D,setToken:_,validateToken:M},Symbol.toStringTag,{value:"Module"}));let y=!1;const $=new Set;function B(){return y}o(B,"isCommentModeActive");function z(){return A()?!y&&!D()?(console.warn("[storyboard] Sign in first to use comments"),!1):(y=!y,N(),y):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}o(z,"toggleCommentMode");function K(t){y=t,N()}o(K,"setCommentMode");function Y(t){return $.add(t),()=>$.delete(t)}o(Y,"subscribeToCommentMode");function N(){for(const t of $)t(y)}o(N,"_notify");const F="https://api.github.com/graphql";async function u(t,e={},n={}){const{retries:s=2}=n,r=w();if(!r)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let c=0;c<=s;c++)try{const i=await fetch(F,{method:"POST",headers:{Authorization:`bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:e})});if(i.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!i.ok)throw new Error(`GitHub API error: ${i.status} ${i.statusText}`);const d=await i.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(l=>l.message).join(", ")}`);return d.data}catch(i){if(a=i,i.message.includes("401")||i.message.includes("Not authenticated")||i.message.includes("invalid or expired"))throw i;c<s&&await new Promise(d=>setTimeout(d,1e3*(c+1)))}throw a}o(u,"graphql");const R=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function m(t){if(!t)return{meta:null,text:""};const e=t.match(R);if(!e)return{meta:null,text:t.trim()};try{const n=JSON.parse(e[1]),s=t.replace(R,"").trim();return{meta:n,text:s}}catch{return{meta:null,text:t.trim()}}}o(m,"parseMetadata");function f(t,e){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${e}`}o(f,"serializeMetadata");function G(t,e){const{meta:n,text:s}=m(t),r={...n,...e};return f(r,s)}o(G,"updateMetadata");const Q=`
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
`,X=`
  query SearchDiscussionLightweight($query: String!) {
    search(query: $query, type: DISCUSSION, first: 1) {
      nodes {
        ... on Discussion {
          id
          title
          url
          comments(first: 100) {
            nodes {
              id
              body
              author {
                login
                avatarUrl
              }
            }
          }
        }
      }
    }
  }
`,W=`
  query GetCommentDetail($id: ID!) {
    node(id: $id) {
      ... on DiscussionComment {
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
`,V=`
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
`,Z=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,tt=`
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
`,et=`
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
`,p=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,nt=`
  mutation DeleteComment($commentId: ID!) {
    deleteDiscussionComment(input: { id: $commentId }) {
      comment {
        id
      }
    }
  }
`,ot=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,st=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`;async function P(t){const e=g(),s=`"${`Comments: ${t}`}" in:title repo:${e.repo.owner}/${e.repo.name}`,a=(await u(Q,{query:s})).search?.nodes?.[0];if(!a)return null;const c=(a.comments?.nodes??[]).map(i=>{const{meta:d,text:l}=m(i.body);return{...i,meta:d,text:l,replies:(i.replies?.nodes??[]).map(h=>{const{meta:v,text:q}=m(h.body);return{...h,meta:v,text:q}})}});return{...a,comments:c}}o(P,"fetchRouteDiscussion");async function rt(t){const e=g(),s=`"${`Comments: ${t}`}" in:title repo:${e.repo.owner}/${e.repo.name}`,a=(await u(X,{query:s})).search?.nodes?.[0];if(!a)return null;const c=(a.comments?.nodes??[]).map(i=>{const{meta:d,text:l}=m(i.body);return{...i,meta:d,text:l}});return{...a,comments:c}}o(rt,"fetchRouteCommentsSummary");async function at(t){const n=(await u(W,{id:t})).node;if(!n)return null;const{meta:s,text:r}=m(n.body),a=(n.replies?.nodes??[]).map(c=>{const{meta:i,text:d}=m(c.body);return{...c,meta:i,text:d}});return{...n,meta:s,text:r,replies:a}}o(at,"fetchCommentDetail");async function it(){const t=g(),e=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),n=await u(V,{owner:t.repo.owner,name:t.repo.name,slug:e}),s=n.repository?.id;let r=n.repository?.discussionCategory?.id;if(r||(r=n.repository?.discussionCategories?.nodes?.find(c=>c.name===t.discussions.category)?.id),!s||!r)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:s,categoryId:r}}o(it,"getRepoAndCategoryIds");async function ct(t,e,n,s){let r=await P(t);if(!r){const{repositoryId:i,categoryId:d}=await it(),l=`Comments: ${t}`,h=f({route:t,createdAt:new Date().toISOString()},"");r=(await u(Z,{repositoryId:i,categoryId:d,title:l,body:h})).createDiscussion.discussion}const a=f({x:Math.round(e*10)/10,y:Math.round(n*10)/10},s);return(await u(tt,{discussionId:r.id,body:a})).addDiscussionComment.comment}o(ct,"createComment");async function ut(t,e,n){return(await u(et,{discussionId:t,replyToId:e,body:n})).addDiscussionComment.comment}o(ut,"replyToComment");async function dt(t,e){const{meta:n,text:s}=m(e),r={...n,resolved:!0},a=s.startsWith("(Resolved) ")?s:`(Resolved) ${s}`,c=f(r,a);return(await u(p,{commentId:t,body:c})).updateDiscussionComment.comment}o(dt,"resolveComment");async function mt(t,e){const{meta:n,text:s}=m(e),r={...n};delete r.resolved;const a=s.replace(/^\(Resolved\)\s*/,""),c=f(r,a);return(await u(p,{commentId:t,body:c})).updateDiscussionComment.comment}o(mt,"unresolveComment");async function lt(t,e,n){const{meta:s}=m(e),r=s?f(s,n):n;return(await u(p,{commentId:t,body:r})).updateDiscussionComment.comment}o(lt,"editComment");async function yt(t,e){return(await u(p,{commentId:t,body:e})).updateDiscussionComment.comment}o(yt,"editReply");async function ft(t,e,n,s){const r=G(e,{x:Math.round(n*10)/10,y:Math.round(s*10)/10});return(await u(p,{commentId:t,body:r})).updateDiscussionComment.comment}o(ft,"moveComment");async function gt(t){await u(nt,{commentId:t})}o(gt,"deleteComment");async function pt(t,e){await u(ot,{subjectId:t,content:e})}o(pt,"addReaction");async function ht(t,e){await u(st,{subjectId:t,content:e})}o(ht,"removeReaction");const I="sb-comments:",It=120*1e3;function Ct(t){try{const e=localStorage.getItem(I+t);if(!e)return null;const n=JSON.parse(e);return Date.now()-n.ts>It?(localStorage.removeItem(I+t),null):n.data}catch{return null}}o(Ct,"getCachedComments");function wt(t,e){try{localStorage.setItem(I+t,JSON.stringify({ts:Date.now(),data:e}))}catch{}}o(wt,"setCachedComments");function $t(t){try{localStorage.removeItem(I+t)}catch{}}o($t,"clearCachedComments");const C="sb-pending-comments:";function bt(t,e){try{const n=E(t),s=n.findIndex(r=>r.id===e.id);s>=0?n[s]=e:n.push(e),localStorage.setItem(C+t,JSON.stringify(n))}catch{}}o(bt,"savePendingComment");function E(t){try{const e=localStorage.getItem(C+t);return e?JSON.parse(e):[]}catch{return[]}}o(E,"getPendingComments");function St(t,e){try{const n=E(t).filter(s=>s.id!==e);n.length>0?localStorage.setItem(C+t,JSON.stringify(n)):localStorage.removeItem(C+t)}catch{}}o(St,"removePendingComment");const j="sb-comment-drafts";function T(){try{return JSON.parse(localStorage.getItem(j)||"{}")}catch{return{}}}o(T,"readDrafts");function U(t){try{localStorage.setItem(j,JSON.stringify(t))}catch{}}o(U,"writeDrafts");function Dt(t,e){const n=T();n[t]=e,U(n)}o(Dt,"saveDraft");function Et(t){return T()[t]??null}o(Et,"getDraft");function Tt(t){const e=T();delete e[t],U(e)}o(Tt,"clearDraft");function vt(t){return`comment:${t}`}o(vt,"composerDraftKey");function Rt(t){return`reply:${t}`}o(Rt,"replyDraftKey");const xt=Object.freeze(Object.defineProperty({__proto__:null,addReaction:pt,clearCachedComments:$t,clearDraft:Tt,clearToken:O,composerDraftKey:vt,createComment:ct,deleteComment:gt,editComment:lt,editReply:yt,fetchCommentDetail:at,fetchRouteCommentsSummary:rt,fetchRouteDiscussion:P,getCachedComments:Ct,getCachedUser:x,getCommentsConfig:g,getDraft:Et,getPendingComments:E,getToken:w,graphql:u,initCommentsConfig:k,isAuthenticated:D,isCommentModeActive:B,isCommentsEnabled:A,moveComment:ft,parseMetadata:m,removePendingComment:St,removeReaction:ht,replyDraftKey:Rt,replyToComment:ut,resolveComment:dt,saveDraft:Dt,savePendingComment:bt,serializeMetadata:f,setCachedComments:wt,setCommentMode:K,setToken:_,subscribeToCommentMode:Y,toggleCommentMode:z,unresolveComment:mt,updateMetadata:G,validateToken:M},Symbol.toStringTag,{value:"Module"}));export{$t as A,ft as B,bt as C,Ot as D,xt as E,D as a,Dt as b,vt as c,Tt as d,x as e,dt as f,Et as g,lt as h,B as i,ht as j,pt as k,ut as l,yt as m,gt as n,K as o,Ct as p,rt as q,Rt as r,Y as s,z as t,mt as u,wt as v,at as w,E as x,ct as y,St as z};
