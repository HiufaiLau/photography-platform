import { Controller, Get, Post, Patch, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { PostsService, createPost, updatePost } from './posts.service';
import { ZodError } from 'zod';
const parse=(schema:any,value:any)=>{try{return schema.parse(value)}catch(e){if(e instanceof ZodError)throw new BadRequestException(e.flatten());throw e}};
@Controller('posts') export class PostsController {
 constructor(private posts:PostsService){}
 @Get() list(@Query('public') p?:string){return this.posts.list(p==='true')}
 @Get(':slug') get(@Param('slug') slug:string,@Query('public') p?:string){return this.posts.find(slug,p==='true')}
 @Post() create(@Body() body:unknown){return this.posts.create(parse(createPost,body))}
 @Patch(':id') update(@Param('id') id:string,@Body() body:unknown){return this.posts.update(id,parse(updatePost,body))}
 @Delete(':id') remove(@Param('id') id:string){return this.posts.remove(id)}
}
