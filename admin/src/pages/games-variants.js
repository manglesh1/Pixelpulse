import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchGamesVariants, createGamesVariant, deleteGamesVariant, updateGamesVariant, fetchGames } from '../services/api';

const GamesVariant = () => {
  const [data, setData] = useState([]);
  const [games, setGames] = useState([]); // State to store games
  const [newVariant, setNewVariant] = useState({
    name: '',
    variantDescription: '',
    Levels: '',
    BackgroundImage: '',
    iconImage: '',
    video: '',
    instructions: '',
    GameId: '',
  });
  const [editData, setEditData] = useState(null);

  const getGamesVariants = async () => {
    const data = await fetchGamesVariants();
    setData(data);
  };

  const getGames = async () => {
    const gamesData = await fetchGames();
    setGames(gamesData);
  };

  useEffect(() => {
    getGamesVariants();
    getGames();
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'ID',
      },
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Description',
        accessor: 'variantDescription',
      },
      {
        Header: 'Levels',
        accessor: 'Levels',
      },
      {
        Header: 'Background Image',
        accessor: 'BackgroundImage',
      },
      {
        Header: 'Icon Image',
        accessor: 'iconImage',
      },
      {
        Header: 'Video',
        accessor: 'video',
      },
      {
        Header: 'Instructions',
        accessor: 'instructions',
      },
      {
        Header: 'Game ID',
        accessor: 'GameId',
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
              onClick={() => handleDelete(row.original.ID)}
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
    setNewVariant({ ...newVariant, [name]: value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (newVariant.name && newVariant.GameId) {
      const createdVariant = await createGamesVariant(newVariant);
      setData([...data, createdVariant]);
      setNewVariant({
        name: '',
        variantDescription: '',
        Levels: '',
        BackgroundImage: '',
        iconImage: '',
        video: '',
        instructions: '',
        GameId: '',
      });
    }
  };

  const handleDelete = async (ID) => {
    await deleteGamesVariant(ID);
    getGamesVariants(); // Re-fetch games variants to update the list
  };

  const handleEditClick = (variant) => {
    setEditData(variant);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async () => {
    if (editData) {
      await updateGamesVariant(editData.ID, editData);
      setData(data.map(item => (item.ID === editData.ID ? editData : item)));
      setEditData(null);
    }
  };

  return (
    <div className="container">
      <h1 className="header">Games Variants</h1>
      <form onSubmit={handleCreateSubmit} className="createForm">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={newVariant.name}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <input
          type="text"
          name="variantDescription"
          placeholder="Description"
          value={newVariant.variantDescription}
          onChange={handleCreateChange}
          className="input"
        />
        <input
          type="text"
          name="Levels"
          placeholder="Levels"
          value={newVariant.Levels}
          onChange={handleCreateChange}
          className="input"
        />
        <input
          type="text"
          name="BackgroundImage"
          placeholder="Background Image"
          value={newVariant.BackgroundImage}
          onChange={handleCreateChange}
          className="input"
        />
        <input
          type="text"
          name="iconImage"
          placeholder="Icon Image"
          value={newVariant.iconImage}
          onChange={handleCreateChange}
          className="input"
        />
        <input
          type="text"
          name="video"
          placeholder="Video URL"
          value={newVariant.video}
          onChange={handleCreateChange}
          className="input"
        />
        <input
          type="text"
          name="instructions"
          placeholder="Instructions"
          value={newVariant.instructions}
          onChange={handleCreateChange}
          className="input"
        />
        <select
          name="GameId"
          value={newVariant.GameId}
          onChange={handleCreateChange}
          required
          className="input"
        >
          <option value="">Select Game</option>
          {games.map(game => (
            <option key={game.GameID} value={game.GameID}>
              {game.gameName} ({game.gameCode})
            </option>
          ))}
        </select>
        <button type="submit" className="button">Create</button>
      </form>
      <CustomTable columns={columns} data={data} />
      {editData && (
        <div className="editForm">
          <h2>Edit Games Variant</h2>
          <input
            type="text"
            name="name"
            value={editData.name}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="variantDescription"
            value={editData.variantDescription}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="Levels"
            value={editData.Levels}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="BackgroundImage"
            value={editData.BackgroundImage}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="iconImage"
            value={editData.iconImage}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="video"
            value={editData.video}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="instructions"
            value={editData.instructions}
            onChange={handleEditChange}
            className="input"
          />
          <select
            name="GameId"
            value={editData.GameId}
            onChange={handleEditChange}
            className="input"
          >
            <option value="">Select Game</option>
            {games.map(game => (
              <option key={game.GameID} value={game.GameID}>
                {game.gameName} ({game.gameCode})
              </option>
            ))}
          </select>
          <button onClick={handleEditSave} className="button save">Save</button>
          <button onClick={() => setEditData(null)} className="button cancel">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default GamesVariant;
