import logo from "../assets/logo192px.png";
import "../styles/Explore.css";

function Explore() {
  return (
    <>
      <div className="logo">
        <img src={logo} alt="STRUVO" className="logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="explore-page">
        <h1>Explore Page</h1>
        <p>Discover new content and connect with others!</p>
      </div>
    </>
  );
}

export default Explore;