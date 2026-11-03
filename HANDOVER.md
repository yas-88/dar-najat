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
