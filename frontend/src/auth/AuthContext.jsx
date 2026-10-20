import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {memberApi,onUnauthorized} from '../lib/api';
const Context=createContext(null);
const KEY='ems_auth';
// Mock authentication is never enabled in a production Vite build.
export const MOCK_AUTH_ENABLED=import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_AUTH!=='false';
const MOCK_ACCOUNTS={
 admin:{password:'admin1234',role:'ADMIN',name:'Mock 관리자'},
 user:{password:'user1234',role:'USER',name:'Mock 일반회원'}
};
function restore(){
 try {
  const data=JSON.parse(sessionStorage.getItem(KEY)||'null');
  if(data?.mock) return MOCK_AUTH_ENABLED && data.role && data.user?data:null;
  return data?.token?data:null;
 }catch{return null;}
}
export function AuthProvider({children}){
 const [session,setSession]=useState(restore);
 const logout=useCallback(()=>{sessionStorage.removeItem(KEY);setSession(null);},[]);
 useEffect(()=>onUnauthorized(logout),[logout]);
 const login=async(credentials)=>{
   const id=String(credentials.email||'').trim().toLowerCase();
   const mock=MOCK_AUTH_ENABLED?MOCK_ACCOUNTS[id]:null;
   if(mock){
     if(credentials.password!==mock.password) throw new Error('Mock 계정 비밀번호가 올바르지 않습니다.');
     const info={mock:true,token:null,user:{id,name:mock.name,role:mock.role},role:mock.role};
     sessionStorage.setItem(KEY,JSON.stringify(info));setSession(info);return info;
   }
   const result=await memberApi.login(credentials);
   const token=result?.accessToken||result?.access_token||result?.token;
   if(!token)throw new Error('로그인 응답에 accessToken이 없습니다. DTO 계약을 확인하세요.');
   const me=await memberApi.me(token);
   const roles=Array.isArray(me?.roles)?me.roles:[me?.role].filter(Boolean);
   const info={token,user:me,role:roles.some(r=>r==='ADMIN'||r==='ROLE_ADMIN')?'ADMIN':'USER',mock:false};
   sessionStorage.setItem(KEY,JSON.stringify(info));setSession(info);return info;
 };
 return <Context.Provider value={{session,token:session?.token,role:session?.role,user:session?.user,login,logout,isMock:!!session?.mock}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
