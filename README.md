# ⚡ PE Return Machine

> **Decompose stock and REIT/InvIT returns into earnings growth, multiple expansion, and distribution yield.**  
> Built for investors who think in multiples.

🔗 **Live:** [financewizard007.github.io/pe-return-machine](https://financewizard007.github.io/pe-return-machine/)

---

## What Is This?

The PE Return Machine breaks down investment returns into their **three fundamental drivers**:

```
Total Return = Earnings Growth × PE Re-rating × Distribution Yield
```

Most investors look at a stock's return and call it a number. This tool asks *why* — how much came from the business growing, how much from the market paying more, and how much from distributions received.

Works for both **equities (PE mode)** and **REITs / InvITs (P/FFO mode)**.

---

## Features

**Two Modes**
- 🏛 **PE Mode** — for equities. Entry PE × Exit PE × Earnings CAGR × Holding Period
- 🏢 **P/FFO Mode** — for REITs and InvITs. Adds annual distribution yield to the return stack

**Return Decomposition**
- Splits total return into earnings contribution vs PE/P/FFO re-rating contribution
- Year-by-year breakdown — see which year the multiple did the heavy lifting
- Waterfall chart — visualise each component's share of total return

**IRR Heatmap**
- Full grid of exit multiples vs earnings growth rates
- Instantly see which combinations generate >20%, 15–20%, 10–15% etc.
- Your current scenario is highlighted in the grid

**Price Trajectory**
- EPS/FFO growth vs PE multiple path charted together
- Front-loaded, linear, or back-loaded multiple expansion paths
- See exactly how price = earnings × multiple evolves over time

**Side-by-Side Compare**
- Compare two securities head-to-head
- Same holding period, different entry/exit multiples and growth rates
- Edge table showing which metric each security wins on

**Pre-built Scenarios**
| Scenario | Description |
|----------|-------------|
| 🐂 Nifty Bull '20–24 | Post-COVID re-rating |
| 💥 Nifty '08 Crash | GFC de-rating |
| 🚀 Midcap Re-rate | Discovery to darling |
| 🪤 Value Trap | Cheap stays cheap |
| ⚡ Quality Compounder | Earnings carry the weight |
| 🏢 Mindspace REIT | P/FFO + DPU yield |
| 🛍️ Nexus Select | Retail REIT re-rating |
| 🛣️ InvIT Stable | Yield + mild growth |

**Verdict Engine**
- Automatically rates the setup: Exceptional → Strong → Fair Value → Muted → Weak → Capital Destroyer
- Animated radial gauge showing annualised total return
- Plain-English takeaway explaining what drives or kills the return

---

## Inputs

| Input | Range | What It Means |
|-------|-------|---------------|
| Entry PE / P/FFO | 3× – 80× | The multiple you buy at |
| Exit PE / P/FFO | 3× – 80× | The multiple you sell at |
| Earnings / FFO CAGR | -20% – 50% | Annual business growth rate |
| Holding Period | 1 – 15 years | How long you hold |
| Distribution Yield | 0% – 15% | Annual DPU — REIT/InvIT mode only |
| PE Path | Front / Linear / Back | How the multiple re-rates over time |

---

## The Core Insight

A stock returning 25% CAGR over 5 years looks great. But was it:
- The business compounding earnings at 20%+? (sustainable)
- The market re-rating from 10× to 25×? (may not repeat)
- Both? (rare and powerful)

The PE Return Machine separates these forces so you know what you are actually betting on.

---

## Tech Stack

- **React** — UI and state management
- **Recharts** — charts and visualisations
- **Vite** — build tool
- **GitHub Pages** — hosting

---

## Local Setup

```bash
git clone https://github.com/Financewizard007/pe-return-machine.git
cd pe-return-machine
npm install
npm run dev
```

See `SETUP-GUIDE.md` for full instructions.

---

## Related Projects

- 🗺️ [India Inc Knowledge Graph](https://financewizard007.github.io/india-inc-graph/) — How India's top companies are connected
- 📊 [Nifty 250 Decoded](https://financewizard007.github.io/nifty250-decoded/) — Business models of 250 Nifty companies
- 📈 [NIFTY 50 Business Model](https://financewizard007.github.io/NIFTY-50-Business-Model/) — Visual guide to Nifty 50

---

## About

Built by **The Finance Lens** ([@financelensin](https://youtube.com/@financelensin))  
Building tools that make institutional finance accessible to everyone.

> *Not financial advice. For educational purposes only.*

---

⭐ Star this repo if you find it useful · Share with someone who invests in Indian equities or REITs
