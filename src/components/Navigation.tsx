import { useState, useEffect } from "react";
import { Menu, X, User, LayoutDashboard, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasMinRoleLevel } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
                  <Link to="/">
                    <img
                      src="/img/turing-logo.webp"
                      alt="Turing Logo"
                      style={{ width: "117px" }}
                    />
                  </Link>
                </div>
                <div className="nav-links-desktop">
                  <nav>
                    <ul className="flex items-center gap-1">
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className="nav-link-item"
                            style={{
                              color: location.pathname === item.href ? "#9113ff" : undefined,
                            }}
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                      {user ? (
                        <>
                          {hasMinRoleLevel(2) && (
                            <li>
                              <Link
                                to="/dashboard"
                                className="nav-link-item flex items-center gap-1.5"
                                style={{ color: location.pathname.startsWith("/dashboard") ? "#9113ff" : undefined }}
                              >
                                <LayoutDashboard size={16} />
                                <span>Dashboard</span>
                              </Link>
                            </li>
                          )}
                          <li>
                            <Link
                              to="/profile"
                              className="nav-link-item flex items-center gap-1.5"
                              style={{ color: location.pathname === "/profile" ? "#9113ff" : undefined }}
                            >
                              <User size={16} />
                              <span>Profile</span>
                            </Link>
                          </li>
                        </>
                      ) : (
                        <li>
                          <Link
                            to="/login"
                            className="nav-link-item flex items-center gap-1.5"
                            style={{ color: location.pathname === "/login" ? "#9113ff" : undefined }}
                          >
                            <LogIn size={16} />
                            <span>Login</span>
                          </Link>
                        </li>
                      )}
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
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {user ? (
            <>
              {hasMinRoleLevel(2) && (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              )}
              <Link to="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  );
};
