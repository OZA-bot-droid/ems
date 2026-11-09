import { api } from '../../../api/axiosInstance.js';
import { unwrap } from '../../../api/apiError.js';
export const registrationApi = {
 apply:id=>api.post(`/events/${id}/registrations`).then(unwrap),
 mine:params=>api.get('/events/registrations/me',{params}).then(unwrap),
 adminList:params=>api.get('/events/registrations',{params}).then(unwrap),
 approve:id=>api.patch(`/events/registrations/${id}/approve`).then(unwrap),
 reject:(id,reason)=>api.patch(`/events/registrations/${id}/reject`,{reason}).then(unwrap),
 cancel:id=>api.patch(`/events/registrations/${id}/cancel`).then(unwrap),
 summary:id=>api.get(`/events/${id}/summary`).then(unwrap),
};
