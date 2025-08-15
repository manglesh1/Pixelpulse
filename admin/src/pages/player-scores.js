import React, { useEffect, useState } from 'react';
import {
  fetchPagedPlayerScores,
  fetchGamesVariants,
  deletePlayerScore
} from '@/services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async () => ({ props: {} }));

const PlayerScores = () => {
  // --- State
  const [pageData, setPageData] = useState({
    scores: [], totalItems: 0, totalPages: 1,
    page: 1, pageSize: 10,
  });
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [gamesVariantId, setGamesVariantId] = useState('');
  const [searchTerm, setSearchTerm]         = useState('');  // free-text name/email
  const [loading, setLoading]               = useState(false);

  // --- Smart pagination input
  const [inputPageIndex, setInputPageIndex] = useState(null);
  const [inputPageValue, setInputPageValue] = useState('');

  // --- Variant name lookup
  const [variantMap, setVariantMap] = useState({});

  // Load variants once
  useEffect(() => {
    fetchGamesVariants().then(list => {
      const map = {};
      list.forEach(v => (map[v.ID] = v.name));
      setVariantMap(map);
    });
  }, []);

  // Fetch one page whenever filters/page change
  const loadPage = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = pageData;
      const res = await fetchPagedPlayerScores({
        page,
        pageSize,
        startDate,
        endDate,
        gamesVariantId,
        search: searchTerm,
      });
      setPageData({
        scores:      res.data,
        totalItems:  res.pagination.totalItems,
        totalPages:  res.pagination.totalPages,
        page:        res.pagination.page,
        pageSize:    res.pagination.pageSize,
      });
    } catch (err) {
      console.error('Failed to load scores', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on deps change
  useEffect(() => {
    loadPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData.page, startDate, endDate, gamesVariantId, searchTerm]);

  // Delete handler
  const handleDelete = async (scoreId) => {
    if (!confirm(`Delete score #${scoreId}?`)) return;
    try {
      await deletePlayerScore(scoreId);
      loadPage();
    } catch {
      alert('Failed to delete score');
    }
  };

  // Pagination helpers
  const { page, totalPages } = pageData;
  const visiblePages = () => {
    if (totalPages <= 5) return Array.from({length: totalPages}, (_,i)=>i+1);
    if (page <= 3)          return [1,2,3,4,'dot', totalPages];
    if (page >= totalPages-2) return [1,'dot', totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [1,'dot', page-1, page, page+1,'dot', totalPages];
  };
  const handlePageInput = e => {
    e.preventDefault();
    const v = parseInt(inputPageValue, 10);
    if (v>=1 && v<=totalPages) setPageData(pd=>({...pd, page:v}));
    setInputPageIndex(null);
    setInputPageValue('');
  };

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight:'100vh' }}>
      <h2 className="fw-bold mb-4">Player Scores</h2>

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-3">
          <label>Start Date</label>
          <input
            type="date" className="form-control"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPageData(pd=>({...pd,page:1})); }}
          />
        </div>
        <div className="col-md-3">
          <label>End Date</label>
          <input
            type="date" className="form-control"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPageData(pd=>({...pd,page:1})); }}
          />
        </div>
        <div className="col-md-3">
          <label>Game Variant</label>
          <select
            className="form-control"
            value={gamesVariantId}
            onChange={e => { setGamesVariantId(e.target.value); setPageData(pd=>({...pd,page:1})); }}
          >
            <option value="">All</option>
            {Object.entries(variantMap).map(([id,name])=>(
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label>Player Name / Email</label>
          <input
            type="text" className="form-control"
            placeholder="Search name or email"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPageData(pd=>({...pd,page:1})); }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" style={{width:48, height:48}}/>
        </div>
      ) : (
        <>
          <table className="table table-striped table-hover align-middle table-bordered">
            <thead className="table-light">
              <tr>
                <th>Score ID</th>
                <th>Player</th>
                <th>Game</th>
                <th>Variant</th>
                <th>Level</th>
                <th>Points</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.scores.map(s => (
                <tr key={s.ScoreID}>
                  <td>{s.ScoreID}</td>
                  <td>
                    {s.player
                      ? `${s.player.FirstName} ${s.player.LastName}`
                      : s.PlayerID}
                  </td>
                  <td>{s.game?.gameName || s.GameID}</td>
                  <td>{s.GamesVariant?.name || s.GamesVariantId}</td>
                  <td>{s.LevelPlayed || '—'}</td>
                  <td>{s.Points}</td>
                  <td>{new Date(s.StartTime).toLocaleString()}</td>
                  <td>{new Date(s.EndTime).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={()=>handleDelete(s.ScoreID)}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages>1 && (
            <nav className="mt-4 d-flex justify-content-center">
              <ul className="pagination">
                <li className={`page-item ${page===1?'disabled':''}`}>
                  <button className="page-link"
                    onClick={()=>setPageData(pd=>({...pd,page:pd.page-1}))}
                  >&laquo;</button>
                </li>

                {visiblePages().map((p,idx)=>
                  p==='dot' ? (
                    <li key={`dot-${idx}`} className="page-item">
                      {inputPageIndex===idx ? (
                        <form onSubmit={handlePageInput}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{width:60}}
                            value={inputPageValue}
                            min={1} max={totalPages}
                            autoFocus
                            onChange={e=>setInputPageValue(e.target.value)}
                            onBlur={()=>setInputPageIndex(null)}
                          />
                        </form>
                      ) : (
                        <button
                          className="page-link"
                          onClick={()=>setInputPageIndex(idx)}
                        >…</button>
                      )}
                    </li>
                  ) : (
                    <li
                      key={p}
                      className={`page-item ${p===page?'active':''}`}
                    >
                      <button className="page-link"
                        onClick={()=>setPageData(pd=>({...pd,page:p}))}
                      >{p}</button>
                    </li>
                  )
                )}

                <li className={`page-item ${page===totalPages?'disabled':''}`}>
                  <button className="page-link"
                    onClick={()=>setPageData(pd=>({...pd,page:pd.page+1}))}
                  >&raquo;</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerScores;
