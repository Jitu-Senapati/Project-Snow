import Navbar from "../componenets/Navbar";
import Hero from "../componenets/Hero";
import About from "../componenets/About";
import Creators from "../componenets/Creators";
import Footer from "../componenets/Footer";

function LandingPage() {
  return (
    <>
      <div className="background-container">

        <video
          className="background-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/blackLiquid.mp4" type="video/mp4" />
        </video>
      </div>
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <About />

      {/* Creators Section */}
      <Creators />

      {/* Footer Section */}
      <Footer />
    </>
  );
}

export default LandingPage;