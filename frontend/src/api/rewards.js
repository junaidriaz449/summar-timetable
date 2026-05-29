import client from './client'

export const getRewards = () => client.get('/rewards').then(r => r.data)
export const createReward = (data) => client.post('/rewards', data).then(r => r.data)
export const updateReward = (id, data) => client.put(`/rewards/${id}`, data).then(r => r.data)
export const deleteReward = (id) => client.delete(`/rewards/${id}`)

export const getRedemptions = (status) =>
  client.get('/redemptions', { params: status ? { status } : {} }).then(r => r.data)
export const createRedemption = (data) => client.post('/redemptions', data).then(r => r.data)
export const updateRedemption = (id, data) => client.put(`/redemptions/${id}`, data).then(r => r.data)
