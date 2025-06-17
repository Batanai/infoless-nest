import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { VisaModule } from './visa/visa.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule, 
    PrismaModule, 
    VisaModule, 
    BookmarkModule, 
    AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
