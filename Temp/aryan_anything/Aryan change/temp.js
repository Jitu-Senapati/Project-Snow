// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate");
    }
  });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll(
  ".about-content, .creator-card",
);
animateElements.forEach((el) => observer.observe(el));

// Navbar background on scroll
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 100) {
    navbar.style.background = "rgba(0, 0, 0, 0.8)";
  } else {
    navbar.style.background = "rgba(0, 0, 0, 0.3)";
  }
});

// Parallax effect for floating elements
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const floatingElements = document.querySelectorAll(".floating-element");

  floatingElements.forEach((element, index) => {
    const speed = (index + 1) * 0.5;
    element.style.transform = `translateY(${scrolled * speed * 0.05}px)`;
  });
});

// Add hover effect to creator cards
const creatorCards = document.querySelectorAll(".creator-card");
creatorCards.forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-10px) scale(1.02)";
  });

  card.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0) scale(1)";
  });
});

// Dynamic greeting based on time
const heroSubtitle = document.querySelector(".hero-subtitle");
const currentHour = new Date().getHours();
let greeting;

if (currentHour < 12) {
  greeting = "Good Morning! Start Your Learning Journey";
} else if (currentHour < 18) {
  greeting = "Good Afternoon! Continue Your Studies";
} else {
  greeting = "Good Evening! Keep Learning & Growing";
}

// Optional: uncomment to change subtitle based on time
// heroSubtitle.textContent = greeting;

// Add loading animation
window.addEventListener("load", () => {
  document.body.style.opacity = "0";
  setTimeout(() => {
    document.body.style.transition = "opacity 0.5s";
    document.body.style.opacity = "1";
  }, 100);
});

// Easter egg: Konami code
let konamiCode = [];
const konamiPattern = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

document.addEventListener("keydown", (e) => {
  konamiCode.push(e.key);
  konamiCode = konamiCode.slice(-10);

  if (konamiCode.join(",") === konamiPattern.join(",")) {
    document.body.style.animation = "rainbow 2s infinite";
    setTimeout(() => {
      document.body.style.animation = "";
    }, 5000);
  }
});

// Add rainbow animation keyframes dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
`;
document.head.appendChild(style);
