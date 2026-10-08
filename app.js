const seed = [
  {type:'Culture',title:'Irreechaa Together',excerpt:'JIRRA showing up together to celebrate culture, community and identity in the DMV.',media_url:'assets/culture-1.jpg',media_type:'image'},
  {type:'Football',title:'JIRRA FC',excerpt:'Follow the team, tournament appearances, match updates and stories from the pitch.',media_url:'assets/culture-3.jpg',media_type:'image'},
  {type:'Community',title:'We Are Here',excerpt:'Photos, announcements, posters and stories from the JIRRA community.',media_url:'assets/culture-4.jpg',media_type:'image'}
];

document.getElementById('year').textContent = new Date().getFullYear();
const postsEl = document.getElementById('posts');

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function mediaMarkup(p){
  if(!p.media_url) return `<div class="card-media placeholder">JIRRA</div>`;
  if((p.media_type||'').startsWith('video')) return `<video class="card-media" src="${esc(p.media_url)}" controls playsinline preload="metadata"></video>`;
  return `<img class="card-media" src="${esc(p.media_url)}" alt="${esc(p.title)}">`;
}
function renderPosts(posts){
  postsEl.innerHTML = posts.map(p=>`<article class="card">${mediaMarkup(p)}<div class="card-body"><p class="eyebrow red">${esc(p.type)}</p><h3>${esc(p.title)}</h3>${p.event_date?`<p class="date">${new Date(p.event_date+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</p>`:''}<p>${esc(p.excerpt||p.body||'')}</p></div></article>`).join('');
}
async function loadPosts(){
  if(!window.JIRRA_SUPABASE_CONFIGURED){renderPosts(seed);return;}
  const {data,error}=await window.jirraDb.from('posts').select('*').eq('status','published').order('published_at',{ascending:false}).limit(12);
  if(error){console.error(error);renderPosts(seed);return;}
  renderPosts(data?.length?data:seed);
}
loadPosts();
