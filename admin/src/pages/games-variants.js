import React, { useState, useEffect } from 'react';
import {
  fetchGamesVariants,
  createGamesVariant,
  deleteGamesVariant,
  updateGamesVariant,
  fetchGames
} from '../services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async () => {
  return { props: {} };
});

const GamesVariant = () => {
  const [data, setData] = useState([]);
  const [games, setGames] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmToggleTarget, setConfirmToggleTarget] = useState(null);
  const [confirmToggleType, setConfirmToggleType] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [variants, allGames] = await Promise.all([
        fetchGamesVariants(),
        fetchGames()
      ]);
      setData(variants);
      setGames(allGames);
      setLoading(false);
    };
    load();
  }, []);

  // Update filtered list when data or games change
  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filteredList = data.filter(v =>
      v.name.toLowerCase().includes(search) ||
      v.Levels.toString().includes(search) ||
      games.find(g => g.GameID === v.GameId)?.gameName.toLowerCase().includes(search)
    );
    setFiltered(filteredList);
  }, [data, games, searchTerm]);

  // Reset page when user updates the search term
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const visiblePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, '...', totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const openModal = (variant = null) => {
    setEditData(variant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteGamesVariant(deleteTarget.ID);
    const updated = data.filter(v => v.ID !== deleteTarget.ID);
    setData(updated);
    setDeleteTarget(null);
  };

  const variantFormState = editData || {
    name: '',
    Levels: '',
    MaxIterations: 5,
    MaxIterationTime: 30,
    MaxLevel: 10,
    ReductionTimeEachLevel: 5,
    GameId: '',
    instructions: '',
    introAudio: '',
    introAudioText: '',
    IsActive: 1
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (editData?.ID) {
      await updateGamesVariant(editData.ID, editData);
      const updated = data.map(v => v.ID === editData.ID ? { ...v, ...editData } : v);
      setData(updated);
    } else {
      const created = await createGamesVariant(editData);
      setData(prev => [...prev, created]);
    }
    closeModal();
  };

  const handleToggleActive = (variant) => {
    const type = variant.IsActive === 1 ? 'inactivate' : 'activate';
    setConfirmToggleTarget(variant);
    setConfirmToggleType(type);
  };

  const confirmToggle = async () => {
    const updated = {
      ...confirmToggleTarget,
      IsActive: confirmToggleType === 'activate' ? 1 : 0
    };
    await updateGamesVariant(confirmToggleTarget.ID, updated);
    const newData = data.map(v => v.ID === updated.ID ? updated : v);
    setData(newData);
    setConfirmToggleTarget(null);
    setConfirmToggleType(null);
  };

  const getGameName = id => games.find(g => g.GameID === id)?.gameName || '—';

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Game Variants</h2>
        <button className="btn-create" onClick={() => openModal()}>Create Variant</button>
      </div>

      <input
        className="form-control mb-3"
        placeholder="Search variants..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      ) : (
        <>
          <table className="table table-bordered table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Levels</th>
                <th>Game</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(v => (
                <tr key={v.ID}>
                  <td>{v.ID}</td>
                  <td>
                    <span className="text-primary text-decoration-underline" role="button" onClick={() => openModal(v)}>
                      {v.name}
                    </span>
                  </td>
                  <td>{v.Levels}</td>
                  <td>{getGameName(v.GameId)}</td>
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
                      <button className="btn btn-sm btn-dark" onClick={() => openModal(v)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(v)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <nav className="mt-4 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>&laquo;</button>
              </li>
              {visiblePages().map((p, idx) =>
                p === '...' ? (
                  <li key={idx} className="page-item disabled"><span className="page-link">…</span></li>
                ) : (
                  <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                  </li>
                )
              )}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>&raquo;</button>
              </li>
            </ul>
          </nav>
        </>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editData?.ID ? 'Edit Variant' : 'Create Variant'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body row g-3">
                  {['name', 'Levels', 'MaxIterations', 'MaxIterationTime', 'MaxLevel', 'ReductionTimeEachLevel', 'instructions', 'introAudio', 'introAudioText'].map(key => (
                    <div key={key} className="col-md-6">
                      <label className="form-label">{key}</label>
                      <input
                        type={key === 'Levels' || key.includes('Max') || key === 'ReductionTimeEachLevel' ? 'number' : 'text'}
                        className="form-control"
                        name={key}
                        required={['name', 'GameId'].includes(key)}
                        value={variantFormState[key]}
                        onChange={handleFormChange}
                      />
                    </div>
                  ))}
                  <div className="col-md-6">
                    <label className="form-label">Game</label>
                    <select
                      name="GameId"
                      className="form-select"
                      value={variantFormState.GameId}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Game</option>
                      {games.map(g =>
                        <option key={g.GameID} value={g.GameID}>{g.gameName} ({g.gameCode})</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Is Active</label>
                    <select
                      name="IsActive"
                      className="form-select"
                      value={variantFormState.IsActive}
                      onChange={handleFormChange}
                    >
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editData?.ID ? 'Save' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button className="btn-close" onClick={() => setDeleteTarget(null)}></button>
              </div>
              <div className="modal-body">
                <p>Delete variant <strong>{deleteTarget.name}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation/Inactivation Confirmation */}
      {confirmToggleTarget && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm {confirmToggleType === 'activate' ? 'Activation' : 'Inactivation'}</h5>
                <button className="btn-close" onClick={() => setConfirmToggleTarget(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to <strong>{confirmToggleType}</strong> <strong>{confirmToggleTarget.name}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmToggleTarget(null)}>Cancel</button>
                <button className={`btn btn-${confirmToggleType === 'activate' ? 'success' : 'warning'}`} onClick={confirmToggle}>
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
