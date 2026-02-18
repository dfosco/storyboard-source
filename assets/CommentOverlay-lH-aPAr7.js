import{i as C,l as $,f as N,s as M,o as S,t as z,a as D}from"./index-B16q-90B.js";import"./vendor-primer-BK6UB-si.js";import"./vendor-react-BQyrhFMj.js";import"./vendor-octicons-BtAiKi0j.js";import"./vendor-reshaped-BDP14DwY.js";const v="sb-comments-drawer-style";function A(){if(document.getElementById(v))return;const e=document.createElement("style");e.id=v,e.textContent=`
    .sb-comments-drawer-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99997;
      background: rgba(0, 0, 0, 0.4);
    }

    .sb-comments-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 99998;
      width: 380px;
      max-width: 90vw;
      background: #161b22;
      border-left: 1px solid #30363d;
      box-shadow: -8px 0 24px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      animation: sb-drawer-slide-in 150ms ease;
    }

    @keyframes sb-drawer-slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .sb-comments-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #21262d;
      flex-shrink: 0;
    }

    .sb-comments-drawer-title {
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
      margin: 0;
    }

    .sb-comments-drawer-close {
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
    .sb-comments-drawer-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-comments-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .sb-comments-drawer-loading {
      padding: 32px 20px;
      text-align: center;
      color: #8b949e;
      font-size: 13px;
    }

    .sb-comments-drawer-empty {
      padding: 32px 20px;
      text-align: center;
      color: #484f58;
      font-size: 13px;
    }

    .sb-comments-drawer-route-group {
      border-bottom: 1px solid #21262d;
    }

    .sb-comments-drawer-route-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: #0d1117;
      font-size: 12px;
      font-weight: 600;
      color: #8b949e;
      text-transform: none;
    }

    .sb-comments-drawer-route-path {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      color: #58a6ff;
    }

    .sb-comments-drawer-route-count {
      margin-left: auto;
      font-size: 11px;
      color: #484f58;
      font-weight: 400;
    }

    .sb-comments-drawer-comment {
      display: flex;
      gap: 10px;
      padding: 10px 20px;
      cursor: pointer;
      transition: background 100ms;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-family: inherit;
    }
    .sb-comments-drawer-comment:hover {
      background: #21262d;
    }

    .sb-comments-drawer-comment-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-comments-drawer-comment-content {
      flex: 1;
      min-width: 0;
    }

    .sb-comments-drawer-comment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .sb-comments-drawer-comment-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-comments-drawer-comment-time {
      font-size: 11px;
      color: #484f58;
    }

    .sb-comments-drawer-comment-resolved {
      font-size: 10px;
      color: #3fb950;
      background: rgba(63, 185, 80, 0.1);
      border-radius: 999px;
      padding: 0 6px;
    }

    .sb-comments-drawer-comment-text {
      font-size: 13px;
      line-height: 1.4;
      color: #c9d1d9;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sb-comments-drawer-comment-replies {
      font-size: 11px;
      color: #8b949e;
      margin-top: 2px;
    }
  `,document.head.appendChild(e)}function T(e){return new Date(e).toLocaleDateString("en-US",{month:"short",day:"numeric"})}let r=null;async function H(){if(!C())return;if(r){i();return}A();const e=document.createElement("div");e.className="sb-comments-drawer-backdrop",e.addEventListener("click",i);const a=document.createElement("div");a.className="sb-comments-drawer";const l=document.createElement("div");l.className="sb-comments-drawer-header";const b=document.createElement("h2");b.className="sb-comments-drawer-title",b.textContent="All Comments",l.appendChild(b);const c=document.createElement("button");c.className="sb-comments-drawer-close",c.innerHTML="×",c.setAttribute("aria-label","Close"),c.addEventListener("click",i),l.appendChild(c),a.appendChild(l);const o=document.createElement("div");o.className="sb-comments-drawer-body";const f=document.createElement("div");f.className="sb-comments-drawer-loading",f.textContent="Loading comments…",o.appendChild(f),a.appendChild(o),document.body.appendChild(e),document.body.appendChild(a),r={backdrop:e,drawer:a};function h(s){s.key==="Escape"&&(s.preventDefault(),s.stopPropagation(),i(),window.removeEventListener("keydown",h,!0))}window.addEventListener("keydown",h,!0),r.onKeyDown=h;try{const s=await $();if(o.innerHTML="",!s||s.length===0){const t=document.createElement("div");t.className="sb-comments-drawer-empty",t.textContent="No comments yet",o.appendChild(t);return}for(const t of s){const y=t.title?.match(/^Comments:\s*(.+)$/);if(!y)continue;const p=y[1];let d;try{d=await N(p)}catch{continue}if(!d?.comments?.length)continue;const u=document.createElement("div");u.className="sb-comments-drawer-route-group";const g=document.createElement("div");g.className="sb-comments-drawer-route-header",g.innerHTML=`<span class="sb-comments-drawer-route-path">${p}</span><span class="sb-comments-drawer-route-count">${d.comments.length} comment${d.comments.length!==1?"s":""}</span>`,u.appendChild(g);for(const n of d.comments){const w=document.createElement("button");w.className="sb-comments-drawer-comment";const k=n.author?.avatarUrl?`<img class="sb-comments-drawer-comment-avatar" src="${n.author.avatarUrl}" alt="${n.author?.login??""}" />`:"",E=n.meta?.resolved?'<span class="sb-comments-drawer-comment-resolved">Resolved</span>':"",x=n.replies?.length??0,L=x>0?`<div class="sb-comments-drawer-comment-replies">💬 ${x} ${x===1?"reply":"replies"}</div>`:"";w.innerHTML=`
          ${k}
          <div class="sb-comments-drawer-comment-content">
            <div class="sb-comments-drawer-comment-meta">
              <span class="sb-comments-drawer-comment-author">${n.author?.login??"unknown"}</span>
              ${n.createdAt?`<span class="sb-comments-drawer-comment-time">${T(n.createdAt)}</span>`:""}
              ${E}
            </div>
            <p class="sb-comments-drawer-comment-text">${n.text?.slice(0,100)??""}</p>
            ${L}
          </div>
        `,w.addEventListener("click",()=>{if(i(),window.location.pathname!==p){const m=new URL(window.location.href);m.pathname=p,m.searchParams.set("comment",n.id),window.location.href=m.toString()}else{const m=new URL(window.location.href);m.searchParams.set("comment",n.id),window.history.replaceState(null,"",m.toString()),M(!0)}}),u.appendChild(w)}o.appendChild(u)}if(o.children.length===0){const t=document.createElement("div");t.className="sb-comments-drawer-empty",t.textContent="No comments yet",o.appendChild(t)}}catch(s){o.innerHTML="";const t=document.createElement("div");t.className="sb-comments-drawer-empty",t.textContent=`Failed to load comments: ${s.message}`,o.appendChild(t)}}function i(){r&&(r.onKeyDown&&window.removeEventListener("keydown",r.onKeyDown,!0),r.backdrop.remove(),r.drawer.remove(),r=null)}function K(){const e=[];return C()?(e.push({label:"Toggle comments",icon:"💬",onClick:()=>{z()}}),e.push({label:"See all comments",icon:"📋",onClick:()=>{H()}}),e.push({label:"Sign out of comments",icon:"🚪",onClick:()=>{D()}})):e.push({label:"Sign in for comments",icon:"💬",onClick:()=>{S()}}),e}export{K as getCommentsMenuItems};
