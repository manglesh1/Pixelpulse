import React, { useState, useEffect } from 'react';
import {
  fetchGamesVariants,
  createGamesVariant,
  deleteGamesVariant,
  updateGamesVariant,
  fetchGames
} from '../services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async () => ({ props: {} }));

const GamesVariant = () => {
  const [data, setData]                   = useState([]);
  const [games, setGames]                 = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [loading, setLoading]             = useState(true);
  const [editData, setEditData]           = useState(null);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [confirmToggleTarget, setConfirmToggleTarget] = useState(null);
  const [confirmToggleType, setConfirmToggleType]     = useState(null);
  const pageSize = 10;

  const fieldLabels = {
    name:               'Variant Name',
    variantDescription: 'Description',
    Levels:             'Levels',
    GameType:           'Game Type',
    instructions:       'Instructions',
    MaxIterations:      'Max Iterations',
    MaxIterationTime:   'Max Iteration Time',
    MaxLevel:           'Max Level',
    ReductionTimeEachLevel: 'Reduction Time Each Level',
    introAudio:         'Intro Audio URL',
    introAudioText:     'Intro Audio Text',
  };

  // Load data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [variants, allGames] = await Promise.all([
        fetchGamesVariants(),
        fetchGames()
      ]);
      setData(variants);
      setGames(allGames);
      setLoading(false);
    })();
  }, []);

  // Filter by name or levels or game name
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      data.filter(v => {
        const nameMatch = v.name.toLowerCase().includes(term);
        const levelMatch = String(v.Levels).includes(term);
        const gameName = games.find(g => g.GameID === v.GameId)?.gameName || '';
        const gameMatch = gameName.toLowerCase().includes(term);
        return nameMatch || levelMatch || gameMatch;
      })
    );
  }, [data, games, searchTerm]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const visiblePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, '...', totalPages);
      else if (currentPage >= totalPages - 2)
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      else
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
    }
    return pages;
  };

  // Modal open/close
  const openModal = variant => {
    setEditData(
      variant || {
        name: '',
        variantDescription: '',
        Levels: '',
        GameType: '',
        instructions: '',
        MaxIterations: 5,
        MaxIterationTime: 30,
        MaxLevel: 10,
        ReductionTimeEachLevel: 5,
        introAudio: '',
        introAudioText: '',
        IsActive: 1,
        GameId: ''
      }
    );
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false);
  };
  const handleFormChange = e => {
    const { name, value } = e.target;
    setEditData(d => ({ ...d, [name]: value }));
  };
  const handleFormSubmit = async e => {
    e.preventDefault();
    if (editData.ID) {
      await updateGamesVariant(editData.ID, editData);
      setData(d => d.map(v => (v.ID === editData.ID ? editData : v)));
    } else {
      const created = await createGamesVariant(editData);
      setData(d => [...d, created]);
    }
    closeModal();
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteGamesVariant(deleteTarget.ID);
    setData(d => d.filter(v => v.ID !== deleteTarget.ID));
    setDeleteTarget(null);
  };

  // Toggle
  const handleToggleActive = v => {
    setConfirmToggleTarget(v);
    setConfirmToggleType(v.IsActive === 1 ? 'inactivate' : 'activate');
  };
  const confirmToggle = async () => {
    const updated = {
      ...confirmToggleTarget,
      IsActive: confirmToggleType === 'activate' ? 1 : 0
    };
    await updateGamesVariant(updated.ID, updated);
    setData(d => d.map(v => (v.ID === updated.ID ? updated : v)));
    setConfirmToggleTarget(null);
    setConfirmToggleType(null);
  };

  const getGameName = id => games.find(g => g.GameID === id)?.gameName || '—';

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Game Variants</h2>
        <button className="btn-create" onClick={() => openModal()}>
          Create Variant
        </button>
      </div>


      <input
        className="form-control mb-3"
        placeholder="Search variants…"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" style={{ width: 48, height: 48 }} />
        </div>
      ) : (
        <>
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Game</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(v => (
                <tr key={v.ID}>
                  <td>{v.ID}</td>
                  <td>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => openModal(v)}
                    >
                      {v.name}
                    </button>
                  </td>
                  <td>{getGameName(v.GameId)}</td>
                  <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={v.IsActive === 1}
                        onChange={() => handleToggleActive(v)}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-dark"
                        onClick={() => openModal(v)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteTarget(v)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <nav className="d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>
                  &laquo;
                </button>
              </li>
              {visiblePages().map((p, i) =>
                p === '...' ? (
                  <li key={i} className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
                ) : (
                  <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p)}>
                      {p}
                    </button>
                  </li>
                )
              )}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="gv-form-title"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="gv-form-title" className="modal-title">
                  {editData?.ID ? 'Edit Game Variant' : 'Create Game Variant'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeModal}
                />
              </div>
              <form onSubmit={handleFormSubmit}>
              <div className="modal-body row g-3">
                {Object.keys(fieldLabels).map(key => (
                  <div key={key} className="col-md-6">
                    <label className="form-label">{fieldLabels[key]}</label>
                    <input
                      type={
                        ['Levels','MaxIterations','MaxIterationTime','MaxLevel','ReductionTimeEachLevel'].includes(key)
                          ? 'number'
                          : 'text'
                      }
                      className="form-control"
                      name={key}
                      value={editData[key] ?? ''}
                      onChange={handleFormChange}
                      required={key === 'name'}
                    />
                  </div>
                ))}


                  <div className="col-md-6">
                    <label className="form-label">Game</label>
                    <select
                      name="GameId"
                      className="form-select"
                      value={editData.GameId || ''}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Game</option>
                      {games.map(g => (
                        <option key={g.GameID} value={g.GameID}>
                          {g.gameName} ({g.gameCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Is Active</label>
                    <select
                      name="IsActive"
                      className="form-select"
                      value={editData.IsActive}
                      onChange={handleFormChange}
                    >
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editData?.ID ? 'Save Changes' : 'Create Variant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="gv-delete-title"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="gv-delete-title" className="modal-title">
                  Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setDeleteTarget(null)}
                />
              </div>
              <div className="modal-body">
                Delete variant <strong>{deleteTarget.name}</strong>?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activate/Inactivate Confirmation Modal */}
      {confirmToggleTarget && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="gv-toggle-title"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="gv-toggle-title" className="modal-title">
                  Confirm {confirmToggleType === 'activate' ? 'Activation' : 'Inactivation'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setConfirmToggleTarget(null)}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to <strong>{confirmToggleType}</strong> variant{' '}
                <strong>{confirmToggleTarget.name}</strong>?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmToggleTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className={`btn btn-${
                    confirmToggleType === 'activate' ? 'success' : 'warning'
                  }`}
                  onClick={confirmToggle}
                >
                  {confirmToggleType === 'activate' ? 'Activate' : 'Inactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesVariant;
