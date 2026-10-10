import { createHmac } from 'node:crypto';
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='GET'||!/^[a-f0-9]{64}$/.test(req.query.code||'')) return res.status(400).send('Open Gas Receipts from your CTL workspace.');
 const secret=process.env.CTL_RECEIPTS_SSO_SECRET;
 if(!secret)return res.status(503).send('Workspace sign-in is unavailable.');
 const result=await fetch('https://chicago-testing-lab.vercel.app/employee/exchange',{method:'POST',headers:{'Content-Type':'application/json','x-ctl-app':'receipts',Authorization:`Bearer ${secret}`},body:JSON.stringify({code:req.query.code}),signal:AbortSignal.timeout(10000)});
 if(!result.ok)return res.status(401).send('This launch link expired. Open Gas Receipts again from your CTL workspace.');
 const {user}=await result.json();
 const payload=Buffer.from(JSON.stringify({id:user.user_id,name:user.full_name,email:user.email,expires:Date.now()+28800000})).toString('base64url');
 const sig=createHmac('sha256',secret).update(payload).digest('base64url');
 res.setHeader('Set-Cookie',`ctl_receipts=${payload}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`);
 res.redirect(303,'/');
}
