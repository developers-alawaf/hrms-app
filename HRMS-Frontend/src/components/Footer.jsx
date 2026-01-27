import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} Alawaf HRMS. All rights reserved.
        </p>
        {/* <Link to="/" className="footer-link">
          Back to Home
        </Link> */}
      </div>
    </footer>
  );
};

export default Footer;