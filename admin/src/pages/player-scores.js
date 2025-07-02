import React, { useState, useEffect } from 'react';
import { fetchPlayerScores, fetchGamesVariants } from '@/services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async () => {
  return { props: {} };
});

const Players = () => {
  const [data, setData] = useState([]);
  const [variantMap, setVariantMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inputPageIndex, setInputPageIndex] = useState(null);
  const [inputPageValue, setInputPageValue] = useState('');
  const pageSize = 10;

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const [scores, variants] = await Promise.all([
        fetchPlayerScores(),
        fetchGamesVariants(),
      ]);

      const sorted = scores.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      // Create ID → name map
      const map = {};
      variants.forEach((v) => {
        map[v.ID] = v.name;
      });

      setVariantMap(map);
      setData(sorted);
      setLoading(false);
    };

    getData();
  }, []);

  const totalPages = Math.ceil(data.length / pageSize);
  const currentData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const visiblePages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...');
      } else if (currentPage >= totalPages - 2) {
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(inputPageValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setInputPageValue('');
    setInputPageIndex(null);
  };

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Player Scores</h2>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: '3rem', height: '3rem' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <table className="table table-striped table-hover align-middle table-bordered">
            <thead className="table-light">
              <tr>
                <th>Score ID</th>
                <th>Game ID</th>
                <th>Player ID</th>
                <th>Game Variant</th>
                <th>Level Played</th>
                <th>Points</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((score) => (
                <tr key={score.ScoreID}>
                  <td>{score.ScoreID}</td>
                  <td>{score.GameID}</td>
                  <td>{score.PlayerID}</td>
                  <td>{variantMap[score.GamesVariantId] || score.GamesVariantId}</td>
                  <td>{score.LevelPlayed}</td>
                  <td>{score.Points}</td>
                  <td>{new Date(score.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <nav className="mt-4 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage((p) => p - 1)}>
                  &laquo;
                </button>
              </li>

              {visiblePages().map((page, idx) =>
                page === '...' ? (
                  <li key={`dots-${idx}`} className="page-item">
                    {inputPageIndex === idx ? (
                      <form onSubmit={handlePageInputSubmit}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '80px' }}
                          value={inputPageValue}
                          min={1}
                          max={totalPages}
                          autoFocus
                          onChange={(e) => setInputPageValue(e.target.value)}
                          onBlur={() => {
                            setInputPageValue('');
                            setInputPageIndex(null);
                          }}
                        />
                      </form>
                    ) : (
                      <button className="page-link" onClick={() => setInputPageIndex(idx)}>
                        ...
                      </button>
                    )}
                  </li>
                ) : (
                  <li
                    key={page}
                    className={`page-item ${currentPage === page ? 'active' : ''}`}
                  >
                    <button className="page-link" onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  </li>
                )
              )}

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage((p) => p + 1)}>
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
};

export default Players;
