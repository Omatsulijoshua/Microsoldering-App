import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { KbService } from './kb.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('knowledge-base')
export class KbController {
  constructor(private kbService: KbService) {}

  @Get()
  findAll() {
    return this.kbService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kbService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() body: any) {
    return this.kbService.create(body);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.kbService.update(id, body);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.kbService.delete(id);
  }
}
