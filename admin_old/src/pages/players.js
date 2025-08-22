import React, { useEffect, useState } from 'react';
import {
  fetchPagedPlayers,
  fetchPlayerById,
  fetchPlayersBySigneeId,
  fetchWristbandsByPlayerID,
  fetchGamesVariants,
  updatePlayer,
  deletePlayer,
  updateWristband,
  deleteWristband,
  fetchPlayerScoreById
} from '@/services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth()(async () => {
  return { props: {} };
});

const Players = () => {
  // --- Paging, filtering & search
  const [pageData, setPageData] = useState({ players: [], total: 0, page: 1, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [validOnly, setValidOnly] = useState(false);
  const [masterOnly, setMasterOnly] = useState(false);
  const [playingNow, setPlayingNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputPageIndex, setInputPageIndex] = useState(null);
  const [inputPageValue, setInputPageValue] = useState('');
  const [showAllScores, setShowAllScores] = useState(false);

  // --- Modal & details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [wristbands, setWristbands] = useState([]);
  const [children, setChildren] = useState([]);
  const [parentPlayer, setParentPlayer] = useState(null);
  const [topScores, setTopScores] = useState([]);
  const [variantMap, setVariantMap] = useState({});
  const [showValidOnlyInModal, setShowValidOnlyInModal] = useState(true);
  const [ childrenWristbands, setChildrenWristbands ] = useState({});   

  // --- Inline edit state
  const [editingWristbandId, setEditingWristbandId] = useState(null);
  const [editingChildId, setEditingChildId] = useState(null);
  const [childEditData, setChildEditData] = useState({ FirstName: '', LastName: '' });

  const [sortBy, setSortBy] = useState('playerid');
  const [sortDir, setSortDir] = useState('desc');

  // --- Toasts
  const [toast, setToast] = useState({ message: '', type: '' });
  const [showToast, setShowToast] = useState(false);
  const showSuccess = msg => { setToast({ message: msg, type: 'success' }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };
  const showError   = msg => { setToast({ message: msg, type: 'danger'  }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

    useEffect(() => {
    // whenever search or any filter changes, go back to page 1
    setPageData(pd => ({ ...pd, page: 1 }));
    }, [searchTerm, validOnly, masterOnly, playingNow]);

  // --- Fetch one page
  const loadPage = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = pageData;
      const data = await fetchPagedPlayers({
        page,
        pageSize,
        search: searchTerm,
        validOnly,
        masterOnly,
        playingNow,
        sortBy,
        sortDir
      });
      setPageData(data);
    } catch {
      showError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  // --- Reload on any filter/page/search change
  useEffect(() => {
    loadPage();
  }, [
    pageData.page,
    pageData.pageSize,
    searchTerm,
    validOnly,
    masterOnly,
    playingNow,
    sortBy,
    sortDir
  ]);

  // --- Pagination helpers
  const totalPages = Math.ceil(pageData.total / pageData.pageSize);
  const visiblePages = () => {
    const pages = [];
    const p = pageData.page;
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (p <= 3) {
      pages.push(1, 2, 3, 4, 'dot', totalPages);
    } else if (p >= totalPages - 2) {
      pages.push(1, 'dot', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'dot', p - 1, p, p + 1, 'dot', totalPages);
    }
    return pages;
  };
  const handlePageInput = e => {
    e.preventDefault();
    const v = parseInt(inputPageValue, 10);
    if (v >= 1 && v <= totalPages) {
      setPageData(pd => ({ ...pd, page: v }));
    }
    setInputPageIndex(null);
    setInputPageValue('');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction
      setSortDir(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };
  // --- Open & load modal
const openModal = player => {
  setSelectedPlayer(player);
  setIsModalOpen(true);
};
useEffect(() => {
  if (!isModalOpen || !selectedPlayer) return;

  // Prevent refetching on every keystroke
  const playerId = selectedPlayer.PlayerID;

  setModalLoading(true);

  (async () => {
    try {
      const [wbs, kids, parent] = await Promise.all([
        fetchWristbandsByPlayerID(playerId),
        selectedPlayer.PlayerID === selectedPlayer.SigneeID
          ? fetchPlayersBySigneeId(playerId)
          : Promise.resolve([]),
        selectedPlayer.SigneeID && selectedPlayer.SigneeID !== selectedPlayer.PlayerID
          ? fetchPlayerById(selectedPlayer.SigneeID)
          : Promise.resolve(null),
      ]);

      setWristbands(wbs);
      setChildren(kids.filter(c => c.PlayerID !== playerId));
      setParentPlayer(parent);

      const [allScores, variants] = await Promise.all([
        fetchPlayerScoreById(playerId),
        fetchGamesVariants()
      ]);

      const vmap = {};
      variants.forEach(v => vmap[v.ID] = v.name);
      setVariantMap(vmap);

      const best = Object.values(
        allScores.reduce((acc, s) => {
          if (!acc[s.GamesVariantId] || s.Points > acc[s.GamesVariantId].Points) {
            acc[s.GamesVariantId] = s;
          }
          return acc;
        }, {})
      );
      setTopScores(best);

    } catch {
      showError('Failed to load details');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
      setEditingWristbandId(null);
      setEditingChildId(null);
    }
  })();
}, [isModalOpen, selectedPlayer?.PlayerID]);


  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
    setWristbands([]);
    setChildren([]);
    setParentPlayer(null);
    setTopScores([]);
  };

  // --- Inline edits & deletes
  const handlePlayerChange = e => {
    const { name, value } = e.target;
    setSelectedPlayer(p => ({ ...p, [name]: value }));
  };
  const handlePlayerSave = async () => {
    try {
      await updatePlayer(selectedPlayer.PlayerID, selectedPlayer);
      showSuccess('Player updated');
      loadPage();
      reloadModalData(selectedPlayer.PlayerID);
    } catch {
      showError('Failed to update player');
    }
  };
  const deletePlayerWithConfirm = async id => {
    if (!confirm('Delete this player?')) return;
    try {
      await deletePlayer(id);
      showSuccess('Player deleted');
      loadPage();
      closeModal();
    } catch {
      showError('Failed to delete player');
    }
  };

  const startChildEdit = c => {
    setEditingChildId(c.PlayerID);
    setChildEditData({ FirstName: c.FirstName, LastName: c.LastName });
  };
  const handleChildField = (k, v) => {
    setChildEditData(d => ({ ...d, [k]: v }));
  };
  const saveChild = async () => {
    try {
      await updatePlayer(editingChildId, childEditData);
      showSuccess('Child updated');
      reloadModalData(selectedPlayer.PlayerID);
    } catch {
      showError('Failed to update child');
    }
  };
  const deleteChild = async id => {
    if (!confirm('Delete this child?')) return;
    try {
      await deletePlayer(id);
      showSuccess('Child deleted');
      reloadModalData(selectedPlayer.PlayerID);
    } catch {
      showError('Failed to delete child');
    }
  };

const reloadModalData = async (playerId) => {
  setModalLoading(true);
  try {
    const player = await fetchPlayerById(playerId); // ✅ reload base player
    setSelectedPlayer(player); // ✅ ensures input values refresh

    const [wbs, kids, parent] = await Promise.all([
      fetchWristbandsByPlayerID(playerId),
      player.PlayerID === player.SigneeID
        ? fetchPlayersBySigneeId(playerId)
        : Promise.resolve([]),
      player.SigneeID && player.SigneeID !== player.PlayerID
        ? fetchPlayerById(player.SigneeID)
        : Promise.resolve(null),
    ]);

    setWristbands(wbs);
    setChildren(kids.filter(c => c.PlayerID !== playerId));
    setParentPlayer(parent);

    const [allScores, variants] = await Promise.all([
      fetchPlayerScoreById(playerId),
      fetchGamesVariants()
    ]);

    const vmap = {};
    variants.forEach(v => vmap[v.ID] = v.name);
    setVariantMap(vmap);

    const best = Object.values(
      allScores.reduce((acc, s) => {
        if (!acc[s.GamesVariantId] || s.Points > acc[s.GamesVariantId].Points) {
          acc[s.GamesVariantId] = s;
        }
        return acc;
      }, {})
    );
    setTopScores(best);

    // Reload wristbands for each child
    const childrenWBMap = {};
    await Promise.all(kids.map(async c => {
      const wbs = await fetchWristbandsByPlayerID(c.PlayerID);
      childrenWBMap[c.PlayerID] = wbs;
    }));
    setChildrenWristbands(childrenWBMap);

  } catch {
    showError('Failed to load details');
    setIsModalOpen(false);
  } finally {
    setModalLoading(false);
    setEditingWristbandId(null);
    setEditingChildId(null);
  }
};

  const isValidWb = wb => {
    const now = Date.now(),
          s = new Date(wb.playerStartTime).getTime(),
          e = new Date(wb.playerEndTime).getTime();
    return wb.wristbandStatusFlag === 'R' && now >= s && now <= e;
  };
  const handleWbField = (id, k, v) => {
    setWristbands(ws => ws.map(w => w.WristbandTranID === id ? { ...w, [k]: v } : w));
  };
const saveWb = async wb => {
  // build the payload exactly as your API expects
  const payload = {
    uid: wb.wristbandCode,
    currentstatus: wb.wristbandStatusFlag,
    status: wb.wristbandStatusFlag,
    playerStartTime: wb.playerStartTime,
    playerEndTime: wb.playerEndTime,
  };

  try {
    // send the update
    const updated = await updateWristband(payload);
    showSuccess('Wristband saved');

    setWristbands(ws =>
      ws.map(w =>
        w.WristbandTranID === wb.WristbandTranID ? updated : w
      )
    );

  } catch (err) {
    console.error('saveWb error:', err.response?.status, err.response?.data);
    showError('Failed to save wristband');
  }
};
  const deleteWb = async id => {
    if (!confirm('Delete this wristband?')) return;
    try {
      await deleteWristband(id);
      showSuccess('Wristband deleted');
      reloadModalData(selectedPlayer.PlayerID);
    } catch {
      showError('Failed to delete wristband');
    }
  };

const toDateTimeLocal = dateString => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  // adjust for timezone so the local picker shows the correct time
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
};


  // Date formatter
  const fmt = dt => new Intl.DateTimeFormat('en-US', {
    month:'numeric', day:'numeric',
    hour:'numeric', minute:'2-digit', hour12:true
  }).format(dt);

  return (
    <div className="container-fluid bg-white py-4">
      {/* Toast */}
      {showToast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3`} role="alert">
          {toast.message}
          <button className="btn-close" onClick={()=>setShowToast(false)}/>
        </div>
      )}

      {/* Header: search + filters */}
      <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Players</h2>
        <input
          type="text"
          className="form-control"
          placeholder="Search players..."
          style={{ maxWidth: 300 }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="form-check form-switch">
          <input id="flt-valid" className="form-check-input" type="checkbox"
            checked={validOnly} onChange={()=>setValidOnly(v=>!v)}/>
          <label htmlFor="flt-valid" className="form-check-label">Valid only</label>
        </div>
        <div className="form-check form-switch">
          <input id="flt-master" className="form-check-input" type="checkbox"
            checked={masterOnly} onChange={()=>setMasterOnly(v=>!v)}/>
          <label htmlFor="flt-master" className="form-check-label">Master only</label>
        </div>
        <div className="form-check form-switch">
          <input id="flt-playing" className="form-check-input" type="checkbox"
            checked={playingNow} onChange={()=>setPlayingNow(v=>!v)}/>
          <label htmlFor="flt-playing" className="form-check-label">Playing now</label>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" style={{ width: 48, height: 48 }}/>
        </div>
      ) : (
        <>
          <table className="table table-striped table-hover align-middle table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {[
                { label: 'ID', field: 'playerid' },
                { label: 'Name', field: 'firstname' },
                { label: 'Email', field: 'email' },
                { label: 'Signee', field: 'signeeid' }
              ].map(col => (
                <th
                  key={col.field}
                  role="button"
                  onClick={() => handleSort(col.field)}
                  style={{ cursor: 'pointer' }}
                >
                  {col.label}{' '}
                  {sortBy === col.field && (
                    <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
            <tbody>
              {pageData.players.map(p=>(
                <tr key={p.PlayerID}>
                  <td>{p.PlayerID}</td>
                  <td>{p.FirstName} {p.LastName}</td>
                  <td>{p.email}</td>
                  <td>{p.SigneeID ?? '—'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={()=>openModal(p)}>Details</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>deletePlayerWithConfirm(p.PlayerID)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="d-flex justify-content-center">
              <ul className="pagination">
                <li className={`page-item ${pageData.page===1?'disabled':''}`}>
                  <button className="page-link" onClick={()=>setPageData(pd=>({...pd,page:pd.page-1}))}>&laquo;</button>
                </li>
                {visiblePages().map((pg,i)=> pg==='dot' ? (
                  <li key={`dot-${i}`} className="page-item">
                    {inputPageIndex===i ? (
                      <form onSubmit={handlePageInput}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 60 }}
                          value={inputPageValue}
                          onChange={e=>setInputPageValue(e.target.value)}
                          onBlur={()=>setInputPageIndex(null)}
                          min={1} max={totalPages}
                          autoFocus
                        />
                      </form>
                    ) : (
                      <button className="page-link" onClick={()=>setInputPageIndex(i)}>…</button>
                    )}
                  </li>
                ) : (
                  <li key={`pg-${pg}`} className={`page-item ${pg===pageData.page?'active':''}`}>
                    <button className="page-link" onClick={()=>setPageData(pd=>({...pd,page:pg}))}>{pg}</button>
                  </li>
                ))}
                <li className={`page-item ${pageData.page===totalPages?'disabled':''}`}>
                  <button className="page-link" onClick={()=>setPageData(pd=>({...pd,page:pd.page+1}))}>&raquo;</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Details Modal */}
        {isModalOpen && selectedPlayer && (
        <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">

                {/* Header */}
                <div className="modal-header d-flex align-items-center">
                <h5 className="modal-title">
                    {selectedPlayer.SigneeID !== selectedPlayer.PlayerID && parentPlayer
                    ? `Child of ${parentPlayer.FirstName} ${parentPlayer.LastName}`
                    : 'Edit Player'}
                </h5>
                {selectedPlayer.SigneeID !== selectedPlayer.PlayerID && parentPlayer && (
                    <button
                    className="btn btn-sm btn-outline-secondary ms-3 me-auto"
                    onClick={() => reloadModalData(parentPlayer.PlayerID)}
                    >
                    View Parent
                    </button>
                )}
                <button type="button" className="btn-close" onClick={closeModal}/>
                </div>

                {/* Body */}
                <div className="modal-body">
                {modalLoading ? (
                    <div className="text-center my-4">
                    <p className="mb-3">Fetching player data…</p>
                    <div className="spinner-border text-primary"/>
                    </div>
                ) : (
                    <>
                    {/* Player info */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                        <label>ID</label>
                        <input className="form-control" value={selectedPlayer.PlayerID} disabled/>
                        </div>
                        <div className="col-md-4">
                        <label>First Name</label>
                        <input
                            className="form-control"
                            name="FirstName"
                            value={selectedPlayer.FirstName}
                            onChange={handlePlayerChange}
                        />
                        </div>
                        <div className="col-md-4">
                        <label>Last Name</label>
                        <input
                            className="form-control"
                            name="LastName"
                            value={selectedPlayer.LastName}
                            onChange={handlePlayerChange}
                        />
                        </div>
                        <div className="col-12">
                        <label>Email</label>
                        <input
                            className="form-control"
                            name="email"
                            type="email"
                            value={selectedPlayer.email || ''}
                            onChange={handlePlayerChange}
                        />
                        </div>
                    </div>

                    {/* Top Scores */}
                    <div className="mb-4">
                    <h6 className="text-muted">Top Scores</h6>

                    {/* Wrap in a fixed-width, scrollable container to prevent reflow */}
                    <div className="table-responsive">
                        <table className="table table-sm">
                        <thead>
                            <tr>
                            <th style={{ width: '50%' }}>Variant</th>
                            <th style={{ width: '25%' }}>Score</th>
                            <th style={{ width: '25%' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showAllScores ? topScores : topScores.slice(0, 5)).map(s => (
                            <tr key={s.ScoreID}>
                                <td>{variantMap[s.GamesVariantId] || s.GamesVariantId}</td>
                                <td>{s.Points}</td>
                                <td>{new Date(s.updatedAt).toLocaleString()}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>

                    {/* Toggle link */}
                    {topScores.length > 5 && !showAllScores && (
                        <button
                        className="btn btn-link p-0"
                        onClick={() => setShowAllScores(true)}
                        >
                        View all {topScores.length}
                        </button>
                    )}
                    {showAllScores && (
                        <button
                        className="btn btn-link p-0"
                        onClick={() => setShowAllScores(false)}
                        >
                        Show less
                        </button>
                    )}
                    </div>


                {/* Children */}
                {selectedPlayer.SigneeID === selectedPlayer.PlayerID && children.length > 0 && (
                <div className="mb-4">
                    <h6 className="text-muted">Children</h6>
                    <ul className="list-group">
                    {children.map(c => {
                        // get all of this child’s wristbands
                        const childWbs = childrenWristbands[c.PlayerID] || [];

                        // find a currently valid one
                        const validWb = childWbs.find(wb => isValidWb(wb));

                        // pick the one we'll display: prefer valid, otherwise first if any
                        const wbToShow = validWb || childWbs[0] || null;

                        // does this child have a valid band right now?
                        const hasValid = !!validWb;

                        // shorten the code for display
                        const full = wbToShow?.wristbandCode || '';
                        const short = full.length > 12
                        ? `${full.slice(0, 8)}…${full.slice(-4)}`
                        : full;

                        return (
                        <li key={c.PlayerID} className="list-group-item d-flex align-items-center">
                            {editingChildId === c.PlayerID ? (
                            /* your existing inline‐edit UI */
                            <div className="d-flex w-100 align-items-center">
                                <div className="d-flex gap-2">
                                <input
                                    className="form-control form-control-sm"
                                    style={{ minWidth: '6rem' }}
                                    value={childEditData.FirstName}
                                    onChange={e => handleChildField('FirstName', e.target.value)}
                                />
                                <input
                                    className="form-control form-control-sm"
                                    style={{ minWidth: '6rem' }}
                                    value={childEditData.LastName}
                                    onChange={e => handleChildField('LastName', e.target.value)}
                                />
                                </div>
                                <div className="ms-auto d-flex gap-2">
                                <button className="btn btn-sm btn-primary" onClick={saveChild}>Save</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditingChildId(null)}>Cancel</button>
                                </div>
                            </div>
                            ) : (
                            <>
                                <a
                                href="#"
                                className="me-3 text-decoration-none"
                                onClick={e => { e.preventDefault(); openModal(c); }}
                                >
                                {c.FirstName} {c.LastName}
                                </a>

                                <span className={`me-3 ${hasValid ? 'text-success' : 'text-danger'}`}>
                                ▌
                                </span>

                                {wbToShow ? (
                                <span className="text-monospace me-auto">
                                    {short} [{wbToShow.wristbandStatusFlag}]
                                </span>
                                ) : (
                                <span className="text-muted me-auto">Unassigned</span>
                                )}

                                <div className="d-flex gap-2">
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => startChildEdit(c)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => deleteChild(c.PlayerID)}
                                >
                                    Delete
                                </button>
                                </div>
                            </>
                            )}
                        </li>
                        );
                    })}
                    </ul>
                </div>
                )}


                    {/* Wristbands */}
                    <div className="mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="text-muted mb-0">Wristbands</h6>
                        <div className="form-check form-switch">
                            <input
                            className="form-check-input"
                            type="checkbox"
                            id="modal-valid-only"
                            checked={showValidOnlyInModal}
                            onChange={() => setShowValidOnlyInModal(v => !v)}
                            />
                            <label className="form-check-label" htmlFor="modal-valid-only">
                            {showValidOnlyInModal ? 'Valid only' : 'Show all'}
                            </label>
                        </div>
                        </div>

                        {wristbands
                        .filter(wb =>
                            wb.WristbandTranID === editingWristbandId ||
                            !showValidOnlyInModal ||
                            isValidWb(wb)
                        )
                        .map(wb => {
                            const full = wb.wristbandCode;
                            const short = full.length > 12
                            ? `${full.slice(0,8)}…${full.slice(-4)}`
                            : full;
                            const s = new Date(wb.playerStartTime),
                                e = new Date(wb.playerEndTime),
                                isMaster = e - s > 10*24*60*60*1000;
                            const isEditing = editingWristbandId === wb.WristbandTranID;

                            return (
                            <div key={wb.WristbandTranID} className="border rounded p-3 mb-3">
                                {isEditing ? (
                                <div className="d-flex align-items-center">
                                    <strong title={full} className="me-4">{short}</strong>
                                    <input
                                    type="datetime-local"
                                    className="form-control form-control-sm me-2"
                                    style={{ maxWidth: 180 }}
                                    value={toDateTimeLocal(wb.playerStartTime)}
                                    onChange={e => handleWbField(wb.WristbandTranID, 'playerStartTime', e.target.value)}
                                    />
                                    <input
                                    type="datetime-local"
                                    className="form-control form-control-sm me-2"
                                    style={{ maxWidth: 180 }}
                                    value={toDateTimeLocal(wb.playerEndTime)}
                                    onChange={e => handleWbField(wb.WristbandTranID, 'playerEndTime', e.target.value)}
                                    />
                                    <select
                                    className="form-select form-select-sm me-2"
                                    style={{ maxWidth: 120 }}
                                    value={wb.wristbandStatusFlag}
                                    onChange={e => handleWbField(wb.WristbandTranID, 'wristbandStatusFlag', e.target.value)}
                                    >
                                    <option value="R">Registered</option>
                                    <option value="I">Initialized</option>
                                    </select>
                                    <div className="ms-auto d-flex gap-2">
                                    <button className="btn btn-sm btn-primary" onClick={() => { saveWb(wb); setEditingWristbandId(null); }}>Save</button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingWristbandId(null)}>Cancel</button>
                                    </div>
                                </div>
                                ) : (
                                <div className="d-flex align-items-center">
                                    <div className="me-4 d-flex align-items-center">
                                    <strong title={full}>{short}</strong>
                                    <span className="text-muted ms-2">
                                        Status:&nbsp;<strong>{wb.wristbandStatusFlag === 'R' ? 'Registered' : 'Initialized'}</strong>
                                    </span>
                                    {isValidWb(wb) && <span className="text-success ms-2">▌</span>}
                                    </div>
                                    <div className="me-auto text-secondary text-nowrap">
                                    {isMaster ? <em>Master wristband</em> : `${fmt(s)} – ${fmt(e)}`}
                                    </div>
                                    <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingWristbandId(wb.WristbandTranID)}>Edit</button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteWb(wb.WristbandTranID)}>Delete</button>
                                    </div>
                                </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                    </>
                )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                <button className="btn btn-primary" onClick={handlePlayerSave}>Save Player</button>
                </div>
            </div>
            </div>
        </div>
        )}

    </div>
  );
};

export default Players;
