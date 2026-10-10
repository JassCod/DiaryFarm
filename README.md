# DairyFarm — Herd Manager

A dairy farm management web app for cows and buffaloes: animal register with tag numbers, daily morning/evening milk,
health & medicine history, breeding/pregnancy tracking with automatic due dates, calving with calf registration, reports and CSV export.

UI: glassmorphism surfaces, neumorphic inputs/buttons/switches, claymorphic stat cards and chips, animated page
transitions (curtain wipe + blur/slide), animated hero, milk-bottle loading screen, skeleton loaders and hover effects.

## Stack
- React 18 + Vite, React Router, Framer Motion
- Supabase (Postgres + Auth). Every table has Row Level Security so each account only sees its own farm.
- Hosted on Vercel (static SPA, `vercel.json` rewrites all routes to `index.html`)

## Records kept
| Area | Fields |
| --- | --- |
| Animals | tag no., name, cow/buffalo, breed, sex, DOB, status (lactating/dry/heifer/calf/bull/sold/dead), lactation no., mother, sire/semen, colour, weight, purchase date & price, notes |
| Milk | per animal per day: morning L, evening L, fat %, SNF % |
| Health | date, type (treatment/vaccination/deworming/checkup/surgery), disease, symptoms, medicine, dosage, reason, vet, cost, milk-withdrawal date, next dose due, outcome |
| Breeding | heat date, insemination date, AI/natural, bull/semen ID, technician, attempt no., PD date & result, expected calving, dry-off date, actual calving, outcome, calf |

Due-date rules (`src/lib.js`): gestation 283 days (cow) / 310 days (buffalo); return-to-heat check at 21 days;
pregnancy diagnosis at 60 days; dry-off 60 days before calving. The dashboard surfaces PD due, heat checks,
calvings within 30 days, dry-offs, vaccine boosters and active milk-withdrawal periods.

## Run locally
```bash
npm install
npm run dev
```
`.env` holds the Supabase URL and publishable key (public by design; data is protected by RLS).

## Database
Schema: `supabase/schema.sql`.
