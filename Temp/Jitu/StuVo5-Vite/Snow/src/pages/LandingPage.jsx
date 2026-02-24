import Navbar from "../componenets/Navbar";
import Hero from "../componenets/Hero";
import About from "../componenets/About";
import Creators from "../componenets/Creators";
import Footer from "../componenets/Footer";

function LandingPage() {
  return (
    <>
      {/* <div className="background-container">

        <video
          className="background-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/blackLiquid.mp4" type="video/mp4" />
        </video>
      </div> */}

      <Navbar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Hero />
        <About />
        <Creators />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;