import { useEffect, useState } from 'react';
import { publicApi } from '../api/axiosInstance';
export default function BootstrapPage() {
  const [checks, setChecks] = useState({});
  useEffect(() => {
    let live = true;
    Promise.all(['members', 'events', 'interactions'].map(async service => {
      try {
        const res = await publicApi.get(`/${service}/ping`);
        return [service, `HTTP ${res.status}`];
      } catch (error) {
        return [service, error.response ? `HTTP ${error.response.status}` : '연결 실패'];
      }
    })).then(rows => { if (live) setChecks(Object.fromEntries(rows)); });
    return () => { live = false; };
  }, []);
  return <main className="container"><h1>EMS Gateway 연결 점검</h1>
    {Object.entries(checks).map(([service, result]) => <p key={service}>{service}: {result}</p>)}
  </main>;
}
