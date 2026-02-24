import React, { useEffect, useRef } from "react";
import logo from "../../assets/logo512px.png";
import books from "../../assets/hero/books.jpg";
import focus from "../../assets/hero/focous.jpeg";
import students from "../../assets/hero/students.jpg";
import studyCore from "../../assets/hero/study core.jpg";
import books2 from "../../assets/hero/book-2.jpg";
import coding from "../../assets/hero/coding.jpeg";
import cotation from "../../assets/hero/cotation.jpeg";
import laptops from "../../assets/hero/laptops.jpg";
import levelup from "../../assets/hero/levelup.jpeg";
import mark from "../../assets/hero/mark.jpeg";
import desk from "../../assets/hero/desk.jpeg";
import chemistry from "../../assets/hero/chemistry.png";
import physics from "../../assets/hero/physics.png";
import flexing from "../../assets/hero/flexing.jpg";
import rocket from "../../assets/hero/rocket.png";

const Hero = () => {
  const heroContentRef = useRef(null);
  const parallaxGridRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;

      // Fade out hero content
      if (heroContentRef.current) {
        const opacity = Math.max(0, 1 - scrolled / 300);
        const translate = scrolled * 0.3;
        heroContentRef.current.style.opacity = opacity;
        heroContentRef.current.style.transform = `translateY(${translate}px)`;
      }

      // Parallax effect on grid columns
      const columns = parallaxGridRef.current?.querySelectorAll(".grid-column");
      columns?.forEach((column) => {
        const speed = parseFloat(column.getAttribute("data-speed")) || 0.3;
        const yPos = -(scrolled * speed * 0.5);
        column.style.setProperty("--parallax-offset", `${yPos}px`);
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const heroImages = {
    col1: [
      { src: books, alt: "Books" },
      { src: focus, alt: "Focus" },
      { src: students, alt: "Students" },
    ],
    col2: [
      { src: studyCore, alt: "Study Core" },
      { src: books2, alt: "Book" },
      { src: coding, alt: "Coding" },
    ],
    col3: [
      { src: cotation, alt: "Now or Never" },
      { src: laptops, alt: "Laptops" },
      { src: levelup, alt: "Level Up" },
    ],
    col4: [
      { src: mark, alt: "Grades" },
      { src: desk, alt: "Desk" },
      { src: chemistry, alt: "Chemistry" },
    ],
    col5: [
      { src: physics, alt: "Physics" },
      { src: flexing, alt: "Flexing" },
      { src: rocket, alt: "Rocket" },
    ],
  };

  return (
    <section className="hero">
      <div className="hero-content" ref={heroContentRef}>
        <div className="hero-logo-main">
          <img src={logo} alt="STUVO" className="hero-logo-icon" />
          <h1 className="hero-title">STUVO5</h1>
        </div>
      </div>

      <div className="hero-images-container">
        <div className="parallax-grid" ref={parallaxGridRef}>
          <div className="grid-column col-1" data-speed="0.3">
            {heroImages.col1.map((img, idx) => (
              <div className="grid-item" key={`col1-${idx}`}>
                <img src={img.src} alt={img.alt} />
              </div>
            ))}
          </div>
          <div className="grid-column col-2" data-speed="0.5">
            {heroImages.col2.map((img, idx) => (
              <div className="grid-item" key={`col2-${idx}`}>
                <img src={img.src} alt={img.alt} />
              </div>
            ))}
          </div>
          <div className="grid-column col-3" data-speed="0.2">
            {heroImages.col3.map((img, idx) => (
              <div className="grid-item" key={`col3-${idx}`}>
                <img src={img.src} alt={img.alt} />
              </div>
            ))}
          </div>
          <div className="grid-column col-4" data-speed="0.4">
            {heroImages.col4.map((img, idx) => (
              <div className="grid-item" key={`col4-${idx}`}>
                <img src={img.src} alt={img.alt} />
              </div>
            ))}
          </div>
          <div className="grid-column col-5" data-speed="0.35">
            {heroImages.col5.map((img, idx) => (
              <div className="grid-item" key={`col5-${idx}`}>
                <img src={img.src} alt={img.alt} />
              </div>
            ))}
          </div>
        </div>
        <div className="hero-fade"></div>
      </div>

      <div
        className="scroll-indicator"
        onClick={scrollToAbout}
        style={{ cursor: "pointer" }}
      >
        <i className="bx bx-chevron-down"></i>
      </div>
    </section>
  );
};

export default Hero;