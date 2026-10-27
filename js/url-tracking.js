// Persist ad-tracking parameters from the landing URL as cookies for 30 days,
// so /api/lead (worker.js) can attribute a lead even if the form is sent later.
(function () {
  var params = new URLSearchParams(window.location.search);
  var keys = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_placement", "utm_device",
    "utm_ad_group", "utm_subsource", "utm_channel", "utm_location", "utm_Ad", "utm_GCLID",
    "adset", "adgroup", "gclid", "fbclid", "srd",
    "cstm_ppc_keyword", "cstm_ppc_placement", "cstm_ppc_device", "cstm_ppc_campaign", "cstm_ppc_channel"
  ];
  keys.forEach(function (k) {
    if (params.has(k)) Set_Cookie(k, params.get(k), 30);
  });
})();
