const db = window.jirraDb;
const loginView=document.getElementById('loginView'), adminView=document.getElementById('adminView'), msg=document.getElementById('msg');
const form=document.getElementById('contentForm'), list=document.getElementById('contentList'), preview=document.getElementById('preview');
let selectedFile=null;
const $=id=>document.getElementById(id);
function say(text,bad=false){msg.textContent=text;msg.className='admin-msg '+(bad?'bad':'ok');}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

async function isAdmin(uid){const {data,error}=await db.from('admin_users').select('user_id').eq('user_id',uid).maybeSingle(); return !error && !!data;}
async function refreshAuth(){
  if(!window.JIRRA_SUPABASE_CONFIGURED){loginView.hidden=false;adminView.hidden=true;say('Connect Supabase in config.js first.',true);return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session){loginView.hidden=false;adminView.hidden=true;return;}
  if(!(await isAdmin(session.user.id))){await db.auth.signOut();loginView.hidden=false;adminView.hidden=true;say('This account is not an approved JIRRA admin.',true);return;}
  loginView.hidden=true;adminView.hidden=false;$('adminEmail').textContent=session.user.email;await loadContent();
}
$('loginForm').onsubmit=async e=>{e.preventDefault();say('Signing in…');const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error){say(error.message,true);return;}await refreshAuth();};
$('logout').onclick=async()=>{await db.auth.signOut();location.reload();};
$('file').onchange=e=>{selectedFile=e.target.files[0]||null;if(!selectedFile){preview.innerHTML='';return;}const url=URL.createObjectURL(selectedFile);preview.innerHTML=selectedFile.type.startsWith('video/')?`<video src="${url}" controls></video>`:`<img src="${url}" alt="Preview">`;};
async function uploadMedia(file,userId){
  if(!file)return {url:null,type:null,path:null};
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const path=`${userId}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
  const {error}=await db.storage.from('media').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
  if(error)throw error;
  const {data}=db.storage.from('media').getPublicUrl(path);
  return {url:data.publicUrl,type:file.type.startsWith('video/')?'video':'image',path};
}
form.onsubmit=async e=>{
  e.preventDefault();
  const btn=$('publishBtn');btn.disabled=true;say('Saving…');
  try{
    const {data:{user}}=await db.auth.getUser(); if(!user)throw new Error('Please sign in again.');
    const media=await uploadMedia(selectedFile,user.id);
    const status=$('status').value;
    const payload={type:$('type').value,title:$('title').value.trim(),excerpt:$('excerpt').value.trim(),body:$('body').value.trim(),event_date:$('eventDate').value||null,event_location:$('eventLocation').value.trim()||null,media_url:media.url,media_type:media.type,media_path:media.path,status,author_id:user.id,published_at:status==='published'?new Date().toISOString():null};
    const {error}=await db.from('posts').insert(payload);if(error)throw error;
    form.reset();selectedFile=null;preview.innerHTML='';say(status==='published'?'Published to jirraa.com.':'Draft saved.');await loadContent();
  }catch(err){console.error(err);say(err.message||'Could not save content.',true);}finally{btn.disabled=false;}
};
async function loadContent(){
  const {data,error}=await db.from('posts').select('*').order('created_at',{ascending:false});if(error){say(error.message,true);return;}
  list.innerHTML=(data||[]).map(p=>`<div class="content-row"><div><span class="status ${esc(p.status)}">${esc(p.status)}</span><strong>${esc(p.title)}</strong><small>${esc(p.type)}${p.event_date?' • '+esc(p.event_date):''}</small></div><div class="row-actions">${p.status==='draft'?`<button data-publish="${p.id}">Publish</button>`:''}<button class="danger" data-delete="${p.id}" data-path="${esc(p.media_path||'')}">Delete</button></div></div>`).join('')||'<p>No content yet.</p>';
}
list.onclick=async e=>{
  const pub=e.target.dataset.publish, del=e.target.dataset.delete;
  if(pub){const {error}=await db.from('posts').update({status:'published',published_at:new Date().toISOString()}).eq('id',pub);if(error)say(error.message,true);else{say('Published.');loadContent();}}
  if(del && confirm('Delete this content?')){const path=e.target.dataset.path;const {error}=await db.from('posts').delete().eq('id',del);if(error){say(error.message,true);return;}if(path)await db.storage.from('media').remove([path]);say('Deleted.');loadContent();}
};
refreshAuth();
