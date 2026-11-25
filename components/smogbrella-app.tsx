'use client'

import { useState } from 'react'
import { ArrowDown, ArrowLeftRight, ArrowUpRight, ChevronDown, CloudFog, CookingPot, Droplets, Heart, House, Leaf, LoaderCircle, MapPin, Shield, Sparkles, Sun, Umbrella, Wind } from 'lucide-react'

type Profile = 'Child with asthma' | 'Elderly' | 'Pregnant' | 'Outdoor worker' | 'Healthy adult'
type Travel = 'Walk' | 'Two-wheeler / cycle' | 'Car / metro'
type Filter = 'None' | 'Purifier' | 'DIY box-fan filter'
type Plan = { city: string; state: string; updatedAt: string; aqi: number; now: number; values: number[]; hours: string[]; saved: number; advice: string; fallback: boolean; profile: Profile }

const breathing: Record<Travel, number> = { Walk: 1.8, 'Two-wheeler / cycle': 2.4, 'Car / metro': 1.1 }
const hourLabel = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`
const aqiBand = (aqi: number) => aqi >= 201 ? 'Very unhealthy' : aqi >= 151 ? 'Unhealthy' : aqi >= 101 ? 'Poor' : aqi >= 51 ? 'Moderate' : 'Good'
const travelTips: Record<Travel, string> = {
  Walk: 'choose calmer side streets and avoid busy roadside waits when you can',
  'Two-wheeler / cycle': 'prefer quieter routes and take an indoor air break when traffic builds',
  'Car / metro': 'avoid idling in traffic and keep car windows closed near exhaust',
}
const profileTips: Record<Profile, string> = {
  'Child with asthma': 'keep prescribed medicine and the clinician’s action plan close; seek care if symptoms worsen.',
  Elderly: 'plan errands for cleaner hours and take an indoor break if breathing feels uncomfortable.',
  Pregnant: 'shorten time outdoors on hazy days and ask a clinician about symptoms or concerns.',
  'Outdoor worker': 'take cleaner-air breaks where possible and use a well-fitting N95.',
  'Healthy adult': 'notice symptoms and reduce outdoor time when the air is hazy.',
}
function fallbackAdvice({ city, state, aqi, pm25, hours, saved, profile, travel, budget }: { city: string; state: string; aqi: number; pm25: number; hours: string[]; saved: number; profile: Profile; travel: Travel; budget: number }) {
  return `For ${city}, ${state}, the current US AQI is ${Math.round(aqi)} (${aqiBand(aqi)}) and PM2.5 is ${Math.round(pm25)} µg/m³. Your three cleaner forecast hours are ${hours.join(', ')}. With a well-fitting N95 and a filtered bedroom, this simple estimate suggests about ${saved}% less exposure. Why: better timing and filtration reduce the particles reaching you.\n\nFor ${travel.toLowerCase()} trips, ${travelTips[travel]}. Why: less time beside traffic exhaust can lower what you breathe in.\n\nWith ₹${budget}/month, wet-mop floors and use a kitchen exhaust fan while cooking; consider a DIY box-fan filter only if a safe, compatible filter fits your budget. Why: these steps can reduce indoor dust and cooking particles.\n\nFor ${profile.toLowerCase()}, ${profileTips[profile]} Why: extra care is useful when polluted air can affect someone more.`
}

function UmbrellaMark({ open = false }: { open?: boolean }) {
  return <Umbrella aria-hidden="true" className={`umbrella-mark ${open ? 'umbrella-open' : ''}`} strokeWidth={1.5} />
}

function Atmosphere() {
  return <div className="atmosphere" aria-hidden="true">
    <div className="haze haze-cantaloupe" /><div className="haze haze-thistle" /><div className="haze haze-sage" />
    <svg className="mist-ribbons" viewBox="0 0 1440 1500" preserveAspectRatio="none">
      <path className="ribbon ribbon-ocean" d="M-120 140 C180 20 360 250 670 140 S1120 40 1570 180 L1570 300 C1210 170 1000 330 690 250 S190 110 -120 300Z" />
      <path className="ribbon ribbon-rose" d="M-120 240 C170 130 430 330 740 230 S1170 170 1570 250 L1570 340 C1160 250 940 420 650 330 S180 220 -120 390Z" />
      <path className="ribbon ribbon-ocean lower-ribbon" d="M-120 1190 C160 1040 440 1270 750 1160 S1190 1080 1570 1200 L1570 1340 C1200 1210 970 1390 650 1300 S160 1160 -120 1380Z" />
      <path className="ribbon ribbon-rose lower-ribbon" d="M-120 1290 C180 1150 410 1370 740 1260 S1180 1180 1570 1300 L1570 1410 C1200 1330 960 1470 640 1390 S170 1270 -120 1460Z" />
    </svg>
  </div>
}

const tipIcons = [Sun, ArrowLeftRight, Wind, Droplets, CookingPot, Heart]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}</label>
}

function HourChart({ values, cleanHours }: { values: number[]; cleanHours: number[] }) {
  const maximum = Math.max(...values, 1)
  return <div className="chart-wrap">
    <div className="chart" role="img" aria-label={`Hourly PM2.5 chart. Cleanest hours: ${cleanHours.map(hourLabel).join(', ')}`}>
      {values.map((value, hour) => <div className={`chart-column ${cleanHours.includes(hour) ? 'is-clean' : ''}`} key={hour} title={`${hourLabel(hour)} · ${Math.round(value)} µg/m³`}>
        <span className="bar-value">{Math.round(value)}</span><div className="bar-track"><div className="bar" style={{ height: `${Math.max(5, (value / maximum) * 100)}%` }} /></div>
        <span className="bar-hour">{hour % 3 === 0 ? hourLabel(hour).slice(0, 2) : ''}</span>
      </div>)}
    </div>
    <div className="chart-legend"><span><i className="legend-dot clean-dot" /> cleanest hours</span><span>PM2.5 · µg/m³</span></div>
  </div>
}

export default function SmogbrellaApp() {
  const [city, setCity] = useState('')
  const [profile, setProfile] = useState<Profile>('Child with asthma')
  const [travel, setTravel] = useState<Travel>('Walk')
  const [filter, setFilter] = useState<Filter>('None')
  const [budget, setBudget] = useState(500)
  const [outdoorHours, setOutdoorHours] = useState(3)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function makePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true); setError(''); setPlan(null)
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json&countryCode=IN`, { cache: 'no-store' })
      if (!geoResponse.ok) throw new Error('Could not look up that city. Please try another spelling.')
      const geo = await geoResponse.json()
      const place = geo.results?.[0]
      if (!place) throw new Error('We couldn’t find that city in India. Try a nearby city name.')
      const resolvedState = place.admin1 ?? place.admin2 ?? 'State unavailable'
      const aqResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.latitude}&longitude=${place.longitude}&current=us_aqi,pm2_5&hourly=pm2_5&timezone=auto&forecast_days=1`, { cache: 'no-store' })
      if (!aqResponse.ok) throw new Error('Live air readings are unavailable right now. Please try again shortly.')
      const aq = await aqResponse.json()
      const current = Number(aq.current?.pm2_5)
      const currentAqi = Number(aq.current?.us_aqi)
      const allValues: number[] = aq.hourly?.pm2_5?.map((value: number | null) => Number(value ?? current)) ?? []
      const times: string[] = aq.hourly?.time ?? []
      const values = times.slice(0, 24).map((_, i) => allValues[i] ?? current)
      if (!Number.isFinite(current) || !Number.isFinite(currentAqi) || values.length < 24) throw new Error('Today’s complete hourly air-quality reading is not available yet.')
      const updatedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const cleanIndices = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value).slice(0, 3).map((item) => item.index).sort((a, b) => a - b)
      const selectedUsual = values.map((value, index) => ({ value, index })).sort((a, b) => Math.abs(a.index - 12) - Math.abs(b.index - 12)).slice(0, outdoorHours)
      const rate = breathing[travel]
      const indoorFactor = filter === 'None' ? 0.7 : 0.3
      const usualOutdoorIndices = new Set(selectedUsual.map((item) => item.index))
      const usualExposure = values.reduce((sum, value, index) => sum + value * (usualOutdoorIndices.has(index) ? rate : indoorFactor), 0)
      const cleanOutdoorIndices = new Set(cleanIndices)
      const smarterExposure = values.reduce((sum, value, index) => sum + value * (cleanOutdoorIndices.has(index) ? rate * 0.25 : 0.3), 0)
      const saved = Math.max(0, Math.min(99, Math.round((1 - smarterExposure / Math.max(usualExposure, 1)) * 100)))
      const chosenHours = cleanIndices.map(hourLabel)
      let advice = fallbackAdvice({ city: place.name, state: resolvedState, aqi: currentAqi, pm25: current, hours: chosenHours, saved, profile, travel, budget })
      let fallback = true
      try {
        const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ profile, budget, travel, city: place.name, state: resolvedState, aqi: currentAqi, pm25: current, saved, cleanHours: chosenHours, exposure: { usual: Math.round(usualExposure), smarter: Math.round(smarterExposure) } }) })
        if (response.ok) { const data = await response.json(); if (typeof data.advice === 'string' && data.advice.trim()) { advice = data.advice; fallback = false } }
      } catch { /* Keep the useful local plan when the coaching service is unavailable. */ }
      setPlan({ city: place.name, state: resolvedState, updatedAt, aqi: currentAqi, now: current, values, hours: chosenHours, saved, advice, fallback, profile })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const severity = !plan ? 'waiting' : plan.aqi >= 151 ? 'severe' : plan.aqi >= 101 ? 'high' : plan.aqi >= 51 ? 'raised' : 'clear'
  const aqiWord = plan ? plan.aqi >= 201 ? 'Very unhealthy' : plan.aqi >= 151 ? 'Unhealthy' : plan.aqi >= 101 ? 'Poor' : plan.aqi >= 51 ? 'Moderate' : 'Good' : 'A little more prepared'

  return <main className={`app-shell level-${severity}`}>
    <Atmosphere />
    <header className="topbar"><a href="#home" className="brand" aria-label="Smogbrella home"><span className="brand-icon"><UmbrellaMark /></span><span>Smogbrella<span className="brand-period">.</span></span></a><nav className="nav-links" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#impact">Impact</a><a href="#who-pays">For schools &amp; societies</a><a className="nav-cta" href="#get-my-plan">Get my plan <ArrowUpRight size={15} /></a></nav></header>
    <div className="page-grid" id="home">
      <section className="intro">
        <div className="hero-copy"><p className="eyebrow"><CloudFog size={15} /> A WINTER AIR FORECAST FOR INDIAN CITIES</p><h1>Forecast the air.<br /><em>Pack a little protection.</em></h1><p className="intro-copy">A gentler way to decide what to carry, when to step out, and how to make home feel safer.</p>
          <a href="#get-my-plan" className="forecast-strip"><span className="forecast-icon"><UmbrellaMark open={!!plan} /></span><span className="forecast-copy"><span className="micro-label">TODAY&apos;S UMBRELLA FORECAST</span><span className="forecast-message">{plan ? <>Carry: <strong>N95 + go out at {plan.hours.join(', ')}</strong></> : <>Your plan is one little check away.</>}</span></span><span className="forecast-arrow"><ArrowUpRight size={18} /></span></a>
        </div>
        <div className="hero-illustration" aria-hidden="true"><svg viewBox="0 0 500 390" className="hero-art">
          <circle cx="327" cy="148" r="78" className="sun-disc" /><circle cx="327" cy="148" r="97" className="sun-ring" />
          <path d="M214 207c45-19 89-16 131-6 48 12 94 3 155-19M208 222c56-9 99 1 138 9 56 11 103 5 156-10" className="smog-line" />
          <path d="M265 289c22-9 42-10 62-4l29-18m-28 17 14 28m-31-23-25 24m-5-18 21 9m37-29 12-18" className="plant-stem" />
          <path d="M325 270c-2-24 13-38 31-39 2 20-8 34-31 39Zm-27 10c-18-19-38-15-48-2 13 16 29 18 48 2Zm46-9c12-20 30-24 43-14-7 17-22 23-43 14Zm-48 24c-18-11-34-5-40 9 14 10 28 8 40-9Z" className="leaf-doodle" />
          <path d="M97 131c14-18 27-18 39 0-13-6-26-6-39 0Zm39 0 11-10m-11 10 13 8" className="bird-doodle" />
          <path d="M92 300c-16-18-16-35-2-51 17 16 18 33 2 51Zm15 23c4-23 17-34 37-33-3 22-15 33-37 33Zm-18-24 19 24 25-12" className="leaf-doodle botanical-corner" />
          <circle cx="198" cy="98" r="3" className="spark-dot"/><circle cx="420" cy="251" r="4" className="spark-dot"/><circle cx="236" cy="158" r="2.5" className="spark-dot"/>
        </svg><span className="art-caption">A little more care for the air we share</span></div>
      </section>
      <section className="how-it-works" id="how-it-works" aria-labelledby="how-title"><div className="section-intro"><p className="eyebrow">THREE SMALL STEPS</p><h2 id="how-title">A forecast you can act on.</h2></div><div className="steps-grid">
        <article className="step-card"><span className="step-number">01</span><span className="step-icon step-ocean"><CloudFog size={19} /></span><h3>Check your air</h3><p>We look at live air-quality readings for your city.</p></article>
        <article className="step-card"><span className="step-number">02</span><span className="step-icon step-rose"><ArrowLeftRight size={19} /></span><h3>Find your window</h3><p>See the cleaner hours and what could fit your routine.</p></article>
        <article className="step-card"><span className="step-number">03</span><span className="step-icon step-sage"><House size={19} /></span><h3>Make home gentler</h3><p>Get practical, budget-aware ideas for the people you love.</p></article>
      </div><svg className="section-leaf" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 83C47 65 45 33 82 15M39 62C22 61 15 50 16 39c15 2 23 11 23 23Zm12-20c-3-16 5-26 19-29 3 15-4 25-19 29Zm-10 23c12-14 26-13 35-3-10 11-22 12-35 3Z" /></svg></section>
      <section className="form-card" id="get-my-plan" aria-labelledby="form-title"><div className="form-heading"><div><p className="eyebrow">A PLAN THAT FITS YOUR DAY</p><h2 id="form-title">Who are we looking out for?</h2></div><span className="step-tag">01 / TODAY</span></div>
        <form onSubmit={makePlan}><div className="form-grid"><Field label="Your city"><span className="input-with-icon"><MapPin size={16} /><input aria-label="Your city" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Enter an Indian city" /></span></Field>
          <Field label="Who needs a little extra care?"><span className="select-wrap"><select value={profile} onChange={(e) => setProfile(e.target.value as Profile)}>{['Child with asthma', 'Elderly', 'Pregnant', 'Outdoor worker', 'Healthy adult'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></span></Field>
          <Field label="How do you usually travel?"><span className="select-wrap"><select value={travel} onChange={(e) => setTravel(e.target.value as Travel)}>{['Walk', 'Two-wheeler / cycle', 'Car / metro'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></span></Field>
          <Field label="Indoor air cleaning"><span className="select-wrap"><select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>{['None', 'Purifier', 'DIY box-fan filter'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></span></Field>
          <Field label="Monthly home-air budget"><span className="budget-input"><span>₹</span><input aria-label="Monthly budget in rupees" type="number" min="0" max="100000" step="50" value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></span></Field>
          <Field label={`Usual time outdoors · ${outdoorHours} ${outdoorHours === 1 ? 'hour' : 'hours'}`}><span className="range-row"><input aria-label="Usual hours outdoors" type="range" min="1" max="12" value={outdoorHours} onChange={(e) => setOutdoorHours(Number(e.target.value))} /><span className="range-value">{outdoorHours}h</span></span></Field>
        </div><button className="submit-button" type="submit" disabled={loading || !city.trim()}>{loading ? <><LoaderCircle className="spin" size={18} /> Reading the air…</> : <>Make my plan for today <ArrowUpRight size={18} /></>}</button>{error && <p className="error-message" role="alert">{error}</p>}<p className="tiny-note"><Shield size={13} /> Your details stay in this browser. No account needed.</p></form>
      </section>
      {plan && <section className="results" id="impact" aria-live="polite"><div className="results-header"><div><p className="eyebrow">YOUR AIR-WEATHER REPORT <span className="location-name"><MapPin size={12} /> Showing: {plan.city}, {plan.state}</span></p><h2>A little more room to breathe.</h2></div><span className={`aqi-pill ${severity}`}><i /> {aqiWord.toUpperCase()}</span></div>
        <div className="result-grid"><article className="saved-card"><div className="saved-top"><span className="micro-label">EXPOSURE SAVED</span><span className="saved-icon"><ArrowDown size={17} /></span></div><div className="saved-number"><span>{plan.saved}</span><b>%</b></div><p>estimated exposure saved today</p><div className="saved-rule" /><div className="umbrella-caption"><UmbrellaMark open={plan.saved > 0} /><span>More cover, less exposure.</span><Sparkles size={15} /></div></article>
          <article className="air-card"><div className="air-heading"><div><span className="micro-label">RIGHT NOW</span><h3>The air outside</h3></div><span className="fresh-tag"><span className="live-dot" /> LIVE</span></div><div className="air-stats"><div className="aqi-stat"><span className="stat-label">US AQI</span><div className="aqi-gauge" role="img" aria-label={`US AQI ${Math.round(plan.aqi)} — ${aqiWord}`} style={{ '--aqi-angle': `${Math.min(plan.aqi, 300) / 300 * 280}deg` } as React.CSSProperties}><strong>{Math.round(plan.aqi)}</strong><span>AQI</span></div><span className="stat-foot">{aqiWord}</span></div><div className="stat-divider" /><div><span className="stat-label">PM2.5</span><strong>{Math.round(plan.now)}<small> µg</small></strong><span className="stat-foot">fine particles</span></div></div><p className="air-note">Updated {plan.updatedAt} · data: Open-Meteo</p></article>
        </div>
        <article className="chart-card"><div className="section-heading"><div><span className="micro-label">FIND YOUR CLEARER WINDOW</span><h3>Today, hour by hour</h3></div><span className="chart-key">24-HOUR PM2.5</span></div><HourChart values={plan.values} cleanHours={plan.hours.map((hour) => Number(hour.slice(0, 2)))} /><div className="clean-time"><span className="clean-spark">✳</span><span>Try stepping out at <strong>{plan.hours.join(' · ')}</strong></span><span className="best-badge">CLEANEST</span></div></article>
        <article className="advice-card"><div className="advice-title"><span className="advice-number">02</span><div><span className="micro-label">SMALL STEPS, REAL CARE</span><h3>Your family’s day plan</h3></div><span className={`coach-tag ${plan.fallback ? 'quick-plan' : 'ai-plan'}`}><Sparkles size={13} /> {plan.fallback ? 'Quick plan' : 'AI plan'}</span></div><div className="tip-grid">{plan.advice.split(/\n\n+/).map((paragraph, index) => { const TipIcon = tipIcons[index % tipIcons.length]; return <div className="tip-card" key={index}><span className={`tip-icon tip-icon-${index % 4}`}><TipIcon size={17} /></span><p>{paragraph}</p></div> })}</div></article>
      </section>}
      {!plan && <aside className="quiet-note" id="impact"><span className="quiet-mark">✳</span><span>Small changes to your timing and air at home can add up. Start with what feels doable.</span></aside>}
    </div>
    <section className="community-band" id="who-pays"><div className="community-inner"><div className="community-copy"><p className="eyebrow">BETTER AIR TAKES ALL OF US</p><h2>Care travels further<br />when we share it.</h2><p>Bring practical air-care guidance to the places families learn, live and work.</p><strong className="free-promise">Families always free. Institutions pay.</strong></div><div className="community-list">
      <article className="community-card"><span className="community-icon"><House size={17} /></span><div><h3>Schools</h3><p>Daily go-outside call for asthmatic students</p></div></article>
      <article className="community-card"><span className="community-icon"><Leaf size={17} /></span><div><h3>Housing societies</h3><p>Shared air alerts and cleaner-hour guidance</p></div></article>
      <article className="community-card"><span className="community-icon"><Wind size={17} /></span><div><h3>Outdoor teams</h3><p>Safer shift timing and simple PPE prompts</p></div></article>
      <article className="community-card"><span className="community-icon"><Heart size={17} /></span><div><h3>CSR partners</h3><p>Local impact families can use every day</p></div></article>
    </div><Sun className="community-sun" aria-hidden="true" /></div></section>
    <footer className="footer"><div className="footer-branding"><a href="#home" className="footer-logo" aria-label="Smogbrella home"><UmbrellaMark /><strong>Smogbrella<span className="brand-period">.</span></strong></a><span>Made for the days that feel a little hazy</span></div><span className="footer-disclaimer">Estimate based on a simple heuristic, not medical advice.</span></footer>
  </main>
}
