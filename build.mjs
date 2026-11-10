import fs from 'node:fs';
await import('./build-base.mjs');
const logoData=fs.readFileSync('university-logo.b64','utf8').trim();
const logoFile='dist/aditya-university-logo.jpg';
fs.writeFileSync(logoFile,Buffer.from(logoData,'base64'));
for(const f of ['index.html','challenges.html','rounds.html','registration.html']){
  const p='dist/'+f;
  let h=fs.readFileSync(p,'utf8');
  const headerPattern=/<header>(<img class="emblem"[^>]*>)(<a class="brand"[^>]*>.*?<\/a>)(<nav aria-label="Main navigation">.*?<\/nav>)(<button class="motion-toggle"[^>]*>.*?<\/button>)?<\/header>/;
  const match=h.match(headerPattern);
  if(!match)throw new Error('Expected header markup missing in '+f);
  const logo=match[1].replace(/src="[^"]+"/,'src="aditya-university-logo.jpg"').replace(/alt="[^"]+"/,'alt="Aditya University logo"');
  const header=`<header class="site-header">${logo}<div class="header-identity"><a class="brand" href="index.html">FORENSITHON 2026</a><p class="header-organised">Organised by</p><p class="header-subtitle">Department of Forensic Science, School of Sciences in collaboration with Institution's Innovation Council (IIC)</p></div>${match[3]}${match[4]||''}</header>`;
  h=h.replace(match[0],header);
  const footerOld='<footer><strong>FORENSITHON 2026</strong>';
  if(!h.includes(footerOld))throw new Error('Expected footer markup missing in '+f);
  h=h.replace(footerOld,'<footer><img class="footer-logo" src="aditya-university-logo.jpg" alt="Aditya University logo"><strong>FORENSITHON 2026</strong>');
  const oldFooterSchool=' / Aditya University</p>';
  if(!h.includes(oldFooterSchool))throw new Error('Expected footer university suffix missing in '+f);
  h=h.replace(oldFooterSchool,'</p>');
  if(f==='index.html'){
    const old='<p class="eyebrow">ADITYA UNIVERSITY / FORENSIC INNOVATION HACKATHON</p>';
    if(!h.includes(old))throw new Error('Expected home hero eyebrow missing');
    h=h.replace(old,'<p class="eyebrow hero-kicker">FORENSIC INNOVATION HACKATHON</p>');
    const badgeOld='<p class="hero-event">9-10 December 2026 · T-Hub · 6 students per team</p>';
    if(!h.includes(badgeOld))throw new Error('Expected home hero date badge missing');
    h=h.replace(badgeOld,'<p class="hero-event">9-10 December 2026 · 6 students per team</p>');
    const venueStat='<div><span>VENUE</span><strong>T-Hub</strong></div>';
    if(!h.includes(venueStat))throw new Error('Expected location stat missing');
    h=h.replace(venueStat,'');
  }
  if(f==='registration.html'){
    const locationLine='<p class="lead">9-10 December 2026 / T-Hub</p>';
    if(!h.includes(locationLine))throw new Error('Expected registration location line missing');
    h=h.replace(locationLine,'<p class="lead">9-10 December 2026</p>');
  }
  if(f==='rounds.html'){
    const locationText='to the two-day offline event at T-Hub, 9-10 December 2026.';
    if(!h.includes(locationText))throw new Error('Expected rounds location sentence missing');
    h=h.replace(locationText,'to the two-day offline event on 9-10 December 2026.');
  }
  if(/t-hub|thub|venue/i.test(h))throw new Error('A removed location reference remains in '+f);
  fs.writeFileSync(p,h);
}
fs.appendFileSync('dist/styles.css',String.raw`
/* Centered event identity and cleaner mobile header. */
header.site-header{position:relative;min-height:82px;display:flex;align-items:center;gap:12px}
header.site-header .emblem{position:relative;z-index:2;flex:0 0 auto;width:170px;height:auto;max-height:58px;object-fit:contain;border-radius:0}
header.site-header .header-identity{position:absolute;left:50%;transform:translateX(-50%);width:min(30vw,400px);text-align:center;z-index:1}
header.site-header .brand{display:block;margin:0;font-size:20px;line-height:1.1;font-weight:900;letter-spacing:.2px;white-space:nowrap}
header.site-header .header-organised{margin:3px 0 0;font-size:9px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:var(--blue)}
header.site-header .header-subtitle{margin:2px 0 0;font-size:10px;line-height:1.25;font-weight:600;letter-spacing:0;color:var(--ink)}
header.site-header nav{position:relative;z-index:2;margin-left:auto;gap:10px;flex:0 0 auto}
header.site-header .motion-toggle{position:relative;z-index:2;flex:0 0 auto}
@media(max-width:1050px){header.site-header{display:grid;grid-template-columns:96px minmax(0,1fr) auto;grid-template-areas:"logo identity toggle" "nav nav nav";gap:8px 12px;padding:12px 5%}header.site-header .emblem{grid-area:logo;width:110px;max-height:40px}header.site-header .header-identity{grid-area:identity;position:static;transform:none;width:100%;max-width:100%;justify-self:center}header.site-header .brand{font-size:18px}header.site-header .header-subtitle{font-size:10px}header.site-header nav{grid-area:nav;width:100%;margin:0;justify-content:flex-end;gap:12px}header.site-header .motion-toggle{grid-area:toggle;margin:0}}
@media(max-width:600px){header.site-header{grid-template-columns:auto 1fr auto;grid-template-areas:"logo . toggle" "identity identity identity" "nav nav nav";gap:7px 8px;padding:12px 6%}header.site-header .emblem{width:110px;max-height:40px}header.site-header .header-identity{width:100%;max-width:360px}header.site-header .brand{font-size:17px}header.site-header .header-subtitle{font-size:10px;line-height:1.3}header.site-header nav{justify-content:space-between;gap:5px}header.site-header nav a{font-size:12px}}
@media(max-width:350px){header.site-header .emblem{width:96px;max-height:34px}header.site-header .brand{font-size:15px}header.site-header .header-subtitle{font-size:9px}header.site-header nav a{font-size:11px}}
.hero .hero-kicker{display:table;margin:0 auto 16px;padding:8px 15px;background:var(--lime);color:var(--ink);border:2px solid var(--ink);border-radius:999px;font-size:clamp(13px,1.4vw,17px);font-weight:900;line-height:1.25;letter-spacing:1.2px;box-shadow:3px 3px 0 var(--ink)}
@media(max-width:600px){.hero .hero-kicker{font-size:13px;letter-spacing:.6px;padding:7px 10px}}
footer .footer-logo{display:block;width:190px;max-width:70vw;height:auto;object-fit:contain;margin:0 0 12px}
`);
console.log('Updated the header identity on all pages and highlighted the home hero kicker.');
