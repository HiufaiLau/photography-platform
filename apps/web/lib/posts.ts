export type ImageItem={id:string;postId:string|null;alt:string;caption:string;position:number;mime:string};
export type Post={id:string;title:string;slug:string;excerpt:string;content:string;status:'DRAFT'|'PUBLISHED';createdAt:string;updatedAt:string;images:ImageItem[]};
export const gateway=process.env.GATEWAY_URL||'http://localhost:3001';
export async function publishedPosts():Promise<Post[]>{try{const r=await fetch(`${gateway}/posts`,{cache:'no-store'});return r.ok?await r.json():[]}catch{return []}}
