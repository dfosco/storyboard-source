import{i as d,s as f,l as u,g as b,f as g,o as w,t as h,a as v}from"./index-Db4m7Wkl.js";import"./vendor-primer-DemBoo1e.js";import"./vendor-react-BuwH6fqj.js";import"./vendor-octicons-BpazhUNY.js";import"./vendor-reshaped-DaHIQrVt.js";function x(t){return new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric"})}let n=null;async function y(){if(!d())return;if(n){a();return}const t=document.createElement("div");t.className="sb-comments-drawer-backdrop fixed top-0 right-0 bottom-0 left-0",t.addEventListener("click",a);const o=document.createElement("div");o.className="sb-comments-drawer sb-drawer-animate fixed top-0 right-0 bottom-0 flex flex-column sb-bg bl sb-b-default sb-shadow sans-serif",o.innerHTML=`
    <div x-data="sbCommentsDrawer">
      <!-- Header -->
      <div class="flex items-center justify-between ph4 pv3 bb sb-b-muted flex-shrink-0">
        <h2 class="f5 fw6 sb-fg ma0">All Comments</h2>
        <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer sb-close-btn"
                aria-label="Close"
                @click="closeDrawer()">×</button>
      </div>

      <!-- Body -->
      <div class="flex-auto overflow-y-auto pa0">
        <!-- Loading state -->
        <template x-if="loading">
          <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">Loading comments…</div>
        </template>

        <!-- Error state -->
        <template x-if="error">
          <div class="pv4 ph4 tc sb-fg-muted sb-f-sm" x-text="'Failed to load comments: ' + error"></div>
        </template>

        <!-- Empty state -->
        <template x-if="!loading && !error && groups.length === 0">
          <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">No comments yet</div>
        </template>

        <!-- Comment groups by route -->
        <template x-for="group in groups" :key="group.route">
          <div class="bb sb-b-muted">
            <div class="flex items-center ph4 pv2 sb-bg-inset f7 fw6 sb-fg-muted">
              <span class="code sb-fg-accent" x-text="group.route"></span>
              <span class="ml-auto fw4 flex flex-nowrap sb-f-xs sb-min-w-max"
                    x-text="group.comments.length + (group.comments.length !== 1 ? ' comments' : ' comment')"></span>
            </div>
            <template x-for="comment in group.comments" :key="comment.id">
              <button class="flex ph4 pv2 pointer bn bg-transparent w-100 tl sans-serif sb-drawer-btn"
                      :class="comment.meta?.resolved ? 'sb-drawer-btn-resolved' : ''"
                      @click="navigateTo(group.route, comment.id)">
                <template x-if="comment.author?.avatarUrl">
                  <img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar"
                       :src="comment.author.avatarUrl"
                       :alt="comment.author?.login ?? ''" />
                </template>
                <div class="flex flex-column flex-auto sb-min-w-0 gap-2">
                  <div class="flex items-center">
                    <span class="f7 fw6 mr1"
                          :class="comment.meta?.resolved ? 'sb-fg-muted' : 'sb-fg'"
                          x-text="comment.author?.login ?? 'unknown'"></span>
                    <template x-if="comment.createdAt">
                      <span class="sb-fg-muted mr1 sb-f-xs" x-text="formatDate(comment.createdAt)"></span>
                    </template>
                    <template x-if="comment.meta?.resolved">
                      <span class="sb-fg-success br-pill ph1 sb-badge-resolved">Resolved</span>
                    </template>
                  </div>
                  <p class="ma0 overflow-hidden nowrap truncate lh-copy sb-f-sm"
                     :class="comment.meta?.resolved ? 'sb-fg-muted' : 'sb-fg'"
                     x-text="(comment.text ?? '').slice(0, 100)"></p>
                  <template x-if="(comment.replies?.length ?? 0) > 0">
                    <div class="sb-fg-muted mt1 sb-f-xs"
                         x-text="'💬 ' + comment.replies.length + ' ' + (comment.replies.length === 1 ? 'reply' : 'replies')"></div>
                  </template>
                </div>
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>
  `,document.body.appendChild(t),document.body.appendChild(o),n={backdrop:t,drawer:o};function i(e){e.key==="Escape"&&(e.preventDefault(),e.stopPropagation(),a(),window.removeEventListener("keydown",i,!0))}window.addEventListener("keydown",i,!0),n.onKeyDown=i,window.Alpine._sbDrawerRegistered||(window.Alpine.data("sbCommentsDrawer",()=>({loading:!0,error:null,groups:[],async init(){try{const e=await u();if(!e||e.length===0){this.loading=!1;return}const r=b()?.basePath??"/",s=[];for(const p of e){const c=p.title?.match(/^Comments:\s*(.+)$/);if(!c)continue;const m=c[1];if(!m.startsWith(r))continue;let l;try{l=await g(m)}catch{continue}l?.comments?.length&&s.push({route:m,comments:l.comments})}this.groups=s}catch(e){this.error=e.message}finally{this.loading=!1}},formatDate(e){return x(e)},closeDrawer(){a()},navigateTo(e,r){if(a(),window.location.pathname!==e){const s=new URL(window.location.href);s.pathname=e,s.searchParams.set("comment",r),window.location.href=s.toString()}else{const s=new URL(window.location.href);s.searchParams.set("comment",r),window.history.replaceState(null,"",s.toString()),f(!0)}}})),window.Alpine._sbDrawerRegistered=!0),window.Alpine.initTree(o)}function a(){n&&(n.onKeyDown&&window.removeEventListener("keydown",n.onKeyDown,!0),n.backdrop.remove(),n.drawer.remove(),n=null)}function E(){const t=[];return d()?(t.push({label:"Toggle comments",icon:"💬",onClick:()=>{h()}}),t.push({label:"See all comments",icon:"📋",onClick:()=>{y()}}),t.push({label:"Sign out of comments",icon:"🚪",onClick:()=>{v()}})):t.push({label:"Sign in for comments",icon:"💬",onClick:()=>{w()}}),t}export{E as getCommentsMenuItems};
