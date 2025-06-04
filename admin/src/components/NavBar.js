import Link from 'next/link';
import styles from '../styles/NavBar.module.css';

const NavBar = () => (
  <nav className={styles.nav}>
    <ul className={styles.menu}>
      <li>
        <Link href="/">Home</Link>
      </li>
      <li>
        <Link href="/gameroom-types">Gameroom Types</Link>
      </li>
      <li>
        <Link href="/notifications">Notifications</Link>
      </li>
      <li>
        <Link href="/config">Config</Link>
      </li>
      <li>
        <Link href="/player-scores">Player Scores</Link>
      </li>
      <li>
        <Link href="/players">Players</Link>
      </li>
      <li>
        <Link href="/games">Games</Link>
      </li>
      <li>
        <Link href="/games-variants">Games Variants</Link>
      </li>
      {/* <li>
        <Link href="/gameroom-devices">Devices</Link>
      </li> */}
      <li>
        <Link href="/smart-devices">Smart Devices</Link>
      </li>
      <li>
        <Link href="/bookings">Bookings</Link>
      </li>
    </ul>
    <style jsx>{`
      nav {
        background: #333;
        padding: 1rem;
      }
      ul {
        list-style: none;
        display: flex;
        justify-content: space-around;
        padding: 0;
        margin: 0;
      }
      li {
        margin: 0;
      }
      a {
        color: #fff;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `}</style>
  </nav>
);

export default NavBar;
