import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApiUtil } from '../util/apiUtil';
import { useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
  const { logout, refreshAccessToken, authLoading, accessToken } = useAuth();
  const apiReq = useApiUtil();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = () => {
      const isLogin = localStorage.getItem('isLoginSession');
      if (!isLogin) {
        navigate('/');
      }
    };
    checkLogin();
  }, []);

  const myInfo = async () => {
    navigate('/');
    // if (authLoading) {
    //   return;
    // }

    // try {
    //   const res = await apiReq('/members/me', {
    //     method: 'GET',
    //   });

    //   if (res.ok) {
    //     const data = await res.json();
    //     console.log(data);
    //   } else {
    //     console.log('에러 발생');
    //     console.log(res);
    //   }
    // } catch (err) {
    //   console.log(err);
    // }
  };

  // const userString = async () => {
  //   try {
  //     const res = await apiReq('/members/test/user', { method: 'GET' });
  //     if (res.ok) {
  //       const data = await res.text();
  //       console.log(data);
  //     } else {
  //       const data = await res.json();
  //       console.log(data);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  // const adminString = async () => {
  //   try {
  //     const res = await apiReq('/members/test/admin', { method: 'GET' });
  //     if (res.ok) {
  //       const data = await res.text();
  //       console.log(data);
  //     } else {
  //       const data = await res.json();
  //       console.log(data);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  // const allString = async () => {
  //   try {
  //     const res = await apiReq('/members/test/all', { method: 'GET' });
  //     if (res.ok) {
  //       const data = await res.text();
  //       console.log(data);
  //     } else {
  //       const data = await res.json();
  //       console.log(data);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  return (
    <div>
      <button className="bg-blue-500" onClick={myInfo}>
        내 정보
      </button>
      <button className="bg-red-500" onClick={logout}>
        로그아웃
      </button>
      <button className="bg-green-500" onClick={refreshAccessToken}>
        재발급
      </button>
    </div>
  );
};

export default LoginSuccess;
