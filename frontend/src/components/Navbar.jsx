import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Hook breakpoint ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}

// ─── Icône burger ─────────────────────────────────────────────────────────────
function BurgerIcon({ open }) {
  return (
    <div
      style={{
        width: 24,
        height: 20,
        position: "relative",
        cursor: "pointer",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "block",
            position: "absolute",
            height: 2.5,
            width: "100%",
            background: "#111827",
            borderRadius: 2,
            left: 0,
            transition: "all 0.28s cubic-bezier(.77,0,.175,1)",
            top:
              i === 0
                ? open
                  ? "50%"
                  : 0
                : i === 1
                ? "50%"
                : open
                ? "50%"
                : "100%",

            transform:
              open
                ? i === 0
                  ? "translateY(-50%) rotate(45deg)"
                  : i === 2
                  ? "translateY(-50%) rotate(-45deg)"
                  : "scaleX(0)"
                : i === 1
                ? "translateY(-50%)"
                : "none",

            opacity: open && i === 1 ? 0 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const isMobile = useIsMobile();

  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  // ─── Permissions ────────────────────────────────────────────────────────────
  const canAccessUsers = ["ADMIN", "DIRECTEUR", "MANAGER"].includes(
    user?.role
  );

  const canAccessEquipiers = ["ADMIN", "DIRECTEUR", "MANAGER"].includes(
    user?.role
  );

  const canAccessBriefDebrief = ["ADMIN", "DIRECTEUR", "MANAGER"].includes(
    user?.role
  );

  const canAccessStats = ["ADMIN", "DIRECTEUR", "MANAGER"].includes(
    user?.role
  );

  const canAccessFormations = [
    "ADMIN",
    "DIRECTEUR",
    "MANAGER",
    "FORMATEUR",
  ].includes(user?.role);

  // ─── Liens ──────────────────────────────────────────────────────────────────
  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      show: true,
    },

    {
      to: "/users",
      label: "Utilisateurs",
      show: canAccessUsers,
    },

    {
      to: "/equipiers-restaurent",
      label: "Équipiers",
      show: canAccessEquipiers,
    },

    {
      to: "/brief-debrief",
      label: "Brief / Débrief",
      show: canAccessBriefDebrief,
    },
    {
      to: "/placement-equipe",
      label: "Placement Équipe",
      show: canAccessFormations,
    },
    {
      to: "/stats",
      label: "Statistiques",
      show: canAccessStats,
    },

    {
      to: "/formations",
      label: "Formations",
      show: canAccessFormations,
    },
    {
  to: "/formations-dashboard",
  label: "Dashboard Formation",
  show: canAccessFormations,
},

  ].filter((l) => l.show);

  // ─── Fermer menu si clic extérieur ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Fermer menu changement route ──────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (to) => location.pathname === to;

  return (
    <nav style={navStyle} ref={menuRef}>
      <div style={navInner}>
        {/* ─── Logo ─────────────────────────────────────────────────────────── */}
        <Link to="/dashboard" style={brandStyle}>
          <span style={brandIcon}>🍔</span>

          <span style={brandText}>RushManager</span>
        </Link>

        {/* ─── Desktop Links ───────────────────────────────────────────────── */}
        {!isMobile && (
          <div style={desktopLinksStyle}>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={isActive(link.to) ? activeLinkStyle : linkStyle}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* ─── Desktop Right ──────────────────────────────────────────────── */}
        {!isMobile && (
          <div style={rightSideStyle}>
            <div style={userBadgeStyle}>
              <span style={userInitialStyle}>
                {user?.prenom?.[0]}
                {user?.nom?.[0]}
              </span>

              <div>
                <div style={userNameStyle}>
                  {user?.prenom} {user?.nom}
                </div>

                <div style={userRoleStyle}>{user?.role}</div>
              </div>
            </div>

            <button onClick={handleLogout} style={logoutBtnStyle}>
              Déconnexion
            </button>
          </div>
        )}

        {/* ─── Mobile Burger ──────────────────────────────────────────────── */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={userInitialStyle}>
              {user?.prenom?.[0]}
              {user?.nom?.[0]}
            </div>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={burgerBtnStyle}
              aria-label="Menu"
            >
              <BurgerIcon open={menuOpen} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Mobile Drawer ─────────────────────────────────────────────────── */}
      {isMobile && (
        <div
          style={{
            ...drawerStyle,
            maxHeight: menuOpen ? 700 : 0,
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? "auto" : "none",
          }}
        >
          {/* User */}
          <div style={drawerUserStyle}>
            <div
              style={{
                ...userInitialStyle,
                width: 44,
                height: 44,
                fontSize: 16,
              }}
            >
              {user?.prenom?.[0]}
              {user?.nom?.[0]}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {user?.prenom} {user?.nom}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 2,
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>

          <div style={drawerDivider} />

          {/* Links */}
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={
                isActive(link.to)
                  ? drawerActiveLinkStyle
                  : drawerLinkStyle
              }
            >
              {link.label}
            </Link>
          ))}

          <div style={drawerDivider} />

          {/* Logout */}
          <button onClick={handleLogout} style={drawerLogoutStyle}>
            🚪 Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const navStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backgroundColor: "#fff",
  borderBottom: "1px solid #e5e7eb",
  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
};

const navInner = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 20px",
  height: 60,
  maxWidth: 1280,
  margin: "0 auto",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
  flexShrink: 0,
};

const brandIcon = {
  fontSize: 22,
};

const brandText = {
  fontWeight: 800,
  fontSize: 17,
  color: "#111827",
  letterSpacing: "-0.3px",
};

const desktopLinksStyle = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flex: 1,
  justifyContent: "center",
};

const linkStyle = {
  padding: "6px 14px",
  borderRadius: 8,
  textDecoration: "none",
  color: "#374151",
  fontWeight: 500,
  fontSize: 14,
};

const activeLinkStyle = {
  ...linkStyle,
  backgroundColor: "#111827",
  color: "#fff",
};

const rightSideStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const userBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const userInitialStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  backgroundColor: "#111827",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 13,
};

const userNameStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
};

const userRoleStyle = {
  fontSize: 11,
  color: "#6b7280",
};

const logoutBtnStyle = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const burgerBtnStyle = {
  background: "none",
  border: "none",
  padding: 8,
  cursor: "pointer",
};

const drawerStyle = {
  overflow: "hidden",
  transition:
    "max-height 0.35s cubic-bezier(.77,0,.175,1), opacity 0.25s ease",
  borderTop: "1px solid #f3f4f6",
  backgroundColor: "#fff",
  padding: "0 16px",
};

const drawerUserStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "16px 0 14px",
};

const drawerDivider = {
  height: 1,
  backgroundColor: "#f3f4f6",
  margin: "4px 0",
};

const drawerLinkStyle = {
  display: "block",
  padding: "13px 8px",
  textDecoration: "none",
  color: "#374151",
  fontWeight: 500,
  fontSize: 15,
  borderBottom: "1px solid #f9fafb",
};

const drawerActiveLinkStyle = {
  ...drawerLinkStyle,
  color: "#111827",
  fontWeight: 700,
  borderLeft: "3px solid #111827",
  paddingLeft: 12,
};

const drawerLogoutStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "14px 8px",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#dc2626",
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 8,
};