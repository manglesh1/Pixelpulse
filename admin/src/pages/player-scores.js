import React, { useMemo, useState, useEffect } from 'react';
import CustomTable from '../components/CustomTable';
import { fetchPlayerScores } from '@/services/api';

const Players = () => {
    const [data, setData] = useState([]);

    const getPlayers = async () => {
        const data = await fetchPlayerScores();
        setData(data);
    };

    useEffect(() => {
        getPlayers();
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: 'Score ID',
                accessor: 'ScoreID',
            },
            {
                Header: 'Game ID',
                accessor: 'GameID',
            },
            {
                Header: 'Player ID',
                accessor: 'PlayerID',
            },
            {
                Header: 'Games Variant ID',
                accessor: 'GamesVariantId',
            },
            {
                Header: 'Level Played',
                accessor: 'LevelPlayed',
            },
            {
                Header: 'Points',
                accessor: 'Points',
            },
            {
                Header: 'Updated At',
                accessor: 'updatedAt',
            },
        ],
        []
    );

    return (
        <div className="container">
            <h1 className="header">Players' Scores</h1>
            <CustomTable columns={columns} data={data} />
        </div>
    );
};

export default Players;
