import React, { useEffect, useState } from 'react';
import { withAuth } from '../../utils/withAuth';
import { fetchGameStats } from '@/services/api';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

export const getServerSideProps = withAuth()(async () => {
  return { props: {} };
});

export default function Dashboard() {
  const [dailyStats, setDailyStats] = useState([]);
  const [hourlyTodayStats, setHourlyTodayStats] = useState([]);
  const [topVariants, setTopVariants] = useState([]);
  const [topVariantsToday, setTopVariantsToday] = useState([]);
  const [summary, setSummary] = useState({
    todayPlays: 0,
    weekPlays: 0,
    monthPlays: 0,
    mostPopularToday: null,
    playersInFacilityToday: 0,
    playersInFacilityNow: 0
  });

  const [range, setRange] = useState('7'); // today | 7 | 30

  useEffect(() => {
    const loadStats = async () => {
      const stats = await fetchGameStats();
      setDailyStats(stats.dailyPlays || []);
      setHourlyTodayStats(stats.hourlyTodayPlays || []);
      setTopVariants(stats.topVariants || []);
      setTopVariantsToday(stats.topVariantsToday || []);
      setSummary({
        todayPlays: stats.todayPlays,
        weekPlays: stats.weekPlays,
        monthPlays: stats.monthPlays,
        mostPopularToday: stats.mostPopularToday,
        playersInFacilityToday: stats.playersInFacilityToday,
        playersInFacilityNow: stats.playersInFacilityNow
      });
    };

    loadStats();
  }, []);

    const chartData = range === 'today'
      ? {
          labels: hourlyTodayStats.map(h => `${h.hour}:00`),
          datasets: [
            {
              label: 'Games Played Today (Hourly)',
              data: hourlyTodayStats.map(h => h.totalPlays),
              borderColor: '#007bff',
              backgroundColor: '#007bff',
              tension: 0.3,
              fill: false,
            },
          ],
        }
      : {
        labels: dailyStats
          .slice(-Number(range))
          .map(d => {
            const dt = new Date(d.date);
            dt.setDate(dt.getDate() + 1);        
            return dt.toISOString().slice(0, 10);  
          }),
          datasets: [
            {
              label: `Games Played (Last ${range} Days)`,
              data: dailyStats
                .slice(-Number(range))
                .map(d => d.totalPlays),
              borderColor: '#007bff',
              backgroundColor: '#007bff',
              tension: 0.3,
              fill: false,
            },
          ],
        };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,  // Allow chart to fill container height
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          offset: true, // offset grid lines to improve spacing
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 7, // smaller limit to reduce clutter
            callback: function(value) {
              const label = this.getLabelForValue(value);
              // shorten date format from YYYY-MM-DD to MM-DD
              return label.length === 10 ? label.slice(5) : label;
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 20,
          },
        },
      },
    };


  const topVariantsData = {
    labels: topVariants.map(v => v.name),
    datasets: [
      {
        label: 'Plays (Last 30 Days)',
        data: topVariants.map(v => v.plays),
        backgroundColor: '#4A90E2',
      },
    ],
  };

  const pieChartData = {
    labels: topVariantsToday.map(v => v.name),
    datasets: [
      {
        label: "Today's Plays",
        data: topVariantsToday.map(v => v.plays),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#C9CBCF', '#B39CD0', '#FFB6C1', '#00CED1'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container">
      <section className="summary-boxes">
        <div className="summary-box">
          <h3>Players In Facility (Now)</h3>
          <p>{summary.playersInFacilityNow}</p>
        </div>
        <div className="summary-box">
          <h3>Players In Facility (Today)</h3>
          <p>{summary.playersInFacilityToday}</p>
        </div>
        <div className="summary-box">
          <h3>Today's Plays</h3>
          <p>{summary.todayPlays}</p>
        </div>
        <div className="summary-box">
          <h3>This Week</h3>
          <p>{summary.weekPlays}</p>
        </div>
        <div className="summary-box">
          <h3>This Month</h3>
          <p>{summary.monthPlays}</p>
        </div>
        <div className="summary-box">
          <h3>Most Popular Today</h3>
          <p>{summary.mostPopularToday?.name || '—'}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="range-buttons">
          <button
            className={range === 'today' ? 'active' : ''}
            onClick={() => setRange('today')}
          >
            Today
          </button>
          <button
            className={range === '7' ? 'active' : ''}
            onClick={() => setRange('7')}
          >
            Last 7 Days
          </button>
          <button
            className={range === '30' ? 'active' : ''}
            onClick={() => setRange('30')}
          >
            Last 30 Days
          </button>
        </div>
        <h2>{range === 'today' ? 'Games Played Today (Hourly)' : `Games Played Per Day (Last ${range} Days)`}</h2>
          <div style={{ height: '400px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
      </section>

      <section className="dashboard-section">
        <h2>Top Played Game Variants</h2>
        <Bar data={topVariantsData} height={100} />
      </section>

      <section className="dashboard-section">
        <h2>Top Variants Today</h2>
        {topVariantsToday.length === 0 ? (
          <p>No games played yet today.</p>
        ) : (
          <table className="variant-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Game Variant</th>
                <th>Plays Today</th>
              </tr>
            </thead>
            <tbody>
              {topVariantsToday.map((v, index) => (
                <tr key={v.name}>
                  <td>{index + 1}</td>
                  <td>{v.name}</td>
                  <td>{v.plays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <style jsx>{`
        .container {
          padding: 2rem;
        }

        .summary-boxes {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: space-between;
        }

        .summary-box {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 1rem;
          flex: 1 1 calc(30% - 1rem);
          min-width: 200px;
          text-align: center;
        }

        .summary-box h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .summary-box p {
          margin-top: 0.5rem;
          font-size: 1.6rem;
          font-weight: bold;
        }

        .range-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .range-buttons button {
          padding: 0.4rem 0.8rem;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .range-buttons button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .dashboard-section {
          margin-bottom: 3rem;
        }

        .variant-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .variant-table th,
        .variant-table td {
          padding: 0.75rem 1rem;
          border: 1px solid #dee2e6;
          text-align: left;
        }

        .variant-table th {
          background-color: #f1f1f1;
        }

        .variant-table tbody tr:nth-child(odd) {
          background-color: #fafafa;
        }

        .dashboard-section button {
          color: #222 !important;  /* Dark text color overrides white */
        }
      `}</style>
    </div>
  );
}
