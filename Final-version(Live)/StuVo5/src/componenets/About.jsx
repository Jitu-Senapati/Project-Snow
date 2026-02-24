
function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-container">
        {/* Animated Background Elements */}
        <div className="about-animation">
          <div className="floating-element element-1">
            <i className="bx bxs-book-bookmark"></i>
          </div>
          <div className="floating-element element-2">
            <i className="bx bxs-graduation"></i>
          </div>
          <div className="floating-element element-3">
            <i className="bx bxs-file-doc"></i>
          </div>
          <div className="floating-element element-4">
            <i className="bx bxs-group"></i>
          </div>
          <div className="floating-element element-5">
            <i className="bx bxs-bulb"></i>
          </div>

          <div className="animated-orb orb-1"></div>
          <div className="animated-orb orb-2"></div>
          <div className="animated-orb orb-3"></div>
        </div>

        {/* About Content */}
        <div className="about-content">
          <h2 className="about-title">
            Your Ultimate Study <br />
            <span>Companion Platform</span>
          </h2>

          <p className="about-description">
            STUVO 5 is a comprehensive platform designed exclusively for college
            students to streamline their academic journey. Access study
            materials, collaborate with peers, share notes, find valuable
            resources, and achieve academic excellence - all in one integrated
            platform.
          </p>

          <div className="about-features">
            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Access quality study materials anytime, anywhere</span>
            </div>

            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Collaborate seamlessly with fellow students</span>
            </div>

            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Share and discover comprehensive notes</span>
            </div>

            <div className="feature-item">
              <i className="bx bx-check-circle"></i>
              <span>Find resources tailored to your curriculum</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
