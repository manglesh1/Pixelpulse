import React, { useState, useEffect } from 'react';
import {
  fetchSmartDevices,
  setSmartDeviceStatus
} from '../services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth()(async () => {
  return { props: {} };
});

const SmartDevices = () => {
  const [devices, setDevices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    const data = await fetchSmartDevices();
    setDevices(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filteredData = devices.filter(
      d =>
        d.alias?.toLowerCase().includes(lower) ||
        d.ip?.includes(lower) ||
        d.mac?.toLowerCase().includes(lower) ||
        d.model?.toLowerCase().includes(lower)
    );
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchTerm, devices]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const visiblePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handleToggle = async (ip, state) => {
    try {
      await setSmartDeviceStatus(ip, state);
      loadDevices();
    } catch (err) {
      alert(`Failed to turn ${state} device ${ip}`);
    }
  };

  const handleEditClick = (device) => {
    setEditDevice(device);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditDevice(null);
    setIsModalOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditDevice(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    alert(`Saved alias (not actually updating in backend): ${editDevice.alias}`);
    closeModal();
  };

  return (
    <div className="container-fluid bg-white py-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Smart Devices</h2>
        <button className="btn-create" onClick={loadDevices}>Refresh</button>
      </div>

      <input
        className="form-control mb-3"
        placeholder="Search devices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      ) : (
        <>
          <table className="table table-striped table-hover align-middle table-bordered">
            <thead className="table-light">
              <tr>
                <th>Alias</th>
                <th>IP</th>
                <th>MAC</th>
                <th>Model</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(d => (
                <tr key={d.mac}>
                  <td>{d.alias || '—'}</td>
                  <td>{d.ip}</td>
                  <td>{d.mac}</td>
                  <td>{d.model}</td>
                  <td>{d.powerState || 'Unknown'}</td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-sm btn-success" onClick={() => handleToggle(d.ip, 'on')}>ON</button>
                      <button className="btn btn-sm btn-warning" onClick={() => handleToggle(d.ip, 'off')}>OFF</button>
                      <button className="btn btn-sm btn-dark" onClick={() => handleEditClick(d)}>Edit</button>
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

      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Device</h5>
                <button className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleEditSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Alias</label>
                    <input
                      type="text"
                      name="alias"
                      className="form-control"
                      value={editDevice.alias}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      name="notes"
                      className="form-control"
                      value={editDevice.notes || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" type="submit">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDevices;
