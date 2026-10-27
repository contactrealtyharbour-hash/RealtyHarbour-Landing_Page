// Cloudflare Worker for the Realty Harbour landing page.
// Static files come from dist/ (built by build.sh); this script only runs when no file matches.
// It handles POST /api/lead and the page routes of the Bollineni Zion single-page app.
//
// Configure in Cloudflare → Workers & Pages → realtyharbour → Settings → Variables and Secrets:
//   LEAD_WEBHOOK_URL   a URL that receives the lead as JSON (Google Apps Script, Zapier, Make, your CRM)
//   RESEND_API_KEY     + LEAD_TO_EMAIL (comma-separated) to email each lead via resend.com
//   LEAD_FROM_EMAIL    optional sender for Resend (defaults to onboarding@resend.dev until you verify a domain)
// Every lead is also written to the Worker log (Observability → Logs).

const MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Bollineni Zion (bollineni-zion/) routes pages in the browser, so a path such as
// /bollineni-zion/thank-you has no file of its own: serve the app's index.html for it.
const ZION = "/bollineni-zion/";
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    let v = part.slice(i + 1).trim();
    try { v = decodeURIComponent(v); } catch (_) { /* keep raw */ }
    out[part.slice(0, i).trim()] = v;
  }
  return out;
}

async function handleLead(request, env) {
  const form = await request.formData();
  const f = (k) => String(form.get(k) || "").trim();
  const thanks = () => Response.redirect(new URL("/thank-you", request.url).toString(), 303);

  if (f("company")) return thanks(); // honeypot: bots fill the hidden field

  const name = f("fname");
  const phone = f("mobile").replace(/\D/g, "");
  const email = f("email");
  const project = f("project").slice(0, 100);
  if (!name || !MOBILE.test(phone) || !EMAIL.test(email)) {
    return new Response("Please go back and check your name, 10-digit mobile number and email.", { status: 400 });
  }

  // Tracking values: the page URL the form was sent from (Referer) wins, then the 30-day cookies
  // that js/url-tracking.js stores from the landing URL.
  const cookies = parseCookies(request.headers.get("cookie"));
  const page = request.headers.get("referer") || "";
  let pageParams = new URLSearchParams();
  try { pageParams = new URL(page).searchParams; } catch (_) { /* no referer */ }
  const t = (k) => (pageParams.get(k) || cookies[k] || "").trim();
  const ua = request.headers.get("user-agent") || "";
  const ip = request.headers.get("cf-connecting-ip") || "";
  // Google Ads {device} is m / t / c; otherwise classify the browser.
  const device = { m: "Mobile", t: "Tablet", c: "Desktop" }[t("cstm_ppc_device").toLowerCase()]
    || (/iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop");

  // Field names are what the Google Apps Script webhook maps to sheet columns.
  const lead = {
    name,
    phone,
    email,
    project,
    source: t("utm_source") || t("cstm_ppc_channel") || "Direct",
    campaign: t("utm_campaign") || t("cstm_ppc_campaign"),
    channel: t("cstm_ppc_channel") || t("utm_channel") || t("utm_medium"),
    keyword: t("utm_term") || t("cstm_ppc_keyword"),
    placement: t("utm_placement") || t("cstm_ppc_placement"),
    device,
    medium: t("utm_medium"),
    gclid: t("gclid") || t("utm_GCLID"),
    ad: t("utm_content") || t("utm_Ad"),
    adset: t("adset"),
    adgroup: t("adgroup") || t("utm_ad_group"),
    ip,
    ipAddress: ip, // the script's key for the IP column is not known; cover the common spellings
    ip_address: ip,
    fbclid: t("fbclid"),
    form: f("source"),
    page,
    userAgent: ua,
    receivedAt: new Date().toISOString(),
  };
  console.log("LEAD", JSON.stringify(lead));

  const jobs = [];
  if (env.LEAD_WEBHOOK_URL) {
    jobs.push(fetch(env.LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    }));
  }
  if (env.RESEND_API_KEY && env.LEAD_TO_EMAIL) {
    const text = Object.entries(lead)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    jobs.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.LEAD_FROM_EMAIL || "Realty Harbour <onboarding@resend.dev>",
        to: env.LEAD_TO_EMAIL.split(",").map((s) => s.trim()),
        subject: `New lead: ${name} (${phone})${project ? " for " + project : ""} via ${lead.form || "website"}`,
        text,
      }),
    }));
  }
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === "rejected") { console.error("LEAD forward failed", r.reason); continue; }
    const body = await r.value.text().catch(() => "");
    if (!r.value.ok || /"success"\s*:\s*false/.test(body)) console.error("LEAD forward responded", r.value.status, body.slice(0, 300));
    else console.log("LEAD forwarded", r.value.status, body.slice(0, 120));
  }

  return thanks();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead") {
      return request.method === "POST"
        ? handleLead(request, env)
        : new Response("Method not allowed", { status: 405 });
    }
    if (url.pathname.startsWith(ZION) && !HAS_EXTENSION.test(url.pathname)
        && (request.method === "GET" || request.method === "HEAD")) {
      return env.ASSETS.fetch(new Request(new URL(ZION, url), request));
    }
    return env.ASSETS.fetch(request);
  },
};
