// Fade out STUVO5 text on scroll + add parallax to loop
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const heroContent = document.querySelector(".hero-content");

  // Fade out text
  if (heroContent) {
    const opacity = Math.max(0, 1 - scrolled / 300);
    const translate = scrolled * 0.3;
    heroContent.style.opacity = opacity;
    heroContent.style.transform = `translateY(${translate}px)`;
  }

  // Add parallax offset to the looping animation
  const parallaxElements = document.querySelectorAll(".grid-column");
  parallaxElements.forEach((column) => {
    const speed = parseFloat(column.getAttribute("data-speed")) || 0.3;
    const yPos = -(scrolled * speed * 0.5); // Reduced parallax effect
    // Apply parallax as CSS variable that combines with animation
    column.style.setProperty("--parallax-offset", `${yPos}px`);
  });
});
