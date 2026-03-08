export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Address */}
        <div className="footer-column">
          <h3>
            <img src="/img/Footer/location.png" className="icon" alt="Address" />
            Address
          </h3>
          <p>
            Acharya Narendra Dev College,
            <br />
            University of Delhi
            <br />
            Govindpuri, Kalkaji 110019
          </p>
        </div>

        {/* Contact Us */}
        <div className="footer-column">
          <h3>
            <img src="/img/Footer/Call.png" className="icon" alt="Contact" />
            Contact Us
          </h3>
          <p>
            Phone:<a href="tel:+91 74283 85311">+91 74283 85311</a>
          </p>
          <p>
            Email:
            <a href="mailto:turingandcs@gmail.com">turingandcs@gmail.com</a>
          </p>
        </div>

        {/* Opening Hours */}
        <div className="footer-column">
          <h3>
            <img src="/img/Footer/clock.png" className="icon" alt="Hours" />
            Opening Hours
          </h3>
          <p>Mon-Sat: 11:00 A.M. - 8:00 P.M.</p>
          <p>Sunday: Closed</p>
        </div>

        {/* Follow Us */}
        <div className="footer-column">
          <h3>Follow Us</h3>
          <div className="social-icons-footer">
            <a href="https://www.instagram.com/turing.andc?igsh=Z2dqNzlydWR1MjR2">
              <img src="/img/Footer/Instagram.png" alt="Instagram" />
            </a>
            <a href="#">
              <img src="/img/Footer/Linkedin.png" alt="LinkedIn" />
            </a>
          </div>
        </div>

        {/* Affiliation */}
        <div className="footer-column">
          <h3>Our Affiliation</h3>
          <div className="logo-container">
            <a href="https://www.andcollege.du.ac.in/#">
              <img
                src="/img/Footer/ANDC.png"
                alt="Acharya Narendra Dev College Logo"
                className="footer-logo"
              />
            </a>
            <a href="https://www.du.ac.in/">
              <img
                src="/img/Footer/DU.png"
                alt="University of Delhi Logo"
                className="footer-logo"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        &copy; Copyright Turing ANDC UoD. All Rights Reserved
      </div>
    </footer>
  );
};
