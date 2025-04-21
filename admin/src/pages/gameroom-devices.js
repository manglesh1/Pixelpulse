import React, { useEffect, useMemo, useState } from 'react';
import CustomTable from '../components/CustomTable';
import {
  fetchDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  fetchGames
} from '../services/api';

const Devices = () => {
  const [data, setData] = useState([]);
  const [games, setGames] = useState([]);
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [search, setSearch] = useState('');

  const [newDevice, setNewDevice] = useState({
    GameID: '',
    deviceId: '',
    deviceType: '',
    comPort: '',
    baudRate: '',
    parity: '',
    stopBits: '',
    dataBits: '',
    description: '',
    isOptional: false
  });

  const getDevices = async () => {
    const devices = await fetchDevices();
    setData(devices);
  };

  const getGames = async () => {
    const gameList = await fetchGames();
    setGames(gameList);
  };

  useEffect(() => {
    getDevices();
    getGames();
  }, []);

  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'id' },
      { Header: 'Game', accessor: 'gameCode' },
      { Header: 'Device ID', accessor: 'deviceId' },
      { Header: 'Type', accessor: 'deviceType' },
      { Header: 'COM Port', accessor: 'comPort' },
      {
        Header: 'Optional',
        accessor: 'isOptional',
        Cell: ({ value }) => (value ? 'Yes' : 'No')
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="action-buttons">
            <button className="button edit" onClick={() => handleEditClick(row.original)}>Edit</button>
            <button className="button delete" onClick={() => handleDelete(row.original.id)}>Delete</button>
          </div>
        )
        
      }
    ],
    []
  );

  const handleEditClick = (device) => {
    setEditData(device);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this device?");
    if (!confirm) return;
    await deleteDevice(id);
    getDevices();
  };

  const handleChange = (e, isEdit = false) => {
    const { name, value, type, checked } = e.target;
    const updated = { ...(isEdit ? editData : newDevice) };
    updated[name] = type === 'checkbox' ? checked : value;
    isEdit ? setEditData(updated) : setNewDevice(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editData) {
      await updateDevice(editData.id, editData);
      setData(data.map((item) => (item.id === editData.id ? editData : item)));
    } else {
      const created = await createDevice(newDevice);
      setData([...data, created]);
    }
    closeModal();
  };

  const openModalForCreate = () => {
    setNewDevice({
      GameID: '',
      deviceId: '',
      deviceType: '',
      comPort: '',
      baudRate: '',
      parity: '',
      stopBits: '',
      dataBits: '',
      description: '',
      isOptional: false
    });
    setEditData(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false);
  };

  const current = editData || newDevice;

  const filteredData = useMemo(() => {
    return data.filter((device) => {
      const matchesGame = !selectedGame || device.gameCode === selectedGame;
      const q = search.toLowerCase();
      const matchesSearch =
        device.deviceId.toLowerCase().includes(q) ||
        device.deviceType.toLowerCase().includes(q) ||
        device.comPort.toLowerCase().includes(q);
      return matchesGame && matchesSearch;
    });
  }, [data, selectedGame, search]);

  return (
    <div className="container">
      <h1 className="header">Devices</h1>
      <button onClick={openModalForCreate} className="button create">Create</button>

      <div className="filters" style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
        <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} className="input">
          <option value="">All Games</option>
          {games.map((game) => (
            <option key={game.GameID} value={game.gameCode}>
              {game.gameCode}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search Device ID, COM port, or Type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>
      <CustomTable columns={columns} data={filteredData} />

      {isModalOpen && (
        <div className="modal">
          <div className="modalContent">
            <button className="closeButton" onClick={closeModal}>X</button>
            <h2>{editData ? 'Edit Device' : 'Create Device'}</h2>
            <form onSubmit={handleSave} className="form">

              <div className="formRow">
                <label>Game *</label>
                <select
                  name="GameID"
                  value={current.GameID}
                  onChange={(e) => handleChange(e, !!editData)}
                  required
                  className="input"
                >
                  <option value="">Select Game</option>
                  {games.map((game) => (
                    <option key={game.GameID} value={game.GameID}>
                      {game.gameCode} ({game.gameName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="formRow">
                <label>Device ID *</label>
                <input
                  type="text"
                  name="deviceId"
                  value={current.deviceId}
                  onChange={(e) => handleChange(e, !!editData)}
                  required
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>Device Type *</label>
                <input
                  type="text"
                  name="deviceType"
                  value={current.deviceType}
                  onChange={(e) => handleChange(e, !!editData)}
                  required
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>COM Port *</label>
                <input
                  type="text"
                  name="comPort"
                  value={current.comPort}
                  onChange={(e) => handleChange(e, !!editData)}
                  required
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>Baud Rate</label>
                <input
                  type="number"
                  name="baudRate"
                  value={current.baudRate}
                  onChange={(e) => handleChange(e, !!editData)}
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>Parity</label>
                <input
                  type="text"
                  name="parity"
                  value={current.parity}
                  onChange={(e) => handleChange(e, !!editData)}
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>Stop Bits</label>
                <input
                  type="text"
                  name="stopBits"
                  value={current.stopBits}
                  onChange={(e) => handleChange(e, !!editData)}
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>Data Bits</label>
                <input
                  type="number"
                  name="dataBits"
                  value={current.dataBits}
                  onChange={(e) => handleChange(e, !!editData)}
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={current.description}
                  onChange={(e) => handleChange(e, !!editData)}
                  className="input"
                />
              </div>

              <div className="formRow">
                <label>
                  <input
                    type="checkbox"
                    name="isOptional"
                    checked={current.isOptional}
                    onChange={(e) => handleChange(e, !!editData)}
                  /> Optional
                </label>
              </div>

              <button type="submit" className="button save">
                {editData ? 'Save' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
