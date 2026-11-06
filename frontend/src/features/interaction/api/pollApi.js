import { api } from '../../../api/axiosInstance.js';
import { unwrap } from '../../../api/apiError.js';
export const pollApi = {
 get:id=>api.get(`/interactions/polls/${id}`).then(unwrap),
 create:body=>api.post('/interactions/polls',body).then(unwrap),
 mine:params=>api.get('/interactions/polls/mycreated',{params}).then(unwrap),
 active:()=>api.get('/interactions/polls/getpolls').then(unwrap),
 activeVotes:ids=>ids.length?api.get('/interactions/polls/getactivevotes',{params:{pollIds:ids},paramsSerializer:p=>p.pollIds.map(id=>'pollIds='+encodeURIComponent(id)).join('&')}).then(unwrap):Promise.resolve([]),
 vote:(id,body)=>api.post(`/interactions/polls/${id}/votes`,body).then(unwrap),
 results:id=>api.get(`/interactions/polls/${id}/results`).then(unwrap),
 activate:id=>api.patch(`/interactions/polls/${id}/activate`).then(unwrap),
 close:id=>api.patch(`/interactions/polls/${id}/close`).then(unwrap),
 statusSubscriptions:()=>api.get('/interactions/polls/status-subscriptions').then(unwrap),
};
