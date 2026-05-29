import client from './client'

export const getWeeklyDashboard = () => client.get('/dashboard/weekly').then(r => r.data)
