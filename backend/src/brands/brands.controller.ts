import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  // Brands
  @Get('brands')
  findAllBrands() {
    return this.brandsService.findAllBrands();
  }

  @Get('brands/:id')
  findBrandById(@Param('id') id: string) {
    return this.brandsService.findBrandById(id);
  }

  @UseGuards(AuthGuard)
  @Post('brands')
  createBrand(@Body() body: any) {
    return this.brandsService.createBrand(body.name, body.description, body.logo);
  }

  @UseGuards(AuthGuard)
  @Patch('brands/:id')
  updateBrand(@Param('id') id: string, @Body() body: any) {
    return this.brandsService.updateBrand(id, body);
  }

  @UseGuards(AuthGuard)
  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.brandsService.deleteBrand(id);
  }

  // Categories
  @Get('brands/:brandId/categories')
  findCategoriesByBrand(@Param('brandId') brandId: string) {
    return this.brandsService.findCategoriesByBrand(brandId);
  }

  @UseGuards(AuthGuard)
  @Post('device-categories')
  createCategory(@Body() body: any) {
    return this.brandsService.createCategory(body.brandId, body.name, body.description);
  }

  // Models
  @Get('device-categories/:categoryId/models')
  findModelsByCategory(@Param('categoryId') categoryId: string) {
    return this.brandsService.findModelsByCategory(categoryId);
  }

  @Get('device-models/:id')
  findModelById(@Param('id') id: string) {
    return this.brandsService.findModelById(id);
  }

  @UseGuards(AuthGuard)
  @Post('device-models')
  createModel(@Body() body: any) {
    return this.brandsService.createModel(
      body.brandId,
      body.categoryId,
      body.name,
      body.modelNumber,
      body.year,
      body.notes
    );
  }
}
