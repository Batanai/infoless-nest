import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '@/auth/dto';
import { EditUserDto } from '@/user/dto';
import { CreateBookmarkDto } from '@/bookmark/dto/create-bookmark.dto';
import { EditBookmarkDto } from '@/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService
  const baseUrl = 'http://localhost:3333';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ 
        whitelist: true
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl(baseUrl);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@example.com',
      password: '123',
    };

    it('should throw if email is empty', () => {
      return pactum.spec()
        .post(`/auth/signup`)
        .withBody({
          password: dto.password,
        })
        .expectStatus(400)
    });

    it('should throw if password is empty', () => {
      return pactum.spec()
        .post(`/auth/signup`)
        .withBody({
          email: dto.email,
        })
        .expectStatus(400)
    });

    it('should throw if no body', () => {
      return pactum.spec()
        .post(`/auth/signup`)
        .withBody({})
        .expectStatus(400)
    });

    it('should register a new user', () => {
      return pactum.spec()
        .post(`/auth/signup`)
        .withBody(dto)
        .expectStatus(201)
    });

    it('should login an existing user', () => {
      return pactum.spec()
        .post(`/auth/signin`)
        .withBody(dto)
        .expectStatus(200)
        .stores('userToken', 'access_token');
    });
  });

  describe('Users', () => {
    it('should get current user', async () => {
      return pactum.spec()
        .get(`/users/me`)
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .expectStatus(200);
    });

    it('should edit user', async () => {
      const dto: EditUserDto = {
        firstName: 'Batie',
        email: 'batie@example.com',
      };
      return pactum.spec()
        .patch(`/users`)
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.firstName)
        .expectBodyContains(dto.email);
    });

  });

  describe('Bookmarks', () => {
    it('get empty bookmark', async () => {
      return pactum.spec()
        .get(`/bookmarks`)
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .expectStatus(200)
        .expectBody([]);
    });

    it('should create a new bookmark', async () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://example.com',
      };
      return pactum.spec()
        .post(`/bookmarks`)
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .withBody(dto)
        .expectStatus(201)
        .stores('bookmarkId', 'id');
    });

    it('should get all bookmarks', async () => {
      return pactum.spec()
        .get(`/bookmarks`)
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .expectStatus(200)
        .expectJsonLength(1);
    });

    it('should get a single bookmark by Id', async () => {
      return pactum.spec()
        .get(`/bookmarks/{id}`)
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .expectStatus(200)
        .expectBodyContains('$S{bookmarkId}');
    });

    it('should update a bookmark', async () => {
      const dto: EditBookmarkDto = {
        title: 'Updated Bookmark',
        description: 'Updated description',
      };
      return pactum.spec()
        .patch(`/bookmarks/{id}`)
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .withBody(dto)
        .expectStatus(200);
    });

    it('should delete a bookmark', async () => {
      return pactum.spec()
        .delete(`/bookmarks/{id}`)
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userToken}'
        })
        .expectStatus(204);
    });
  });

});