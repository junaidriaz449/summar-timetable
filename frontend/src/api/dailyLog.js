import client from './client'

export const getDailyLog = (kidId, date) =>
  client.get(`/daily-log/${kidId}`, { params: date ? { log_date: date } : {} }).then(r => r.data)
export const markComplete = (data) => client.post('/daily-log', data).then(r => r.data)
export const unmarkComplete = (logId) => client.delete(`/daily-log/${logId}`)
