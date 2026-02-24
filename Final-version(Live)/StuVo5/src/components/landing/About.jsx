const About = () => {
  const features = [
    {
      icon: "bx-check-circle",
      text: "Access quality study materials anytime, anywhere",
    },
    {
      icon: "bx-check-circle",
      text: "Collaborate seamlessly with fellow students",
    },
    { icon: "bx-check-circle", text: "Share and discover comprehensive notes" },
    {
      icon: "bx-check-circle",
      text: "Find resources tailored to your curriculum",
    },
  ];

  return (
    <section className="about-section" id="about">
      <div className="about-container">
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
            {features.map((feature, index) => (
              <div className="feature-item" key={index}>
                <i className={`bx ${feature.icon}`}></i>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;