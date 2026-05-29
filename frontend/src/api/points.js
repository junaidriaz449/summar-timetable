import client from './client'

export const getAllPoints = () => client.get('/points').then(r => r.data)
export const getPoints = (kidId) => client.get(`/points/${kidId}`).then(r => r.data)
export const adjustPoints = (kidId, data) => client.post(`/points/${kidId}/adjust`, data).then(r => r.data)
export const resetWeeklyPoints = () => client.post('/points/reset-week').then(r => r.data)
