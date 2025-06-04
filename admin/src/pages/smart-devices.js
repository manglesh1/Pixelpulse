import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchSmartDevices, setSmartDeviceStatus, getSmartDeviceStatus } from '../services/api';

const SmartDevices = () => {
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDevice, setEditDevice] = useState(null);

  const getDevices = async () => {
    const data = await fetchSmartDevices();
    setDevices(data);
  };

  useEffect(() => {
    getDevices();
  }, []);

  const columns = useMemo(() => [
    { Header: 'Alias', accessor: 'alias' },
    { Header: 'IP', accessor: 'ip' },
    { Header: 'MAC', accessor: 'mac' },
    { Header: 'Model', accessor: 'model' },
    { Header: 'Power State', accessor: 'powerState' },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <div>
          <button onClick={() => handleToggle(row.original.ip, 'on')}>ON</button>
          <button onClick={() => handleToggle(row.original.ip, 'off')}>OFF</button>
          <button onClick={() => handleEditClick(row.original)}>Edit</button>
        </div>
      ),
    }
  ], []);

  const handleToggle = async (ip, state) => {
    try {
      await setSmartDeviceStatus(ip, state);
      getDevices(); // Refresh after action
    } catch (err) {
      alert(`Failed to turn ${state} device ${ip}`);
    }
  };

  const handleEditClick = (device) => {
    setEditDevice(device);
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditDevice({ ...editDevice, [name]: value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    // This is where you'd update alias in DB if storing it
    alert(`Saved alias (not actually updating in backend): ${editDevice.alias}`);
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setEditDevice(null);
    setIsModalOpen(false);
  };

  return (
    <div className="container">
      <h1 className="header">Smart Devices</h1>
      <button onClick={getDevices} className="button create">Refresh Devices</button>
      <CustomTable columns={columns} data={devices} />

      {isModalOpen && (
        <div className="modal">
          <div className="modalContent">
            <button className="closeButton" onClick={closeModal}>X</button>
            <h2>Edit Device</h2>
            <form onSubmit={handleEditSave} className="form">
              <div className="formRow">
                <label htmlFor="alias">Alias:</label>
                <input
                  type="text"
                  id="alias"
                  name="alias"
                  value={editDevice.alias}
                  onChange={handleEditChange}
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="notes">Notes:</label>
                <input
                  type="text"
                  id="notes"
                  name="notes"
                  placeholder="(optional)"
                  value={editDevice.notes || ''}
                  onChange={handleEditChange}
                  className="input"
                />
              </div>
              <button type="submit" className="button save">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDevices;
