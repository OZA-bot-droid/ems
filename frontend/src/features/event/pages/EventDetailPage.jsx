import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
export default function EventDetailPage() {const {eventId}=useParams();const [data,setData]=useState(null);const [error,setError]=useState('');useEffect(()=>{eventApi.detail(eventId).then(setData).catch(e=>setError(e.message));},[eventId]);return <section className="panel"><h1>행사 상세 #{eventId}</h1>{error&&<p role="alert">{error}</p>}{data&&<pre>{JSON.stringify(data,null,2)}</pre>}</section>;}
