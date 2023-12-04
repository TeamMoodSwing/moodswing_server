import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const ormconfig = (): TypeOrmModuleOptions => {
  return {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/src/apis/**/*.entity.*'],
    synchronize: true,
    logging: true,
  };
};
