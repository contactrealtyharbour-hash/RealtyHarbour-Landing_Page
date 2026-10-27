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

  const cookies = parseCookies(request.headers.get("cookie"));
  // Flat object: the Google Apps Script webhook reads name, phone, email, project from the JSON body;
  // tracking cookies (utm_*, gclid, fbclid, srd, cstm_ppc_*) are spread in as extra top-level keys.
  const lead = {
    name,
    phone,
    email,
    project,
    source: f("source"),
    page: request.headers.get("referer") || "",
    ...Object.fromEntries(Object.entries(cookies).filter(([k]) => /^(utm_|gclid|fbclid|srd|cstm_ppc_)/.test(k))),
    ip: request.headers.get("cf-connecting-ip") || "",
    userAgent: request.headers.get("user-agent") || "",
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
        subject: `New lead: ${name} (${phone})${project ? " for " + project : ""} via ${lead.source || "website"}`,
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
