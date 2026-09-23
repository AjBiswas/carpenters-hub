// highlight the nav link matching whichever section is in view
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle("nav-active", link.getAttribute("href") === "#" + id);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach((section) => observer.observe(section));

// mobile hamburger menu: toggles a drawer under the header, closes on
// choosing a link or tapping outside it
const header = document.querySelector(".site-header");
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

siteNav.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (e) => {
  if (!header.classList.contains("nav-open")) return;
  if (header.contains(e.target)) return;
  header.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
});

// switch the header from a transparent overlay (over the hero photo)
// to a solid bar once the page is scrolled past the hero
const hero = document.querySelector(".hero");

function updateHeaderState() {
  const threshold = hero.offsetHeight - 80;
  header.classList.toggle("scrolled", window.scrollY > threshold);
}

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

// custom auto-hiding scroll indicator (see home.css for why: native
// scrollbar pseudo-elements don't transition opacity reliably)
const scrollIndicator = document.getElementById("scrollIndicator");
let hideIndicatorTimer = null;

function updateScrollIndicator() {
  const doc = document.documentElement;
  const trackHeight = window.innerHeight;
  const scrollable = doc.scrollHeight - window.innerHeight;

  if (scrollable <= 0) {
    scrollIndicator.style.opacity = "0";
    return;
  }

  const thumbHeight = Math.max(40, (window.innerHeight / doc.scrollHeight) * trackHeight);
  const thumbTop = (window.scrollY / scrollable) * (trackHeight - thumbHeight);

  scrollIndicator.style.height = thumbHeight + "px";
  scrollIndicator.style.transform = `translateY(${thumbTop}px)`;
  scrollIndicator.classList.add("visible");

  clearTimeout(hideIndicatorTimer);
  hideIndicatorTimer = setTimeout(() => {
    scrollIndicator.classList.remove("visible");
  }, 900);
}

updateScrollIndicator();
window.addEventListener("scroll", updateScrollIndicator, { passive: true });
window.addEventListener("resize", updateScrollIndicator);

// consultation modal: a single "Get in Touch" entry point — first contact
// leads to a conversation, and a home visit with the sample catalogue
// follows later if it's a good fit, rather than being a separate choice
const consultModal = document.getElementById("consultModal");
const consultForm = document.getElementById("consultForm");
const consultSuccess = document.getElementById("consultSuccess");

document.getElementById("consultOpenBtn").addEventListener("click", () => {
  consultForm.hidden = false;
  consultSuccess.hidden = true;
  consultForm.reset();
  consultModal.showModal();
});

document.getElementById("modalClose").addEventListener("click", () => {
  consultModal.close();
});

consultModal.addEventListener("click", (e) => {
  if (e.target === consultModal) consultModal.close();
});

consultForm.addEventListener("submit", (e) => {
  e.preventDefault();
  consultForm.hidden = true;
  consultSuccess.hidden = false;
});

document.getElementById("consultDone").addEventListener("click", () => {
  consultModal.close();
});

// showcase spotlight: auto-rotating slides + dots, and the text fades/slides
// in the first time the section scrolls into view
const showcaseSlides = document.querySelectorAll(".showcase-slide");
const showcaseDots = document.querySelectorAll(".showcase-dot");
let showcaseIndex = 0;
let showcaseTimer = null;

function goToShowcaseSlide(index) {
  showcaseSlides[showcaseIndex].classList.remove("is-active");
  showcaseDots[showcaseIndex].classList.remove("is-active");
  showcaseIndex = index;
  showcaseSlides[showcaseIndex].classList.add("is-active");
  showcaseDots[showcaseIndex].classList.add("is-active");
}

function startShowcaseAutoplay() {
  clearInterval(showcaseTimer);
  showcaseTimer = setInterval(() => {
    goToShowcaseSlide((showcaseIndex + 1) % showcaseSlides.length);
  }, 5000);
}

showcaseDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    goToShowcaseSlide(Number(dot.dataset.index));
    startShowcaseAutoplay();
  });
});

startShowcaseAutoplay();

const showcaseContent = document.querySelector(".showcase-content");
const showcaseRevealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        showcaseContent.classList.add("in-view");
        showcaseRevealObserver.disconnect();
      }
    });
  },
  { threshold: .35 }
);
showcaseRevealObserver.observe(showcaseContent);

