import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient, PostStatus } from '@prisma/client';
import { z } from 'zod';
export const createPost = z.object({title:z.string().trim().min(1).max(180),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),excerpt:z.string().max(500).default(''),content:z.string().max(50000).default(''),status:z.enum(['DRAFT','PUBLISHED']).default('DRAFT')});
export const updatePost=createPost.partial();
@Injectable() export class PostsService {
 constructor(private db:PrismaClient) {}
 async list(publicOnly:boolean){return this.db.post.findMany({where:publicOnly?{status:PostStatus.PUBLISHED}:{},include:{images:{orderBy:{position:'asc'}}},orderBy:{createdAt:'desc'}})}
 async find(slug:string,publicOnly:boolean){const post=await this.db.post.findUnique({where:{slug},include:{images:{orderBy:{position:'asc'}}}});if(!post||(publicOnly&&post.status!=='PUBLISHED'))throw new NotFoundException();return post}
 async create(input:z.infer<typeof createPost>){try{return await this.db.post.create({data:{...input,publishedAt:input.status==='PUBLISHED'?new Date():null},include:{images:true}})}catch(e:any){if(e.code==='P2002')throw new ConflictException('Slug already exists');throw e}}
 async update(id:string,input:z.infer<typeof updatePost>){const current=await this.db.post.findUnique({where:{id}});if(!current)throw new NotFoundException();try{return await this.db.post.update({where:{id},data:{...input,publishedAt:input.status==='PUBLISHED'&&!current.publishedAt?new Date():input.status==='DRAFT'?null:undefined},include:{images:{orderBy:{position:'asc'}}}})}catch(e:any){if(e.code==='P2002')throw new ConflictException('Slug already exists');throw e}}
 async remove(id:string){try{await this.db.post.delete({where:{id}});return {deleted:true}}catch(e:any){if(e.code==='P2025')throw new NotFoundException();throw e}}
}
