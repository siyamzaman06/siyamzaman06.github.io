document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const header=document.querySelector('.site-header');const updateHeader=()=>header?.classList.toggle('scrolled',scrollY>18);updateHeader();addEventListener('scroll',updateHeader,{passive:true});
const themeToggle=document.getElementById('themeToggle');if(localStorage.getItem('portfolio-theme')==='light')document.body.classList.add('light');const themeIcon=()=>{if(themeToggle)themeToggle.textContent=document.body.classList.contains('light')?'☾':'☼'};themeIcon();themeToggle?.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('portfolio-theme',document.body.classList.contains('light')?'light':'dark');themeIcon()});
const menuButton=document.getElementById('menuButton'),navLinks=document.getElementById('navLinks');menuButton?.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'×':'☰'});navLinks?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{navLinks.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');if(menuButton)menuButton.textContent='☰'}));
const current=document.body.dataset.page;document.querySelectorAll('[data-page-link]').forEach(a=>{if(a.dataset.pageLink===current){a.classList.add('active');a.setAttribute('aria-current','page')}});
document.querySelectorAll('.media img').forEach(img=>{const fallback=()=>{img.style.display='none';img.closest('.media')?.classList.add('media-missing');img.nextElementSibling?.classList.add('show')};img.addEventListener('error',fallback);if(img.complete&&img.naturalWidth===0)fallback()});
document.querySelectorAll('video[data-default-volume]').forEach(video=>{video.volume=Number(video.dataset.defaultVolume)});
const reveals=document.querySelectorAll('.reveal');if('IntersectionObserver'in window){const obs=new IntersectionObserver((entries,o)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.12});reveals.forEach(x=>obs.observe(x))}else reveals.forEach(x=>x.classList.add('visible'));
const timeline=document.querySelector('.timeline');if(timeline){const items=[...timeline.querySelectorAll('.timeline-item')],progress=timeline.querySelector('.timeline-progress');if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible','active')}),{threshold:.28});items.forEach(x=>io.observe(x))}else items.forEach(x=>x.classList.add('visible','active'));const update=()=>{const r=timeline.getBoundingClientRect(),middle=innerHeight*.55,travel=Math.min(Math.max(middle-r.top,0),r.height);if(progress)progress.style.height=`${travel}px`};update();addEventListener('scroll',update,{passive:true});addEventListener('resize',update)}

const imageLightbox=document.getElementById('imageLightbox');
if(imageLightbox){
  const lightboxImage=document.getElementById('imageLightboxImage');
  const lightboxTitle=document.getElementById('imageLightboxTitle');
  const closeButton=imageLightbox.querySelector('.image-lightbox-close');
  const closeDuration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:260;
  let closeTimer;

  const closePreview=()=>{
    if(!imageLightbox.open||imageLightbox.classList.contains('is-closing'))return;
    imageLightbox.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer=setTimeout(()=>{
      imageLightbox.close();
      imageLightbox.classList.remove('is-closing');
      document.body.classList.remove('preview-open');
      lightboxImage.removeAttribute('src');
    },closeDuration);
  };

  document.querySelectorAll('.preview-button').forEach(button=>button.addEventListener('click',()=>{
    clearTimeout(closeTimer);
    imageLightbox.classList.remove('is-closing');
    const buttonRect=button.getBoundingClientRect();
    const originX=Math.min(94,Math.max(6,((buttonRect.left+buttonRect.width/2)/innerWidth)*100));
    const originY=Math.min(94,Math.max(6,((buttonRect.top+buttonRect.height/2)/innerHeight)*100));
    imageLightbox.style.setProperty('--preview-origin-x',`${originX}%`);
    imageLightbox.style.setProperty('--preview-origin-y',`${originY}%`);
    lightboxImage.src=button.dataset.previewSrc;
    lightboxImage.alt=button.dataset.previewAlt;
    lightboxTitle.textContent=button.dataset.previewTitle;
    if(!imageLightbox.open)imageLightbox.showModal();
    document.body.classList.add('preview-open');
  }));

  closeButton?.addEventListener('click',closePreview);
  imageLightbox.addEventListener('cancel',event=>{event.preventDefault();closePreview()});
  imageLightbox.addEventListener('click',event=>{if(event.target===imageLightbox)closePreview()});
}
