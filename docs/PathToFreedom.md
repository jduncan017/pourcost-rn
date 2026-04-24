# Path to Freedom

Strategic notes for turning PourCost from a side project into a paid full-time gig. Keep this as a living doc — revisit quarterly.

---

## 1. Monetization — what to paywall ASAP

**Gate by cost to you, not just perceived value.** The stuff that costs money per user should have hard caps on free from day one:

- **Invoice OCR scans** — Gemini isn't free. Cap free at **3 scans/month**, Lite unlimited. Easy to implement (count rows in `invoices` table per calendar month), and it's the single most magical feature. People will pay to unlock more.
- **Ingredient / cocktail count** — cap free at **50 ingredients + 15 cocktails**. Trivial check on insert. Hits the "I need this for my whole bar" threshold naturally.
- **Multi-size bottle configurations** — Lite-only. Complex feature, signals seriousness. Single-bottle users fit free fine.
- **CSV / PDF export** — universally gated across SaaS. ~10 min to implement, high willingness to pay for professional use.
- **Price change alerts + price history** — Lite-only. Signals "you're running a real bar."

### Early-adopter pricing play

Two options, pick one:

- **Lifetime deal at $149** (Lite features forever) for first 100 users, then switch to monthly. Generates ~$15k cash fast, rewards believers, caps downside at 100 users.
- **50% off monthly for 12 months** if they sign up before launch+30 days, grandfathered. Produces more long-term MRR but slower upfront cash.

Second option wins on MRR math; first option wins on credibility + cashflow runway.

---

## 2. Gamified sharing

Ranked by ROI (easy AND viral):

1. **Cocktail menu share card** — bartenders already post drink menus to Instagram manually. Generate a beautiful image of their cocktail list with costs hidden, push "Share to IG/TikTok." Every share includes "Made with PourCost." Free acquisition, they WANT to post anyway. 2-3 days to build.
2. **Alternate app icons** — iOS supports this out of the box. Ship 4-5 variants (gold, chrome, neon, etc.), unlock after 1 referral or as a Lite perk. Dopamine hit for almost zero cost. 1 day.
3. **"Shift recap" share card** — at end of day/week, auto-generate "Josh saved $147 in pour cost this week" card. Same IG-share pipeline as #1. Bartenders will brag.
4. **Referral = free month** — both sides get 1 month Lite. Standard but works. Tie redemption to valid signup + payment method attached to prevent abuse.
5. **Community ingredient pricing** — opt-in to contribute your Tito's 750ml price (anonymized), see the regional average. Creates a network effect — people come back for it AND feel invested contributing. Medium-build (1 week), but it's a moat.

Skip: leaderboards (too competitive for the hospitality vibe), cash payouts (accounting headache).

---

## 3. Side project → full-time

What actually moves the needle in the first 6 months post-launch:

- **Short-form video is everything** for this audience. Bartenders live on TikTok and Instagram. Record: invoice scan → drinks recosted → "this cocktail just lost me $1.80 a pour." Ship 3/week minimum. Cheap, the killer mechanic IS demo-able.
- **Local bar drops.** Pick 3 neighborhoods. Show up with iPad. 10-minute demo. Leave a QR code. Bartender buy-in drives owner buy-in. This is how Toast got their first 1000 restaurants.
- **One marquee case study** — free for 60 days to one mid-sized bar group, capture real numbers ("cut Q1 pour cost 3 pts"), use forever in marketing. Trade Lite access for a video testimonial.
- **Distributor partnerships** — Southern Glazer's, Republic National, Breakthru. They already have reps walking into bars weekly. If they recommend PourCost, you get free distribution at massive scale. Harder sell but 100x leverage.
- **Pricing anchor**: $49/mo Lite is spot-on for small independents. Consider adding a **$29/mo single-bar starter** to widen the funnel — not every indie will spring for $49 sight-unseen, but $29 is an easy yes and upsell-able.

### Hardest truth

The bottleneck from "side project" to "full-time gig" is usually sales conversations, not features. Once at 20 paying bars, you know more than any competitor about what to build next. **Get to 20 fast — trade feature work for conversation time.**

---

## Open questions to revisit

- At what MRR does it make sense to go full-time? (Napkin math: cover mortgage + health insurance + 6mo runway = $X/mo target)
- Fundraise or bootstrap? Staying bootstrapped keeps 100% ownership but limits marketing spend. Consider only after proving $5-10k MRR.
- Do we need a co-founder (GTM/sales focus)? Solo dev + solo seller is doable at first but caps growth.
