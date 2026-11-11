import { Controller, Get, Post, Patch, Delete, Query, Param, Body, HttpException, Headers, UnauthorizedException, Res } from '@nestjs/common';
import { Response } from 'express';import { timingSafeEqual } from 'node:crypto';
@Controller()export class GatewayController {
 private base=process.env.CONTENT_SERVICE_URL||'http://localhost:3002';
 private auth(value?:string){const key=process.env.INTERNAL_API_KEY;if(!key||!value||Buffer.byteLength(key)!==Buffer.byteLength(value)||!timingSafeEqual(Buffer.from(key),Buffer.from(value)))throw new UnauthorizedException()}
 private async forward(method:string,path:string,body?:unknown){let r:globalThis.Response;try{r=await fetch(`${this.base}${path}`,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)})}catch{throw new HttpException('Service unavailable',503)}const data=await r.json().catch(()=>({message:'Upstream error'}));if(!r.ok)throw new HttpException(data,r.status);return data}
 @Get('health')health(){return {status:'ok'}}
 @Get('posts')list(@Headers('x-internal-key')key?:string){if(key)this.auth(key);return this.forward('GET',`/posts?public=${key?'false':'true'}`)}
 @Get('posts/:slug')get(@Param('slug')slug:string,@Headers('x-internal-key')key?:string){if(key)this.auth(key);return this.forward('GET',`/posts/${encodeURIComponent(slug)}?public=${key?'false':'true'}`)}
 @Post('posts')create(@Body()b:unknown,@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('POST','/posts',b)}
 @Patch('posts/:id')update(@Param('id')id:string,@Body()b:unknown,@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('PATCH',`/posts/${encodeURIComponent(id)}`,b)}
 @Delete('posts/:id')remove(@Param('id')id:string,@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('DELETE',`/posts/${encodeURIComponent(id)}`)}
 @Get('media')media(@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('GET','/media')}
 @Post('media')upload(@Body()b:unknown,@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('POST','/media',b)}
 @Patch('media/:id')editMedia(@Param('id')id:string,@Body()b:unknown,@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('PATCH',`/media/${encodeURIComponent(id)}`,b)}
 @Delete('media/:id')deleteMedia(@Param('id')id:string,@Headers('x-internal-key')k?:string){this.auth(k);return this.forward('DELETE',`/media/${encodeURIComponent(id)}`)}
 @Get('media/:id/private-file')async privateFile(@Param('id')id:string,@Headers('x-internal-key')k:string,@Res()res:Response){this.auth(k);const r=await fetch(`${this.base}/media/${encodeURIComponent(id)}/private-file`);if(!r.ok)throw new HttpException('Image unavailable',r.status);res.setHeader('Content-Type',r.headers.get('content-type')||'application/octet-stream');res.setHeader('Cache-Control','private, no-store');res.send(Buffer.from(await r.arrayBuffer()))}
 @Get('media/:id/file')async file(@Param('id')id:string,@Res()res:Response){const r=await fetch(`${this.base}/media/${encodeURIComponent(id)}/file`);if(!r.ok)throw new HttpException('Image unavailable',r.status);res.setHeader('Content-Type',r.headers.get('content-type')||'application/octet-stream');res.setHeader('Cache-Control','public, max-age=600');res.send(Buffer.from(await r.arrayBuffer()))}
}
