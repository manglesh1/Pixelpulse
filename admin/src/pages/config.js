import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchConfigs, createConfig, deleteConfig, updateConfig, fetchGamesVariants } from '../services/api';

const Config = () => {
  const [data, setData] = useState([]);
  const [gamesVariants, setGamesVariants] = useState([]); // State to store games variants
  const [newConfig, setNewConfig] = useState({
    configKey: '',
    configValue: '',
    GamesVariantId: '',
    isActive: true,
  });
  const [editData, setEditData] = useState(null);

  const getConfigs = async () => {
    const data = await fetchConfigs();
    setData(data);
  };

  const getGamesVariants = async () => {
    const variantsData = await fetchGamesVariants();
    setGamesVariants(variantsData);
  };

  useEffect(() => {
    getConfigs();
    getGamesVariants();
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Config Key',
        accessor: 'configKey',
      },
      {
        Header: 'Config Value',
        accessor: 'configValue',
      },
      {
        Header: 'Games Variant ID',
        accessor: 'GamesVariantId',
      },
      {
        Header: 'Active',
        accessor: 'isActive',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
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
    setNewConfig({ ...newConfig, [name]: value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (newConfig.configKey && newConfig.configValue) {
      const createdConfig = await createConfig(newConfig);
      setData([...data, createdConfig]);
      setNewConfig({
        configKey: '',
        configValue: '',
        GamesVariantId: '',
        isActive: true,
      });
    }
  };

  const handleDelete = async (id) => {
    await deleteConfig(id);
    getConfigs(); // Re-fetch configs to update the list
  };

  const handleEditClick = (config) => {
    setEditData(config);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async () => {
    if (editData) {
      await updateConfig(editData.id, editData);
      setData(data.map(item => (item.id === editData.id ? editData : item)));
      setEditData(null);
    }
  };

  return (
    <div className="container">
      <h1 className="header">Configurations</h1>
      <form onSubmit={handleCreateSubmit} className="createForm">
        <input
          type="text"
          name="configKey"
          placeholder="Config Key"
          value={newConfig.configKey}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <input
          type="text"
          name="configValue"
          placeholder="Config Value"
          value={newConfig.configValue}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <select
          name="GamesVariantId"
          value={newConfig.GamesVariantId}
          onChange={handleCreateChange}
          className="input"
        >
          <option value="">Select Games Variant</option>
          {gamesVariants.map(variant => (
            <option key={variant.ID} value={variant.ID}>
              {variant.name}
            </option>
          ))}
        </select>
        <label>
          Active:
          <input
            type="checkbox"
            name="isActive"
            checked={newConfig.isActive}
            onChange={(e) => setNewConfig({ ...newConfig, isActive: e.target.checked })}
          />
        </label>
        <button type="submit" className="button">Create</button>
      </form>
      <CustomTable columns={columns} data={data} />
      {editData && (
        <div className="editForm">
          <h2>Edit Config</h2>
          <input
            type="text"
            name="configKey"
            value={editData.configKey}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="configValue"
            value={editData.configValue}
            onChange={handleEditChange}
            className="input"
          />
          <select
            name="GamesVariantId"
            value={editData.GamesVariantId}
            onChange={handleEditChange}
            className="input"
          >
            <option value="">Select Games Variant</option>
            {gamesVariants.map(variant => (
              <option key={variant.ID} value={variant.ID}>
                {variant.name}
              </option>
            ))}
          </select>
          <label>
            Active:
            <input
              type="checkbox"
              name="isActive"
              checked={editData.isActive}
              onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
            />
          </label>
          <button onClick={handleEditSave} className="button save">Save</button>
          <button onClick={() => setEditData(null)} className="button cancel">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Config;
