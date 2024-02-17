import { IValidation } from 'contentful-migration';
import { RangeType } from '../types';

export const range = ({ min, max }: RangeType): IValidation => ({
  range: {
    min,
    max
  }
});
