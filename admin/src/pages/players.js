import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchPlayers } from '@/services/api';

const Players = () => {
    const [data, setData] = useState([]);

    const getPlayers = async () => {
        const data = await fetchPlayers();
        setData(data);
    };

    useEffect(() => {
        getPlayers();
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: 'Player ID',
                accessor: 'PlayerID',
            },
            {
                Header: 'First Name',
                accessor: 'FirstName',
            },
            {
                Header: 'Last Name',
                accessor: 'LastName',
            },
            {
                Header: 'Email',
                accessor: 'email',
            },
            {
                Header: 'Date Of Birth',
                accessor: 'DateOfBirth',
            },
            {
                Header: 'Created At',
                accessor: 'createdAt',
            },
            {
                Header: 'Signature',
                accessor: 'Signature',
            },
        ],
        []
    );

    return (
        <div className="container">
            <h1 className="header">Players</h1>
            <CustomTable columns={columns} data={data} />
        </div>
    );
};

export default Players;
