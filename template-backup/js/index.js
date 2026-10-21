function noBack() {
  window.history.forward();
}

window.onload = noBack();
window.onpageshow = function (evt) {
  if (evt.persisted) noBack();
};

// forward backward js

window.addEventListener("load", function () {
  //loader js
  setTimeout(function () {
    let loader = document.querySelector(".loader-div");
    if (loader) {
      loader.classList.add("hide");
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
      loader.style.display = "none";
      document.body.classList.remove("loading");
      document.body.classList.add("loaded");
    }
  }, 1500);
});

document.addEventListener("DOMContentLoaded", function () {
  window.location.href;

  window.history.forward(1);

  // let navLinks = this.documentElement.querySelectorAll(".link-items .navItem");
  // navLinks.forEach((link) => {
  //   link.addEventListener("click", function (e) {
  //     navLinks.forEach((otherLink) => {
  //       otherLink.classList.remove("active");
  //     });

  //     let selectedNav = e.target;
  //     selectedNav.classList.add("active");
  //   });
  // });

  // let toggleUp = document.querySelector(".toggle-up-content");
  // if (toggleUp) {
  //   toggleUp.addEventListener("click", function () {
  //     window.scrollTo({
  //       top: 0,
  //       behavior: "smooth",
  //     });
  //   });
  // }

  document.querySelectorAll(".year").forEach((e) => {
    e.innerHTML = new Date().getFullYear();
  });
});

//adding class to header when window scroll to Y-axis
// const toggleUp = document.querySelector(".toggle-up");
// const toggleUpC = document.querySelector(".toggle-up-content");
// const btnExplore = document.querySelector(".mob.enquire-div");

// function handledScroll() {
//   let scrollPosition = window.scrollY;

//   let scrollTo = 200;

//   if (scrollPosition > scrollTo) {
//     toggleUp.classList.add("show");
//     btnExplore.classList.add("show");
//   } else {
//     toggleUp.classList.remove("show");
//     btnExplore.classList.remove("show");
//   }
// }

// window.addEventListener("scroll", handledScroll);

// if (toggleUpC) {
//   toggleUpC.addEventListener("click", function () {
//     window.scrollTo({
//       top: 0,
//       left: 0,
//       behavior: "smooth",
//     });
//   });
// }

/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
// var prevScrollpos = window.pageYOffset;
// window.onscroll = function () {
//   var currentScrollPos = window.pageYOffset;
//   if (prevScrollpos > currentScrollPos) {
//     document.getElementById("navbar").style.top = "0";
//   } else {
//     document.getElementById("navbar").style.top = "-200px";
//   }
//   prevScrollpos = currentScrollPos;
// };

// window.addEventListener("load", (event) => {
//   //console.log("page is fully loaded");
//   setTimeout(() => {
//     $("#mainModalPopup").modal("show");
//   }, 5000);
// });

/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */

// document.getElementById("header").style.top = "0";

// var prevScrollpos = window.pageYOffset;
// window.onscroll = function () {
//   var currentScrollPos = window.pageYOffset;
//   if (prevScrollpos > currentScrollPos) {
//     document.getElementById("header").style.top = "0";
//   } else {
//     document.getElementById("header").style.top = "-200px";
//   }
//   prevScrollpos = currentScrollPos;
// };

// let btnBrochure = document.querySelectorAll(".btnPrimary");
// let inputValue = document.getElementById("source2");
// if (btnBrochure) {
//   btnBrochure.forEach((btn) => {
//     btn.addEventListener("click", (e) => {
//       let selectBtn = e.currentTarget;
//       if (selectBtn.classList.contains("btn-brochure")) {
//         inputValue.value = "Brochure";
//       } else {
//         inputValue.value = "";
//       }
//     });
//   });
// }

function scrollInto(id) {
  let elmnt = document.getElementById(id);
  elmnt.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });
}
