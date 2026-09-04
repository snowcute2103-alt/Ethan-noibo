# Design System — Nội Bộ (Ethan Ecom)

> **As-built reference**, captured from the current implementation in `app/`, `components/`, `lib/`; updated on 2026-09-04.
> This documents decisions already made in code. Do not silently invert them — if a rule here is wrong or
> intentionally changed, update this file in the same change.
>
> **LOGIC:** When building a specific page, check `design-system/pages/[page-name].md` first.
> If it exists, its rules override this file. Otherwise follow the rules below.

---

## Brand

- Product: **Nội Bộ** — internal portal for Ethan Ecom (e-commerce / print-on-demand manufacturer, ~88 staff, Vietnamese).
- Slogan: *"Đồng lòng đồng sức, bứt phá gặt thành công"*
- Tone: trustworthy corporate chrome + warm, human content surfaces — not a generic SaaS admin panel.
- Content lives behind department/tier-gated visibility (`lib/roles.ts::canView`); the UI must always make *why* a user sees or doesn't see something legible (see VisibilityBadge below).

## Color Tokens (`tailwind.config.ts`)

The palette is implemented as semantic CSS variables in `app/globals.css` and consumed through Tailwind tokens. Both `light` and `dark` values must be updated together. The selected theme lives on `html[data-theme]`, defaults to the operating-system preference, and is persisted in `localStorage` under `ethan-theme`.

| Token | Hex | Usage |
|---|---|---|
| `navy` | `#1A2745` | Primary structural color — header, footers, dark panels |
| `navy-2` | `#233252` | Navy variant |
| `navy-deep` | `#101A30` | Darkest navy |
| `blue` | `#0052CC` | Links, focus rings, SOP/Rule section accent |
| `blue-cta` | `#2D6FF0` | Call-to-action variant |
| `gold` | `#F5A623` | Highlights, active nav indicator, Thông báo section accent |
| `gold-2` | `#FFC94D` | Gold variant, warning tone |
| `cyan` | `#00D2FF` | Eyebrow/kicker text on navy, header wordmark |
| `ink` | `#333333` | Body text |
| `muted` | `#5A6B82` | Secondary text |
| `surface` / `surface-2` | `#FFFFFF` / `#F4F7F9` | Page/card backgrounds |

The hex values above describe the light-mode brand reference. Runtime colors use equivalent OKLCH values; dark mode uses navy-tinted elevated surfaces rather than a mechanical inversion. New UI must use the semantic tokens instead of adding raw light-only background or text colors.

**Section-accent colors** (ad-hoc but consistent per content type — reused as wayfinding, not tokenized):

| Section | Accent | Where |
|---|---|---|
| SOP & Quy trình | `#0052CC` (blue) | `hub-card`, doc header rules |
| Thông báo | `#F5A623` (gold) | `hub-card`, notice banner gradient |
| Khen thưởng | `#FF6F91` (pink) | `hub-card`; chip rotation adds `#00D2FF`, `#F5A623`, `#7C6CF0` |
| Văn hoá | `#1A2745` (navy) | `hub-card` |
| Báo cáo | `#0052CC` (blue) | metric cards, search data, report navigation |

**Severity colors** (policy/rule rows) — always paired with an icon + text label, never color alone:

| Severity | Icon | Style |
|---|---|---|
| `critical` | `OctagonAlert` | `text-red-600` / `bg-red-50` |
| `warning` | `CircleAlert` | `text-gold-2` / `bg-[#FFF3D6] text-[#B5720A]` |
| `info` (default) | `Info` | `text-blue` / `bg-[#E7F0FF]` |

## Typography

- **`font-heading`** → Fahkwang (300–700): headings, nav, buttons, hub card titles.
- **`font-body`** → Mulish (400–700): default body copy (set on `<body>`).
- **`font-serif`** → Noto Serif (400–900, normal/italic): phần đọc dài và điểm nhấn biên tập của SOP.
- **`font-baskerville`** → Libre Baskerville (400–700): lockup "Ethan Ecom" trong ParallaxHero.
- **`font-script`** → Alex Brush (400): chữ trang trí trên vé sinh nhật.

## Corner Radius — two-tier system

- **Sharp/structural** (`border`, radius 0 — matches `tailwind.config.ts` → `borderRadius.DEFAULT: '0px'`): header/nav chrome, login inputs & submit button, SOP document tables/section rules/golden-rule callout. Signals "this is an operational document."
- **Soft/rounded** (16–28px, or `rounded-full` for pills/icon chips): hub cards, notice banner, policy/announcement cards, recognition chips, culture images. Signals "this is human/content-facing."
- **Rule:** never mix the two on one surface. A table inside an SOP doc stays sharp even on an otherwise-soft page; a dashboard hub card stays soft even sitting directly under the sharp header.

## Shadows

Tint every shadow with the surface's own accent color at low opacity — never plain gray:

```
Navy content card   → shadow-[0_10px_30px_-18px_rgba(26,39,69,0.25)]
Gold notice banner  → shadow-[0_16px_40px_-16px_rgba(245,166,35,0.55)]
Hub card (hover)    → shadow-[0_24px_48px_-20px_rgba(26,39,69,0.28)]
Recognition chip    → shadow-[0_8px_24px_-16px_rgba(26,39,69,0.35)]
```

## Spacing / Rhythm

- Page sections: `py-20 sm:py-28` up to `sm:py-32` for the largest editorial sections — generous, magazine-like breathing room.
- Card padding: `p-8`–`p-12`.
- Page container: `mx-auto max-w-[1440px] px-5 sm:px-8`.

## Component Recipes (as-built, not generic)

```css
/* Structural button — login submit, sharp */
.btn-structural {
  background: #1A2745;      /* navy */
  color: white;
  padding: 12px 0;          /* full-width in its form */
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-weight: 600;
  transition: all 200ms ease;
}
.btn-structural:hover { background: #F5A623; color: #1A2745; } /* navy <-> gold swap, not a tint */

/* Structural input — sharp */
.input-structural {
  border: 1px solid #e0e7f3;
  background: #fafbff;
  padding: 12px 16px;
  border-radius: 0;
}
.input-structural:focus { border-color: #0052CC; outline: none; }

/* Soft content card — hub / policy / announcement */
.card-soft {
  background: white;
  border: 1px solid #eef1f8;
  border-radius: 24px;      /* 24-28px range depending on card size */
  padding: 32px;
  box-shadow: 0 10px 30px -20px rgba(26,39,69,0.2);
}
```

## Shared shadcn/Radix component layer

`components.json` cấu hình shadcn theo style `new-york`, RSC/TypeScript và alias `@/components`, `@/lib`. Đây là lớp open-code được điều chỉnh theo nhận diện Ethan, không phải một theme shadcn độc lập phủ lên sản phẩm.

- Dùng primitives trong `components/ui/` cho các control dùng chung: `Button`, `Input`, `Textarea`, `NativeSelect`, `Checkbox`, `Badge`, `Alert`, `Card`, `Field`, `Table`, `Skeleton`, `Empty`, `Avatar`, `Popover`, `DropdownMenu`, `Dialog`, `AlertDialog`, `Tooltip` và `Separator`.
- Các overlay tương tác dùng Radix để giữ keyboard navigation, focus management, Escape-to-close và portal behavior nhất quán.
- Màu component lấy từ semantic tokens `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `accent`, `destructive`, `success`, `input`, `ring`; không hard-code màu chỉ đúng ở light mode.
- Control vận hành giữ bán kính `--ui-radius-control: 0`; card/dialog/popover dùng `--ui-radius-card`; panel nội dung lớn tiếp tục dùng `--ui-radius-panel`.
- Touch target mặc định của button/control chính tối thiểu 44px. Size nhỏ chỉ dùng cho tác vụ phụ trong bảng dày dữ liệu và vẫn phải có tên truy cập được hoặc tooltip.
- Form mới nhóm bằng `FieldSet`/`FieldLegend`, không đặt quá bốn field trong một nhóm nếu có thể tách thành cụm nghiệp vụ rõ ràng.
- Bảng rộng được cuộn trong chính vùng table; không làm trang tổng thể bị tràn ngang trên mobile.

## Component Patterns by Content Type

The portal deliberately renders 4 content types + urgent notices with **different card languages** — do not collapse them into one generic "card":

1. **Notice/urgent banner** (`notice-banner.tsx`) — gradient gold panel, `TriangleAlert` icon, shown only while a notice is active, always sits above the hub-card grid on dashboard home.
2. **SOP/Rule** (`sop-document.tsx`) — sharp editorial doc: ghost-navy numbered index (`01`, `02`…), `scroll-mt-28` section anchors (ready for a sticky TOC — see Gaps below), navy-header table, solid-navy "golden rule" callout block.
3. **Thông báo / Policy** (`policy-card.tsx`, `announcement-list.tsx`) — rounded white card, navy header band with effective date; severity rows always pair icon + colored badge + text.
4. **Khen thưởng** (`recognition-wall.tsx`) — festive tone kept deliberately distinct from policy tone: rotating accent chips, `Star` + `PartyPopper` icons, grid layout.
5. **Văn hoá** (`culture-articles.tsx`) — magazine layout, alternating image/text per article, Playfair italic pull-quotes, 5-value image grid.
6. **VisibilityBadge** (`components/visibility-badge.tsx`) — reused on every scoped content card; shows department scope + minTier so a user understands why they do/don't see something. Any new content type must include it.
7. **HubCard** (`hub-card.tsx`) — dashboard-home entry point per type; its `accent` prop must match that type's section-accent color (table above) for wayfinding consistency.

## Icons

`lucide-react` only, stroke width 2–2.5, no emoji — followed consistently today; keep it that way.

## Accessibility already satisfied — keep doing this

- Severity/status never relies on color alone (icon + badge + text every time) — `policy-card.tsx`.
- Nav active state uses both color *and* an underline bar (`nav-link.tsx`), not color alone.
- Form inputs have visible `<label htmlFor>` pairs (`login-form.tsx`).

## Gaps flagged in `docs/content-source-noi-bo-portal.md` (not yet built)

- SOP page has no sticky TOC or table/code search yet, despite anchors already being wired for one.
- Rule/thongbao severity styling uses one-off hex (`#FFF3D6`, `#B5720A`) — fine while used once; promote to a tailwind token if a third place needs it.

## Anti-patterns for this project specifically

- ❌ Don't invert the sharp/soft radius rule — it's the primary visual signal separating "operational document" from "human content."
- ❌ Don't invent a 5th section-accent color ad hoc — reuse an existing one or add it to the table above first.
- ❌ Don't define a `--font-*-display`/`-mono` slot casually — most sections should inherit Montserrat; only give a section its own type personality when the content genuinely calls for it (e.g. a tabular/code feel).
- ❌ Emojis as icons, missing `cursor-pointer`, invisible focus states, color-only status — none of these are present today; don't introduce them.

## Pre-Delivery Checklist

- [ ] New content type reuses `VisibilityBadge` and gets a documented section-accent color.
- [ ] Sharp vs soft radius matches the surface's role (doc/table vs card/content).
- [ ] Shadows are accent-tinted, not plain gray.
- [ ] Severity/status communicated via icon + badge + text, not color alone.
- [ ] No emojis as icons; `lucide-react` only.
- [ ] Responsive at 375px / 768px / 1024px / 1440px, no horizontal scroll.
- [ ] Focus states visible; `prefers-reduced-motion` respected for any new animation.
- [ ] Control dùng chung ưu tiên primitive trong `components/ui/`; dialog/menu phá huỷ phải dùng `AlertDialog` thay cho `window.confirm`.
