import { FrameworkAdapter, FrameworkType } from '../types';
import { fastapiAdapter } from './fastapi';
import { djangoAdapter } from './django';
import { nestjsAdapter } from './nestjs';
import { springBootAdapter } from './springboot';
import { expressAdapter } from './express';
import { laravelAdapter } from './laravel';
import { railsAdapter } from './rails';
import { ginAdapter } from './gin';
import { phoenixAdapter } from './phoenix';
import { actixAdapter, axumAdapter, rocketAdapter } from './rust';

const frameworkAdapters: Record<string, FrameworkAdapter> = {
  fastapi: fastapiAdapter as FrameworkAdapter,
  django: djangoAdapter as FrameworkAdapter,
  nestjs: nestjsAdapter as FrameworkAdapter,
  'spring-boot': springBootAdapter as FrameworkAdapter,
  express: expressAdapter as FrameworkAdapter,
  laravel: laravelAdapter as FrameworkAdapter,
  rails: railsAdapter as FrameworkAdapter,
  gin: ginAdapter as FrameworkAdapter,
  phoenix: phoenixAdapter as FrameworkAdapter,
  actix: actixAdapter as FrameworkAdapter,
  axum: axumAdapter as FrameworkAdapter,
  rocket: rocketAdapter as FrameworkAdapter,
};

export const getFrameworkAdapter = (type: FrameworkType): FrameworkAdapter => {
  const adapter = frameworkAdapters[type];
  if (!adapter) throw new Error(`Unknown framework type: ${type}`);
  return adapter;
};

export const getAllFrameworkAdapters = (): FrameworkAdapter[] => Object.values(frameworkAdapters);

export const getSupportedFrameworks = (): Array<{ id: FrameworkType; name: string; language: string; description: string }> => {
  return Object.values(frameworkAdapters).map(({ id, name, language, description }) => ({ id, name, language, description }));
};

export { fastapiAdapter, djangoAdapter, nestjsAdapter, springBootAdapter, expressAdapter, laravelAdapter, railsAdapter, ginAdapter, phoenixAdapter, actixAdapter, axumAdapter, rocketAdapter };
