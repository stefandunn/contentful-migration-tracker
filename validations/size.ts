import { IValidation } from 'contentful-migration';

export const maxSize = (size: number): IValidation => ({
  size: {
    max: size
  }
});

export const minSize = (size: number): IValidation => ({
  size: {
    min: size
  }
});

export const sizeBetween = (min: number, max: number): IValidation => ({
  size: {
    min,
    max
  }
});
