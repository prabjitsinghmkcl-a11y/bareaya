import React from "react";
import { Link } from "react-router-dom";
import "../styles/footer.css";

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    };

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>About Us</h4>
                    <p>
                        Bareaya is a leading e-commerce platform that offers a wide range of products to cater to your needs. We are committed to providing the best shopping experience for our customers.
                    </p>
                </div>
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/" onClick={scrollToTop}>Home</Link></li>
                        <li><Link to="/shop" onClick={scrollToTop}>Shop</Link></li>
                        <li><Link to="/about" onClick={scrollToTop}>About</Link></li>
                        <li><Link to="/contact" onClick={scrollToTop}>Contact</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Customer Support</h4>
                    <div className="support-details">
                        <p><strong>Call:</strong> <a href="tel:+919266145378">+91 92661 45378</a></p>
                        <p><strong>Email:</strong> <a href="mailto:care@bareaya.in">care@bareaya.in</a></p>
                    </div>
                </div>
                <div className="footer-section">
                    <h4>Contact Us</h4>
                    <p>
                        <strong>Head Office:</strong><br />
                        B-46/1, Nariana Industrial Area, Phase 2, New Delhi, Delhi 110028
                    </p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Bareaya. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
