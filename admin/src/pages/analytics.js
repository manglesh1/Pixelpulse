import React, { useEffect, useMemo, useState } from 'react';
import { withAuth } from '../../utils/withAuth';
import { Line, Bar, Pie, Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, LogarithmicScale,
  BarElement, PointElement, LineElement, ArcElement,
  Tooltip, Legend, Title
} from 'chart.js';
import {
  fetchGameStats,
  fetchDailyPlays,
  fetchHourlyPlays,
  fetchTopVariants,
  fetchGameShareForDay,
  fetchWeekdayHourHeatmap,
  fetchGameLengthAverages
} from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, LogarithmicScale,
  BarElement, PointElement, LineElement, ArcElement,
  Tooltip, Legend, Title
);

// Toronto-local YYYY-MM-DD for "today" (no string parsing)
function torontoTodayYYYYMMDD() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

// Add days to YYYY-MM-DD safely
function addDaysYYYYMMDD(yyyyMMdd, days) {
  const [y, m, d] = (yyyyMMdd || '').split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export const getServerSideProps = withAuth(async () => ({ props: {} }));

export default function Analytics() {
  // Filters
  const [rangeDays, setRangeDays] = useState(30);
  const [endDate, setEndDate] = useState('');       // YYYY-MM-DD (Toronto)
  const [hourlyDate, setHourlyDate] = useState(''); // YYYY-MM-DD
  const [topLimit, setTopLimit] = useState(10);

  // Summary
  const [summary, setSummary] = useState(null);

  // Data
  const [daily, setDaily] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [topVariants, setTopVariants] = useState([]);
  const [gameShare, setGameShare] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [avgLenOverall, setAvgLenOverall] = useState(null);
  const [avgLenByVariant, setAvgLenByVariant] = useState([]);
  const [avgLenByGame, setAvgLenByGame] = useState([]);

  // UI toggles
  const [avgLenView, setAvgLenView] = useState('variant'); // 'variant' | 'game'
  const [expandAvgLen, setExpandAvgLen] = useState(false);
  const INITIAL_COUNT = 10;

  const avgLenTotal = avgLenView === 'variant' ? avgLenByVariant.length : avgLenByGame.length;
  const avgLenVisible = expandAvgLen ? avgLenTotal : Math.min(INITIAL_COUNT, avgLenTotal);

  // tweak these if you want tighter/looser spacing
  const BAR_HEIGHT = 26;   // px per bar including gaps
  const EXTRA_PAD = 90;    // legend/title/padding room
  const MIN_HEIGHT = 380;  // keep your old minimum
  const avgLenChartHeight = Math.max(MIN_HEIGHT, avgLenVisible * BAR_HEIGHT + EXTRA_PAD);

  // Derived range based on filters
  const effectiveEndDate = endDate || torontoTodayYYYYMMDD();               // YYYY-MM-DD
  const effectiveStartDate = addDaysYYYYMMDD(effectiveEndDate, -(rangeDays - 1)); // YYYY-MM-DD

  const load = async () => {
    const s = await fetchGameStats();
    setSummary(s);

    const d = await fetchDailyPlays({ days: rangeDays, end: endDate });
    setDaily(Array.isArray(d.plays) ? d.plays : []);

    const h = await fetchHourlyPlays({ date: hourlyDate });
    setHourly(Array.isArray(h.hourly) ? h.hourly : []);

    const t = await fetchTopVariants({ days: rangeDays, end: endDate, limit: topLimit });
    setTopVariants(Array.isArray(t.top) ? t.top : []);

    const p = await fetchGameShareForDay({
      startDate: effectiveStartDate,
      endDate: effectiveEndDate
    });
    setGameShare(p.share || []);

    const hm = await fetchWeekdayHourHeatmap({ weeks: 12 });
    setHeatmap(Array.isArray(hm.matrix) ? hm.matrix : []);

    const gl = await fetchGameLengthAverages({
      // Let the backend interpret Toronto-local date range via getUtcBoundsFromQuery
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      // Filter outliers
      minSeconds: 10,
      maxSeconds: 3600
    });
    setAvgLenOverall(gl?.overall ?? null);
    setAvgLenByVariant(Array.isArray(gl?.byVariant) ? gl.byVariant : []);
    setAvgLenByGame(Array.isArray(gl?.byGame) ? gl.byGame : []);
  };

  useEffect(() => { load(); /* initial */ // eslint-disable-next-line
  }, []);

  useEffect(() => { load(); /* on filters */ // eslint-disable-next-line
  }, [rangeDays, endDate, hourlyDate, topLimit]);

  // === Chart prep ===
  const dailyLine = useMemo(() => {
    if (!daily.length) return { labels: [], datasets: [] };
    const labels = daily.map(d => {
      const dt = new Date(d.date);
      dt.setDate(dt.getDate() + 1); // keep your UTC alignment
      return dt.toISOString().slice(0, 10);
    });
    const data = daily.map(d => Number(d.plays) || 0);
    return {
      labels,
      datasets: [{
        label: `Games / day (last ${rangeDays})`,
        data,
        borderColor: '#007bff',
        backgroundColor: '#007bff',
        tension: 0.3,
        fill: false
      }]
    };
  }, [daily, rangeDays]);

  const hourlyLine = useMemo(() => {
    if (!hourly.length) return { labels: [], datasets: [] };
    return {
      labels: hourly.map(h => `${h.hour}:00`),
      datasets: [{
        label: `Hourly plays (${hourlyDate || 'Today'})`,
        data: hourly.map(h => Number(h.totalPlays) || 0),
        borderColor: '#28a745',
        backgroundColor: '#28a745',
        tension: 0.3,
        fill: false
      }]
    };
  }, [hourly, hourlyDate]);

  const topVariantsBar = useMemo(() => {
    if (!topVariants.length) return { labels: [], datasets: [] };
    return {
      labels: topVariants.map(v => v.name),
      datasets: [{
        label: `Top variants (last ${rangeDays}d)`,
        data: topVariants.map(v => Number(v.plays) || 0),
        backgroundColor: '#4A90E2'
      }]
    };
  }, [topVariants, rangeDays]);

  const gameSharePie = useMemo(() => {
    if (!gameShare?.length) return { labels: [], datasets: [] };
    const baseColors = [
      '#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF',
      '#FF9F40','#C9CBCF','#B39CD0','#FFB6C1','#00CED1'
    ];
    const colors = gameShare.map((_, i) => baseColors[i % baseColors.length]);
    return {
      labels: gameShare.map(g => g.name),
      datasets: [{
        label: `Game share (${
          effectiveStartDate === effectiveEndDate
            ? effectiveEndDate
            : `${effectiveStartDate} → ${effectiveEndDate}`
        })`,
        data: gameShare.map(g => Number(g.plays) || 0),
        backgroundColor: colors,
        borderWidth: 1
      }]
    };
  }, [gameShare, effectiveStartDate, effectiveEndDate]);

  const heatmapBubble = useMemo(() => {
    if (!heatmap.length) return { datasets: [] };
    const totals = heatmap.map(r => Number(r.total) || 0);
    const max = Math.max(1, ...totals);
    const bubbles = heatmap.map(row => ({
      x: Number(row.hour) || 0,
      y: Number(row.weekday) || 0,
      r: 3 + 12 * ((Number(row.total) || 0) / max)
    }));
    return { datasets: [{ label: 'Traffic heatmap (12w)', data: bubbles }] };
  }, [heatmap]);

  // Average length by VARIANT (with show more)
  const avgLenByVariantBar = useMemo(() => {
    if (!avgLenByVariant.length) return { labels: [], datasets: [] };
    const list = expandAvgLen ? avgLenByVariant : avgLenByVariant.slice(0, INITIAL_COUNT);
    const labels = list.map(v => v.variantName ?? `Variant ${v.gamesVariantId ?? '—'}`);
    const data = list.map(v => {
      const secs = typeof v?.avgSeconds === 'number' ? v.avgSeconds : Number(v?.avgSeconds);
      const mins = typeof v?.avgMinutes === 'number' ? v.avgMinutes : Number(v?.avgMinutes);
      return Number.isFinite(mins) ? mins : (Number.isFinite(secs) ? secs / 60 : 0);
    });
    return {
      labels,
      datasets: [{
        label: `Avg game length (min) ${
          effectiveStartDate === effectiveEndDate
            ? `— ${effectiveEndDate}`
            : `— ${effectiveStartDate} → ${effectiveEndDate}`
        }`,
        data,
        backgroundColor: '#8E44AD'
      }]
    };
  }, [avgLenByVariant, expandAvgLen, effectiveStartDate, effectiveEndDate]);

  // Average length by GAME (with show more)
  const avgLenByGameBar = useMemo(() => {
    if (!avgLenByGame.length) return { labels: [], datasets: [] };
    const list = expandAvgLen ? avgLenByGame : avgLenByGame.slice(0, INITIAL_COUNT);
    const labels = list.map(g => g.gameName ?? `Game ${g.GameID ?? '—'}`);
    const data = list.map(g => {
      const secs = typeof g?.avgSeconds === 'number' ? g.avgSeconds : Number(g?.avgSeconds);
      const mins = typeof g?.avgMinutes === 'number' ? g.avgMinutes : Number(g?.avgMinutes);
      return Number.isFinite(mins) ? mins : (Number.isFinite(secs) ? secs / 60 : 0);
    });
    return {
      labels,
      datasets: [{
        label: `Avg game length (min) ${
          effectiveStartDate === effectiveEndDate
            ? `— ${effectiveEndDate}`
            : `— ${effectiveStartDate} → ${effectiveEndDate}`
        }`,
        data,
        backgroundColor: '#8E44AD'
      }]
    };
  }, [avgLenByGame, expandAvgLen, effectiveStartDate, effectiveEndDate]);

  // Shared chart options
  const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: false } }, scales: { y: { beginAtZero: true } } };
  const dailyOpts = {
    ...lineOpts,
    scales: {
      x: { ticks: { autoSkip: true, maxTicksLimit: 10, callback(v) { const l = this.getLabelForValue(v); return l.slice(5); } } },
      y: { beginAtZero: true }
    }
  };
  const barOpts = { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true } } };
  const pieOpts = { responsive: true, maintainAspectRatio: false };
  const bubbleOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Hour (0-23)' }, min: 0, max: 23, ticks: { stepSize: 1 } },
      y: { title: { display: true, text: 'Weekday (1=Sun..7=Sat)' }, min: 1, max: 7, ticks: { stepSize: 1 } }
    }
  };

  const Empty = ({ children }) => (
    <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 8 }}>
      <span style={{ color: '#888' }}>{children}</span>
    </div>
  );

  return (
    <div className="container">
      <h1>Analytics</h1>

      <section className="summary-boxes">
        <div className="summary-box"><h3>Players In Facility (Now)</h3><p>{summary?.playersInFacilityNow ?? 0}</p></div>
        <div className="summary-box"><h3>Players In Facility (Today)</h3><p>{summary?.playersInFacilityToday ?? 0}</p></div>
        <div className="summary-box"><h3>Today's Plays</h3><p>{summary?.todayPlays ?? 0}</p></div>
        <div className="summary-box"><h3>This Week</h3><p>{summary?.weekPlays ?? 0}</p></div>
        <div className="summary-box"><h3>This Month</h3><p>{summary?.monthPlays ?? 0}</p></div>
        <div className="summary-box"><h3>Most Popular Today</h3><p>{summary?.mostPopularToday?.name || '—'}</p></div>
      </section>

      <section className="controls">
        <div><label>Range (days)</label>
          <select value={rangeDays} onChange={e => setRangeDays(Number(e.target.value))}>
            <option value={7}>7</option><option value={30}>30</option><option value={90}>90</option><option value={180}>180</option>
          </select>
        </div>
        <div><label>End date (Toronto)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div><label>Hourly date (Toronto)</label>
          <input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} />
        </div>
        <div><label>Top limit</label>
          <input type="number" min="1" max="50" value={topLimit} onChange={e => setTopLimit(Number(e.target.value))} />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Daily Plays</h2>
        <div className="chart">
          {daily.length ? <Line data={dailyLine} options={dailyOpts} /> : <Empty>No daily data</Empty>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Hourly Plays ({hourlyDate || 'Today'})</h2>
        <div className="chart">
          {hourly.length ? <Line data={hourlyLine} options={lineOpts} /> : <Empty>No hourly data</Empty>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Top Variants (last {rangeDays} days)</h2>
        <div className="chart">
          {topVariants.length ? <Bar data={topVariantsBar} options={barOpts} /> : <Empty>No top variants</Empty>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>
          Game Share (Rooms) (
            {effectiveStartDate === effectiveEndDate
              ? effectiveEndDate
              : `${effectiveStartDate} → ${effectiveEndDate}`}
          )
        </h2>
        <div className="chart"><Pie data={gameSharePie} options={pieOpts} /></div>
      </section>

      <section className="dashboard-section">
        <h2>Traffic Heatmap (Weekday × Hour)</h2>
        <div className="chart">
          {heatmap.length ? <Bubble data={heatmapBubble} options={bubbleOpts} /> : <Empty>No heatmap data</Empty>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Average Game Length</h2>

        <div className="summary-boxes" style={{ marginBottom: '1rem' }}>
          <div className="summary-box">
            <h3>Overall Avg</h3>
            <p>
              {avgLenOverall?.avgMinutes != null
                ? `${(avgLenOverall.avgMinutes).toFixed(1)} min`
                : '—'}
            </p>
          </div>

          <div className="summary-box" style={{ flex: '0 0 auto', minWidth: 200 }}>
            <h3>View</h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <button onClick={() => setAvgLenView('variant')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: avgLenView === 'variant' ? '#e9ecef' : '#fff', color: '#000' }}>
                By Variant
              </button>
              <button onClick={() => setAvgLenView('game')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: avgLenView === 'game' ? '#e9ecef' : '#fff', color: '#000' }}>
                By Game
              </button>
            </div>
          </div>
        </div>

      <div className="chart" style={{ height: avgLenChartHeight }}>
        {avgLenView === 'variant'
          ? (avgLenByVariant.length
              ? <Bar
                  data={avgLenByVariantBar}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: { beginAtZero: true },
                      y: { ticks: { autoSkip: false, maxTicksLimit: avgLenVisible } } // show all labels
                    }
                  }}
                />
              : <Empty>No game length data (variants)</Empty>)
          : (avgLenByGame.length
              ? <Bar
                  data={avgLenByGameBar}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: { beginAtZero: true },
                      y: { ticks: { autoSkip: false, maxTicksLimit: avgLenVisible } }
                    }
                  }}
                />
              : <Empty>No game length data (games)</Empty>)
        }
      </div>

      {(avgLenView === 'variant' ? avgLenByVariant.length : avgLenByGame.length) > INITIAL_COUNT && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setExpandAvgLen(v => !v)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: '#fff',
              color: '#111' // darker text for better contrast
            }}
          >
            {expandAvgLen
              ? 'Show less'
              : `Show more (${(avgLenView === 'variant' ? avgLenByVariant.length : avgLenByGame.length) - INITIAL_COUNT} more)`}
          </button>
        </div>
      )}
    </section>

      <style jsx>{`
        .container { padding: 2rem; }
        .summary-boxes { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; justify-content: space-between; }
        .summary-box { background: #f8f9fa; border: 1px solid #dee2e6; padding: 1rem; flex: 1 1 calc(30% - 1rem); min-width: 200px; text-align: center; border-radius: 8px; }
        .summary-box h3 { margin: 0; font-size: 1rem; font-weight: 600; }
        .summary-box p { margin-top: 0.5rem; font-size: 1.6rem; font-weight: bold; }
        .controls { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; margin-bottom: 1rem; }
        .controls label { font-size: 0.85rem; color: #555; }
        .controls input, .controls select { padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; min-width: 160px; }
        .dashboard-section { margin-bottom: 3rem; }
        .chart { height: 380px; width: 100%; }
      `}</style>
    </div>
  );
}
