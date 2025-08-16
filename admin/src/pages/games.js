import React, { useState, useEffect } from 'react';
import {
  fetchGames,
  createGame,
  deleteGame,
  updateGame,
  fetchGamesVariants,
} from '../services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async () => {
  return { props: {} };
});

const Games = () => {
  const [data, setData] = useState([]);
  const [variants, setVariants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [newGame, setNewGame] = useState({
    gameCode: '',
    gameName: '',
    MaxPlayers: 5,
    IpAddress: '127.0.0.1',
    LocalPort: 21,
    RemotePort: 7113,
    SocketBReceiverPort: 20105,
    NoOfControllers: 1,
    NoofLedPerdevice: 1,
    columns: 14,
    introAudio: '',
  });
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [games, gameVariants] = await Promise.all([
        fetchGames(),
        fetchGamesVariants(),
      ]);
      setData(games);
      setVariants(gameVariants);
      setFiltered(games);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filteredData = data.filter(
      g =>
        g.gameName?.toLowerCase().includes(lower) ||
        g.gameCode?.toLowerCase().includes(lower)
    );
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchTerm, data]);

  const openModalForCreate = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewGame({ ...newGame, [name]: value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const created = await createGame(newGame);
    const updated = [...data, created];
    setData(updated);
    setSearchTerm('');
    setIsModalOpen(false);
  };

  const handleEditClick = (game) => {
    setEditData(game);
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    await updateGame(editData.GameID, editData);
    const updated = data.map(d => (d.GameID === editData.GameID ? editData : d));
    setData(updated);
    setIsModalOpen(false);
    setEditData(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteGame(deleteTarget.GameID);
    const updated = data.filter(d => d.GameID !== deleteTarget.GameID);
    setData(updated);
    setDeleteTarget(null);
  };

  const getVariantsByGame = (gameId) => {
    return variants.filter(v => v.GameId === gameId);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const getNumberOfVariants = (gameId) => {
    return variants.filter(v => v.GameId === gameId).length;
  }

  const fieldLabels = {
    gameCode: 'Game Code',
    gameName: 'Game Name',
    MaxPlayers: 'Max Players',
    IpAddress: 'IP Address',
    LocalPort: 'Local Port',
    RemotePort: 'Remote Port',
    SocketBReceiverPort: 'Socket B Receiver Port',
    NoOfControllers: 'Number of Controllers',
    NoofLedPerdevice: 'LEDs per Device',
    columns: 'Columns',
  };

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const sortedData = [...filtered].sort((a, b) => {
    const { key, direction } = sortConfig;

    if (!key) return 0;

    let aVal = a[key];
    let bVal = b[key];

    if (key === 'numberOfVariants') {
      aVal = getNumberOfVariants(a.GameID);
      bVal = getNumberOfVariants(b.GameID);
    }

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'string') {
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const currentData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visiblePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, '...');
      else if (currentPage >= totalPages - 2) pages.push('...', totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Games</h2>
        <button className="btn-create" onClick={openModalForCreate}>Create Game</button>
      </div>

      <input
        className="form-control mb-3"
        placeholder="Search by name or code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <table className="table table-bordered table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th role="button" onClick={() => handleSort('GameID')}>
                  ID {sortConfig.key === 'GameID' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th role="button" onClick={() => handleSort('gameCode')}>
                  Code {sortConfig.key === 'gameCode' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th role="button" onClick={() => handleSort('gameName')}>
                  Name {sortConfig.key === 'gameName' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th role="button" onClick={() => handleSort('createdAt')}>
                  Created {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th role="button" onClick={() => handleSort('numberOfVariants')}>
                  # of Variants {sortConfig.key === 'numberOfVariants' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(game => (
                <tr key={game.GameID}>
                  <td>{game.GameID}</td>
                  <td>
                    <span
                      role="button"
                      className="text-primary text-decoration-underline"
                      onClick={() => handleEditClick(game)}
                    >
                      {game.gameCode}
                    </span>
                  </td>
                  <td>{game.gameName}</td>
                  <td>{new Date(game.createdAt).toLocaleDateString()}</td>
                  <td>{getNumberOfVariants(game.GameID)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-dark" onClick={() => handleEditClick(game)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(game)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <nav className="mt-4 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>&laquo;</button>
              </li>
              {visiblePages().map((p, idx) =>
                p === '...' ? (
                  <li key={idx} className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editData ? 'Edit Game' : 'Create Game'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={editData ? handleEditSave : handleCreateSubmit}>
                <div className="modal-body row g-3">
                  {[
                    'gameCode',
                    'gameName',
                    'MaxPlayers',
                    'IpAddress',
                    'LocalPort',
                    'RemotePort',
                    'SocketBReceiverPort',
                    'NoOfControllers',
                    'NoofLedPerdevice',
                    'columns',
                  ].map((key) => (
                    <div key={key} className="col-md-6">
                      <label className="form-label">{fieldLabels[key] || key}</label>
                      <input
                        type={
                          key.includes('Port') || key === 'MaxPlayers' || key === 'columns'
                            ? 'number'
                            : 'text'
                        }
                        className="form-control"
                        name={key}
                        required
                        value={editData ? editData[key] : newGame[key]}
                        onChange={editData ? handleEditChange : handleCreateChange}
                      />
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editData ? 'Save' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button className="btn-close" onClick={() => setDeleteTarget(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{deleteTarget.gameName}</strong>?</p>
                <p className="text-danger">
                  This will also delete the following variants:
                </p>
                <ul>
                  {getVariantsByGame(deleteTarget.GameID).map(v => (
                    <li key={v.ID}>{v.name}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
