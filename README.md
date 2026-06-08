# didiplay — Shopify OS 2.0 Theme

A complete Shopify Online Store 2.0 theme for the didiplay drawing-robot store.

## How updates work now (GitHub sync)

This repo is connected to Shopify via **Online Store → Themes → Add theme → Connect from GitHub**.
Once connected to a branch, **every push to that branch updates the theme automatically** — no zip uploads.

### First-time setup
1. Create a new GitHub repo (empty, no README) — or use an existing one.
2. Upload **the contents of this folder to the repo root** (the `layout/`, `templates/`,
   `sections/`, `assets/`, `config/`, `snippets/`, `locales/` folders must be at the top level,
   NOT inside another folder).
3. In Shopify admin: Online Store → Themes → Add theme → **Connect from GitHub** → pick the repo + branch.
4. Shopify imports the theme. Click **Publish** when ready (or Preview first).

### Making changes after that
- Edit files in the repo and **push** → Shopify updates the connected theme within ~a minute.
- Edits made in Shopify's **Theme Editor** are written back to `config/settings_data.json`
  on the connected branch, so pull before you push to avoid conflicts.

## Required store setup (one time)
- **Product:** create "Drawing Robot for Kids" ($39.99, compare-at $69.99), add a **Color**
  option (Pink / Mint / Teal), then set its Theme template to `product`.
- **Add-on / cross-sell + drawer "Complete the Set":** need at least one other product in the store.
- **Shipping protection:** create a product with the handle `shipping-protection` (e.g. $2.99) so
  the drawer toggle adds a real line item.
- **Navigation:** set `main-menu` (Home, Shop, Track Order, About Us) and `footer` link lists.
- **Pages:** create "About" and "Track Order" pages; set their templates to `about` and `track`.
- **Currency/Language:** currency uses Shopify Markets; language uses Google Translate (12 languages).

## Structure
- `layout/theme.liquid` — base layout, fonts, header/footer groups, cart drawer, global scripts
- `sections/` — all editable sections incl. `header-group.json` / `footer-group.json`
- `templates/` — JSON templates with content pre-populated
- `assets/` — CSS (`didiplay-styles/index/product/mobile`) + JS (`didiplay-cart`, `didiplay-effects`)
- `snippets/didiplay-cart-drawer.liquid` — Ajax cart drawer
