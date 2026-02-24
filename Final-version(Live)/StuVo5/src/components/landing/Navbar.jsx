import { Link } from "react-router-dom";
import logo from "../../assets/logo512px.png";


const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="STUVO" className="logo-icon" />
        <span className="logo-text">STUVO5</span>
        <span className="beta">β</span>
      </div>
      <Link to="/login" className="login-btn">
        Login
      </Link>
    </nav>
  );
};

export default Navbar;