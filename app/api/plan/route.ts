import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const allowedProfiles = ['Child with asthma', 'Elderly', 'Pregnant', 'Outdoor worker', 'Healthy adult']
    if (!allowedProfiles.includes(input.profile) || typeof input.city !== 'string' || input.city.length > 100 || typeof input.state !== 'string' || input.state.length > 100 || !Number.isFinite(input.budget) || input.budget < 0 || input.budget > 100000 || !Array.isArray(input.cleanHours) || input.cleanHours.length !== 3 || !Number.isFinite(input.saved)) {
      return NextResponse.json({ error: 'Invalid plan details.' }, { status: 400 })
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const { text } = await generateText({
          model: 'google/gemini-3.8-flash',
          system: 'You are Smogbrella, a warm, calm, practical winter-air coach for families in Indian cities. Offer general, cautious guidance only; do not diagnose, promise health outcomes, or replace clinician advice. Make clear that an N95 should fit snugly, and never advise leaving a fan/filter unattended or using an unsafe filter. Write in plain, kind words, around 160–200 words. Include: a morning routine; lower-emission daily choices; exactly three affordable indoor hacks that make sense for this monthly rupee budget (DIY box-fan filter, wet mopping, kitchen exhaust); give each indoor hack its own separate paragraph and one-line why. Include a profile-specific care tip with a one-line why. Do not invent medical recommendations. Preserve the supplied cleanest hours and call the exposure figure an estimate. Use short paragraphs, no markdown heading.',
          prompt: JSON.stringify({ city: input.city, state: input.state, who: input.profile, travel: input.travel, monthly_budget_rupees: input.budget, AQI_now: input.aqi, PM2_5_now_ug_m3: input.pm25, cleanest_hours: input.cleanHours, estimated_exposure_saved_percent: input.saved, computed_exposure: input.exposure }),
          maxOutputTokens: 420,
          abortSignal: AbortSignal.timeout(18000),
        })
        return NextResponse.json({ advice: text })
      } catch {
        if (attempt === 2) return NextResponse.json({ error: 'The coach is taking a little breather.' }, { status: 503 })
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }
    return NextResponse.json({ error: 'The coach is taking a little breather.' }, { status: 503 })
  } catch {
    return NextResponse.json({ error: 'The coach is taking a little breather.' }, { status: 503 })
  }
}
