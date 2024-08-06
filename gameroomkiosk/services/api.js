import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/player/';

export const fetchPlayerbyId = async (id) => {
    const res = await axios.get(`${API_BASE_URL}${id}`)
    return res.data;
}

export const fetchPlayersByEmail = async (email) => {
    const res = await axios.get(`${API_BASE_URL}findAll/?email=${email}`);
    return res.data;
}

export const createPlayer = async (pls) => {
    const res = await axios.post(`${API_BASE_URL}create`, pls);
    return res.data;
}

export const updatePlayer = async (id, pls) => {
    try {
        const res = await axios.put(`${API_BASE_URL}${id}`, pls);
        return res.data;
    } catch (err) {
        console.log(err);
    }
} 




