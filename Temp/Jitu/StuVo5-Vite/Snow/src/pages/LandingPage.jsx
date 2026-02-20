import Navbar from "../componenets/Navbar";
import Hero from "../componenets/Hero";
import About from "../componenets/About";
import Creators from "../componenets/Creators";
import Footer from "../componenets/Footer";

function LandingPage() {
  return (
    <>
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