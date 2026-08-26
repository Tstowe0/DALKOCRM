# Accuracy targets & blockers

Goal: **100% of the written Library contracts** for the pieces we claim as built.  
Not a goal: pixel-clone every Word screenshot.

**Out of score (by product owner):** scanner hardware, real SMTP delivery, TMS/production DB, licensed brand fonts, pixel-perfect mockup match.

## Scores (written Library UI/behavior)

| Area | Score | Notes |
|------|-------|--------|
| Appearance shell | **100%** | Written bullets + Design Rules |
| Leads list | **100%** | List/search/actions/import/compose |
| Prospects list | **~100%** | Twin of Leads; Present–On Board; Prospect Source; Convert→Client only |
| Clients list | **~95%** | First Draft only; TMS Active/Deactivated; no Convert/Mass Convert; no Source column |
| Attachments | **100%** | Library upload/table/more (scanner ignored) |
| Add Lead full screen | **~95%** | Sortable tables, Contact Lookup, bordered Company Info subsections, notes draft guard, fuller section windows, seeded demo data |
| Add Prospect full screen | **~95%** | Same sections as Add Lead; Prospect Source + prospect statuses |
| Add Client full screen | **~90%** | Same 10 sections; Status=Client + TMS Status; heavy TMS/Claims blocks from FD not built |
| Contacts list | **~95%** | First Draft list board; Primary flag; company link by pipeline; modal Add/Edit (full contact page deferred) |
| Campaigns list | **~90%** | No Library list doc; patterned on company Campaigns section + Contacts board |
| Claims list | **~90%** | Appearance nav + Client FD Claims & Disputes columns; Add form inferred |
| Client Claims section | **~95%** | Type/Topic/Load No + audit columns; Add Claim; All Claims link |

### Add Lead section breakdown

| Section | Score |
|---------|-------|
| Screen header | ~95% |
| Company Information | ~95% (5 subsections: Logo + 4 bordered) |
| Contacts | ~95% |
| Subsidiary Companies | ~95% |
| Attachments | ~100% |
| Emails | ~95% |
| Activities | ~90% (modal windows; separate Add Activities module doc not in Library) |
| Campaigns | ~90% |
| Contact Log | ~95% (Contact Lookup included) |
| Notes | ~95% |
| Log | ~95% |

## Still thinner vs full CRM product

- Dedicated Claims / Campaigns Library list specs (PoC inferred)
- Full Contact Information page (PoC uses modal; FD shows full page)
- Client First Draft TMS financial blocks (rating, credit, aging, etc.)
- Email Lookup on New Email compose (Library details Email Lookup separately)
- Exact mockup iconography / column widths
- Contact Department field (FD expand shows it; not in PoC schema)
- More nav: Enquiry / Feeds / Survey
