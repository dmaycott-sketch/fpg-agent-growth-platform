# Freedom Partners Group — Cloudflare rebuild

Static rebuild of [freedompartnersgroup.com](https://freedompartnersgroup.com), migrating off Webflow onto Cloudflare Pages. Built from the real design tokens (colors, type, spacing) and content pulled directly from the live Webflow site, not a redesign.

## Status

**Live pages so far:** Home (`/`), Book a Call (`/book-a-call`)

**Not yet built:** Mentorship, Onboarding, Development, Community, Support, Resources, Workflows, Training, Accountability, New Agents, Apply, Privacy, Terms, Accessibility — 13 pages, all linked from the nav/footer already in place. Those links currently 404 until each page is built.

## Structure

```
/index.html              Home page
/book-a-call/index.html  Book a Call page with lead form
/css/tokens.css          Design tokens pulled from Webflow (color, type, spacing)
/css/style.css           Shared component styles
/functions/api/submit-lead.js   Cloudflare Pages Function — posts form leads to Zoho CRM
```

No build step — this is plain HTML/CSS. Cloudflare Pages serves it as-is and runs `/functions/*` as serverless functions automatically.

## Connect to Cloudflare Pages (one-time, manual — do this yourself)

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select this repository (`fpg-agent-growth-platform`)
3. Build settings: **Framework preset: None**, **Build command: (leave blank)**, **Build output directory: /**
4. Deploy — Cloudflare gives you a preview URL like `fpg-agent-growth-platform.pages.dev`

## Set the Zoho CRM environment variables

In the Pages project → **Settings** → **Environment variables**, add (for both Production and Preview):

| Name | Value |
|---|---|
| `ZOHO_CLIENT_ID` | from Zoho API Console self-client |
| `ZOHO_CLIENT_SECRET` | from Zoho API Console self-client |
| `ZOHO_REFRESH_TOKEN` | from the one-time OAuth exchange (see `tmg-listing-leads-system/SETUP.md` for the exact curl command — same Zoho org) |
| `ZOHO_ACCOUNTS_DOMAIN` | `https://accounts.zoho.com` |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.com` |

Redeploy after setting these (Pages picks up new env vars on the next deploy, not retroactively).

## Verify

Submit the Book a Call form on the preview URL — a new Lead should appear in Zoho CRM under **Leads**, source "Website", with brokerage and revenue/new-agent status in the Description field.

## DNS cutover (when ready)

Once the remaining pages are built and the form is verified:

1. Pages project → **Custom domains** → add `freedompartnersgroup.com` and `www.freedompartnersgroup.com`
2. Cloudflare will prompt you to update DNS — if the domain's nameservers are already on Cloudflare, this is automatic; otherwise follow the CNAME/A record instructions it gives you
3. Webflow's publish stays live until DNS actually switches over, so there's no downtime window — just don't remove the Webflow site until you've confirmed the Cloudflare version end-to-end
