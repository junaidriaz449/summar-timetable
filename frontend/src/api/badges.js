import client from './client'

export const getBadges = (kidId) => client.get(`/badges/${kidId}`).then(r => r.data)
export const evaluateBadges = (kidId) => client.post(`/badges/evaluate/${kidId}`).then(r => r.data)
