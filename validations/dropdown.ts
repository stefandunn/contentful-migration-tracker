import { IValidation } from 'contentful-migration';

export const dropdownOptions = (options: string[]): IValidation => ({
  in: options
});
