# ☂️ Smogbrella: an umbrella for the air

A winter-smog coach for families in Indian cities. Check the air the way you check the weather, and get a plan you can actually follow.

Built for **PromptWars Virtual, Challenge 6: Urban Air Quality Assistant** by **Paridhi Jain**.

## The problem
Every winter, AQI apps show a number and tell people to "stay indoors." That doesn't help a delivery rider, a child with asthma, or a family that can't afford a purifier.

## What it does
1. You enter your city, who needs extra care, how you travel, your indoor air setup, a monthly budget in ₹, and your usual time outdoors.
2. It fetches live AQI and hourly PM2.5 for your city.
3. It finds the **cleanest hours** of the day for your outings.
4. It shows the **exposure saved** by following the plan (cleaner hours + N95 + filtered bedroom).
5. Gemini writes a short plan in plain words with tips that fit your budget (for example a DIY box-fan filter before a purifier), each with a one-line "why this helps."

If the AI is unavailable, a personalised quick plan appears instead.

## How the impact is calculated
`exposure = Σ (hourly PM2.5 × breathing rate × protection factor)`
Breathing: walking 1.8, two-wheeler/cycle 2.4, car/metro 1.1 · N95 0.25 · indoors 0.7, or 0.3 with filtering.
These are stated assumptions, a simple heuristic and not medical advice. They are meant to be validated with real sensor data.

## Business model
Free for families. Schools, housing societies, employers and delivery platforms pay for group advisories, and CSR partners sponsor free seats for low-income households.

## Tech
- Next.js + TypeScript + Tailwind
- Open-Meteo Geocoding and Air Quality APIs (live data, no key needed)
- Google Gemini 2.5 Flash for plan writing (server-side)
- Built with v0 and Claude (Anthropic) for design, code and writing support

## Run locally
```bash
pnpm install
pnpm dev
```
Create a `.env.local` file with your Gemini key (never commit it):
```
GEMINI_API_KEY=your_key_here
```
Open http://localhost:3000

## Limitations
Air data is modelled and may differ from ground sensors. Exposure figures are estimates. Not a substitute for medical advice.
