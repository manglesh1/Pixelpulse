import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchGamesVariants, createGamesVariant, deleteGamesVariant, updateGamesVariant, fetchGames } from '../services/api';

const GamesVariant = () => {
  const [data, setData] = useState([]);
  const [games, setGames] = useState([]);
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        Cell: ({ row }) => (
          <span
            onClick={() => handleEditClick(row.original)}
            style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
          >
            {row.original.name}
          </span>
        ),
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
      setIsModalOpen(false); // Close modal after creation
    }
  };

  const handleDelete = async (ID) => {
    await deleteGamesVariant(ID);
    getGamesVariants(); // Re-fetch games variants to update the list
  };

  const handleEditClick = (variant) => {
    setEditData(variant);
    setIsModalOpen(true); // Open modal for editing
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (editData) {
      await updateGamesVariant(editData.ID, editData);
      setData(data.map(item => (item.ID === editData.ID ? editData : item)));
      setEditData(null);
      setIsModalOpen(false); // Close modal after saving
    }
  };

  const openModalForCreate = () => {
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
    setIsModalOpen(true); // Open modal for creating
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false); // Close modal without saving
  };

  return (
    <div className="container">
      <h1 className="header">Games Variants</h1>
      <button onClick={openModalForCreate} className="button create">Create</button>
      <CustomTable columns={columns} data={data} />
      
      {isModalOpen && (
        <div className="modal">
          <div className="modalContent">
            <button className="closeButton" onClick={closeModal}>X</button>
            <h2>{editData ? 'Edit Games Variant' : 'Create Games Variant'}</h2>
            <form onSubmit={editData ? handleEditSave : handleCreateSubmit} className="form">
              <div className="formRow">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Name"
                  value={editData ? editData.name : newVariant.name}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="variantDescription">Description:</label>
                <input
                  type="text"
                  id="variantDescription"
                  name="variantDescription"
                  placeholder="Description"
                  value={editData ? editData.variantDescription : newVariant.variantDescription}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="Levels">Levels:</label>
                <input
                  type="text"
                  id="Levels"
                  name="Levels"
                  placeholder="Levels"
                  value={editData ? editData.Levels : newVariant.Levels}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="instructions">Instructions:</label>
                <textarea
                  id="instructions"
                  name="instructions"
                  placeholder="Instructions"
                  value={editData ? editData.instructions : newVariant.instructions}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  className="input textarea"
                  rows="4"
                />
              </div>
              <div className="formRow">
                <label htmlFor="GameId">Game:</label>
                <select
                  id="GameId"
                  name="GameId"
                  value={editData ? editData.GameId : newVariant.GameId}
                  onChange={editData ? handleEditChange : handleCreateChange}
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
              </div>
              <button type="submit" className="button save">{editData ? 'Save' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesVariant;
