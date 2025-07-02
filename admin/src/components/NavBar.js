import Link from 'next/link';
import styles from '../styles/NavBar.module.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const NavBar = ({ collapsed, setCollapsed }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/me`, {
          withCredentials: true,
        });
        setUser(res.data);
      } catch {
        // User not authenticated
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
  if (typeof window !== 'undefined' && collapsed) {
    import('bootstrap/dist/js/bootstrap.bundle.min.js').then(({ Tooltip }) => {
      const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      
      tooltipTriggerList.forEach((el) => {
        // Dispose existing tooltip if any
        if (el._tooltip) {
          el._tooltip.dispose();
          el._tooltip = null;
        }
        
        // Create new tooltip instance
        el._tooltip = new Tooltip(el);

        // Hide tooltip on mouseleave to avoid sticking
        el.addEventListener('mouseleave', () => {
          if (el._tooltip) {
            el._tooltip.hide();
          }
        });
      });
    });
  }

  return () => {
    if (typeof window !== 'undefined') {
      const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.forEach(el => {
        if (el._tooltip) {
          el._tooltip.dispose();
          el._tooltip = null;
        }
      });
      // Remove any lingering tooltip DOM elements
      const tooltipElements = document.querySelectorAll('.tooltip');
      tooltipElements.forEach(t => t.remove());
    }
  };
}, [collapsed]);


  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const iconMap = {
    '/': 'bi-house-door',
    '/games': 'bi-controller',
    '/games-variants': 'bi-grid-3x3-gap',
    '/players': 'bi-people',
    '/player-scores': 'bi-trophy',
    '/smart-devices': 'bi-lightning-charge',
    '/config': 'bi-gear',
    '/admin-page': 'bi-shield-lock',
  };

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Games', href: '/games' },
    { label: 'Game Variants', href: '/games-variants' },
    { label: 'Players', href: '/players' },
    { label: 'Player Scores', href: '/player-scores' },
    { label: 'Smart Devices', href: '/smart-devices' },
    { label: 'Config', href: '/config' },
  ];

  const adminItem = { label: 'Admin', href: '/admin-page' };

  return (
    <nav
      className={`${styles.nav} ${collapsed ? styles.collapsed : ''}`}
      aria-label="Primary Navigation"
    >
      <button
        className={styles.toggleBtn}
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
      >
        <i className="bi bi-list" aria-hidden="true"></i>
      </button>

      <ul className={styles.menu}>
        {navItems.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              tabIndex={collapsed ? -1 : 0}
              {...(collapsed
                ? {
                    'data-bs-toggle': 'tooltip',
                    title: label,
                    'data-bs-placement': 'right',
                  }
                : {})}
              className={router.pathname === href ? 'active' : ''}
            >
              <i
                className={`bi ${iconMap[href]} ${styles.icon}`}
                aria-hidden="true"
              ></i>
              <span className={styles.label}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.bottomSection}>
      <ul className={`${styles.menu} ${styles.adminMenu}`}>
          {user?.role === 'admin' && (
            <li key={adminItem.href}>
              <Link
                href={adminItem.href}
                tabIndex={collapsed ? -1 : 0}
                {...(collapsed
                  ? {
                      'data-bs-toggle': 'tooltip',
                      title: adminItem.label,
                      'data-bs-placement': 'right',
                    }
                  : {})}
                className={router.pathname === adminItem.href ? 'active' : ''}
              >
                <i
                  className={`bi ${iconMap[adminItem.href]} ${styles.icon}`}
                  aria-hidden="true"
                ></i>
                <span className={styles.label}>{adminItem.label}</span>
              </Link>
            </li>
          )}
        </ul>

        <div className={styles.userSection}>
          {user ? (
            <>
              <span className={collapsed ? styles.collapsedUserText : ''}>
                Hello, {user.email} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className={styles.logoutIconBtn}
                title={collapsed ? 'Logout' : undefined}
                aria-label="Logout"
                {...(collapsed
                  ? {
                      'data-bs-toggle': 'tooltip',
                      'data-bs-placement': 'right',
                    }
                  : {})}
              >
                <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              tabIndex={collapsed ? -1 : 0}
              {...(collapsed
                ? {
                    'data-bs-toggle': 'tooltip',
                    title: 'Login',
                    'data-bs-placement': 'right',
                  }
                : {})}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
