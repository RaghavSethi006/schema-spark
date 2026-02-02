// Platform Adapters Index
import { PlatformAdapter, PlatformType } from '../types/platforms';
import { nodejsAdapter } from './nodejs';
import { electronAdapter } from './electron';

const platformAdapters: Record<PlatformType, PlatformAdapter> = {
  nodejs: nodejsAdapter,
  electron: electronAdapter,
  browser: nodejsAdapter, // Fallback
  serverless: nodejsAdapter, // Fallback
};

export const getPlatformAdapter = (type: PlatformType): PlatformAdapter => {
  const adapter = platformAdapters[type];
  if (!adapter) {
    throw new Error(`Unknown platform type: ${type}`);
  }
  return adapter;
};

export const getAllPlatformAdapters = (): PlatformAdapter[] => {
  return [nodejsAdapter, electronAdapter];
};

export const getSupportedPlatforms = (): Array<{ id: PlatformType; name: string; description: string }> => {
  return getAllPlatformAdapters().map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
};

export { nodejsAdapter, electronAdapter };
