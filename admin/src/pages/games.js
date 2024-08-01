import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchGames, createGame, deleteGame, updateGame } from '../services/api';

const Games = () => {
  const [data, setData] = useState([]);
  const [newGame, setNewGame] = useState({
    gameCode: '',
    gameName: '',
    gameDescription: '',
    MaxIterations: 5,
    MaxIterationTime: 30,
    MaxLevel: 10,
    ReductionTimeEachLevel: 5,
    MaxPlayers: 5,
    IpAddress: '127.0.0.1',
    LocalPort: 21,
    RemotePort: 7113,
    SocketBReceiverPort: 20105,
    NoOfControllers: 1,
    NoofLedPerdevice: 1,
    columns: 14,
    introAudio: ''
  });
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getGames = async () => {
    const data = await fetchGames();
    setData(data);
  };

  useEffect(() => {
    getGames();
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'GameID',
        accessor: 'GameID',
      },
      {
        Header: 'Game Code',
        accessor: 'gameCode',
        Cell: ({ row }) => (
          <span
            onClick={() => handleEditClick(row.original)}
            style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
          >
            {row.original.gameCode}
          </span>
        ),
      },
      {
        Header: 'Game Name',
        accessor: 'gameName',
      },
      {
        Header: 'Description',
        accessor: 'gameDescription',
      },
      {
        Header: 'Created At',
        accessor: 'createdAt',
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <button
              className="button edit"
              onClick={() => handleEditClick(row.original)}
            >
              Edit
            </button>
            <button
              className="button delete"
              onClick={() => handleDelete(row.original.GameID)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewGame({ ...newGame, [name]: value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (newGame.gameCode && newGame.gameName && newGame.gameDescription) {
      const createdGame = await createGame(newGame);
      setData([...data, createdGame]);
      setNewGame({
        gameCode: '',
        gameName: '',
        gameDescription: '',
        MaxIterations: 5,
        MaxIterationTime: 30,
        MaxLevel: 10,
        ReductionTimeEachLevel: 5,
        MaxPlayers: 5,
        IpAddress: '127.0.0.1',
        LocalPort: 21,
        RemotePort: 7113,
        SocketBReceiverPort: 20105,
        NoOfControllers: 1,
        NoofLedPerdevice: 1,
        columns: 14,
        introAudio: ''
      });
      setIsModalOpen(false); // Close modal after creation
    }
  };

  const handleDelete = async (GameID) => {
    await deleteGame(GameID);
    getGames(); // Re-fetch games to update the list
  };

  const handleEditClick = (game) => {
    setEditData(game);
    setIsModalOpen(true); // Open modal for editing
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (editData) {
      await updateGame(editData.GameID, editData);
      setData(data.map(item => (item.GameID === editData.GameID ? editData : item)));
      setEditData(null);
      setIsModalOpen(false); // Close modal after saving
    }
  };

  const openModalForCreate = () => {
    setNewGame({
      gameCode: '',
      gameName: '',
      gameDescription: '',
      MaxIterations: 5,
      MaxIterationTime: 30,
      MaxLevel: 10,
      ReductionTimeEachLevel: 5,
      MaxPlayers: 5,
      IpAddress: '127.0.0.1',
      LocalPort: 21,
      RemotePort: 7113,
      SocketBReceiverPort: 20105,
      NoOfControllers: 1,
      NoofLedPerdevice: 1,
      columns: 14,
      introAudio: ''
    });
    setIsModalOpen(true); // Open modal for creating
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false); // Close modal without saving
  };

  return (
    <div className="container">
      <h1 className="header">Games</h1>
      <button onClick={openModalForCreate} className="button create">Create</button>
      <CustomTable columns={columns} data={data} />
      
      {isModalOpen && (
        <div className="modal">
          <div className="modalContent">
            <button className="closeButton" onClick={closeModal}>X</button>
            <h2>{editData ? 'Edit Game' : 'Create Game'}</h2>
            <form onSubmit={editData ? handleEditSave : handleCreateSubmit} className="form">
              <div className="formRow">
                <label htmlFor="gameCode">Game Code:</label>
                <input
                  type="text"
                  id="gameCode"
                  name="gameCode"
                  placeholder="Game Code"
                  value={editData ? editData.gameCode : newGame.gameCode}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="gameName">Game Name:</label>
                <input
                  type="text"
                  id="gameName"
                  name="gameName"
                  placeholder="Game Name"
                  value={editData ? editData.gameName : newGame.gameName}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="gameDescription">Game Description:</label>
                <input
                  type="text"
                  id="gameDescription"
                  name="gameDescription"
                  placeholder="Game Description"
                  value={editData ? editData.gameDescription : newGame.gameDescription}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="MaxIterations">Max Iterations:</label>
                <input
                  type="number"
                  id="MaxIterations"
                  name="MaxIterations"
                  placeholder="Max Iterations"
                  value={editData ? editData.MaxIterations : newGame.MaxIterations}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="MaxIterationTime">Max Iteration Time:</label>
                <input
                  type="number"
                  id="MaxIterationTime"
                  name="MaxIterationTime"
                  placeholder="Max Iteration Time"
                  value={editData ? editData.MaxIterationTime : newGame.MaxIterationTime}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="MaxLevel">Max Level:</label>
                <input
                  type="number"
                  id="MaxLevel"
                  name="MaxLevel"
                  placeholder="Max Level"
                  value={editData ? editData.MaxLevel : newGame.MaxLevel}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="ReductionTimeEachLevel">Reduction Time Each Level:</label>
                <input
                  type="number"
                  id="ReductionTimeEachLevel"
                  name="ReductionTimeEachLevel"
                  placeholder="Reduction Time Each Level"
                  value={editData ? editData.ReductionTimeEachLevel : newGame.ReductionTimeEachLevel}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="MaxPlayers">Max Players:</label>
                <input
                  type="number"
                  id="MaxPlayers"
                  name="MaxPlayers"
                  placeholder="Max Players"
                  value={editData ? editData.MaxPlayers : newGame.MaxPlayers}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="IpAddress">IP Address:</label>
                <input
                  type="text"
                  id="IpAddress"
                  name="IpAddress"
                  placeholder="IP Address"
                  value={editData ? editData.IpAddress : newGame.IpAddress}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="LocalPort">Local Port:</label>
                <input
                  type="number"
                  id="LocalPort"
                  name="LocalPort"
                  placeholder="Local Port"
                  value={editData ? editData.LocalPort : newGame.LocalPort}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="RemotePort">Remote Port:</label>
                <input
                  type="number"
                  id="RemotePort"
                  name="RemotePort"
                  placeholder="Remote Port"
                  value={editData ? editData.RemotePort : newGame.RemotePort}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="SocketBReceiverPort">Socket B Receiver Port:</label>
                <input
                  type="number"
                  id="SocketBReceiverPort"
                  name="SocketBReceiverPort"
                  placeholder="Socket B Receiver Port"
                  value={editData ? editData.SocketBReceiverPort : newGame.SocketBReceiverPort}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="NoOfControllers">No. of Controllers:</label>
                <input
                  type="number"
                  id="NoOfControllers"
                  name="NoOfControllers"
                  placeholder="No. of Controllers"
                  value={editData ? editData.NoOfControllers : newGame.NoOfControllers}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="NoofLedPerdevice">No. of LEDs Per Device:</label>
                <input
                  type="number"
                  id="NoofLedPerdevice"
                  name="NoofLedPerdevice"
                  placeholder="No. of LEDs Per Device"
                  value={editData ? editData.NoofLedPerdevice : newGame.NoofLedPerdevice}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="columns">Columns:</label>
                <input
                  type="number"
                  id="columns"
                  name="columns"
                  placeholder="Columns"
                  value={editData ? editData.columns : newGame.columns}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="introAudio">Intro Audio:</label>
                <input
                  type="text"
                  id="introAudio"
                  name="introAudio"
                  placeholder="Intro Audio"
                  value={editData ? editData.introAudio : newGame.introAudio}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  className="input"
                />
              </div>
              <button type="submit" className="button save">{editData ? 'Save' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
