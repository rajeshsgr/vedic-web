import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

/* ─── API ─────────────────────────────────────────────────── */
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api/v1/panchanga', timeout: 12000 });
const fmt = d => d.toISOString().split('T')[0];

const fetchPanchanga = (date, loc) =>
  API.get('/daily', {
    params: { date: fmt(date), lat: loc.lat, lon: loc.lon, timezone: loc.tz, location: loc.name }
  }).then(r => r.data.data);

/* ─── Constants ───────────────────────────────────────────── */
const FALLBACK_LOC = { lat: 29.9941, lon: -90.1788, tz: 'America/Chicago', name: 'Metairie, Louisiana' };

const PLANET_COLORS = {
  Sun:'#F0913A', Moon:'#9B7FD4', Mars:'#E05252', Mercury:'#52A852',
  Jupiter:'#D4A820', Venus:'#D4608A', Saturn:'#5A9EC4', Rahu:'#7A5BB0', Ketu:'#C47840'
};

const PLANET_SYMBOLS = {
  Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋'
};

const NAKSHATRA_GUIDES = {
  'Ashwini':          { good:['travel','medicine','starting new things'], avoid:['harsh deeds'] },
  'Bharani':          { good:['creative work','agriculture'], avoid:['new ventures','travel'] },
  'Krittika':         { good:['cooking','fire rituals','bold actions'], avoid:['sensitive meetings'] },
  'Rohini':           { good:['business','property','creative work','planting'], avoid:['surgery','confrontation'] },
  'Mrigashira':       { good:['arts','music','learning'], avoid:['confrontation'] },
  'Ardra':            { good:['rain rituals','research'], avoid:['auspicious events','travel'] },
  'Punarvasu':        { good:['travel','starting projects','gardening'], avoid:['surgery'] },
  'Pushya':           { good:['all auspicious work','buying property','pooja'], avoid:['marriage'] },
  'Ashlesha':         { good:['occult studies','research'], avoid:['new beginnings','surgery'] },
  'Magha':            { good:['ancestral rites','royal meetings'], avoid:['new beginnings'] },
  'Purva Phalguni':   { good:['romance','arts','leisure'], avoid:['serious work'] },
  'Uttara Phalguni':  { good:['marriage','long-term projects','education'], avoid:['short journeys'] },
  'Hasta':            { good:['crafts','healing','lending money'], avoid:['arguments'] },
  'Chitra':           { good:['arts','architecture','jewelry'], avoid:['inauspicious acts'] },
  'Swati':            { good:['business','travel','new learning'], avoid:['fixed agreements'] },
  'Vishakha':         { good:['goal-setting','determination','agriculture'], avoid:['travel'] },
  'Anuradha':         { good:['friendship','cooperation','spiritual work'], avoid:['confrontation'] },
  'Jyeshtha':         { good:['occult','leadership','bold acts'], avoid:['new partnerships'] },
  'Mula':             { good:['medicine','research','spiritual inquiry'], avoid:['planting','new ventures'] },
  'Purva Ashadha':    { good:['water activities','education'], avoid:['major decisions'] },
  'Uttara Ashadha':   { good:['permanent things','ethics','law'], avoid:['haste'] },
  'Shravana':         { good:['education','listening','spiritual study'], avoid:['confrontation'] },
  'Dhanishta':        { good:['music','real estate','wealth-building'], avoid:['marriage'] },
  'Shatabhisha':      { good:['healing','astronomy','meditation'], avoid:['travel south','arguments'] },
  'Purva Bhadrapada': { good:['occult','ascetic practices'], avoid:['marriage','new business'] },
  'Uttara Bhadrapada':{ good:['charity','spiritual work','agriculture'], avoid:['haste'] },
  'Revati':           { good:['travel','completion','water activities'], avoid:['starting new things'] },
};

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.25} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:#0D0A06;color:#E8DDD0;
  font-family:'DM Sans',system-ui,sans-serif;
  min-height:100vh;
  background-image:
    radial-gradient(ellipse at 10% 5%, rgba(200,169,110,0.07) 0%,transparent 45%),
    radial-gradient(ellipse at 90% 95%, rgba(155,127,212,0.05) 0%,transparent 45%);
}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(200,169,110,0.3);border-radius:2px}

.skel{
  background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%);
  background-size:600px 100%;
  animation:shimmer 1.4s infinite;
  border-radius:12px;
}
.card{
  background:rgba(255,255,255,0.035);
  border:1px solid rgba(255,255,255,0.07);
  border-radius:16px;
  transition:transform .2s,box-shadow .2s;
}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
.card-gold{
  background:rgba(200,169,110,0.05);
  border:1px solid rgba(200,169,110,0.15);
  border-radius:16px;
}
.pill{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 10px;border-radius:20px;
  font-size:11px;font-weight:600;letter-spacing:.5px;
}
.good{background:rgba(82,168,82,0.12);color:#72C872;border:1px solid rgba(82,168,82,0.25)}
.bad {background:rgba(224,82,82,0.12);color:#E07070;border:1px solid rgba(224,82,82,0.25)}
.neu {background:rgba(200,169,110,0.1);color:#C8A030;border:1px solid rgba(200,169,110,0.2)}
.retro{background:rgba(224,82,82,0.1);color:#E07070;border:1px solid rgba(224,82,82,0.2)}
.reveal{animation:fadeUp .5s ease both}

/* location modal */
.modal-bg{
  position:fixed;inset:0;background:rgba(0,0,0,0.7);
  display:flex;align-items:center;justify-content:center;
  z-index:200;animation:fadeIn .2s ease;padding:20px;
}
.modal{
  background:#1A1510;border:1px solid rgba(200,169,110,0.2);
  border-radius:20px;padding:28px;width:100%;max-width:480px;
}

/* nav tabs */
.tab-bar{
  display:flex;gap:4px;
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:12px;padding:4px;
}
.tab{
  flex:1;padding:8px 4px;border:none;background:transparent;
  color:rgba(232,221,208,0.5);font-size:12px;font-weight:500;
  border-radius:9px;cursor:pointer;transition:all .2s;
  font-family:'DM Sans',sans-serif;
}
.tab.active{
  background:rgba(200,169,110,0.12);
  color:#C8A96E;border:1px solid rgba(200,169,110,0.2);
}

input[type=text],input[type=number],select{
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1);
  color:#E8DDD0;border-radius:10px;
  padding:10px 14px;width:100%;
  font-family:'DM Sans',sans-serif;font-size:14px;
  outline:none;transition:border .2s;
}
input:focus,select:focus{border-color:rgba(200,169,110,0.4)}
select option{background:#1A1510}

@media(max-width:640px){
  .hide-sm{display:none!important}
  .stack-sm{flex-direction:column!important}
  .full-sm{width:100%!important;grid-column:1/-1!important}
}
`;

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtTime = t => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const moonEmoji = pct => {
  if (pct < 6)   return '🌑';
  if (pct < 30)  return '🌒';
  if (pct < 48)  return '🌓';
  if (pct < 72)  return '🌔';
  if (pct < 94)  return '🌕';
  if (pct < 110) return '🌖';
  return '🌘';
};

const dateLabel = d => d.toLocaleDateString('en-US', {
  weekday:'long', month:'long', day:'numeric', year:'numeric'
});

const shiftDate = (d, n) => {
  const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd;
};

/* ─── Sub-components ──────────────────────────────────────── */
function ArcRing({ pct, color, size = 96, stroke = 7, label, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition:'stroke-dashoffset 1.2s ease' }}/>
      </svg>
      {(label||sub) && (
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',gap:2 }}>
          {label && <div style={{ fontFamily:'Cinzel',fontSize:size>80?22:14,fontWeight:700,
            color:'#E8DDD0',lineHeight:1 }}>{label}</div>}
          {sub && <div style={{ fontSize:9,color:'#6A5A4A',letterSpacing:1,textTransform:'uppercase' }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.06)',borderRadius:3,height:3,overflow:'hidden',marginTop:8 }}>
      <div style={{ width:`${Math.min(pct,100)}%`,height:'100%',background:color,
        borderRadius:3,transition:'width 1.2s ease' }}/>
    </div>
  );
}

function Skel({ h=120, br=16 }) {
  return <div className="skel" style={{ height:h, borderRadius:br }}/>;
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:10,letterSpacing:3,color:'#6A5A4A',textTransform:'uppercase',
      fontWeight:600,marginBottom:14,display:'flex',alignItems:'center',gap:8 }}>
      <span style={{ color:'#C8A030',fontSize:11 }}>✦</span>{children}
    </div>
  );
}

function TimeBox({ icon, label, value, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:12,padding:'14px 10px',textAlign:'center',flex:1 }}>
      <div style={{ fontSize:22,marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:10,color:'#6A5A4A',textTransform:'uppercase',letterSpacing:1,
        marginBottom:4,fontWeight:600 }}>{label}</div>
      <div style={{ fontFamily:'DM Mono',fontSize:15,fontWeight:600,color }}>{fmtTime(value) || '—'}</div>
    </div>
  );
}

function MuhurtaRow({ name, start, end, auspicious }) {
  const color  = auspicious ? '#72C872' : '#E07070';
  const bgCol  = auspicious ? 'rgba(82,168,82,0.07)' : 'rgba(224,82,82,0.07)';
  const border = auspicious ? 'rgba(82,168,82,0.2)' : 'rgba(224,82,82,0.2)';
  return (
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'12px 16px',borderRadius:12,background:bgCol,border:`1px solid ${border}`,marginBottom:8 }}>
      <div>
        <div style={{ fontSize:13,fontWeight:500,color,marginBottom:3 }}>{name}</div>
        <div style={{ fontFamily:'DM Mono',fontSize:12,color:'#8A7A6A' }}>
          {fmtTime(start)} – {fmtTime(end)}
        </div>
      </div>
      <span className={`pill ${auspicious?'good':'bad'}`}>
        {auspicious ? '✓ Auspicious' : '⚠ Avoid'}
      </span>
    </div>
  );
}

function PlanetCard({ p }) {
  const color = PLANET_COLORS[p.planet] || '#888';
  const sym   = PLANET_SYMBOLS[p.planet] || '●';
  return (
    <div style={{ background:`${color}0D`,border:`1px solid ${color}22`,
      borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:12 }}>
      <div style={{ width:40,height:40,borderRadius:'50%',background:`${color}18`,
        flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:20,color }}>{sym}</div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2 }}>
          <span style={{ fontSize:14,fontWeight:600 }}>{p.planet}</span>
          {p.retrograde && <span className="pill retro" style={{ fontSize:9 }}>℞ Retro</span>}
        </div>
        <div style={{ fontFamily:'DM Mono',fontSize:12,color }}>
          {p.signDegree}° {p.sign}
        </div>
        <div style={{ fontSize:11,color:'#8A7A6A',marginTop:1 }}>{p.nakshatra}</div>
      </div>
    </div>
  );
}

/* ─── Location Modal ──────────────────────────────────────── */
function LocationModal({ loc, onSave, onClose }) {
  const [form, setForm] = useState({ ...(loc || { lat:29.9941, lon:-90.1788, tz:'America/Chicago', name:'Metairie, Louisiana' }) });
  const TZ_OPTIONS = [
    'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
    'America/Phoenix','Asia/Kolkata','Asia/Dubai','Europe/London',
    'Australia/Sydney','Pacific/Auckland'
  ];
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  return (
    <div className="modal-bg" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ fontFamily:'Cinzel',fontSize:18,color:'#C8A96E',marginBottom:6 }}>
          📍 Your Location
        </div>
        <div style={{ fontSize:13,color:'#6A5A4A',marginBottom:24 }}>
          Calculations are location-specific. Set your coordinates for accurate timings.
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div>
            <label style={{ fontSize:11,color:'#8A7A6A',letterSpacing:1,textTransform:'uppercase',
              display:'block',marginBottom:6 }}>Location Name</label>
            <input type="text" value={form.name} onChange={e=>set('name',e.target.value)}
              placeholder="e.g. Metairie, Louisiana"/>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ fontSize:11,color:'#8A7A6A',letterSpacing:1,textTransform:'uppercase',
                display:'block',marginBottom:6 }}>Latitude</label>
              <input type="number" step="0.0001" value={form.lat}
                onChange={e=>set('lat',parseFloat(e.target.value))}/>
            </div>
            <div>
              <label style={{ fontSize:11,color:'#8A7A6A',letterSpacing:1,textTransform:'uppercase',
                display:'block',marginBottom:6 }}>Longitude</label>
              <input type="number" step="0.0001" value={form.lon}
                onChange={e=>set('lon',parseFloat(e.target.value))}/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11,color:'#8A7A6A',letterSpacing:1,textTransform:'uppercase',
              display:'block',marginBottom:6 }}>Timezone</label>
            <select value={form.tz} onChange={e=>set('tz',e.target.value)}>
              {TZ_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <button onClick={onClose} style={{ flex:1,padding:'11px',borderRadius:12,
              background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
              color:'#8A7A6A',cursor:'pointer',fontFamily:'DM Sans',fontSize:14 }}>
              Cancel
            </button>
            <button onClick={()=>onSave(form)} style={{ flex:2,padding:'11px',borderRadius:12,
              background:'rgba(200,169,110,0.15)',border:'1px solid rgba(200,169,110,0.3)',
              color:'#C8A96E',cursor:'pointer',fontFamily:'Cinzel',fontSize:14,fontWeight:600 }}>
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Views ───────────────────────────────────────────── */
function TabToday({ d, delay }) {
  if (!d) return null;
  const tithi    = d.tithi    || {};
  const nakshatra = d.nakshatra || {};
  const sunT     = d.sunTimes  || {};
  const moonT    = d.moonTimes || {};
  const rahu     = d.rahuKalam?.[0] || {};
  const yama     = d.yamagandham?.[0] || {};
  const gulikai  = d.gulikai?.[0] || {};
  const abhijit  = d.abhijitMuhurta?.[0] || {};
  const brahma   = d.brahmaMuhurta?.[0] || {};
  const guide    = NAKSHATRA_GUIDES[nakshatra.name] || { good:[], avoid:[] };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

      {/* Five Limbs */}
      <div className="reveal" style={{ animationDelay:`${delay}s` }}>
        <SectionLabel>Five Limbs of Panchanga</SectionLabel>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10 }}>
          {[
            { icon:'📅', label:'Vara', main:d.vara?.replace('vara',''), sub:d.varaLord, color:'#F0913A' },
            { icon:'🌙', label:'Tithi', main:tithi.name, sub:`${tithi.paksha} #${tithi.number}`, color:'#9B7FD4', pct:tithi.completionPercent },
            { icon:'⭐', label:'Nakshatra', main:nakshatra.name, sub:`Pada ${nakshatra.pada} · ${nakshatra.lord}`, color:'#52A852', pct:nakshatra.completionPercent },
            { icon:'🔯', label:'Yoga', main:d.yoga, color:'#D4608A' },
            { icon:'◑',  label:'Karana', main:d.karana, color:'#5A9EC4' },
          ].map((c,i) => (
            <div key={c.label} className="card" style={{ padding:'16px 14px',
              borderTop:`2px solid ${c.color}55`,animationDelay:`${delay+i*0.05}s` }}>
              <div style={{ fontSize:22,marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontSize:10,color:'#6A5A4A',textTransform:'uppercase',
                letterSpacing:1,marginBottom:4,fontWeight:600 }}>{c.label}</div>
              <div style={{ fontFamily:'Cinzel',fontSize:14,fontWeight:600,color:c.color,marginBottom:3 }}>
                {c.main || '—'}
              </div>
              {c.sub && <div style={{ fontSize:11,color:'#8A7A6A' }}>{c.sub}</div>}
              {c.pct!=null && <ProgressBar pct={c.pct} color={c.color}/>}
              {c.pct!=null && <div style={{ fontSize:10,color:'#6A5A4A',marginTop:4 }}>{c.pct}% done</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Sun & Moon */}
      <div className="reveal" style={{ animationDelay:`${delay+0.1}s` }}>
        <SectionLabel>Sun & Moon</SectionLabel>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <div className="card" style={{ padding:18 }}>
            <div style={{ fontSize:11,color:'#F0913A',letterSpacing:2,textTransform:'uppercase',
              fontWeight:600,marginBottom:12 }}>☀ Sun</div>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
              <TimeBox icon="🌅" label="Sunrise" value={sunT.sunrise} color="#F0913A"/>
              <TimeBox icon="🌇" label="Sunset"  value={sunT.sunset}  color="#E8604A"/>
            </div>
            {sunT.daylightDurationMinutes && (
              <div style={{ marginTop:12,background:'rgba(240,145,58,0.07)',borderRadius:10,
                padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontSize:11,color:'#6A5A4A' }}>Daylight</span>
                <span style={{ fontFamily:'DM Mono',fontSize:13,color:'#F0913A',fontWeight:500 }}>
                  {Math.floor(sunT.daylightDurationMinutes/60)}h {sunT.daylightDurationMinutes%60}m
                </span>
              </div>
            )}
          </div>
          <div className="card" style={{ padding:18,background:'rgba(155,127,212,0.06)',
            border:'1px solid rgba(155,127,212,0.15)' }}>
            <div style={{ fontSize:11,color:'#9B7FD4',letterSpacing:2,textTransform:'uppercase',
              fontWeight:600,marginBottom:12 }}>
              {moonEmoji(moonT.moonPhasePercent)} Moon
            </div>
            <div style={{ fontFamily:'Cinzel',fontSize:16,fontWeight:600,color:'#E8DDD0',marginBottom:4 }}>
              {moonT.moonSign || '—'}
            </div>
            <div style={{ fontSize:12,color:'#9B7FD4',marginBottom:12 }}>{moonT.moonPhaseName}</div>
            <div style={{ background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'6px 10px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                <span style={{ fontSize:10,color:'#6A5A4A' }}>New</span>
                <span style={{ fontSize:10,color:'#6A5A4A' }}>Full</span>
              </div>
              <div style={{ background:'rgba(255,255,255,0.06)',borderRadius:4,height:5 }}>
                <div style={{ width:`${moonT.moonPhasePercent||0}%`,height:'100%',
                  background:'linear-gradient(90deg,#6A4AA0,#C8A8F0)',borderRadius:4,
                  transition:'width 1.2s ease' }}/>
              </div>
              <div style={{ textAlign:'center',fontSize:11,color:'#9B7FD4',marginTop:5 }}>
                {moonT.moonPhasePercent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nakshatra guide */}
      <div className="reveal card" style={{ padding:20,animationDelay:`${delay+0.15}s` }}>
        <SectionLabel>Nakshatra Guide · {nakshatra.name}</SectionLabel>
        <div style={{ fontSize:12,color:'#8A7A6A',fontStyle:'italic',marginBottom:14 }}>
          Deity: {nakshatra.deity} · Symbol: {nakshatra.symbol} · Quality: {nakshatra.quality}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          <div>
            <div style={{ fontSize:11,color:'#72C872',fontWeight:600,marginBottom:8 }}>✓ Good For</div>
            {guide.good.map((g,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:7,marginBottom:6 }}>
                <div style={{ width:5,height:5,borderRadius:'50%',background:'#52A852',flexShrink:0 }}/>
                <span style={{ fontSize:12,color:'#A8C8A8',textTransform:'capitalize' }}>{g}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:11,color:'#E07070',fontWeight:600,marginBottom:8 }}>✗ Avoid</div>
            {guide.avoid.map((g,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:7,marginBottom:6 }}>
                <div style={{ width:5,height:5,borderRadius:'50%',background:'#E05252',flexShrink:0 }}/>
                <span style={{ fontSize:12,color:'#C8A8A8',textTransform:'capitalize' }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
        {tithi.fastingDay && (
          <div style={{ marginTop:14,background:'rgba(240,145,58,0.1)',borderRadius:10,
            padding:'10px 14px',border:'1px solid rgba(240,145,58,0.25)',
            color:'#F0913A',fontSize:13,fontWeight:500 }}>
            🙏 {tithi.fastingName || 'Ekadashi'} — Fasting day
          </div>
        )}
      </div>

      {/* Muhurtas */}
      <div className="reveal" style={{ animationDelay:`${delay+0.2}s` }}>
        <SectionLabel>Muhurta Timings</SectionLabel>
        {brahma.name  && <MuhurtaRow name="🌌 Brahma Muhurta"   start={brahma.startTime}   end={brahma.endTime}   auspicious={true}/>}
        {abhijit.name && <MuhurtaRow name="✨ Abhijit Muhurta" start={abhijit.startTime}  end={abhijit.endTime}  auspicious={true}/>}
        {rahu.name    && <MuhurtaRow name="🔴 Rahu Kalam"       start={rahu.startTime}     end={rahu.endTime}     auspicious={false}/>}
        {yama.name    && <MuhurtaRow name="🟠 Yamagandham"      start={yama.startTime}     end={yama.endTime}     auspicious={false}/>}
        {gulikai.name && <MuhurtaRow name="🟡 Gulikai"          start={gulikai.startTime}  end={gulikai.endTime}  auspicious={false}/>}
      </div>
    </div>
  );
}

function TabPlanets({ d, delay }) {
  if (!d) return null;
  const planets = d.planetPositions || [];
  const vara = d.varaLord;
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div className="reveal card-gold" style={{ padding:18,animationDelay:`${delay}s` }}>
        <div style={{ fontSize:10,color:'#C8A030',letterSpacing:2,textTransform:'uppercase',marginBottom:6 }}>
          Today's Planetary Ruler
        </div>
        <div style={{ fontFamily:'Cinzel',fontSize:16,fontWeight:600,color:'#E8C87A' }}>
          {d.vara} — {vara}
        </div>
        <div style={{ fontSize:12,color:'#8A7A6A',marginTop:4 }}>
          Ayanamsa: {d.ayanamsaName} · {d.ayanamsaValue}°
        </div>
      </div>
      <div className="reveal" style={{ animationDelay:`${delay+0.05}s` }}>
        <SectionLabel>9 Graha — Sidereal Positions</SectionLabel>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10 }}>
          {planets.map((p,i) => (
            <div key={p.planet} className="reveal" style={{ animationDelay:`${delay+0.05+i*0.04}s` }}>
              <PlanetCard p={p}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabSummary({ d, date, delay }) {
  if (!d) return null;
  const tithi = d.tithi || {};
  const nak   = d.nakshatra || {};
  const sun   = d.sunTimes  || {};
  const moon  = d.moonTimes || {};
  const rows  = [
    { label:'Date',      value: dateLabel(date) },
    { label:'Vara',      value: `${d.vara} (${d.varaLord})` },
    { label:'Tithi',     value: `${tithi.paksha} ${tithi.name} #${tithi.number} · ${tithi.completionPercent}% done` },
    { label:'Nakshatra', value: `${nak.name} Pada ${nak.pada} (${nak.lord}) · ${nak.completionPercent}% done` },
    { label:'Yoga',      value: d.yoga },
    { label:'Karana',    value: d.karana },
    { label:'Moon',      value: `${moonEmoji(moon.moonPhasePercent)} ${moon.moonSign} · ${moon.moonPhaseName} (${moon.moonPhasePercent}%)` },
    { label:'Sunrise',   value: fmtTime(sun.sunrise) },
    { label:'Sunset',    value: fmtTime(sun.sunset) },
    { label:'Moonrise',  value: fmtTime(moon.moonrise) },
    { label:'Moonset',   value: fmtTime(moon.moonset) },
    { label:'Ayanamsa',  value: `${d.ayanamsaName} · ${d.ayanamsaValue}°` },
    { label:'Location',  value: d.location },
    { label:'Latitude',  value: `${d.latitude}°N` },
    { label:'Longitude', value: `${Math.abs(d.longitude)}°${d.longitude<0?'W':'E'}` },
    { label:'Timezone',  value: d.timezone },
    { label:'Fasting',   value: tithi.fastingDay ? `Yes — ${tithi.fastingName}` : 'No' },
  ];
  return (
    <div className="reveal card" style={{ padding:20, animationDelay:`${delay}s` }}>
      <SectionLabel>Complete Panchanga Summary</SectionLabel>
      <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
        {rows.map((r,i) => (
          <div key={r.label} style={{
            display:'flex',justifyContent:'space-between',alignItems:'flex-start',
            padding:'10px 0',
            borderBottom: i < rows.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            gap:12,flexWrap:'wrap'
          }}>
            <span style={{ fontSize:12,color:'#6A5A4A',letterSpacing:0.5,
              textTransform:'uppercase',fontWeight:600,flexShrink:0 }}>{r.label}</span>
            <span style={{ fontSize:13,color:'#E8C87A',textAlign:'right' }}>{r.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────── */
export default function App() {
  const [date,    setDate]    = useState(new Date());
  const [loc,     setLoc]     = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('today');
  const [modal,   setModal]   = useState(false);
  const [now,     setNow]     = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  // ── Geolocation on mount ────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('vedic_location');
    if (saved) {
      try { setLoc(JSON.parse(saved)); setLocLoading(false); return; } catch(e) {}
    }
    if (!navigator.geolocation) {
      setLoc(FALLBACK_LOC); setLocLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Reverse geocode using free API
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const d = await r.json();
          const city  = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
          const state = d.address?.state || '';
          const name  = [city, state].filter(Boolean).join(', ') || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
          // Guess timezone via browser
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const detected = { lat, lon, tz, name };
          setLoc(detected);
          localStorage.setItem('vedic_location', JSON.stringify(detected));
        } catch {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const detected = { lat, lon, tz, name: `${lat.toFixed(2)}°N, ${Math.abs(lon).toFixed(2)}°${lon<0?'W':'E'}` };
          setLoc(detected);
          localStorage.setItem('vedic_location', JSON.stringify(detected));
        }
        setLocLoading(false);
      },
      () => { setLoc(FALLBACK_LOC); setLocLoading(false); },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);



  const load = useCallback(async () => {
    setLoading(true); setError(null); setData(null);
    try {
      if (!loc) return;
      const res = await fetchPanchanga(date, loc);
      setData(res);
    } catch(e) {
      setError(e.response?.data?.message || e.message || 'API unreachable');
    } finally { setLoading(false); }
  }, [date, loc]);

  useEffect(() => { if (loc) load(); }, [load, loc]);

  const isToday = fmt(date) === fmt(new Date());

  /* Score colour */
  const score = data ? Math.min(100, Math.max(0,
    (data.tithi?.completionPercent > 90 ? 60 : 80) +
    (data.nakshatra?.quality === 'Fixed' ? 15 : data.nakshatra?.quality === 'Moveable' ? 10 : 5) +
    (data.tithi?.fastingDay ? -10 : 5)
  )) : 0;
  const scoreColor = score > 70 ? '#48B448' : score > 40 ? '#C8A030' : '#DC5050';

  const TABS = [
    { id:'today',   label:'Today',   icon:'🗓' },
    { id:'planets', label:'Planets', icon:'🪐' },
    { id:'summary', label:'Summary', icon:'📋' },
  ];

  return (
    <>
      <style>{CSS}</style>
      {modal && loc !== undefined && (
        <LocationModal loc={loc || FALLBACK_LOC}
          onSave={l => { setLoc(l); localStorage.setItem('vedic_location', JSON.stringify(l)); setModal(false); }}
          onClose={() => setModal(false)}/>
      )}

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{
        position:'sticky',top:0,zIndex:100,
        background:'rgba(13,10,6,0.92)',backdropFilter:'blur(14px)',
        borderBottom:'1px solid rgba(200,169,110,0.1)',
        padding:'12px 20px',
      }}>
        <div style={{ maxWidth:1100,margin:'0 auto',
          display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap' }}>

          {/* Logo */}
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <div>
              <div style={{ fontFamily:'Cinzel',fontSize:20,fontWeight:700,
                color:'#C8A96E',letterSpacing:1 }}>ॐ Panchanga</div>
              <button onClick={() => setModal(true)} style={{
                background:'none',border:'none',cursor:'pointer',padding:0,
                fontSize:11,color:'#6A5A4A',letterSpacing:1,textTransform:'uppercase',
                display:'flex',alignItems:'center',gap:4,fontFamily:'DM Sans'
              }}>
                {locLoading
                  ? <><span style={{animation:'pulse 1s infinite',color:'#C8A030'}}>●</span> Detecting location…</>
                  : <>📍 {loc?.name || 'Set location'} <span style={{ color:'#C8A030' }}>↗</span></>
                }
              </button>
            </div>
          </div>

          {/* Clock + nav */}
          <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
            {isToday && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'DM Mono',fontSize:20,color:'#E8DDD0',letterSpacing:1 }}>
                  {now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                </div>
                <div style={{ fontSize:11,color:'#6A5A4A' }}>
                  {now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                </div>
              </div>
            )}
            <div style={{ display:'flex',gap:4 }}>
              {['‹','›'].map((arrow,i) => (
                <button key={arrow} onClick={() => setDate(d => shiftDate(d, i===0?-1:1))}
                  style={{ background:'rgba(200,169,110,0.1)',border:'1px solid rgba(200,169,110,0.2)',
                    color:'#C8A96E',borderRadius:10,width:36,height:36,cursor:'pointer',fontSize:20,
                    display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans' }}>
                  {arrow}
                </button>
              ))}
              {!isToday && (
                <button onClick={() => setDate(new Date())}
                  style={{ background:'rgba(200,169,110,0.1)',border:'1px solid rgba(200,169,110,0.2)',
                    color:'#C8A96E',borderRadius:10,height:36,padding:'0 12px',cursor:'pointer',
                    fontSize:11,fontWeight:600,fontFamily:'DM Sans',letterSpacing:0.5 }}>
                  TODAY
                </button>
              )}
              <button onClick={load}
                style={{ background:'rgba(200,169,110,0.12)',border:'1px solid rgba(200,169,110,0.25)',
                  color:'#C8A96E',borderRadius:10,height:36,padding:'0 14px',cursor:'pointer',
                  fontSize:13,fontFamily:'DM Sans' }}>
                ↻
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── DATE LABEL ─────────────────────────────────────── */}
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'14px 20px 0' }}>
        <div style={{ fontFamily:'Cinzel',fontSize:15,color:'#C8A96E',letterSpacing:0.5 }}>
          {dateLabel(date)}
        </div>
      </div>

      {/* ── HERO STRIP ─────────────────────────────────────── */}
      {!locLoading && <div style={{ maxWidth:1100,margin:'14px auto 0',padding:'0 20px' }}>
        <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>

          {/* Score */}
          <div className="card" style={{ padding:'20px 24px',display:'flex',
            alignItems:'center',gap:18,flex:'0 0 auto' }}>
            {loading
              ? <div className="skel" style={{ width:96,height:96,borderRadius:'50%' }}/>
              : <ArcRing pct={score} color={scoreColor} size={96} stroke={7}
                  label={score} sub="score"/>
            }
            <div>
              <div style={{ fontSize:10,color:'#6A5A4A',textTransform:'uppercase',
                letterSpacing:2,marginBottom:6 }}>Day Quality</div>
              {loading
                ? <><Skel h={18} br={6}/><div style={{ height:6 }}/><Skel h={14} br={6}/></>
                : <>
                    <div style={{ fontFamily:'Cinzel',fontSize:16,fontWeight:600,color:'#E8DDD0',marginBottom:4 }}>
                      {data?.vara || '—'}
                    </div>
                    <div className={`pill ${score>70?'good':score>40?'neu':'bad'}`}>
                      {score>70?'✓ Favorable':score>40?'◎ Moderate':'⚠ Challenging'}
                    </div>
                  </>
              }
            </div>
          </div>

          {/* Tithi quick */}
          <div className="card" style={{ padding:'20px',flex:'1 1 160px',minWidth:140 }}>
            <div style={{ fontSize:10,color:'#6A5A4A',letterSpacing:2,textTransform:'uppercase',marginBottom:10 }}>Tithi</div>
            {loading ? <><Skel h={20} br={6}/><div style={{ height:8 }}/><Skel h={14} br={6}/></> : <>
              <div style={{ fontFamily:'Cinzel',fontSize:17,fontWeight:600,color:'#9B7FD4',marginBottom:4 }}>
                {data?.tithi?.name || '—'}
              </div>
              <div style={{ fontSize:12,color:'#8A7A6A',marginBottom:10 }}>
                {data?.tithi?.paksha} Paksha
              </div>
              <ProgressBar pct={data?.tithi?.completionPercent||0} color="#9B7FD4"/>
              <div style={{ fontSize:10,color:'#6A5A4A',marginTop:4 }}>
                {data?.tithi?.completionPercent}% complete
              </div>
            </>}
          </div>

          {/* Nakshatra quick */}
          <div className="card" style={{ padding:'20px',flex:'1 1 160px',minWidth:140 }}>
            <div style={{ fontSize:10,color:'#6A5A4A',letterSpacing:2,textTransform:'uppercase',marginBottom:10 }}>Nakshatra</div>
            {loading ? <><Skel h={20} br={6}/><div style={{ height:8 }}/><Skel h={14} br={6}/></> : <>
              <div style={{ fontFamily:'Cinzel',fontSize:17,fontWeight:600,color:'#52A852',marginBottom:4 }}>
                {data?.nakshatra?.name || '—'}
              </div>
              <div style={{ fontSize:12,color:'#8A7A6A',marginBottom:10 }}>
                Pada {data?.nakshatra?.pada} · {data?.nakshatra?.lord}
              </div>
              <ProgressBar pct={data?.nakshatra?.completionPercent||0} color="#52A852"/>
              <div style={{ fontSize:10,color:'#6A5A4A',marginTop:4 }}>
                {data?.nakshatra?.completionPercent}% complete
              </div>
            </>}
          </div>

          {/* Sun/Moon quick */}
          <div className="card" style={{ padding:'20px',flex:'1 1 180px',minWidth:160 }}>
            <div style={{ fontSize:10,color:'#6A5A4A',letterSpacing:2,textTransform:'uppercase',marginBottom:10 }}>Sun & Moon</div>
            {loading ? <><Skel h={40} br={8}/><div style={{ height:8 }}/><Skel h={40} br={8}/></> : (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                {[
                  { icon:'🌅', label:'Rise',    val:data?.sunTimes?.sunrise,  color:'#F0913A' },
                  { icon:'🌇', label:'Set',     val:data?.sunTimes?.sunset,   color:'#E8604A' },
                  { icon:'🌕', label:'Moonrise',val:data?.moonTimes?.moonrise,color:'#9B7FD4' },
                  { icon:'🌑', label:'Moonset', val:data?.moonTimes?.moonset, color:'#6A5A8A' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center',padding:'8px 4px',
                    background:'rgba(255,255,255,0.02)',borderRadius:10 }}>
                    <div style={{ fontSize:18,marginBottom:3 }}>{s.icon}</div>
                    <div style={{ fontSize:9,color:'#6A5A4A',letterSpacing:1,textTransform:'uppercase',marginBottom:2 }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily:'DM Mono',fontSize:12,color:s.color,fontWeight:500 }}>
                      {fmtTime(s.val)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      }
      {/* ── TABS ───────────────────────────────────────────── */}
      <div style={{ maxWidth:1100,margin:'20px auto 0',padding:'0 20px' }}>
        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab===t.id?'active':''}`}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <main style={{ maxWidth:1100,margin:'0 auto',padding:'20px 20px 60px' }}>

        {/* Error */}
        {!locLoading && error && !loading && (
          <div style={{ textAlign:'center',padding:'60px 20px' }}>
            <div style={{ fontSize:40,marginBottom:16 }}>⚠️</div>
            <div style={{ fontFamily:'Cinzel',fontSize:18,color:'#E05252',marginBottom:8 }}>
              API Unreachable
            </div>
            <div style={{ color:'#8A7A6A',fontSize:13,marginBottom:24,lineHeight:1.7 }}>
              {error}<br/>
              Make sure your Spring Boot API is running at{' '}
              <code style={{ color:'#C8A96E' }}>http://localhost:8080/api</code>
            </div>
            <button onClick={load} style={{ background:'rgba(200,169,110,0.15)',
              border:'1px solid rgba(200,169,110,0.3)',color:'#C8A96E',borderRadius:12,
              padding:'10px 24px',cursor:'pointer',fontFamily:'Cinzel',fontSize:14 }}>
              ↻ Retry
            </button>
          </div>
        )}

        {/* Location detecting */}
        {locLoading && (
          <div style={{ textAlign:'center',padding:'80px 20px' }}>
            <div style={{ fontSize:40,marginBottom:16,animation:'spin 3s linear infinite',display:'inline-block',color:'#C8A96E' }}>✦</div>
            <div style={{ fontFamily:'Cinzel',fontSize:18,color:'#C8A96E',marginBottom:8 }}>Detecting Your Location</div>
            <div style={{ color:'#6A5A4A',fontSize:13 }}>
              Please allow location access for accurate panchanga timings.<br/>
              <button onClick={() => { setLoc(FALLBACK_LOC); setLocLoading(false); }}
                style={{ marginTop:16,background:'rgba(200,169,110,0.1)',border:'1px solid rgba(200,169,110,0.2)',
                  color:'#C8A96E',borderRadius:10,padding:'8px 20px',cursor:'pointer',
                  fontFamily:'DM Sans',fontSize:13 }}>
                Skip — use Metairie, LA
              </button>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {!locLoading && loading && (
          <div style={{ display:'flex',flexDirection:'column',gap:14,marginTop:8 }}>
            <div style={{ textAlign:'center',padding:'20px 0',
              color:'#6A5A4A',fontSize:13,letterSpacing:3,textTransform:'uppercase' }}>
              <div style={{ fontSize:28,display:'inline-block',
                animation:'spin 2s linear infinite',color:'#C8A96E',marginRight:10 }}>✦</div>
              Consulting the cosmos…
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12 }}>
              {[180,140,160,140,180,150].map((h,i) => <Skel key={i} h={h}/>)}
            </div>
          </div>
        )}

        {/* Tab content */}
        {!locLoading && !loading && !error && data && (
          <>
            {tab === 'today'   && <TabToday   d={data} delay={0.05}/>}
            {tab === 'planets' && <TabPlanets d={data} delay={0.05}/>}
            {tab === 'summary' && <TabSummary d={data} date={date} delay={0.05}/>}
          </>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ textAlign:'center',padding:'20px',
        borderTop:'1px solid rgba(255,255,255,0.05)',color:'#3A2A1A',fontSize:11,letterSpacing:1 }}>
        Jean Meeus Astronomical Algorithms · Lahiri Ayanamsa · {loc?.name || '…'}
      </footer>
    </>
  );
}
