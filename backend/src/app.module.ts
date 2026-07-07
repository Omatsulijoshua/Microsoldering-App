import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BrandsModule } from './brands/brands.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { RepairCasesModule } from './cases/cases.module';
import { KnowledgeBaseModule } from './kb/kb.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    BrandsModule,
    DiagnosisModule,
    RepairCasesModule,
    KnowledgeBaseModule,
    AdminModule,
  ],
})
export class AppModule {}
