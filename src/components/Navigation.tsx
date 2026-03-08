import { useState } from "react";
import { Menu, X } from "lucide-react";

export const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div id="sticky-header" className="main-header-area">
          <div className="container">
            <div className="header_bottom_border">
              <div className="row" style={{ alignItems: "center" }}>
                <div style={{ flex: "0 0 33%", maxWidth: "33%" }}>
                  <div className="logo">
                    <a href="/">
                      <img
                        src="/img/Turing logo.webp"
                        alt="Turing Logo"
                        style={{ width: "117px" }}
                      />
                    </a>
                  </div>
                </div>
                <div style={{ flex: "0 0 67%", maxWidth: "67%" }}>
                  <div className="main-menu" style={{ display: "block" }}>
                    <nav>
                      <ul id="navigation">
                        {navItems.map((item) => (
                          <li key={item.name}>
                            <a href={item.href}>{item.name}</a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                  {/* Mobile menu button */}
                  <div className="d-lg-none" style={{ textAlign: "right" }}>
                    <button
                      className="mobile-menu-btn"
                      onClick={() => setMobileOpen(true)}
                      style={{ display: "none" }}
                    >
                      <Menu />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-menu-overlay">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(false)}
            style={{ position: "absolute", top: 20, right: 20 }}
          >
            <X />
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
