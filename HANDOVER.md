# Dar Najat handover guide

Dar Najat (House of Najat, دار نجاة) is a small website where anyone can run a feeding for people without a home in a loved one's name, follow a short playbook, and log it so others know a spot was covered. It was founded by Yassir in memory of his mother, Najat Ihsane (14 October 1958 to 28 June 2024).

This page is for whoever looks after the site next. It is meant to be enough to keep it running without asking anyone.

## How it is built

Plain HTML, CSS and a little JavaScript. No framework and no build step. Keep it that way: every added tool is something the next person has to maintain.

| File | What it is |
|---|---|
| `index.html` | Home: memorial hero, Today panel (date, clock, weather, help flags, counts), Remembered here, the two anchor days |
| `playbook.html` | The five-step feeding guide and the 2-1-1 resource card |
| `log.html` | The form to log a feeding, recent feedings, Your feedings, the invite and share card |
| `flyer.html` | One-page printable flyer with a QR code to the playbook |
| `site.css` | Colors and type for every page. Change the palette here, once |
| `ptr.js` | Pull to refresh, and it registers the offline worker |
| `sw.js` | Offline support. Bump `VERSION` whenever you change this file |
| `dar-najat-days.ics` | Yearly calendar reminders for 14 October and 28 June. Must keep CRLF line endings (see `.gitattributes`) |
| `setup.sql` | The full database setup, including later updates, in order |
| `wrangler.jsonc` | Cloudflare deploy settings. Do not delete: without it, pushes stop deploying |
| `.assetsignore` | Repo files that must not be published on the site |
| `.github/workflows/keepalive-backup.yml` | Daily database keep-alive and log backup |
| `data/feedings.json` | Backup copy of the public log, written by the workflow |

Marks: `mark-on-navy.svg` (fine lines, for large use), `mark-small.svg` (heavier lines, for small sizes), `mark-on-ivory.svg` (navy, for light backgrounds and print). Icons: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Share card: `og.png`.

## Accounts

- **Code:** GitHub, `yas-88/dar-najat`, branch `main`.
- **Hosting:** Cloudflare, Worker named `dar-najat`, serving `charity.safjob.com`. The domain belongs to SafJob LLC.
- **Database:** Supabase, project `safjob` (organization SafJob LLC, free plan), table `public.feedings`.

## Making a change

1. Edit the file.
2. Commit to `main` and push. Cloudflare deploys in a minute or two.
3. Check the live site on a phone, in a private tab (browsers cache hard).

There is no staging site. A push to `main` is live.

## The database

One table, `feedings`. Columns: date, rough location, city, state or region, two-letter country code, in memory of, items given, about how many people, an optional note, and `hidden`. Nothing identifies the people served, on purpose.

The public website key can only **read visible rows** and **add new rows**. It cannot edit or delete. That is enforced by row level security and the grants in `setup.sql`.

The pages use the **legacy anon key** (starts with `eyJ`). The newer `sb_publishable_` key did not work with this setup.

### Hide an entry

Supabase, Table Editor, `feedings`, find the row, tick **hidden**. It disappears from the log list, the counts and Remembered here. Untick to bring it back. Nothing is deleted.

### If the database is paused

Free Supabase projects pause after a seven-day stretch of low activity, with a warning email first. The daily workflow should prevent this. If it happens anyway: Supabase dashboard, open the project, **Resume project**. A paused project can be restored for up to a year.

### Backups

The workflow saves the public log to `data/feedings.json` every day it changes. Hidden rows are not copied. To rebuild from scratch: create a Supabase project, run `setup.sql`, import `data/feedings.json` into `feedings`, and put the new URL and anon key into `index.html`, `log.html` and the workflow.

GitHub switches off scheduled workflows in public repos after 60 days with no activity, so the workflow commits `data/last-checked.txt` once a month. If it stops anyway: GitHub, Actions tab, select the workflow, **Enable workflow**.

## Outside services

- **Weather:** Open-Meteo, free for non-commercial use, no key, asks for a visible credit (shown under the forecast) and contact above 10,000 requests a day. The page caches for 30 minutes.
- **Weather alerts (US only):** U.S. National Weather Service, api.weather.gov.
- **Fonts:** Google Fonts (Amiri and Mulish).
- **Database library:** supabase-js from jsDelivr, on the log page only.

The "help most needed" flag is a rule of thumb, stated on the page: a low at or below freezing, a high of 90°F (32°C) or more, or an NWS cold or heat alert.

## Rules that keep it what it is

- **Dignity.** Never name, photograph or describe the people served. Locations stay rough, never where someone sleeps.
- **Najat.** The only facts on the site about her are her name and her two dates. Do not add anything about her life unless Yassir wrote it. Her story section in `index.html` is hidden until he does.
- **Open to everyone.** User-facing words stay general ("a loved one's name"). The dedication stays in the hero, the dates and the footer. The star is Moroccan zellige geometry, presented as heritage, not as a religious symbol.
- **No money claims.** Dar Najat is not a registered nonprofit and does not ask for donations. Do not write "tax-deductible," "501(c)(3)" or anything a donor could rely on.
- **Community first.** The log is the record. Prefer features built from what people log over lists someone has to keep updated by hand.

## On the list for later

- A domain of its own (for example darnajat.org), so the site does not depend on SafJob LLC.
- Coverage map, once there are 20 to 30 feedings in one area.
- Cloudflare Turnstile on the log form, if junk entries start.
- Other languages, when someone asks.
- Nonprofit or fiscal sponsor, only once money is being raised.

## November 2026 additions

Approved by Yassir on 14 November 2026 after a preview in chat.

- `help.html` is the "Need a meal?" page for people living outside. Its phone numbers and hours were checked on 14 November 2026 (211info, Oregon Health Authority, Council for the Homeless, 988 Lifeline). Recheck them once a year; the date is printed at the bottom of the page.
- `site.js` holds shared behavior (reveal on scroll, count-up, the light and dark switch). `site.css` holds both themes: the dark values are one block near the top, under `html[data-theme="dark"]`.
- The theme follows the visitor's phone until they tap the switch in the top bar. Their choice, the bigger-text setting, the kit planner ticks and "Your feedings" live only in that browser's storage. Nothing about a visitor is sent to the database.
- The kit planner amounts in `playbook.html` (one item each, 10 percent spare with a minimum of 2, two waters each in heat) are starting suggestions, not a standard. Change them in the `items()` function.
- When you add a page or a shared file, add it to the `CORE` list in `sw.js` and bump `VERSION` so it works offline.

### Later the same day: plans, needs, Spanish

- Two new tables in Supabase, both in `setup.sql`: `feeding_plans` (a planned feeding: day, time of day, rough place) and `feeding_needs` (one row per tap on "What would help most", from a fixed list of eight items, no free text). The view `feeding_needs_tally` gives the 30-day totals. Both tables are read and insert only for the public, have a `hidden` checkbox like `feedings`, and refuse bursts (20 plans an hour, 90 needs in 10 minutes).
- Plans show on the home page, the log page and the Need a meal pages from the day they are posted until the day after their date. Nothing needs clearing by hand.
- Neither table is in the daily backup: plans expire and the tally is a rolling count.
- `ayuda.html` is the Spanish Need a meal page. It is generated from the same text as `help.html`; when you change a phone number or hours in one, change the other. `help.js` runs both. The Spanish was written by Claude and should be read once by a fluent speaker.
- `db.js` is the one place the database address and public key live for the new features. `index.html` and `log.html` still carry their own copy for the feedings log.

### Printables

- `handout.html`: pocket cards to hand to someone who needs a meal, four to a page, English on page one and Spanish on page two (print two-sided). `car-sign.html`: a landscape sign for a parked car. `flyer.html`: the flyer for community boards.
- The codes are plain links with nothing tracked: `qr-help.svg` and `qr-ayuda.svg` open the Need a meal pages, `qr-home.svg` the home page, `qr-playbook.svg` the playbook. If the site moves to its own domain, every code and every printed card must be remade.
- The card carries the same numbers and hours as `help.html`. Change them together.
