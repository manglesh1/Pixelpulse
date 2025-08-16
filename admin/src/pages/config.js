import React, { useState, useEffect } from 'react';
import {
  fetchConfigs,
  createConfig,
  deleteConfig,
  updateConfig,
  fetchGamesVariants,
} from '../services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async () => {
  return { props: {} };
});

const Config = () => {
  const [data, setData] = useState([]);
  const [gamesVariants, setGamesVariants] = useState([]);
  const [newConfig, setNewConfig] = useState({
    configKey: '',
    configValue: '',
    GamesVariantId: '',
    isActive: true,
  });
  const [editData, setEditData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtered, setFiltered] = useState([]);
  const pageSize = 10;

  useEffect(() => {
    getConfigs();
    getGamesVariants();
  }, []);

  const getConfigs = async () => {
    const data = await fetchConfigs();
    setData(data);
  };

  const getGamesVariants = async () => {
    const variants = await fetchGamesVariants();
    setGamesVariants(variants);
  };

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const created = await createConfig(newConfig);
    setData([...data, created]);
    setNewConfig({
      configKey: '',
      configValue: '',
      GamesVariantId: '',
      isActive: true,
    });
    setShowCreateModal(false);
  };

  const handleEditClick = (config) => {
    setEditData(config);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSave = async () => {
    await updateConfig(editData.id, editData);
    setData(data.map((item) => (item.id === editData.id ? editData : item)));
    setEditData(null);
    setShowEditModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId != null) {
      await deleteConfig(deleteTargetId);
      await getConfigs();
      setDeleteTargetId(null);
    }
  };

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

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Configurations</h2>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          Create Configuration
        </button>
      </div>

      <table className="table table-striped table-hover align-middle table-bordered">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Config Key</th>
            <th>Config Value</th>
            <th>Games Variant ID</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((config) => (
            <tr key={config.id}>
              <td>{config.id}</td>
              <td>{config.configKey}</td>
              <td>{config.configValue}</td>
              <td>{config.GamesVariantId}</td>
              <td>{config.isActive ? 'Yes' : 'No'}</td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(config)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTargetId(config.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    {totalPages > 1 && (
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
    )};

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Create Configuration</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Config Key</label>
                    <input
                      type="text"
                      name="configKey"
                      className="form-control"
                      value={newConfig.configKey}
                      onChange={handleCreateChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Config Value</label>
                    <input
                      type="text"
                      name="configValue"
                      className="form-control"
                      value={newConfig.configValue}
                      onChange={handleCreateChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Games Variant</label>
                    <select
                      name="GamesVariantId"
                      className="form-select"
                      value={newConfig.GamesVariantId}
                      onChange={handleCreateChange}
                    >
                      <option value="">Select Variant</option>
                      {gamesVariants.map((variant) => (
                        <option key={variant.ID} value={variant.ID}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="isActive"
                      checked={newConfig.isActive}
                      onChange={handleCreateChange}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn-create">Save</button>
                  <button type="button" className="btn-delete" onClick={() => setShowCreateModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditSave();
                }}
              >
                <div className="modal-header">
                  <h5 className="modal-title">Edit Configuration</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Config Key</label>
                    <input
                      type="text"
                      name="configKey"
                      className="form-control"
                      value={editData.configKey}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Config Value</label>
                    <input
                      type="text"
                      name="configValue"
                      className="form-control"
                      value={editData.configValue}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Games Variant</label>
                    <select
                      name="GamesVariantId"
                      className="form-select"
                      value={editData.GamesVariantId}
                      onChange={handleEditChange}
                    >
                      <option value="">Select Variant</option>
                      {gamesVariants.map((variant) => (
                        <option key={variant.ID} value={variant.ID}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="isActive"
                      checked={editData.isActive}
                      onChange={handleEditChange}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn-create">Save</button>
                  <button type="button" className="btn-delete" onClick={() => setShowEditModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTargetId !== null && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteTargetId(null)}></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this configuration?
              </div>
              <div className="modal-footer">
                <button className="btn-delete" onClick={handleDeleteConfirm}>Delete</button>
                <button className="btn-edit" onClick={() => setDeleteTargetId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Config;
