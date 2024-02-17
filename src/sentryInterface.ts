/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from '@sentry/node';
import { Extras } from '@sentry/types/types/extra';
import { SeverityLevel } from '@sentry/types/types/severity';

Sentry.init({
  dsn: 'https://dc7f4d3eb9c54ea285add04fb93d6f85@o1085837.ingest.sentry.io/6619491',
  tracesSampleRate: 1.0,
  environment:
    process.env.CONTENTFUL_ENVIRONMENT_ID === 'master'
      ? 'production'
      : 'development'
});

class SentryInterface {
  migrationFilename = '';

  migrationChecksum = '';

  async captureException(
    message: any,
    level: SeverityLevel = 'error',
    additionalExtra: Extras = {}
  ): Promise<string> {
    const error = new Error(message);
    error.name = message;
    const captureId = Sentry.captureException(error, {
      extra: {
        migrationId: this.migrationFilename,
        ...additionalExtra
      },
      level
    });

    await Sentry.close(2000);
    return captureId;
  }
}

export default SentryInterface;
