import { useEffect } from "react";
import logo from "../assets/logo512px.png";
import books from "../assets/hero/books.jpg";
import focus from "../assets/hero/focous.jpeg";
import students from "../assets/hero/students.jpg";
import studyCore from "../assets/hero/study core.jpg";
import books2 from "../assets/hero/book-2.jpg";
import coding from "../assets/hero/coding.jpeg";
import cotation from "../assets/hero/cotation.jpeg";
import laptops from "../assets/hero/laptops.jpg";
import levelup from "../assets/hero/levelup.jpeg";
import mark from "../assets/hero/mark.jpeg";
import desk from "../assets/hero/desk.jpeg";
import chemistry from "../assets/hero/chemistry.png";
import physics from "../assets/hero/physics.png";
import flexing from "../assets/hero/flexing.jpg";
import rocket from "../assets/hero/rocket.png";


function Hero() {
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
        <section className="hero">
            {/* Hero Top Content */}
            <div className="hero-content">
                <div className="hero-logo-main">
                    <img src={logo} alt="STUVO" className="hero-logo-icon" />
                    <h1 className="hero-title">STUVO5</h1>
                </div>
            </div>

            {/* Hero Images Grid */}
            <div className="hero-images-container">
                <div className="parallax-grid">
                    <div className="grid-column col-1" data-speed="0.3">
                        <div className="grid-item">
                            <img src={books} alt="Books" />
                        </div>
                        <div className="grid-item">
                            <img src={focus} alt="Focus" />
                        </div>
                        <div className="grid-item">
                            <img src={students} alt="Students" />
                        </div>
                    </div>

                    <div className="grid-column col-2" data-speed="0.5">
                        <div className="grid-item">
                            <img src={studyCore} alt="Study Core" />
                        </div>
                        <div className="grid-item">
                            <img src={books2} alt="Book" />
                        </div>
                        <div className="grid-item">
                            <img src={coding} alt="Coding" />
                        </div>
                    </div>

                    <div className="grid-column col-3" data-speed="0.2">
                        <div className="grid-item">
                            <img src={cotation} alt="Now or Never" />
                        </div>
                        <div className="grid-item">
                            <img src={laptops} alt="Laptops" />
                        </div>
                        <div className="grid-item">
                            <img src={levelup} alt="Level Up" />
                        </div>
                    </div>

                    <div className="grid-column col-4" data-speed="0.4">
                        <div className="grid-item">
                            <img src={mark} alt="Grades" />
                        </div>
                        <div className="grid-item">
                            <img src={desk} alt="Desk" />
                        </div>
                        <div className="grid-item">
                            <img src={chemistry} alt="Study" />
                        </div>
                    </div>

                    <div className="grid-column col-5" data-speed="0.35">
                        <div className="grid-item">
                            <img src={physics} alt="Library" />
                        </div>
                        <div className="grid-item">
                            <img src={flexing} alt="Coding" />
                        </div>
                        <div className="grid-item">
                            <img src={rocket} alt="Focus" />
                        </div>
                    </div>
                </div>

                <div className="hero-fade"></div>
            </div>

            <div className="scroll-indicator">
                <i className="bx bx-chevron-down"></i>
            </div>
        </section>
    );
}

export default Hero;