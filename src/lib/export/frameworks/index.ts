import { FrameworkAdapter, FrameworkType } from '../types';
import { fastapiAdapter } from './fastapi';
import { djangoAdapter } from './django';
import { nestjsAdapter } from './nestjs';
import { springBootAdapter } from './springboot';
import { expressAdapter } from './express';

const frameworkAdapters: Record<string, FrameworkAdapter> = {
  fastapi: fastapiAdapter,
  django: djangoAdapter,
  nestjs: nestjsAdapter,
  'spring-boot': springBootAdapter,
  express: expressAdapter,
};

export const getFrameworkAdapter = (type: FrameworkType): FrameworkAdapter => {
  const adapter = frameworkAdapters[type];
  if (!adapter) {
    throw new Error(`Unknown framework type: ${type}`);
  }
  return adapter;
};

export const getAllFrameworkAdapters = (): FrameworkAdapter[] => {
  return Object.values(frameworkAdapters);
};

export const getSupportedFrameworks = (): Array<{ id: FrameworkType; name: string; language: string; description: string }> => {
  return Object.values(frameworkAdapters).map(({ id, name, language, description }) => ({
    id,
    name,
    language,
    description,
  }));
};

export { fastapiAdapter, djangoAdapter, nestjsAdapter, springBootAdapter, expressAdapter };
