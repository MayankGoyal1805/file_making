import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📁</span>
          <span className="logo-text">FileMaker</span>
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/upload" className="nav-link">Get Started</Link>
          <Link to="/filemaker" className="nav-link">For Makers</Link>
          <Link to="/orders" className="nav-link">Orders</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
