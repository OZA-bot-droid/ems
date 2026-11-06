import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
export default function EventListPage() {
  const [data,setData]=useState(null);const [error,setError]=useState('');
  useEffect(()=>{eventApi.list({page:0,size:10}).then(setData).catch(e=>setError(e.message));},[]);
  const items = Array.isArray(data) ? data : data?.content || data?.items || [];
  return <section className="panel"><h1>행사 목록</h1><p>기본 API 연결 화면입니다. 실제 Event UI로 교체하세요.</p>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>불러오는 중...</p>}<ul>{items.map(item=><li key={item.id}><Link to={`/events/${item.id}`}>{item.title || item.name || item.id}</Link></li>)}</ul></section>;
}
