import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as expressBasicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
// import { HttpExceptionFilter } from './common/filter/http-exception.filter';
// import { RequestValidationPipe } from './common/filter/request.pipe';

class Application {
  private logger = new Logger(Application.name);
  private corsOriginList: string[];
  private PORT = process.env.PORT;

  constructor(private server: NestExpressApplication) {
    this.server = server;

    this.corsOriginList = process.env.CORS_LIST
      ? process.env.COR_LIST.split(',').map((origin) => origin.trim())
      : ['*'];
  }

  // swagger 보안
  // private setBasicAuth() {
  //   this.server.use(
  //     ['/docs'],
  //     expressBasicAuth({
  //       challenge: true,
  //       users: { [process.env.DOCS_ADMIN_NAME]: process.env.DOCS_ADMIN_PWD },
  //     }),
  //   );
  // }

  // openAPI를 미들웨어에 묶는다.
  private async setOpenAPIMiddleWare() {
    const config = new DocumentBuilder()
      .setTitle('MOOD_SWING - API')
      .setDescription('MOOD_SWING CRUD')
      .setVersion('1.0.0')
      // .addBearerAuth(
      //   {
      //     type: 'http',
      //     scheme: 'bearer',
      //     name: 'JWT',
      //     description: 'Jwt Token',
      //     in: 'header',
      //   },
      //   'access_token',
      // )
      .build();

    const document = SwaggerModule.createDocument(this.server, config);
    SwaggerModule.setup('docs', this.server, document, {
      swaggerOptions: { defaultModelsExpandDepth: -1 }, // schemes를 없애기 위함.
    });
  }

  // 전역 미들웨어
  private async setGlobalMiddleWare() {
    this.server.enableCors({
      origin: this.corsOriginList,
      credentials: true,
    });
    // this.setBasicAuth();
    this.setOpenAPIMiddleWare();
    this.server.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // type에 맞지 않는 param 들어올시 에러
        forbidNonWhitelisted: true, // type에 맞지 않는 param 들어올시 에러
        transform: true,
      }),
      // new RequestValidationPipe(),
    );
    this.server.useGlobalInterceptors(
      new ClassSerializerInterceptor(this.server.get(Reflector)),
    );
    // this.server.useGlobalFilters(new HttpExceptionFilter());
  }

  // 미들웨어 및 서버 개방
  async bootstrap() {
    await this.setGlobalMiddleWare();
    await this.server.listen(this.PORT);
    this.serverLog();
  }

  // 개발 서버 & 상용 서버 로그 분기
  serverLog() {
    if (process.env.DEV_MODE === 'dev') {
      this.logger.log(`✅ Server on http://localhost:${this.PORT}`);
    } else {
      this.logger.log(`✅ Server on ${this.PORT}`);
    }
  }
}

const init = async (): Promise<void> => {
  const server = await NestFactory.create<NestExpressApplication>(AppModule);
  const app = new Application(server);
  await app.bootstrap();
};

// init시 에러 로그 처리
init().catch((err) => {
  new Logger('init').error(err);
});
