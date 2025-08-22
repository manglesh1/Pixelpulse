import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "../styles/leaderboard.module.css";

const FADE_DURATION = 600; // short & smooth on Pi
const VARIANT_ROWS = 10,
  SIDEBAR_ROWS = 5,
  RECENT_DAYS = 30;

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const startDate = thirtyDaysAgo.toISOString();
const endDate = today.toISOString();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchAllVariants() {
  const res = await axios.get(`${API_BASE_URL}/gamesVariant/findAll`);
  return res.data;
}

async function fetchLeaderboardScores(variantId) {
  const res = await axios.get(
    `${API_BASE_URL}/playerScore/allForVariant/${variantId}`,
    { params: { startDate, endDate } }
  );
  return res.data;
}

async function fetchTop3Months(days = 91, limit = SIDEBAR_ROWS) {
  const res = await axios.get(
    `${API_BASE_URL}/playerScore/topRecent?days=${days}&limit=${limit}`
  );
  return res.data.map((x) => ({
    ...x,
    Points: x.TotalTopPoints ?? x.Points,
    StartTime: x.LastPlayed ?? x.StartTime,
  }));
}

async function fetchTopRecent(days = RECENT_DAYS, limit = SIDEBAR_ROWS) {
  const res = await axios.get(
    `${API_BASE_URL}/playerScore/topRecent?days=${days}&limit=${limit}`
  );
  return res.data.map((x) => ({
    ...x,
    Points: x.TotalTopPoints ?? x.Points,
    StartTime: x.LastPlayed ?? x.StartTime,
  }));
}

function processLeaderboard(scores, rowLimit) {
  const deduped = {};
  scores.forEach((entry) => {
    if (
      !deduped[entry.PlayerID] ||
      (entry.Points ?? 0) > (deduped[entry.PlayerID].Points ?? 0)
    ) {
      deduped[entry.PlayerID] = entry;
    }
  });

  const arr = Object.values(deduped)
    .filter((e) => (e.Points ?? 0) > 0)
    .sort((a, b) => {
      const p = (b.Points ?? 0) - (a.Points ?? 0);
      if (p) return p;
      const tA =
        new Date(a.StartTime || a.Date || a.createdAt || 0).getTime() || 0;
      const tB =
        new Date(b.StartTime || b.Date || b.createdAt || 0).getTime() || 0;
      return tB - tA;
    });

  return Array.from({ length: rowLimit }, (_, i) => arr[i] || null);
}

function getPlayerName(entry) {
  if (entry.FirstName || entry.LastName) {
    return `${entry.FirstName || ""} ${entry.LastName || ""}`.trim();
  }
  if (entry.player) {
    return (
      `${entry.player.FirstName || ""} ${entry.player.LastName || ""}`.trim() ||
      entry.player.PlayerName ||
      entry.PlayerName ||
      entry.PlayerID
    );
  }
  return entry.PlayerName || entry.PlayerID;
}
function getDate(entry) {
  return entry.StartTime
    ? new Date(entry.StartTime).toLocaleDateString()
    : entry.Date
    ? new Date(entry.Date).toLocaleDateString()
    : entry.createdAt
    ? new Date(entry.createdAt).toLocaleDateString()
    : "";
}

function LeaderboardTable({ leaderboard, small }) {
  return (
    <table
      className={`${styles.leaderboardTable} ${small ? styles.smallTable : ""}`}
    >
      <thead>
        <tr>
          <th className={styles.rankCol}>Rank</th>
          <th>Player</th>
          {small ? (
            <>
              <th>Total Points</th>
              <th>Last Played</th>
            </>
          ) : (
            <>
              <th>Points</th>
              <th>Date</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((entry, idx) =>
          entry ? (
            <tr key={entry.PlayerID ?? `${getPlayerName(entry)}-${idx}`}>
              <td className={styles.rankCol}>{idx + 1}</td>
              <td className={styles.playerNameCell}>{getPlayerName(entry)}</td>
              <td>{entry.Points}</td>
              <td>{getDate(entry)}</td>
            </tr>
          ) : (
            <tr className={styles.emptyRow} key={`empty-${idx}`}>
              <td className={styles.rankCol}>{idx + 1}</td>
              <td colSpan={3}></td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}

function FadeTransition({ show, children }) {
  const [display, setDisplay] = useState(show);
  const [fadeClass, setFadeClass] = useState(
    show ? styles.fadeIn : styles.fadeOut
  );

  useEffect(() => {
    if (show) {
      setDisplay(true);
      requestAnimationFrame(() => setFadeClass(styles.fadeIn));
    } else {
      setFadeClass(styles.fadeOut);
    }
  }, [show]);

  const onTransitionEnd = () => {
    if (fadeClass === styles.fadeOut) setDisplay(false);
  };

  if (!display) return null;
  return (
    <div
      className={`${styles.fadeRoot} ${fadeClass}`}
      onTransitionEnd={onTransitionEnd}
    >
      {children}
    </div>
  );
}

export default function Leaderboard() {
  const [variants, setVariants] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const [top3Months, setTop3Months] = useState([]);
  const [topRecent, setTopRecent] = useState([]);

  const [fadeIn, setFadeIn] = useState(true);
  const intervalRef = useRef();

  useEffect(() => {
    let mounted = true;
    fetchAllVariants().then((all) => {
      if (!mounted) return;
      const active = all.filter((v) => v.IsActive === 1 || v.IsActive === true);
      setVariants(active);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (variants.length === 0) return;
    let cancelled = false;
    setLoading(true);

    fetchLeaderboardScores(variants[currentIdx].ID)
      .then((data) => {
        if (!cancelled) {
          setLeaderboard(
            processLeaderboard(Array.isArray(data) ? data : [], VARIANT_ROWS)
          );
          setFadeIn(true);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIdx((idx) => (idx + 1) % variants.length);
      }, FADE_DURATION);
    }, 10000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [variants, currentIdx]);

  // Sidebar refresh every 60s
  useEffect(() => {
    let cancelled = false;
    const loadSidebar = () => {
      fetchTop3Months().then(
        (data) =>
          !cancelled && setTop3Months(processLeaderboard(data, SIDEBAR_ROWS))
      );
      fetchTopRecent().then(
        (data) =>
          !cancelled && setTopRecent(processLeaderboard(data, SIDEBAR_ROWS))
      );
    };
    loadSidebar();
    const timer = setInterval(loadSidebar, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const currentVariant = variants[currentIdx];
  const leaderboardTitle =
    currentVariant?.game?.gameName ||
    currentVariant?.game?.GameName ||
    currentVariant?.game?.name ||
    currentVariant?.name ||
    "Game";

  return (
    <>
      <style jsx global>{`
        body {
          cursor: none !important;
        }
      `}</style>

      <div className={styles.container}>
        <div className={styles.mainPanel}>
          <FadeTransition show={fadeIn && !loading}>
            <div>
              <div className={styles.tableTitle}>
                {currentVariant
                  ? `${leaderboardTitle} (${currentVariant.name})`
                  : "Loading..."}
              </div>
              <LeaderboardTable leaderboard={leaderboard} />
            </div>
          </FadeTransition>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarGroup}>
            <div className={styles.sidebarTableWrapper}>
              <div className={styles.tableTitle}>Top 5 Last 3 Months</div>
              <LeaderboardTable leaderboard={top3Months} small />
            </div>
            <div className={styles.sidebarTableWrapper}>
              <div className={styles.tableTitle}>Top 5 Last 30 Days</div>
              <LeaderboardTable leaderboard={topRecent} small />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
