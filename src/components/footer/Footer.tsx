import React from "react";
import "../footer/Footer.css";
import containerLogo from "../images/ContainerLog.png"

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* Top Section */}
      <div className="footer-top">
        {/* Logo */}
        <div className="footer-brand">
          <img
            src={containerLogo}
            alt="Buy To Let"
            className="footer-logo"
          />

          <p className="footer-tagline">
            Buy-To-Let is a fully owned subsidiary of Foundation Capital Limited.
          </p>
        </div>
        {/* Social Icons */}
        <div className="footer-social">
          <a href="#" aria-label="Telegram" className="telegram">
            <i className="fab fa-telegram-plane"></i>
          </a>
          <a href="#" aria-label="LinkedIn" className="linkedin">
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a href="#" aria-label="Facebook" className="facebook">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" aria-label="YouTube" className="youtube">
            <i className="fab fa-youtube"></i>
          </a>
          <a href="#" aria-label="X" className="twitter">
            <i className="fab fa-x-twitter"></i>
          </a>
        </div>

        {/* Contact Info */}
        <div className="footer-contact">
          <span><strong>W:</strong> buy-to-let.co</span>
          <span className="divider">|</span>
          <span><strong>E:</strong> info@buy-to-let.co</span>
          <span className="divider">|</span>
          <span><strong>P:</strong> +852.3001.11.11</span>
        </div>

        {/* Links */}
        <div className="footer-links">
          <a href="#">Why Container Investment</a>
          <a href="#">How It Works</a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <span>© 2024 Buy-To-Let. All rights reserved.</span>
        <a href="#">Privacy</a>
      </div>
    </footer>
  );
};

export default Footer;
