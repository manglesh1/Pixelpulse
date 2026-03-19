import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/leaderboard.module.css";
const api = require("../middleware/apiClient");

const FADE_DURATION = 600;
const VARIANT_ROWS = 10;
const SIDEBAR_ROWS = 5;
const RECENT_DAYS = 30;

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const startDate = thirtyDaysAgo.toISOString();
const endDate = today.toISOString();

async function fetchAllVariants() {
  const res = await api.get(`/gamesVariant/findAll`);
  return res.data;
}

async function fetchLeaderboardScores(variantId) {
  const res = await api.get(`/playerScore/allForVariant/${variantId}`, {
    params: { startDate, endDate },
  });
  return res.data;
}

async function fetchTop7Days(days = 7, limit = SIDEBAR_ROWS) {
  const res = await api.get(
    `/playerScore/topRecent?days=${days}&limit=${limit}`,
  );
  return res.data.map((x) => ({
    ...x,
    Points: x.TotalTopPoints ?? x.Points,
    StartTime: x.LastPlayed ?? x.StartTime,
  }));
}

async function fetchTopRecent(days = RECENT_DAYS, limit = SIDEBAR_ROWS) {
  const res = await api.get(
    `/playerScore/topRecent?days=${days}&limit=${limit}`,
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

function hasRealLeaderboardEntries(scores) {
  const processed = processLeaderboard(
    Array.isArray(scores) ? scores : [],
    VARIANT_ROWS,
  );
  return processed.some((row) => row && (row.Points ?? 0) > 0);
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
  const date = entry.StartTime || entry.Date || entry.createdAt;

  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function LeaderboardTable({ leaderboard, small }) {
  return (
    <table
      className={`
        ${styles.leaderboardTable}
        ${small ? styles.smallTable : ""}
        ${!small ? styles.mainLeaderboardTable : ""}
      `}
    >
      <thead>
        <tr>
          <th className={styles.rankCol}>Rank</th>
          <th>Player</th>
          {small ? (
            <th>Total Points</th>
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
              {!small && <td>{getDate(entry)}</td>}
            </tr>
          ) : small ? (
            <tr className={styles.emptyRow} key={`empty-${idx}`}>
              <td className={styles.rankCol}>{idx + 1}</td>
              <td></td>
              <td></td>
            </tr>
          ) : (
            <tr className={styles.emptyRow} key={`empty-${idx}`}>
              <td className={styles.rankCol}>{idx + 1}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}

function FadeTransition({ show, children }) {
  const [display, setDisplay] = useState(show);
  const [fadeClass, setFadeClass] = useState(
    show ? styles.fadeIn : styles.fadeOut,
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

  const [top7Days, setTop7Days] = useState([]);
  const [topRecent, setTopRecent] = useState([]);

  const [fadeIn, setFadeIn] = useState(true);
  const intervalRef = useRef();

  useEffect(() => {
    let mounted = true;

    async function loadVariantsWithScores() {
      try {
        const all = await fetchAllVariants();
        if (!mounted) return;

        const active = all.filter(
          (v) => v.IsActive === 1 || v.IsActive === true,
        );

        const checks = await Promise.all(
          active.map(async (variant) => {
            try {
              const scores = await fetchLeaderboardScores(variant.ID);
              return hasRealLeaderboardEntries(scores) ? variant : null;
            } catch {
              return null;
            }
          }),
        );

        const filtered = checks.filter(Boolean);

        if (!mounted) return;

        setVariants(filtered);
        setCurrentIdx(0);
      } catch (err) {
        console.error("Failed to load leaderboard variants:", err);
        if (mounted) setVariants([]);
      }
    }

    loadVariantsWithScores();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (variants.length === 0) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchLeaderboardScores(variants[currentIdx].ID)
      .then((data) => {
        if (!cancelled) {
          setLeaderboard(
            processLeaderboard(Array.isArray(data) ? data : [], VARIANT_ROWS),
          );
          setFadeIn(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLeaderboard([]);
          setLoading(false);
        }
      });

    if (intervalRef.current) clearInterval(intervalRef.current);

    if (variants.length > 1) {
      intervalRef.current = setInterval(() => {
        setFadeIn(false);
        setTimeout(() => {
          setCurrentIdx((idx) => (idx + 1) % variants.length);
        }, FADE_DURATION);
      }, 10000);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [variants, currentIdx]);

  useEffect(() => {
    let cancelled = false;

    const loadSidebar = () => {
      fetchTop7Days().then(
        (data) =>
          !cancelled && setTop7Days(processLeaderboard(data, SIDEBAR_ROWS)),
      );

      fetchTopRecent().then(
        (data) =>
          !cancelled && setTopRecent(processLeaderboard(data, SIDEBAR_ROWS)),
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
        html,
        body,
        #__next {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          cursor: none !important;
          background: #120301;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <div className={styles.container}>
        <div className={styles.bgGlowOne}></div>
        <div className={styles.bgGlowTwo}></div>
        <div className={styles.gridOverlay}></div>

        <header className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.kicker}>LIVE LEADERBOARDS</div>
            <h1 className={styles.heroTitle}>TOP PLAYERS</h1>
            <div className={styles.heroSubtitle}>
              High scores from the last 30 days, recent winners, and
              game-by-game records
            </div>
          </div>

          <div className={styles.heroCenter}>
            <img
              src="/images/leaderboard/logo_background_removed.png"
              alt="Pixel Pulse"
              className={styles.logo}
            />
          </div>

          <div className={styles.heroRight}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeLabel}>Showing</span>
              <span className={styles.heroBadgeValue}>
                {currentVariant
                  ? leaderboardTitle
                  : "Fetching leaderboard data..."}
              </span>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <section className={styles.mainPanel}>
            <div className={styles.featuredCard}>
              <div className={styles.featuredHeader}>
                <div>
                  <div className={styles.featuredEyebrow}>Featured Game</div>
                  <div className={styles.tableTitle}>
                    {currentVariant
                      ? leaderboardTitle
                      : "Fetching leaderboard data..."}
                  </div>
                </div>

                <div className={styles.featuredChip}>Top 10</div>
              </div>

              <FadeTransition show={fadeIn && !loading}>
                <div className={styles.mainTableWrapper}>
                  <LeaderboardTable leaderboard={leaderboard} />
                </div>
              </FadeTransition>
            </div>
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarGroup}>
              <div className={styles.sidebarTableWrapper}>
                <div className={styles.sidebarCardHeader}>
                  <div className={styles.sidebarEyebrow}>Recent Winners</div>
                  <div className={styles.tableTitle}>Top 5 Last 7 Days</div>
                </div>
                <LeaderboardTable leaderboard={top7Days} small />
              </div>

              <div className={styles.sidebarTableWrapper}>
                <div className={styles.sidebarCardHeader}>
                  <div className={styles.sidebarEyebrow}>Monthly Leaders</div>
                  <div className={styles.tableTitle}>Top 5 Last 30 Days</div>
                </div>
                <LeaderboardTable leaderboard={topRecent} small />
              </div>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
