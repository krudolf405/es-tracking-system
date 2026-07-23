declare module '@nestjs/swagger' {
  import { INestApplication } from '@nestjs/common';



  export interface OpenAPIObject {
    openapi: string;
    info: Record<string, unknown>;
    paths: Record<string, unknown>;
    [key: string]: unknown;
  }

  export class DocumentBuilder {
    setTitle(title: string): this;
    setDescription(description: string): this;
    setVersion(version: string): this;
    build(): Omit<OpenAPIObject, 'openapi'>;
  }

  export const SwaggerModule: {
    createDocument(app: INestApplication, config: ReturnType<DocumentBuilder['build']>): OpenAPIObject;
    setup(path: string, app: INestApplication, document: OpenAPIObject): void;
  };

  export function ApiTags(...tags: string[]): MethodDecorator & ClassDecorator;
  export function ApiOperation(options: { summary?: string; description?: string }): MethodDecorator;
  export function ApiBearerAuth(name?: string): MethodDecorator & ClassDecorator;
}
