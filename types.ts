/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
export type FailedMigrationPromiseResponse = {
  reason: {
    errors: {
      type: string;
      message: string;
      details: {
        intent: {
          type: string;
          meta: {
            contentTypeInstanceId: string;
            fieldInstanceId: string;
            callsite: {
              file: string;
              line: number;
            };
          };
          payload: {
            contentTypeId: string;
            fieldId: string;
          };
        };
      };
    }[];
  };
};

export type MigrationStatus = 'rollback' | 'success' | 'skipped';
export type MigrationReport = [string, MigrationStatus];
export type MigrationReportStatus = PromiseSettledResult<MigrationReport>;
export type RollbackReturnType = MigrationReport | undefined;

export enum MigrationStatusCode {
  started = 'start',
  succeeded = 'success',
  failed = 'fail'
}

export type AssetDimensionsType = {
  maxWidth?: number;
  maxHeight?: number;
  message: string;
  minWidth?: number;
  minHeight?: number;
};

export type AssetFileSizeType = {
  maxFileSize?: number;
  minFileSize?: number;
};

export type RangeType = {
  min?: number;
  max?: number;
};
