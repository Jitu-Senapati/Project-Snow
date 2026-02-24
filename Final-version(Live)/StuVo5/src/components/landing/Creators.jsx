import { Link } from "react-router-dom";
import Aryan from "../../assets/creators/aryan.jpg";
import Jitu from "../../assets/creators/jitu.jpeg";
import Prabhat from "../../assets/creators/prabhat.jpg";
import Sudhansu from "../../assets/creators/sudhansu.jpeg";
import Sunny from "../../assets/creators/sunny.jpg";
import StuVoLogo from "../../assets/logo192px.png";

const creatorsData = [
  {
    id: 1,
    name: "Prabhat Kumar Behera",
    role: "Frontend Developer",
    image: Prabhat,
    socials: {
      instagram: "https://www.instagram.com/prabhat4a",
      github: "https://github.com/Prabhat4a",
      linkedin: "https://www.linkedin.com/in/prabhat-kumar-behera-a806a3363/",
      stuvo: "#",
    },
  },
  {
    id: 2,
    name: "Jitu Senapati",
    role: "UI/UX Designer",
    image: Jitu,
    socials: {
      instagram: "https://www.instagram.com/_jitu_senapati_",
      github: "https://github.com/Jitu-Senapati",
      linkedin: "https://www.linkedin.com/in/jitu-senapati",
      stuvo: "#",
    },
  },
  {
    id: 3,
    name: "N.Eswar Sunny",
    role: "Backend Developer",
    image: Sunny,
    socials: {
      instagram: "https://www.instagram.com/the_e_square_",
      github: "https://github.com/eswarmits8-glitch",
      linkedin: "https://www.linkedin.com/in/n-eswar-sunny-483a1937b/",
      stuvo: "#",
    },
  },
  {
    id: 4,
    name: "Aryan Kumar Rajak",
    role: "Content Strategist",
    image: Aryan,
    socials: {
      instagram: "https://www.instagram.com/aryankr_99",
      github: "https://github.com/Aryan-Kumar-Rajak",
      linkedin: "https://www.linkedin.com/in/aryan-kumar-rajak-a4718a337/",
      stuvo: "#",
    },
  },
  {
    id: 5,
    name: "Sudhansu Sekhara Sunani",
    role: "Marketing Lead",
    image: Sudhansu,
    socials: {
      instagram: "https://www.instagram.com/iam_sss19",
      github: "https://github.com/sudhansux",
      linkedin:"https://www.linkedin.com/in/sudhansu-sekhara-sunani-b8a945368/",
      stuvo: "#",
    },
  },
];

const CreatorCard = ({ creator }) => {
  const handleSocialClick = (e) => {
    e.currentTarget.blur();
  };

  return (
    <div className="creator-card">
      <div className="creator-image">
        <img src={creator.image} alt={creator.name} />
      </div>
      <h3 className="creator-name">{creator.name}</h3>
      <p className="creator-role">{creator.role}</p>
      <div className="creator-socials">
        <a
          href={creator.socials.instagram}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSocialClick}
        >
          <i className="bx bxl-instagram"></i>
        </a>
        <a
          href={creator.socials.github}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSocialClick}
        >
          <i className="bx bxl-github"></i>
        </a>
        <a
          href={creator.socials.linkedin}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSocialClick}
        >
          <i className="bx bxl-linkedin"></i>
        </a>
        <a
          href={creator.socials.stuvo}
          className="social-link"
          onClick={handleSocialClick}
        >
          <img src={StuVoLogo} alt="STUVO" />
        </a>
      </div>
    </div>
  );
};

const Creators = () => {
  return (
    <section className="creators-section" id="creators">
      <h2 className="creators-title">Meet the Creators</h2>
      <div className="creators-wrapper">
        <div className="creators-row">
          {creatorsData.slice(0, 3).map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
        <div className="creators-row second">
          {creatorsData.slice(3, 5).map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      </div>

      <div className="cta-section">
        <h3 className="cta-title">
          Create your account and experience STUVO5 for yourself
        </h3>
        <Link to="/register" className="cta-button">
          Join STUVO5
        </Link>
      </div>
    </section>
  );
};

export default Creators;
