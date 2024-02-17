/* eslint-disable prefer-regex-literals */
import { IValidation } from 'contentful-migration';

export const URLValidation: IValidation = {
  regexp: {
    // Using `RegExp` here to keep escaped slashes. This Regular Expression is taken directly from Contentful's "URL" pattern.
    pattern: new RegExp(
      /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?$/
    ).source
  }
};
