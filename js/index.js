document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".year").forEach((e) => { e.textContent = new Date().getFullYear(); });
});

function scrollInto(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
