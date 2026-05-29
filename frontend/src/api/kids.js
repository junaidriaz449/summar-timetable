import client from './client'

export const getKids = () => client.get('/kids').then(r => r.data)
export const getKid = (id) => client.get(`/kids/${id}`).then(r => r.data)
export const updateKid = (id, data) => client.put(`/kids/${id}`, data).then(r => r.data)
