import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export const checkHealth = async() => {
    const response = await axios.get(`${API_BASE}/health`);
    return response.data;
};

export const predictXray = async(file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE}/predict`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};