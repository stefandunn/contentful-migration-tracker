import { IValidation } from 'contentful-migration';

// More info on flags: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags
type Flag = 'i' | 'g' | 'm' | 's' | 'y' | 'y' | 'd';

export const matchPattern = (
  expression: RegExp | string,
  message?: string,
  flags: Flag[] = []
): IValidation => ({
  regexp: {
    pattern: typeof expression === 'string' ? expression : expression.source,
    flags: flags.join('')
  },
  message
});
