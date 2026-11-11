import { BadRequestException, Controller, Delete, Get, Injectable, NotFoundException, Param, Patch, Post, Body, Res } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Response } from 'express';
const root=process.env.MEDIA_DIR||'/data/media';
const types:Record<string,string>={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/avif':'.avif'};
const create=z.object({data:z.string().max(10000000),mime:z.string(),postId:z.string().optional(),alt:z.string().max(300).default(''),caption:z.string().max(500).default('')});
const change=z.object({postId:z.string().nullable().optional(),alt:z.string().max(300).optional(),caption:z.string().max(500).optional(),position:z.number().int().min(0).optional()});
@Injectable() export class MediaService{constructor(private db:PrismaClient){}
 async list(){return this.db.image.findMany({orderBy:{createdAt:'desc'}})}
 async upload(raw:unknown){const x=create.parse(raw);if(!types[x.mime])throw new BadRequestException('Unsupported image type');let bytes:Buffer;try{bytes=Buffer.from(x.data,'base64')}catch{throw new BadRequestException('Bad base64')};if(bytes.length<12||bytes.length>5*1024*1024)throw new BadRequestException('Image must be 12 bytes to 5MB');const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';const avif=bytes.toString('ascii',4,12).includes('ftypavif');if(!({'image/jpeg':jpeg,'image/png':png,'image/webp':webp,'image/avif':avif}[x.mime]))throw new BadRequestException('File signature does not match format');
 const id=randomUUID();const filename=id+types[x.mime];await mkdir(root,{recursive:true});await writeFile(join(root,filename),bytes,{flag:'wx'});try{return await this.db.image.create({data:{id,filename,mime:x.mime,postId:x.postId||null,alt:x.alt,caption:x.caption,position:0}})}catch(e){await unlink(join(root,filename)).catch(()=>{});throw e}}
 async update(id:string,x:unknown){const input=change.parse(x);return this.db.image.update({where:{id},data:input})}
 async remove(id:string){const item=await this.db.image.findUnique({where:{id}});if(!item)throw new NotFoundException();await this.db.image.delete({where:{id}});await unlink(join(root,item.filename)).catch(()=>{});return {deleted:true}}
 async get(id:string,publicOnly:boolean){const item=await this.db.image.findUnique({where:{id},include:{post:true}});if(!item||publicOnly&&item.post?.status!=='PUBLISHED')throw new NotFoundException();let bytes:Buffer;try{bytes=await readFile(join(root,item.filename))}catch{throw new NotFoundException()};return {item,bytes}}
}
@Controller('media')export class MediaController{constructor(private svc:MediaService){}
 @Get()list(){return this.svc.list()}
 @Post()async upload(@Body()body:unknown){try{return await this.svc.upload(body)}catch(e){if(e instanceof z.ZodError)throw new BadRequestException(e.flatten());throw e}}
 @Patch(':id')async update(@Param('id')id:string,@Body()body:unknown){try{return await this.svc.update(id,body)}catch(e){if(e instanceof z.ZodError)throw new BadRequestException(e.flatten());throw e}}
 @Delete(':id')remove(@Param('id')id:string){return this.svc.remove(id)}
 @Get(':id/private-file')async privateFile(@Param('id')id:string,@Res()res:Response){const {item,bytes}=await this.svc.get(id,false);res.setHeader('Content-Type',item.mime);res.setHeader('Cache-Control','private, no-store');res.send(bytes)}
 @Get(':id/file')async file(@Param('id')id:string,@Res()res:Response){const {item,bytes}=await this.svc.get(id,true);res.setHeader('Content-Type',item.mime);res.setHeader('Cache-Control','public, max-age=600');res.send(bytes)}
}
