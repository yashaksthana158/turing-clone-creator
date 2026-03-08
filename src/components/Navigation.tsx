import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LayoutDashboard, LogIn, ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  name: string;
  href: string;
  children?: { name: string; href: string; comingSoon?: boolean }[];
}

export const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navItems: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "About", href: "/about" },
    { name: "Teams", href: "/teams" },
    {
      name: "Overload++",
      href: "/overloadpp",
      children: [
        { name: "2026", href: "/overloadpp/2026" },
        { name: "2025", href: "/overloadpp" },
        { name: "2024", href: "/overloadpp/2024" },
        { name: "Archive", href: "/overloadpp/archive" },
      ],
    },
    {
      name: "Gallery",
      href: "/gallery",
      children: [
        { name: "2026", href: "/gallery/2026", comingSoon: true },
        { name: "2025", href: "/gallery" },
        { name: "2024", href: "/gallery/2024" },
        { name: "Archive", href: "/gallery/archive" },
      ],
    },
  ];

  const handleMouseEnter = (name: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

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
                        <li
                          key={item.name}
                          className="nav-dropdown-wrapper"
                          onMouseEnter={() => item.children && handleMouseEnter(item.name)}
                          onMouseLeave={() => item.children && handleMouseLeave()}
                        >
                          <Link
                            to={item.href}
                            className="nav-link-item"
                            style={{
                              color: location.pathname === item.href || location.pathname.startsWith(item.href + "/") ? "#9113ff" : undefined,
                            }}
                          >
                            {item.name}
                            {item.children && <ChevronDown size={12} className="ml-1" />}
                          </Link>
                          {item.children && openDropdown === item.name && (
                            <div className="nav-dropdown-menu">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  to={child.comingSoon ? "#" : child.href}
                                  className={`nav-dropdown-item ${child.comingSoon ? "nav-dropdown-disabled" : ""}`}
                                  onClick={(e) => {
                                    if (child.comingSoon) e.preventDefault();
                                    else setOpenDropdown(null);
                                  }}
                                >
                                  {child.name}
                                  {child.comingSoon && <span className="nav-coming-soon">Coming Soon</span>}
                                </Link>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                      {user ? (
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
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  );
};
