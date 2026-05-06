// PixelPulse Leaderboard — brand-matched arcade signage (CRT scanlines, neon green + coral).
// Layout: dominant LIVE FEED (last 50 plays) on the left, compact HIGH SCORES sidebar on the right,
// 12-cell game tray at the foot. Auto-rotates the active game in the sidebar.

import React, { useEffect, useMemo, useRef, useState } from "react";
const api = require("../middleware/apiClient");

const ROTATE_SEC   = 12;
const HS_TOP_N     = 8;     // hero + 7 ranks (ranks 2..8)
const FEED_LIMIT   = 50;    // last 50 plays
const FEED_MAX_MIN = 48 * 60; // ignore plays older than 48h in the feed
const RECENT_DAYS  = 30;

// Brand-matched palette for game accents (still varied, but tuned to the new green/coral scheme).
const PALETTE = ['#b6ff1a', '#f8a858', '#dfff5e', '#7fd900', '#ffb800', '#00d2ff', '#7c5cff', '#ff2e88'];
const EMOJIS  = ['⟆', '⬢', '▲', '◎', '◆', '●', '▦', '⚽', '◯', '▰', '✦', '✺'];
const AVATARS = ['🎮', '🚀', '⚡', '🌟', '🦊', '🐯', '🐸', '🦁', '🦄', '🐙', '🪐', '👻', '🤖', '🧙', '🐝'];
const AVATAR_BGS = ['#b6ff1a', '#f8a858', '#dfff5e', '#7fd900'];

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// ---- color/emoji helpers ----
const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const colorFor    = (key) => PALETTE[hashStr(key) % PALETTE.length];
const emojiFor    = (key) => EMOJIS[hashStr(key) % EMOJIS.length];
const avatarFor   = (key) => AVATARS[hashStr(key) % AVATARS.length];
const avatarBgFor = (key) => AVATAR_BGS[hashStr(key) % AVATAR_BGS.length];

const ALL_GAMES = {
  id: 'all-games',
  name: 'ALL GAMES',
  emoji: '★',
  color: '#b6ff1a',
  variant: 'Top combined scores',
};

const fmtMinsAgo = (m) => {
  if (m == null) return '—';
  if (m < 1) return 'just now';
  if (m === 1) return '1 min ago';
  if (m < 60) return m + ' min ago';
  if (m < 24 * 60) {
    const h = Math.floor(m / 60), rem = m % 60;
    return h + 'h ' + (rem ? rem + 'm ago' : 'ago');
  }
  const d = Math.floor(m / (24 * 60));
  return d + 'd ago';
};

const getLocationIdFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('locationId') || params.get('LocationID') || params.get('location') || null;
};

// ---- API ----
async function fetchTopRecentScores(locationId) {
  try {
    const res = await api.get(`/playerScore/topRecent`, {
      params: { days: RECENT_DAYS, limit: HS_TOP_N, ...(locationId ? { locationId } : {}) },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('[leaderboard] fetchTopRecentScores failed:', err?.response?.status, err?.message);
    return [];
  }
}

async function fetchRecentPlays(locationId) {
  try {
    const res = await api.get(`/playerScore/leaderboardRecent`, {
      params: { page: 1, pageSize: FEED_LIMIT, sortBy: 'starttime', sortDir: 'DESC', ...(locationId ? { locationId } : {}) },
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn('[leaderboard] fetchRecentPlays failed:', err?.response?.status, err?.message);
    return [];
  }
}

// ---- normalization ----
function normalizePlayer(entry) {
  const name = (entry.FirstName || entry.LastName)
    ? `${entry.FirstName || ''} ${entry.LastName || ''}`.trim()
    : (entry.player
        ? (`${entry.player.FirstName || ''} ${entry.player.LastName || ''}`.trim()
            || entry.player.PlayerName || entry.PlayerName || entry.PlayerID)
        : (entry.PlayerName || entry.PlayerID || 'PLAYER'));
  const dt = entry.StartTime || entry.Date || entry.createdAt || entry.LastPlayed;
  const d  = dt ? new Date(dt) : null;
  return {
    name,
    score:    Number(entry.Points ?? entry.TotalTopPoints ?? 0),
    date:     d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    time:     d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
    streak:   entry.Streak ?? 0,
    change:   entry.RankChange ?? 0,
    avatar:   avatarFor(name),
    avatarBg: avatarBgFor(name),
    color:    colorFor(name),
    rawDate:  d,
  };
}

// Recent individual plays from the paged score API.
function buildRecentPlaysFromRows(rows, top10NameSet) {
  const all = rows.map((entry) => {
    const r = normalizePlayer(entry);
    if (!r.rawDate) return null;

    const minsAgo = Math.max(0, Math.floor((Date.now() - r.rawDate.getTime()) / 60000));
    if (minsAgo > FEED_MAX_MIN) return null;

    const gameName = entry.game?.gameName || entry.GameName || entry.GamesVariant?.name || entry.VariantName || 'GAME';
    const gameId = String(entry.GamesVariantId || entry.GamesVariantID || gameName);
    const top10 = top10NameSet.indexOf(r.name);
    const top10Rank = top10 >= 0 && top10 < 10 ? top10 + 1 : null;

    return {
      id:        `${entry.ScoreID || gameId + '-' + r.name + '-' + r.rawDate.getTime()}`,
      minsAgo,
      player:    r.name,
      avatar:    r.avatar,
      avatarBg:  r.avatarBg,
      gameId,
      gameName:  String(gameName).toUpperCase(),
      gameEmoji: emojiFor(gameName),
      gameColor: colorFor(gameName),
      score:     r.score,
      tag:       top10Rank === 1 ? 'TOP PLAYER' : null,
      top10Rank,
    };
  });

  return all.filter(Boolean).sort((a, b) => a.minsAgo - b.minsAgo).slice(0, FEED_LIMIT);
}

// ---- presentational components ----
const ChangeChip = ({ change, mini }) => {
  if (change > 0) return <span className={mini ? 'change up'   : 'badge up'}>{mini ? `▲${change}`           : `▲ UP ${change}`}</span>;
  if (change < 0) return <span className={mini ? 'change down' : 'badge down'}>{mini ? `▼${Math.abs(change)}` : `▼ DOWN ${Math.abs(change)}`}</span>;
  return null; // no rank-change data → hide
};

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const hh = now.getHours(), mm = String(now.getMinutes()).padStart(2,'0'), ss = String(now.getSeconds()).padStart(2,'0');
  const ampm = hh >= 12 ? 'PM' : 'AM', h12 = ((hh + 11) % 12) + 1;
  return <div className="clock">{h12}:{mm}:{ss} {ampm}</div>;
}

function LatestPlay({ play }) {
  return (
    <div className="latest-play" style={{ '--game-color': play.gameColor }}>
      <div className="lp-glow"></div>
      <div className="lp-left">
        <div className="lp-pulse-row">
          <span className="lp-pulse"></span>
          <span className="lp-kicker">JUST PLAYED · {fmtMinsAgo(play.minsAgo)}</span>
        </div>
        <div className="lp-game">
          <span className="lp-glyph">{play.gameEmoji}</span>
          <span className="lp-game-name">{play.gameName}</span>
        </div>
        <div className="lp-player-row">
          <div className="lp-avatar" style={{ '--avatar-bg': play.avatarBg }}>{play.avatar}</div>
          <div className="lp-player-info">
            <div className="lp-player-name">{play.player}</div>
            {(play.tag || play.top10Rank) && (
              <div className="lp-tags">
                {play.top10Rank && <span className="lp-badge">★ TOP {play.top10Rank}</span>}
                {play.tag && <span className="lp-tag">{play.tag}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="lp-score">
        <div className="lp-score-num">{fmt(play.score)}</div>
        <div className="lp-score-lab">POINTS</div>
      </div>
    </div>
  );
}

function FeedRow({ play }) {
  return (
    <div className="feed-row" style={{ '--game-color': play.gameColor }}>
      <div className="fr-game">
        <span className="fr-glyph">{play.gameEmoji}</span>
        <span className="fr-game-name">{play.gameName}</span>
      </div>
      <div className="fr-player">
        <div className="fr-avatar" style={{ '--avatar-bg': play.avatarBg }}>{play.avatar}</div>
        <div className="fr-player-name">{play.player}</div>
      </div>
      <div className="fr-tag-cell">
        {play.top10Rank && <span className="fr-badge">★ TOP {play.top10Rank}</span>}
        {play.tag && <span className="fr-tag">{play.tag}</span>}
      </div>
      <div className="fr-time">{fmtMinsAgo(play.minsAgo)}</div>
      <div className="fr-score">{fmt(play.score)}</div>
    </div>
  );
}

function FeedScroller({ plays }) {
  const list = plays;
  return (
    <div className="feed-wrap">
      <div className="feed-col-head">
        <span className="fch-game">GAME</span>
        <span className="fch-player">PLAYER</span>
        <span className="fch-tag">STATUS</span>
        <span className="fch-time">WHEN</span>
        <span className="fch-score">SCORE</span>
      </div>
      <div className="feed-mask">
        <div className="feed-track">
          {[...list, ...list].map((p, i) => (
            <FeedRow key={p.id + '-' + i} play={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveNowBig({ plays }) {
  const sorted = useMemo(() => [...plays].sort((a, b) => a.minsAgo - b.minsAgo), [plays]);
  const top = sorted[0];
  const games   = new Set(sorted.map(p => p.gameId)).size;
  const players = new Set(sorted.map(p => p.player)).size;
  return (
    <div className="livenow-big">
      <div className="livenow-head">
        <div>
          <div className="panel-kicker">▮ LIVE FEED · LAST {FEED_LIMIT} PLAYS</div>
          <div className="livenow-title">PLAYED<span className="dot">.</span></div>
        </div>
        <div className="livenow-stats">
          <div className="lns"><div className="lns-num">{sorted.length}</div><div className="lns-lab">PLAYS</div></div>
          <div className="lns"><div className="lns-num">{games}</div><div className="lns-lab">GAMES</div></div>
          <div className="lns"><div className="lns-num">{players}</div><div className="lns-lab">PLAYERS</div></div>
        </div>
      </div>
      {top
        ? <LatestPlay play={top} />
        : <div className="latest-play" style={{ '--game-color': 'var(--green)' }}>
            <div className="lp-left">
              <div className="lp-pulse-row"><span className="lp-pulse"></span><span className="lp-kicker">AWAITING PLAYS</span></div>
              <div className="lp-game"><span className="lp-glyph">⏳</span><span className="lp-game-name">No recent activity</span></div>
            </div>
            <div className="lp-score"><div className="lp-score-num">—</div><div className="lp-score-lab">POINTS</div></div>
          </div>}
      {sorted.length > 0 && <FeedScroller plays={sorted} />}
    </div>
  );
}

function HighScoreSidebar({ game, players, slideKey, rotateMs }) {
  const top1 = players[0] || { name: 'AWAITING SCORES', score: 0, avatar: '⏳', avatarBg: 'var(--mid-grn)', streak: 0, change: 0, date: '' };
  return (
    <div className="hs-sidebar">
      <div className="hs-head">
        <div className="panel-kicker">▶ HIGH SCORES · LAST {RECENT_DAYS} DAYS</div>
        <div className="hs-game" style={{ color: game.color }}>
          <span className="hs-glyph">{game.emoji}</span>
          <span className="hs-game-name">{game.name}</span>
        </div>
      </div>

      <div className="hs-hero">
        <div className="hs-crown">👑</div>
        <div className="hs-mini-avatar" style={{ '--avatar-bg': top1.avatarBg }}>{top1.avatar}</div>
        <div className="hs-hero-info">
          <div className="hs-hero-rank">#01 CHAMPION</div>
          <div className="hs-hero-name">{top1.name}</div>
          <div className="hs-hero-meta">
            {top1.streak >= 2 && <span>🔥 ×{top1.streak}</span>}
            {top1.date && <span>{top1.date}</span>}
          </div>
        </div>
        <div className="hs-hero-score">{fmt(top1.score)}</div>
      </div>

      <div className="hs-list">
        {players.slice(1, HS_TOP_N).map((p, i) => {
          const rank = i + 2;
          return (
            <div key={i} className={`hs-row hs-rank-${rank}`}>
              <div className="hs-rank">{String(rank).padStart(2, '0')}</div>
              <div className="hs-mini" style={{ '--avatar-bg': p.avatarBg }}>{p.avatar}</div>
              <div className="hs-info">
                <div className="hs-name">{p.name}</div>
                <div className="hs-meta">
                  <ChangeChip change={p.change} mini />
                  {p.streak >= 2 && <span className="streak-mini">🔥×{p.streak}</span>}
                </div>
              </div>
              <div className="hs-score">{fmt(p.score)}</div>
            </div>
          );
        })}
      </div>

      <div className="hs-rotator-label">
        <span>REFRESHES LIVE</span>
        <div className="progress" key={slideKey}>
          <div className="progress-fill" style={{ animationDuration: rotateMs + 'ms' }}></div>
        </div>
      </div>
    </div>
  );
}

function GameTray({ games, activeId }) {
  return (
    <div className="game-tray">
      {games.slice(0, 12).map(g => (
        <div key={g.id} className={`tray-chip ${g.id === activeId ? 'active' : ''}`}>
          <span className="glyph">{g.emoji}</span>
          <span>{g.name}</span>
        </div>
      ))}
    </div>
  );
}

function Slide({ game, players, plays, games, rotateMs, slideKey }) {
  return (
    <div className="slide" data-screen-label={`Live — ${game.name}`}>
      <div className="beams"></div>

      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <img src="/pp-logo.png" alt="PixelPulse" onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { className: 'brand-letter', textContent: 'P' })); }} />
          </div>
          <div>
            <div className="brand-name"><span className="pp-px">PIXEL</span><span className="pp-pu">PULSE</span></div>
            <div className="brand-sub">VAUGHAN · LIVE ARENA</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="live-pill"><span className="live-dot"></span>ON AIR</div>
          <Clock />
        </div>
      </div>

      <div className="body">
        <LiveNowBig plays={plays} />
        <HighScoreSidebar game={game} players={players} slideKey={slideKey} rotateMs={rotateMs} />
      </div>

      <div className="foot">
        <GameTray games={games} activeId={game.id} />
      </div>
    </div>
  );
}

// ---- Page ----
export default function Leaderboard() {
  const [topScores, setTopScores]   = useState([]);
  const [recentRows, setRecentRows] = useState([]);
  const [locationId, setLocationId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const innerRef = useRef(null);

  useEffect(() => {
    setLocationId(getLocationIdFromUrl());
  }, []);

  // Fetch leaderboard totals and live feed rows from score endpoints.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [scores, plays] = await Promise.all([
        fetchTopRecentScores(locationId),
        fetchRecentPlays(locationId),
      ]);
      if (!cancelled) {
        setTopScores(scores.map(normalizePlayer));
        setRecentRows(plays);
        setRefreshTick((x) => x + 1);
      }
    };
    load();
    const t = setInterval(load, ROTATE_SEC * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, [locationId]);

  // The backend returns aggregate totals; display them as one combined leaderboard.
  const games      = useMemo(() => [ALL_GAMES], []);

  // Per-variant deduped top scores (for the sidebar). Highest score per player, descending.
  const dedupedByVar = useMemo(() => {
    return { [ALL_GAMES.id]: topScores };
  }, [topScores]);

  const slides = useMemo(
    () => games.map((g) => ({ game: g, players: (dedupedByVar[g.id] || []).slice(0, HS_TOP_N) })),
    [games, dedupedByVar]
  );

  // Top-10 name lookup per variant (used to tag plays as "TOP N" in the feed).
  const top10NameSetByVar = useMemo(() => {
    const out = {};
    Object.entries(dedupedByVar).forEach(([id, rows]) => {
      out[id] = rows.slice(0, 10).map(r => r.name);
    });
    return out;
  }, [dedupedByVar]);

  const recentPlays = useMemo(
    () => buildRecentPlaysFromRows(recentRows, top10NameSetByVar[ALL_GAMES.id] || []),
    [recentRows, top10NameSetByVar]
  );

  // Scale 1920x1080 to viewport
  useEffect(() => {
    const fit = () => {
      const el = innerRef.current; if (!el) return;
      const sx = window.innerWidth / 1920, sy = window.innerHeight / 1080;
      el.style.transform = `scale(${Math.min(sx, sy)})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const slide = slides[0];

  return (
    <>
      <style jsx global>{`html, body { margin: 0; padding: 0; background: #050a06; cursor: none !important; overflow: hidden; }`}</style>
      <div className="pp-stage">
        <div className="pp-stage-inner" ref={innerRef}>
          {slide
            ? <Slide
                slideKey={refreshTick}
                game={slide.game}
                players={slide.players}
                plays={recentPlays}
                games={games}
                rotateMs={ROTATE_SEC * 1000}
              />
            : <div style={{ width: 1920, height: 1080, display: 'grid', placeItems: 'center', color: '#b6ff1a', fontFamily: "'Press Start 2P', monospace", fontSize: 32, letterSpacing: '0.2em' }}>LOADING…</div>}
        </div>
      </div>
    </>
  );
}
