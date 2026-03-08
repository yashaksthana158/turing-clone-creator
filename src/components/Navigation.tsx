import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "About", href: "/about" },
    { name: "Teams", href: "/teams" },
    { name: "Overload++", href: "/overloadpp" },
    { name: "Gallery", href: "/gallery" },
  ];

  return (
    <header>
      <div className="header-area">
        <div className={`main-header-area ${isSticky ? "sticky" : ""}`}>
          <div className="container">
            <div className="header_bottom_border">
              <div className="nav-row">
                <div className="nav-logo">
                  <a href="/">
                    <img
                      src="/img/turing-logo.webp"
                      alt="Turing Logo"
                      style={{ width: "117px" }}
                    />
                  </a>
                </div>
                <div className="nav-links-desktop">
                  <nav>
                    <ul>
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <a href={item.href}>{item.name}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
                <div className="nav-mobile-toggle">
                  <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileOpen(true)}
                  >
                    <Menu size={28} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu-overlay">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(false)}
            style={{ position: "absolute", top: 20, right: 20 }}
          >
            <X size={28} />
          </button>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
