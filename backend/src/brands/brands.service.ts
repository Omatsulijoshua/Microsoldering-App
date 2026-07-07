import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class BrandsService {
  constructor(private dbService: DbService) {}

  // Brands CRUD
  findAllBrands() {
    return this.dbService.brands;
  }

  findBrandById(id: string) {
    const brand = this.dbService.brands.find(b => b.id === id);
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    return brand;
  }

  createBrand(name: string, description?: string, logo?: string) {
    const newBrand = {
      id: `b-${Date.now()}`,
      name,
      description: description || '',
      logo: logo || ''
    };
    this.dbService.brands.push(newBrand);
    return newBrand;
  }

  updateBrand(id: string, updateData: any) {
    const brand = this.findBrandById(id);
    if (updateData.name) brand.name = updateData.name;
    if (updateData.description) brand.description = updateData.description;
    if (updateData.logo) brand.logo = updateData.logo;
    return brand;
  }

  deleteBrand(id: string) {
    const idx = this.dbService.brands.findIndex(b => b.id === id);
    if (idx === -1) throw new NotFoundException(`Brand ${id} not found`);
    const removed = this.dbService.brands[idx];
    this.dbService.brands.splice(idx, 1);
    
    // Cascading delete
    this.dbService.categories = this.dbService.categories.filter(c => c.brandId !== id);
    this.dbService.models = this.dbService.models.filter(m => m.brandId !== id);
    return removed;
  }

  // Categories CRUD
  findCategoriesByBrand(brandId: string) {
    return this.dbService.categories.filter(c => c.brandId === brandId);
  }

  createCategory(brandId: string, name: string, description?: string) {
    // Validate brand exists
    this.findBrandById(brandId);
    const newCat = {
      id: `c-${Date.now()}`,
      brandId,
      name,
      description: description || ''
    };
    this.dbService.categories.push(newCat);
    return newCat;
  }

  // Models CRUD
  findModelsByCategory(categoryId: string) {
    return this.dbService.models.filter(m => m.categoryId === categoryId);
  }

  findModelById(id: string) {
    const model = this.dbService.models.find(m => m.id === id);
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    return model;
  }

  createModel(brandId: string, categoryId: string, name: string, modelNumber?: string, year?: number, notes?: string) {
    const newModel = {
      id: `m-${Date.now()}`,
      brandId,
      categoryId,
      name,
      modelNumber: modelNumber || '',
      year: year || new Date().getFullYear(),
      notes: notes || ''
    };
    this.dbService.models.push(newModel);
    return newModel;
  }
}
