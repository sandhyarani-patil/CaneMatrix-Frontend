import api from './api'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const AuthAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  farmerLogin: (farmerCode, password) => api.post('/auth/farmer-login', { farmerCode, password }),
  register: (payload) => api.post('/auth/register', payload),
}

// ---------------------------------------------------------------------------
// Farmers (+ nested bank / farm / nominee details)
// ---------------------------------------------------------------------------
export const FarmerAPI = {
  list: () => api.get('/farmers'),
  get: (id) => api.get(`/farmers/${id}`),
  create: (payload) => api.post('/farmers', payload),
  update: (id, payload) => api.put(`/farmers/${id}`, payload),
  remove: (id) => api.delete(`/farmers/${id}`),

  addBank: (farmerId, payload) => api.post(`/farmers/${farmerId}/bank`, payload),
  getBank: (farmerId) => api.get(`/farmers/${farmerId}/bank`),
  updateBank: (bankId, payload) => api.put(`/farmers/bank/${bankId}`, payload),

  addFarm: (farmerId, payload) => api.post(`/farmers/${farmerId}/farms`, payload),
  getFarms: (farmerId) => api.get(`/farmers/${farmerId}/farms`),
  updateFarm: (farmId, payload) => api.put(`/farmers/farms/${farmId}`, payload),
  removeFarm: (farmId) => api.delete(`/farmers/farms/${farmId}`),

  addNominee: (farmerId, payload) => api.post(`/farmers/${farmerId}/nominee`, payload),
  getNominee: (farmerId) => api.get(`/farmers/${farmerId}/nominee`),
}

// ---------------------------------------------------------------------------
// Sugarcane Supply
// ---------------------------------------------------------------------------
export const SupplyAPI = {
  add: (payload) => api.post('/sugarcane-supply/add', payload),
  all: () => api.get('/sugarcane-supply/all'),
  summary: (farmerCode) => api.get(`/sugarcane-supply/summary/${farmerCode}`),
  filterByDate: (startDate, endDate) => api.get('/sugarcane-supply/filter', { params: { startDate, endDate } }),
  vehicleSummary: (tractorNumber, startDate, endDate) =>
    api.get('/sugarcane-supply/vehicle-summary', { params: { tractorNumber, startDate, endDate } }),
  factorySummary: (startDate, endDate) =>
    api.get('/sugarcane-supply/factory-summary', { params: { startDate, endDate } }),
}

// ---------------------------------------------------------------------------
// Share Allocation
// ---------------------------------------------------------------------------
export const ShareAllocationAPI = {
  list: () => api.get('/share-allocations'),
  get: (id) => api.get(`/share-allocations/${id}`),
  byFarmerCode: (farmerCode) => api.get(`/share-allocations/farmer/${farmerCode}`),
  create: (payload) => api.post('/share-allocations', payload),
  update: (id, payload) => api.put(`/share-allocations/${id}`, payload),
  remove: (id) => api.delete(`/share-allocations/${id}`),
}

// ---------------------------------------------------------------------------
// Share Sugar Allocation (monthly / yearly + festival share sugar)
// ---------------------------------------------------------------------------
export const ShareSugarAPI = {
  list: () => api.get('/share-sugar-allocation'),
  create: (payload) => api.post('/share-sugar-allocation', payload),
  byFarmerCode: (farmerCode) => api.get(`/share-sugar-allocation/farmer/${farmerCode}`),
  lift: (farmerCode, quantity) => api.put('/share-sugar-allocation/lift', null, { params: { farmerCode, quantity } }),
  history: (farmerCode) => api.get(`/share-sugar-allocation/history/${farmerCode}`),
  remove: (id) => api.delete(`/share-sugar-allocation/${id}`),
}

// ---------------------------------------------------------------------------
// Share Transfer
// ---------------------------------------------------------------------------
export const ShareTransferAPI = {
  create: (farmerCode, transferReason, document) => {
    const form = new FormData()
    form.append('farmerCode', farmerCode)
    form.append('transferReason', transferReason)
    if (document) form.append('document', document)
    return api.post('/share-transfer/create', form)
  },
  updateStatus: (id, status) => api.put(`/share-transfer/status/${id}`, null, { params: { status } }),
  all: () => api.get('/share-transfer/all'),
  byFarmer: (farmerCode) => api.get(`/share-transfer/farmer/${farmerCode}`),
}

// ---------------------------------------------------------------------------
// Sugar Factory Rate
// ---------------------------------------------------------------------------
export const FactoryRateAPI = {
  saveOrUpdate: (payload) => api.post('/factory-rates', payload),
  latest: () => api.get('/factory-rates/latest'),
  all: () => api.get('/factory-rates'),
}

// ---------------------------------------------------------------------------
// Tonnes Sugar Allocation
// ---------------------------------------------------------------------------
export const TonnesSugarAPI = {
  create: (farmerCode, totalTonnes) => api.post('/tonnes-sugar/create', null, { params: { farmerCode, totalTonnes } }),
  all: () => api.get('/tonnes-sugar/all'),
  history: (farmerCode) => api.get('/tonnes-sugar/history', { params: { farmerCode } }),
}

// ---------------------------------------------------------------------------
// Festival Sugar Master
// ---------------------------------------------------------------------------
export const FestivalSugarAPI = {
  list: () => api.get('/festival-sugar'),
  get: (id) => api.get(`/festival-sugar/${id}`),
  create: (payload) => api.post('/festival-sugar', payload),
  update: (id, payload) => api.put(`/festival-sugar/${id}`, payload),
  remove: (id) => api.delete(`/festival-sugar/${id}`),
}
