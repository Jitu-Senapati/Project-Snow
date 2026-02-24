import { Link } from "react-router-dom";
import Aryan from "../assets/creators/aryan.jpg";
import Jitu from "../assets/creators/jitu.jpeg";
import Prabhat from "../assets/creators/prabhat.jpg";
import Sudhansu from "../assets/creators/sudhansu.jpeg";
import Sunny from "../assets/creators/sunny.jpg";
import StuVoLogo from "../assets/logo192px.png";

function Creators() {
    return (
        <section className="creators-section" id="creators">
            <h2 className="creators-title">Meet the Creators</h2>

            <div className="creators-wrapper">
                {/* First Row */}
                <div className="creators-row">
                    {/* Creator 1 */}
                    <div className="creator-card">
                        <div className="creator-image">
                            <img src={Prabhat} alt="Prabhat Kumar Behera" />
                        </div>
                        <h3 className="creator-name">Prabhat Kumar Behera</h3>
                        <p className="creator-role">Frontend Developer</p>

                        <div className="creator-socials">
                            <a
                                href="https://www.instagram.com/prabhat4a"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-instagram"></i>
                            </a>
                            <a
                                href="https://github.com/Prabhat4a"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-github"></i>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/prabhat-kumar-behera-a806a3363/"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-linkedin"></i>
                            </a>
                            <a href="#" className="social-link">
                                <img src={StuVoLogo} alt="STUVO" />
                            </a>
                        </div>
                    </div>

                    {/* Creator 2 */}
                    <div className="creator-card">
                        <div className="creator-image">
                            <img src={Jitu} alt="Jitu Senapati" />
                        </div>
                        <h3 className="creator-name">Jitu Senapati</h3>
                        <p className="creator-role">UI/UX Designer</p>

                        <div className="creator-socials">
                            <a href="https://www.instagram.com/_jitu_senapati_" className="social-link">
                                <i className="bx bxl-instagram"></i>
                            </a>
                            <a
                                href="https://github.com/Jitu-Senapati"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-github"></i>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/jitu-senapati/"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-linkedin"></i>
                            </a>
                            <a href="#" className="social-link">
                                <img src={StuVoLogo} alt="STUVO" />
                            </a>
                        </div>
                    </div>

                    {/* Creator 3 */}
                    <div className="creator-card">
                        <div className="creator-image">
                            <img src={Sunny} alt="N Eswar Sunny" />
                        </div>
                        <h3 className="creator-name">N. Eswar Sunny</h3>
                        <p className="creator-role">Backend Developer</p>

                        <div className="creator-socials">
                            <a
                                href="https://www.instagram.com/the_e_square_"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-instagram"></i>
                            </a>
                            <a
                                href="https://github.com/NESWAR-SUNNY"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-github"></i>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/n-eswar-sunny-483a1937b/"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-linkedin"></i>
                            </a>
                            <a href="#" className="social-link">
                                <img src={StuVoLogo} alt="STUVO" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Second Row */}
                <div className="creators-row second">
                    {/* Creator 4 */}
                    <div className="creator-card">
                        <div className="creator-image">
                            <img src={Aryan} alt="Aryan Kumar Rajak" />
                        </div>
                        <h3 className="creator-name">Aryan Kumar Rajak</h3>
                        <p className="creator-role">Content Strategist</p>

                        <div className="creator-socials">
                            <a
                                href="https://www.instagram.com/aryankr_99"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-instagram"></i>
                            </a>
                            <a
                                href="https://github.com/Aryan-Kumar-Rajak"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-github"></i>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/aryan-kumar-rajak-a4718a337/"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-linkedin"></i>
                            </a>
                            <a href="#" className="social-link">
                                <img src={StuVoLogo} alt="STUVO" />
                            </a>
                        </div>
                    </div>

                    {/* Creator 5 */}
                    <div className="creator-card">
                        <div className="creator-image">
                            <img src={Sudhansu} alt="Sudhansu Sekhara Sunani" />
                        </div>
                        <h3 className="creator-name">Sudhansu Sekhara Sunani</h3>
                        <p className="creator-role">Marketing Lead</p>

                        <div className="creator-socials">
                            <a
                                href="https://www.instagram.com/iam_sss19"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-instagram"></i>
                            </a>
                            <a
                                href="https://github.com/sudhansux"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-github"></i>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/sudhansu-sekhara-sunani-b8a945368/"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bxl-linkedin"></i>
                            </a>
                            <a href="#" className="social-link">
                                <img src={StuVoLogo} alt="STUVO" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call To Action */}
            <div className="cta-section">
                <h3 className="cta-title">
                    Create your account and experience STUVO5 for yourself
                </h3>
                <Link to="/login" className="cta-button">
                    Join STUVO5
                </Link>
            </div>
        </section>
    );
}

export default Creators;
