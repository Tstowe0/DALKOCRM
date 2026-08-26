# MyCRM Design Rules

Living reference for building any new screen or component. Parsed from the designer specs in `Library/` (primarily **CRM Appearance and Layout Updates 11.14.2024** and the shared **General Formatting** sections in Add Lead / Leads / Prospects docs).

When a new piece is built, check this file first. If a rule conflicts with a newer Library doc, update this file.

---

## Brand

| Element | Rule |
|--------|------|
| Product name | **MyCRM** |
| Wordmark — “My” | Bradley Hand ITC, white, bold |
| Wordmark — “CRM” | Myriad Pro, white, bold |
| Placement | Top bar, top-left |
| Logo | Centered in the top bar — use `Main/images/Logo1.png` (served as `/brand/Logo1.png`) |
| Username | Do **not** show beside the user menu; show full name only as **hover text** on the user menu |

### Brand assets

| Asset | Location | Use |
|-------|----------|-----|
| DALKO Resources logo | [`Main/images/Logo1.png`](Main/images/Logo1.png) | Drop / source file |
| Served copy | `Main/public/brand/Logo1.png` | App top-bar logo (URL `/brand/Logo1.png`) |

When adding more brand images, put them in `Main/images/` and copy (or we will wire) into `Main/public/brand/` so Next can serve them.

---

## Theme / color

Exact swatches from the Appearance document color pickers (embedded mockup images):

| Token | Hex | Use |
|-------|-----|-----|
| `--color-blue` | `#0B183E` | Top bar, nav text, active underline, primary chrome |
| `--color-gold` | `#E0B752` | Link (nav) bar fill |
| `--color-gold-light` / `--color-gold-deep` | `#F0D48A` / `#C9A043` | Nav bar vertical gradient (per mockups) |
| `--color-table-tint` | `#E1E8FC` | Soft table / menu highlight (Appearance “Table Lines” swatch) |
| `--color-table-line` | `#001D60` | Borders / structural lines (additional Appearance navy swatch) |
| `--color-danger` | `#FF0000` | Required-field errors |
| `--color-white` | `#FFFFFF` | Top-bar wordmark; user avatar circle |

**Status flow chart (Lead/Prospect header)**

- **Current** status: shaded **blue**, **white** font  
- **Completed** statuses: shaded **grey**, **blue** font  
- **Future** statuses: **white** fill, **blue** font  

**Section chrome**

- Collapsible sections use a **blue title bar**; click title bar to collapse/expand.

**Shell chrome (Appearance mockups)**

- Top bar: solid `--color-blue`
- Link bar: **gold gradient** (not white), dark-blue Verdana labels, active = bold underline
- User menu: **white circle** avatar; name only via hover `title`
- More: three-dot control → Enquiry, Feeds, Survey

---

## Typography

Confirmed rule (general UI — use this on every screen):

```
General text, field labels: Open Sans
  -fallback: open sans, helvetica neue, helvetica, arial, sans-serif

Headers, title bars, buttons: Verdana
  -fallback: Verdana, Geneva, sans-serif
```

| Role | Font | CSS / implementation |
|------|------|----------------------|
| General text, field labels | **Open Sans** | `--font-body`: `"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif` |
| Headers, title bars, buttons | **Verdana** | `--font-heading`: `Verdana, Geneva, sans-serif` |
| Nav link bar | **Verdana** | same as headers (`--font-heading`) |

Brand wordmark fonts (Appearance top bar only; lower priority for now):

| Role | Spec font |
|------|-----------|
| “my” | Bradley Hand ITC (web fallback: Caveat) |
| “CRM” | Myriad Pro (web fallback: Source Sans 3) |

---

## Shell layout

### Top bar

- MyCRM wordmark left; logo centered; user menu right (name on hover only).
- Adjust layout/colors to match Appearance mockups (blue/gold scheme).

### Link (nav) bar

- Font: Verdana  
- **In-focus** link: indicated by a **bold underline/line**  
- **More** menu: **three-dot** icon; hover text: `More Options`  

**Primary nav labels (order/names)**

| Show in primary nav | Notes |
|---------------------|--------|
| Leads | was “Lead” |
| Prospects | added |
| Clients | was “Customer” |
| Contacts | was “Contact” |
| Campaigns | was “Campaign” |
| Claims | was “Help Desk” |

**Removed from nav:** Product  

**Under More menu:** Enquiry, Feeds, Survey  

*(Improvements backlog asks to rename Enquiry → Opportunity — prefer Opportunity when implementing that area.)*

### Footer

- Not sticky mid-viewport.  
- Sits at the **bottom of the page content**; visible only after scrolling to the end.

---

## Text & field formatting

Apply globally unless a field notes an exception.

### Text

- After the user finishes typing, convert text to **ALL CAPS**.  
- Open input fields: spellcheck on; auto-capitalize (same ALL-CAPS rule) except where noted.

### Phone / fax

Auto-format on entry:

- **US & Canada:** `(xxx) xxx-xxxx`  
- **Mexico:** accept  
  - `(xx) xx xxxx xxxx`  
  - `(xx xx) xxxx xxxx`  
  - `(xx) xxxx xxxx`  
  - `xx xxxx xxxx` (Greater Mexico City, Guadalajara, Monterrey cells)  
  - `xxx xxx xxxx` (elsewhere)  
- **China:** `(xxx) xxxx xxxx`  
  - Ref: [National conventions — China](https://en.wikipedia.org/wiki/National_conventions_for_writing_telephone_numbers#China)

### Dates

- Display/store entry format: **`mm/dd/yyyy`**  
- Manual entry should normalize short years (e.g. `02/01/17` → `02/01/2017`).

### Postal code

- Accept with or without spaces/dashes (e.g. `A0A1A0` and `A0A 1A0`).  
- Ref: [List of postal codes](https://en.wikipedia.org/wiki/List_of_postal_codes)

### Time

- Format: **`h:mm a`** (hour + minutes numeric; AM/PM selected).  
- Typing `A` selects AM; `P` selects PM.  
- AM/PM displayed in **ALL CAPS**.  
- Empty state shows dashes where digits will go.  
- Support typing **or** clock-icon picker (picker UI per mockup).

### Calendars

- Month click → month picker view; year click → year picker view.  
- Views work in reverse as the user selects.

---

## Controls & interaction

### Keyboard

- Radio & checkbox: **Space** to select  
- Other buttons: **Enter** to activate  

### Dropdowns

- Blank by default unless the doc or Client Settings sets a default  
- Always include a blank option unless the field is required or stated otherwise  
- Options in **alphabetical or numerical** order unless specified  
- First-letter jump (type `E` → first option starting with E)  

### Required fields

- Flag with a **red vertical bar** on the field  
- If bypassed empty: input turns **red**; **red** message below (e.g. `Name is required`)  

### Tables / lists

- Columns sortable where specified  
- Row **More** menus: **three-dot** icon; hover text: `More options`  
- Place More menu where the screen spec indicates (often between first identity column and next column)

### Pagination

- Items per page: **10, 25, 50, 100**  
- Page number entry jumps to that page  
- Single arrows: ±1 page; arrows with line: first/last page  

### Edit patterns (detail screens)

**Add (new record)**  
- All fields open; one screen-level **Save** commits everything.

**Edit (existing record)**  
- Fields locked until per-field **Edit**  
- No screen-level Save; per-field save + exit  
- Hover text: Edit → `Edit`; Save → `Save Changes`; Exit → `Cancel Edit`

### Unsaved changes

- Leaving with dirty data shows a confirmation (Save / Proceed without saving / Cancel — wording per screen).

---

## CRM terminology (status pipeline)

| Term | Meaning |
|------|---------|
| **Lead** | Company status is New Lead, Contact, or Qualify |
| **Prospect** | Status is Present, Proposal, Pursuit, Negotiate, or On Board |
| **Client** | Status is Client (converted or created directly) |

When status moves from **Qualify → Present**, the company is no longer a Lead; it becomes a Prospect.

---

## Detail screen structure (Lead / Prospect)

Header (name, actions, status flow) plus **10 collapsible sections** (blue title bars):

1. Company Information  
2. Contacts  
3. Subsidiary Companies  
4. Attachments  
5. Emails  
6. Activities  
7. Campaigns  
8. Contact Log  
9. Notes  
10. Log  

---

## Source documents

| Rule area | Library file |
|-----------|----------------|
| Theme, shell, nav, footer | `CRM Appearance and Layout Updates 11.14.2024.docx` |
| General formatting, validation, terminology | `CRM Add Lead 11.20.2024.docx` (also mirrored in Prospects / list specs) |
| Permissions / Enquiry→Opportunity | `CRM Improvements 02.12.2024.docx` |

Screenshot mockups in those Word files remain authoritative for spacing and exact chrome where this file summarizes in prose.
