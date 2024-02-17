import { IValidation, LinkMimetype } from 'contentful-migration';
import { AssetDimensionsType, AssetFileSizeType } from '../types';

export const assetTypes = (types: LinkMimetype[]): IValidation => ({
  linkMimetypeGroup: types
});

export const assetFileSize = ({
  maxFileSize = 2048,
  minFileSize = undefined
}: AssetFileSizeType): IValidation => ({
  assetFileSize: {
    max: Math.ceil(maxFileSize * 1024),
    min: minFileSize ? Math.ceil(minFileSize * 1024) : undefined
  }
});

export const assetDimensions = ({
  maxHeight = undefined,
  maxWidth = undefined,
  message,
  minHeight = undefined,
  minWidth = undefined
}: AssetDimensionsType): IValidation => ({
  assetImageDimensions: {
    height: {
      min: minHeight,
      max: maxHeight
    },
    width: {
      min: minWidth,
      max: maxWidth
    }
  },
  message
});
