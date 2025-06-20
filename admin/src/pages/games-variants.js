import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchGamesVariants, createGamesVariant, deleteGamesVariant, updateGamesVariant, fetchGames } from '../services/api';

const GamesVariant = () => {
  const [data, setData] = useState([]);
  const [games, setGames] = useState([]);
  const [newVariant, setNewVariant] = useState({
    name: '',
    variantDescription: '',
    MaxIterations: 5,
    MaxIterationTime: 30,
    MaxLevel: 10,
    ReductionTimeEachLevel: 5,
    Levels: '',
    BackgroundImage: '',
    iconImage: '',
    video: '',
    instructions: '',
    GameId: '',
  });
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        Header: 'Game',
        accessor: 'game.gameName',
        Cell: ({ row }) => row.original.game?.gameName || '—'
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center'}} >
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
        MaxIterations: 5,
        MaxIterationTime: 30,
        MaxLevel: 10,
        ReductionTimeEachLevel: 5,
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
    const confirmDelete = window.confirm('Are you sure you want to delete this game variant?');
    if (!confirmDelete) return;

    await deleteGamesVariant(ID);
    getGamesVariants();
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
      MaxIterations: 5,
      MaxIterationTime: 30,
      MaxLevel: 10,
      ReductionTimeEachLevel: 5,
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

  const filteredData = useMemo(() => {
  if (!searchTerm) return data;

  const lowerSearch = searchTerm.toLowerCase();
  return data.filter(variant => {
    return (
      variant.name?.toLowerCase().includes(lowerSearch) ||
      variant.variantDescription?.toLowerCase().includes(lowerSearch) ||
      variant.instructions?.toLowerCase().includes(lowerSearch) ||
      variant.Levels?.toLowerCase().includes(lowerSearch) ||
      variant.game?.gameName?.toLowerCase().includes(lowerSearch)
    );
  });
}, [searchTerm, data]);

  return (
    <div className="container">
    <h1 className="header">Games Variants</h1>
    <div className="toolbar">
      <input
        type="text"
        placeholder="Search variants..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input search"
      />
      <button onClick={openModalForCreate} className="button create">Create</button>
    </div>
    <CustomTable columns={columns} data={filteredData} />
      
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
                <label htmlFor="MaxIterations">Max Iterations:</label>
                <input
                  type="number"
                  id="MaxIterations"
                  name="MaxIterations"
                  placeholder="Max Iterations"
                  value={editData ? editData.MaxIterations : newVariant.MaxIterations}
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
                  value={editData ? editData.MaxIterationTime : newVariant.MaxIterationTime}
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
                  value={editData ? editData.MaxLevel : newVariant.MaxLevel}
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
                  value={editData ? editData.ReductionTimeEachLevel : newVariant.ReductionTimeEachLevel}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  required
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
              <div className="formRow">
                <label htmlFor="introAudio">Intro Audio URL:</label>
                <input
                  type="text"
                  id="introAudio"
                  name="introAudio"
                  value={editData? editData.introAudio : newVariant.introAudio}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  className="input"
                />
              </div>
              <div className="formRow">
                <label htmlFor="introAudioText">Intro Audio Text:</label>
                <textarea
                  id="introAudioText"
                  name="introAudioText"
                  value={editData ? editData.introAudioText : newVariant.introAudioText}
                  onChange={editData ? handleEditChange : handleCreateChange}
                  className="input"
                />
              </div>
              <div className="formRow">
              <label htmlFor="IsActive">Is Active:</label>
              <select
                id="IsActive"
                name="IsActive"
                value={editData ? editData.IsActive : newVariant.IsActive}
                onChange={editData ? handleEditChange : handleCreateChange}
                className="input"
              >
                <option value="">Select</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
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
