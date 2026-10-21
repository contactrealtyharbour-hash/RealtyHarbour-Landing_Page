# Recon map: Gurukrupa Ekam landing page (web)

Scope: the whole single-page campaign site at https://gurukruparealcon.com/ekam/ (hero, overview with lead form, configurations, amenities, gallery, location, about, legacy, contact form, enquiry modal, floating CTAs, footer). It is a standalone static page, separate from the company's CMS site.
For: Harbor Realty, as the base for its own project landing page (to be rebranded).
Date: 2026-10-18

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | landing page | https://gurukruparealcon.com/ekam/ | the page itself, Bootstrap 5 static HTML |
| 2 | parent site sitemap | https://gurukruparealcon.com/sitemap.xml | the CMS project page lives at /projects/gurukrupa-ekam |
| 3 | desktop screenshot | screens/original-desktop-full.png | full page, 1280 wide |
| 4 | local copy | screens/replica-desktop-full.png | the mirrored copy served from this folder |

## Core loop

An ad visitor lands, scrolls the project pitch, and submits name, phone and email to get the brochure and pricing. The page exists to capture that lead.

## Screens

One page, so each section is a screen. Routes are anchor IDs.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Header | top, sticky | logo, section links, "Contact Now" | Navbar, Offcanvas menu (mobile) | desktop, mobile (hamburger) |
| S02 | Hero banner | `.main-banner` | one full-width image, desktop and mobile versions | Bootstrap carousel (1 slide, fade) | desktop, mobile |
| S03 | Overview + lead form | `#sectionOverview` | pitch copy, 8 USPs with icons, brochure form | Section heading, USP list, Lead form | form empty, invalid, valid |
| S04 | Configurations | `#sectionConfiguration` | 2 BHK (3 plans) / 3 BHK (8 plans) floorplan images | Pill tabs, Swiper, Image card with hover overlay "Get Quotes" | tab 2BHK, tab 3BHK, hover |
| S05 | Amenities | `#sectionAmenities` | 6 amenity cards | Owl carousel (desktop and mobile variants), Amenity card | desktop, mobile |
| S06 | Gallery | `#sectionGallery` | 35 photos; Videos tab | Pill tabs, Swiper, Fancybox lightbox | images, videos (3 webp files 404 on the original), lightbox |
| S07 | Location | `#sectionLocation` | map image + 4 accordion groups of 5 POIs with distances | Map image (lightbox), Accordion | one group open |
| S08 | About Us | `#sectionAbout` | company copy | Section heading, paragraphs | - |
| S09 | Our Legacy | `#legacy` | 6 animated stat counters | Counter | before/after count-up |
| S10 | Contact | `.section-contact` | "Unlock Homefest Offers" headline + form | Lead form | empty, invalid, valid |
| S11 | Floating CTAs | fixed, all scroll positions | Download Brochure, Enquire Now; mobile bottom bar | Floating button | desktop right edge, mobile bottom bar |
| S12 | Enquiry modal | `#mainModalPopup`, from any CTA or floorplan hover | name, email, phone, DNC consent | Modal, Lead form | closed, open, invalid, valid; `?v=2` adds configuration and site-visit selects |
| S13 | Footer | bottom | RERA QR slots (commented out), copyright, agency credit | Footer | - |
| S14 | Thank-you | `thank-you.php` after any form POST | confirmation + lead handler | server-side PHP, returns empty on GET | not retrievable |

## Flows

```
F01 Visitor requests the brochure
    S02 -> S03 (fill name, phone, email, consent) -> S14
    happy path clicks: 5
    edge: phone must be 10 digits and start with 6-9 (custom-validate.js), consent box required,
          "formfilled" cookie is cleared on load, hidden fullurl + inputsource fields are posted

F02 Visitor opens the enquiry modal
    S11 or S04 hover "Get Quotes" -> S12 (name, email, phone, DNC consent) -> S14
    happy path clicks: 6

F03 Visitor browses floorplans
    S04 pick 2 BHK / 3 BHK tab -> swipe cards -> hover -> "Get Quotes" -> S12

F04 Visitor views the gallery
    S06 Images tab -> click thumbnail -> lightbox -> arrow through 35 photos
    edge: Videos tab shows three broken images on the original

F05 Campaign visitor from an ad
    lands with utm_*, gclid, srd, cstm_ppc_* params -> url-tracking.js stores them as 30-day cookies
    -> facebook-conversion.js looks up the visitor IP and posts a page-view event to the agency's FB conversion API
    -> values travel with the lead on submit
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Navbar | desktop inline links, mobile offcanvas | default, scrolled (sticky), open | S01 |
| Section heading | centred h2 with flower ornament | - | S03-S10 |
| USP list item | icon + text | - | S03 |
| Lead form | overview (3 fields + consent), contact (3 fields), modal (3 fields + DNC consent), `?v=2` adds 2 selects | empty, invalid (Bootstrap was-validated), valid, submit disabled until phone is 10 digits | S03, S10, S12 |
| Pill tabs | 2 tabs | active, inactive | S04, S06 |
| Swiper carousel | config, gallery | - | S04, S06 |
| Owl carousel | desktop, mobile | - | S05 |
| Image card | floorplan with hover overlay + icon + button | default, hover | S04 |
| Amenity card | icon + label | - | S05 |
| Accordion | 4 items | open, collapsed | S07 |
| Counter | data-count number with suffix | idle, counting, done | S09 |
| Floating CTA | pink (brochure), primary (enquire), mobile bar with centre button | - | S11 |
| Modal | centred, scrollable, logo + close | closed, open | S12 |
| Footer | QR row, copyright, credit | - | S13 |

Motion: Lenis smooth scroll, AOS fade-up on nearly every block, GSAP + ScrollTrigger in GSAP.js, Fancybox lightbox.

## Inferred data model

```
Lead      fname, mobile (10 digits, 6-9 first), email, agree (bool),
          fullurl, inputsource (hidden),
          select_option_1 (2 BHK | 3 BHK)            only with ?v=2
          select_option_2 (This week | Next week | This month)   only with ?v=2
          attribution cookies: utm_medium, gclid, srd, cstm_ppc_channel/campaign/placement/device/keyword, visiter_ip
          evidence: S03, S10, S12 forms; url-tracking.js; cookie.js; facebook-conversion.js
          confidence: high

Project   name, overview copy, usps[8], configurations{2bhk: 3 plans, 3bhk: 8 plans},
          amenities[6], gallery[35], location{4 groups x 5 POIs with km}, about copy,
          legacy stats[6], rera numbers (commented out in footer)
          evidence: hard-coded page markup; there is no CMS behind this page
          confidence: high
```

Relationships: none in the page. Lead is posted to thank-you.php and handled off-page.

## Feature matrix

See `features.csv`. Must: 12, should: 8, could: 3, skip: 4.

## Out of scope (cannot or should not be cloned)

- The server-side lead handler `thank-you.php` and whatever CRM it feeds. It returns an empty body on GET, so its content is unknown.
- The owner's tracking: GTM container `GTM-T9M7N7S5`, the Realatte Facebook conversion endpoint and the `ipv4-a.jsonip.com` IP lookup. The copy still carries them and they must be swapped before deploying.
- Trial fonts (Tartuffo_Trial, TT_Neoris_Trial, Neutra). The files are in `assets/fonts/` because the page uses them, but they are trial licences and need a licence or a swap before going live.
- Gurukrupa's brand, copy, photos, floorplans, RERA numbers and the "Created by Realatte" credit.

## Size

Screens 14, flows 5, entities 2. Hard parts: none technically; the work is the lead handler, the font licence and rebranding every asset. Size: S.
