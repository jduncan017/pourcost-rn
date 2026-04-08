Below is a "shopping list" of feature ideas you can cherry-pick from as PourCost matures.

1. Core Inventory & Cost Control
   - [ ] Invoice-to-Inventory OCR (you have)
   - [ ] Dynamic COGS tracking with real-time price deltas (you have)
   - [ ] One-tap variance reports (actual vs. theoretical usage)
   - [ ] Par-level alerts & auto-reorder suggestions
   - [ ] Low-stock SMS / push notifications
   - [ ] Multi-unit inventory transfers & "ghost kitchen" support
   - [ ] Batch / keg yield tracking for draft cocktails & beer
   - [ ] Depletion forecasting (AI looks at events, seasonality)
   - [ ] Waste logging & shrinkage heatmaps (who/when/why)

2. Menu & Recipe Engineering
   - [ ] AI recipe builder from inventory (you have)
   - [ ] Prep-recipe costing & roll-ups (you have)
   - [ ] Batch cost amortization (e.g., house syrups)
   - [ ] Allergen & dietary tags auto-generated
   - [ ] ABV / calorie auto-calc & labeling export
   - [ ] Seasonal menu simulation ("what-if" pricing & margin impact)
   - [ ] Supplier swap recommender (suggest cheaper substitutes)
   - [ ] "Feature cocktail" optimizer (AI proposes high-margin specials)
   - [ ] Menu design export to Canva / Figma template
   - [ ] Ability to fair cocktail recipes
   - [ ] Ability to auto-suggest replacements for ingredients
   - [ ] Ability to auto-suggest replacements for all ingredients in recipes section by iterating through which ones you don't have

3. AI-Driven Insights & Coaching
   - [ ] Gap analysis for menu styles & price points (you have)
   - [ ] AI bar-management Q&A assistant (you have)
   - [ ] Smart upsell prompts for bartenders (via mobile)
   - [ ] Forecasted pour cost vs. goal with action checklist
   - [ ] Regional price benchmarking (compare to peer bars)
   - [ ] Dynamic happy-hour pricing engine
   - [ ] KPI dashboard: labor %, pour cost, prime cost, RevPASH

4. Staff Training & Ops
   - [ ] Study-guide generation & quizzes (you have)
   - [ ] Onboarding workflows & SOP library (you have)
   - [ ] Skill-gap heatmap (who missed quiz sections)
   - [ ] Gamified leaderboards for quiz scores / inventory accuracy
   - [ ] Mobile "shift brief" generator (today's specials, 86'd items)
   - [ ] Certification tracker (TIPS, ServSafe, etc.)
   - [ ] Role-based permissions & audit logs
   - [ ] In app messaging and shift notes

5. Integrations & Automation
   - [ ] Invoice email forwarding (forward to scan@pourcost.com → auto-process → push notification to review). Requires email ingestion (SendGrid Inbound Parse or Mailgun Routes), PDF text extraction, review notification flow. Best after web app build for review UX.
   - [ ] POS deep links for live sales pulls (Toast, Square, Lightspeed)
   - [ ] Payroll export (tips, comps, spillage tracked)
   - [ ] QuickBooks / Xero journal entries for COGS sync
   - [ ] Supplier EDI / API ordering (skip email)
   - [ ] Third-party delivery margin tracking (DoorDash, Uber Eats)
   - [ ] BI API so enterprise groups can plug into Power BI / Tableau

6. Compliance & Governance
   - [ ] State liquor reporting auto-fill (e.g., Texas TABC excel)
   - [ ] Keg deposit reconciliation
   - [ ] Ingredient traceability logs (CBD, low-ABV, allergen)
   - [ ] Shelf-life warnings for fresh juices / batches
   - [ ] Sustainability scorecard (waste, water usage)

7. Mobile & UX Enhancements
   - [ ] Offline "cellar mode" for basements with no signal
   - [ ] Barcode / NFC scanning via phone camera
   - [ ] Voice-driven counts ("two cases Tito's, six bottles Campari…")
   - [ ] Dark-mode & low-light counting interface
   - [ ] Smartwatch "low stock" haptic alerts

8. Revenue & Marketing Adjacent
   - [ ] Guest-facing digital menu with live pricing & QR order
   - [ ] Bottle-shop mode (track retail bottle sales vs bar usage)
   - [ ] Loyalty integrations to push high-margin cocktails
   - [ ] Promo ROI tracker (happy hour vs. bounce-back coupons)

9. Hardware / IoT (Future-forward)
   - [ ] Bluetooth scale integration for real-time bottle levels
   - [ ] Smart flow-meter API for draft lines
   - [ ] RFID glassware or coaster tracking (anti-theft + pour accuracy)

10. Scheduling & Workforce (Down-the-road, as you noted)
    - [ ] Labor forecasting tied to sales & events
    - [ ] On-call shift swap marketplace for bartenders
    - [ ] Tips distribution calculator with pooling rules

11. Enterprise / Chain Needs
    - [ ] Centralized recipe & price pushes to all locations
    - [ ] Corporate compliance reporting (franchise dashboards)
    - [ ] Multi-currency support & localized tax/VAT
    - [ ] Ability to share entire portfolios with a new account (aka if a bar manager is leaving the restaurant but wants to retain the cocktails)

\_\_

Below is a clean four-tier lineup (Free → Lite → Pro → Enterprise) with 5–6 carefully-chosen features per tier. I optimized for:
• Founder bandwidth (solo dev, low COGS)
• Clear upgrade path (each tier unlocks an obvious “next pain-killer”)
• AI cost control (heavy AI only in Pro/Enterprise)
• Investor story (easy to explain in the deck)

⸻

🌱 Free – "Starter"

Goal Hook them, capture data, prove value in one shift
- [ ] Manual Inventory & Recipe Entry (up to 50 SKUs)
- [ ] Basic Pour-Cost Calculator (single recipe, manual cost inputs)
- [ ] 1-Click Cost Percentage Report (PDF/CSV export)
- [ ] Weekend Reminder Emails ("Time to do your inventory")
- [ ] Community Knowledge Base Access (how-tos, templates)

Why: Zero infra overhead, zero AI spend. Gives bartenders their first "aha!" and seeds upgrade triggers (SKU cap, manual pain).

⸻

💡 Lite – $49/mo

Goal Eliminate data entry + give real-time cost clarity
- [ ] Invoice-to-Inventory OCR (unlimited scans)
- [ ] Dynamic COGS Tracking & Price-Change Alerts
- [ ] Unlimited Recipe Builder with auto-cost roll-ups
- [ ] Prep Recipe Costing & Batch Yield Tracking
- [ ] Single-Location Dashboard (variance, low-stock alerts)
- [ ] Email Support

Why: Biggest early pain is manual data entry + "what'd that drink cost me today?" All of that is solved here without heavy AI load.

⸻

🚀 Pro – $79/mo

Goal Add AI insights, staff efficiency, and POS accuracy
- [ ] AI Menu Gap & Pricing Suggestions
- [ ] Cocktail Audit + Ingredient Swap Recs
- [ ] POS Integration & Auto-Variance Reports
- [ ] Staff Study-Guide & Quiz Generator
- [ ] Multi-User Roles & Audit Log
- [ ] Mobile "Shift Brief" Push Notifications

Why: These features monetize the AI calls (worth paying for) and drive measurable revenue gains (higher margins, faster training). POS sync makes the numbers bullet-proof, which investors love.

⸻

🏢 Enterprise – $199+/mo (custom)

Goal Chain-wide control, deep analytics, white-labeling
- [ ] Multi-Location Command Center (roll-up analytics)
- [ ] Custom API / ERP Integrations (SAP, NetSuite, flow-meters, etc.)
- [ ] SSO & Advanced Permissions (SOC-2 friendly)
- [ ] Corporate Recipe Push & Compliance Reporting
- [ ] Dedicated Account Manager + Priority SLA
- [ ] White-Label Staff App & Reports

Why: Enterprise bars/hotel groups pay for control, integrations, and premium support. High margin, low churn, great logo cred.

⸻

🔑 Upgrade Ladders (briefly mention in the deck)
• Free → Lite: “Tired of typing in costs? Unlock OCR and dynamic COGS.”
• Lite → Pro: “Your recipes are costed—now use AI to optimize them and sync to POS.”
• Pro → Enterprise: “Roll this out chain-wide, integrate with ERP, and get white-label power.”
