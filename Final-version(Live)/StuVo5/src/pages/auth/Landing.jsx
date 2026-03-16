import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import About from "../../components/landing/About";
import Creators from "../../components/landing/Creators";
import Footer from "../../components/landing/Footer";
import "../../styles/landing.css";

function Landing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/explore", { replace: true });
    }
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const heroContent = document.querySelector(".hero-content");

      if (heroContent) {
        const opacity = Math.max(0, 1 - scrolled / 300);
        const translate = scrolled * 0.3;
        heroContent.style.opacity = opacity;
        heroContent.style.transform = `translateY(${translate}px)`;
      }

      const parallaxElements = document.querySelectorAll(".grid-column");
      parallaxElements.forEach((column) => {
        const speed = parseFloat(column.getAttribute("data-speed")) || 0.3;
        const yPos = -(scrolled * speed * 0.5);
        column.style.setProperty("--parallax-offset", `${yPos}px`);
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Creators />
      <Footer />
    </>
  );
}

export default Landing;