import {cookies} from 'next/headers';import {createHmac,timingSafeEqual} from 'node:crypto';
const SESSION_NAME='photo_admin';
function sign(payload:string){return createHmac('sha256',process.env.SESSION_SECRET||'').update(payload).digest('hex')}
export async function authenticated(){const raw=(await cookies()).get(SESSION_NAME)?.value;if(!raw||!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)return false;const [expiry,signature]=raw.split('.');if(!expiry||!signature||!/^\d+$/.test(expiry)||Number(expiry)<Date.now())return false;const expected=sign(expiry);return expected.length===signature.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(signature))}
export async function setSession(){const expiry=String(Date.now()+7*24*3600*1000);(await cookies()).set(SESSION_NAME,`${expiry}.${sign(expiry)}`,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*24*3600})}
export async function clearSession(){(await cookies()).delete(SESSION_NAME)}
export function safeOrigin(req:Request){const origin=req.headers.get('origin');const url=new URL(req.url);return !origin||origin===url.origin||origin===process.env.NEXT_PUBLIC_SITE_URL}
export function apiHeaders(){return {'content-type':'application/json','x-internal-key':process.env.INTERNAL_API_KEY||''}}
