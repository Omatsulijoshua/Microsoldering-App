import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class KbService {
  constructor(private dbService: DbService) {}

  findAll() {
    return this.dbService.kbArticles;
  }

  findOne(id: string) {
    const article = this.dbService.kbArticles.find(a => a.id === id);
    if (!article) throw new NotFoundException(`Knowledge base article ${id} not found`);
    return article;
  }

  create(articleData: any) {
    const newArticle = {
      id: `kb-${Date.now()}`,
      title: articleData.title,
      content: articleData.content,
      brandId: articleData.brandId || '',
      categoryId: articleData.categoryId || '',
      modelId: articleData.modelId || '',
      difficulty: articleData.difficulty || 'MEDIUM',
      visibility: articleData.visibility || 'PUBLIC',
      createdBy: articleData.createdBy || 'u-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dbService.kbArticles.push(newArticle);
    return newArticle;
  }

  update(id: string, updateData: any) {
    const article = this.findOne(id);
    
    if (updateData.title) article.title = updateData.title;
    if (updateData.content) article.content = updateData.content;
    if (updateData.difficulty) article.difficulty = updateData.difficulty;
    if (updateData.visibility) article.visibility = updateData.visibility;
    
    article.updatedAt = new Date().toISOString();
    return article;
  }

  delete(id: string) {
    const idx = this.dbService.kbArticles.findIndex(a => a.id === id);
    if (idx === -1) throw new NotFoundException(`Knowledge base article ${id} not found`);
    const removed = this.dbService.kbArticles[idx];
    this.dbService.kbArticles.splice(idx, 1);
    return removed;
  }
}
