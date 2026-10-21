function animateCounter(counter) {
  const target = +counter.getAttribute("data-count");
  let count = 0;
  const duration = 3000;
  const stepTime = Math.max(duration / target, 20);

  const update = () => {
    count++;
    counter.textContent = count;
    if (count < target) {
      setTimeout(update, stepTime);
    } else {
      counter.textContent = target;
    }
  };

  update();
}

document.addEventListener("DOMContentLoaded", function () {
  const section = document.querySelector("#sectionOverview");
  const counters = document.querySelectorAll(".count");
  let hasAnimated = false;

  if (!section) {
    console.warn("sectionOverview not found.");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          console.log("Triggering counter...");
          counters.forEach((counter) => {
            // Reset initial number to 0 so animation is visible
            counter.textContent = "0";
            animateCounter(counter);
          });
          hasAnimated = true;
        }
      });
    },
    {
      threshold: 0.3, // trigger when 30% visible
    }
  );

  observer.observe(section);
});
