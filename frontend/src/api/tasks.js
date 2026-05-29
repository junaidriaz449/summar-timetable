import client from './client'

export const getTasks = (age_group) =>
  client.get('/tasks', { params: age_group ? { age_group } : {} }).then(r => r.data)
export const createTask = (data) => client.post('/tasks', data).then(r => r.data)
export const updateTask = (id, data) => client.put(`/tasks/${id}`, data).then(r => r.data)
export const deleteTask = (id) => client.delete(`/tasks/${id}`)
