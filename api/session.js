import {createHmac,timingSafeEqual} from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ctl_receipts='))?.slice(13);
 try{
  const [payload,sig]=token.split('.');
  const actual=Buffer.from(sig,'base64url');const expected=createHmac('sha256',process.env.CTL_RECEIPTS_SSO_SECRET).update(payload).digest();
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error();
  const user=JSON.parse(Buffer.from(payload,'base64url').toString());if(user.expires<Date.now())throw Error();
  const check=await fetch('https://chicago-testing-lab.vercel.app/employee/exchange',{method:'POST',headers:{'Content-Type':'application/json','x-ctl-app':'receipts',Authorization:`Bearer ${process.env.CTL_RECEIPTS_SSO_SECRET}`},body:JSON.stringify({userId:user.id}),signal:AbortSignal.timeout(10000)});
  if(!check.ok)throw Error();
  const current=await check.json();
  return res.json({user:{...user,name:current.user.full_name,email:current.user.email}});
 }catch{return res.json({user:null});}
}
