import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchGameroomTypes, createGameroomType, deleteGameroomType, updateGameroomType } from '../services/api';
import { withAuth } from '../../utils/withAuth';

export const getServerSideProps = withAuth(async (context) => {
  return { props: {} };
});

const GameroomTypes = () => {
  const [data, setData] = useState([]);
  const [newType, setNewType] = useState({ roomtypeCode: '', roomDescription: '' });
  const [editData, setEditData] = useState(null);
  const getGameroomTypes = async () => {
    const data = await fetchGameroomTypes();
    setData(data);
  };
  useEffect(() => {
       getGameroomTypes();
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Room Type Code',
        accessor: 'roomtypeCode',
      },
      {
        Header: 'Room Description',
        accessor: 'roomDescription',
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
              onClick={() => handleDelete(row.original.id)}
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
    setNewType({ ...newType, [name]: value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (newType.roomtypeCode && newType.roomDescription) {
      const createdType = await createGameroomType(newType);
      setData([...data, createdType]);
      setNewType({ roomtypeCode: '', roomDescription: '' });
    }
  };

  const handleDelete = async (id) => {
    await deleteGameroomType(id);
    getGameroomTypes();
  };

  const handleEditClick = (type) => {
    setEditData(type);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async () => {
    if (editData) {
      await updateGameroomType(editData.id, editData);
      setData(data.map(item => (item.id === editData.id ? editData : item)));
      setEditData(null);
    }
  };

  return (
    <div className="container">
      <h1 className="header">Gameroom Types</h1>
      <form onSubmit={handleCreateSubmit} className="createForm">
        <input
          type="text"
          name="roomtypeCode"
          placeholder="Room Type Code"
          value={newType.roomtypeCode}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <input
          type="text"
          name="roomDescription"
          placeholder="Room Description"
          value={newType.roomDescription}
          onChange={handleCreateChange}
          required
          className="input"
        />
        <button type="submit" className="button">Create</button>
      </form>
      <CustomTable columns={columns} data={data} />
      {editData && (
        <div className="editForm">
          <h2>Edit Gameroom Type</h2>
          <input
            type="text"
            name="roomtypeCode"
            value={editData.roomtypeCode}
            onChange={handleEditChange}
            className="input"
          />
          <input
            type="text"
            name="roomDescription"
            value={editData.roomDescription}
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

export default GameroomTypes;
