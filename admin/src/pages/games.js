import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchGames, createGame, deleteGame, updateGame } from '../services/api';

const Games = () => {
  const [data, setData] = useState([]);
  const [newGame, setNewGame] = useState({ gameCode: '', gameName: '', gameDescription: '' });
  const [editData, setEditData] = useState(null);

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
      setNewGame({ gameCode: '', gameName: '', gameDescription: '' });
    }
  };

  const handleDelete = async (GameID) => {
    await deleteGame(GameID);
    getGames(); // Re-fetch games to update the list
  };

  const handleEditClick = (game) => {
    setEditData(game);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async () => {
    if (editData) {
      await updateGame(editData.GameID, editData);
      setData(data.map(item => (item.GameID === editData.GameID ? editData : item)));
      setEditData(null);
    }
  };
  

  return (
    <div className="container">
      <h1 className="header">Games</h1>
      <form onSubmit={handleCreateSubmit} className="createForm">
        <input
          type="text"
          name="gameCode"
          placeholder="Game Code"
          value={newGame.gameCode}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <input
          type="text"
          name="gameName"
          placeholder="Game Name"
          value={newGame.gameName}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <input
          type="text"
          name="gameDescription"
          placeholder="gameDescription"
          value={newGame.description}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <button type="submit" className="button">Create</button>
      </form>
      <CustomTable columns={columns} data={data} />
      {editData && (
        <div className="editForm">
          <h2>Edit Game</h2>
          <input
            type="text"
            name="gameCode"
            value={editData.gameCode}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="gameName"
            value={editData.gameName}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="gameDescription"
            value={editData.gameDescription}
            onChange={handleEditChange}
            className="input"
          />
          <button onClick={handleEditSave} className="button save">Save</button>
          <button onClick={() => setEditData(null)} className="button cancel">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Games;
