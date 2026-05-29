import client from './client'

export const getSettings = () => client.get('/settings').then(r => r.data)
export const updateSetting = (data) => client.put('/settings', data).then(r => r.data)
export const verifyPin = (pin) => client.post('/settings/verify-pin', { pin }).then(r => r.data)
