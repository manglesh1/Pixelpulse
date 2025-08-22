import '../styles/globals.css';
import '../styles/model.css';
import NavBar from '../components/NavBar';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useState } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const hideNavOnRoutes = ['/login'];
  const shouldHideNav = hideNavOnRoutes.includes(router.pathname);

  // Sidebar collapse state here
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={sidebarCollapsed ? 'collapsed-sidebar' : ''}>
      {!shouldHideNav && (
        <NavBar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}
      <div className={shouldHideNav ? '' : 'mainContent'}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default MyApp;
