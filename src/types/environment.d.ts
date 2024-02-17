/* eslint-disable @typescript-eslint/no-empty-interface */
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      CONTENTFUL_SPACE_ID: string;
      CONTENTFUL_ENVIRONMENT_ID: string;
      CONTENTFUL_CMA_TOKEN: string;
    }
  }
}
