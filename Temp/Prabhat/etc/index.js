window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;

  // HERO TEXT FADE
  const heroContent = document.querySelector(".hero-content");
  if (heroContent) {
    const opacity = Math.max(0, 1 - scrolled / 300);
    const translate = scrolled * 0.3;

    heroContent.style.opacity = opacity;
    heroContent.style.transform = `translateY(${translate}px)`;

    // Navbar logo fade
    const logoText = document.querySelector(".logo-text");
    if (logoText) {
      logoText.style.opacity = 1 - opacity;
    }
  }

  // REAL PARALLAX (WORKING)
  const columns = document.querySelectorAll(".grid-column");

  columns.forEach((column, index) => {
    const speed = 0.2 + index * 0.05; // wave effect
    const yOffset = scrolled * speed;
    column.style.setProperty("--parallax-offset", `${-yOffset}px`);
  });
});
