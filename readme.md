# Contentful Migration

The purpose of this project is to support tracked migrations to be executed against a Contentful environment.

The benefits of doing so include:

- Control over data structure of your Content Types.
- Track your changes and be able to roll them back.
- Deploy the same migrations over multiple environments, allowing them to nort diverge.

It's possible to run migrations on Contentful spaces, which can be executed on any space specified in the `.env` file.

## Installation

First, you will need to obtain a Contentful Management [CMA Token](https://www.contentful.com/developers/docs/references/authentication/#getting-a-personal-access-token) page.

This API key will need to be added to `.env` as the `CONTENTFUL_CMA_TOKEN` key.

Other `.env` variables are:

`CONTENTFUL_SPACE_ID` - The ID of the space to run migrations on
`CONTENTFUL_ENVIRONMENT_ID` - The environment to run migrations on (`master` for production, `development` for staging).
`DATABASE_URL` - The constructed MySQL URL from [Planetscale](https://app.planetscale.com).

Use yarn to install dependencies

```
yarn install
```

## Migrations

To make a new migration file, run the following (include the Jira ticket number if it exists):

```
yarn run make:migration migration_description
```

For example:

```
yarn run make:migration create_lesson_content_type
```

This will generate a file in the `migrations` directory of this project with a basic template for writing migrations according to the [documentation](https://github.com/contentful/contentful-migration).

> **Please use** [chain-notation](https://github.com/contentful/contentful-migration#chaining-vs-object-notation) method when writing migrations to make them easier to read.

#### Validations

**Validation** helpers are available in the `validations` directory and should be added into the validation array:

```typescript
import {
  assetDimensions,
  assetFileSize,
  assetTypes
} from '../validations/assets';
import { URLValidation } from '../validations/urls';

contentType
  .createField('youtubeURL')
  .name('Youtube URL')
  .type('Symbol')
  .validations([URLValidation]);

contentType
  .createField('thumbnail')
  .name('Thumbnail Image')
  .type('Link')
  .linkType('Asset')
  .validations([
    assetTypes(['image']), // Restrict to only image mime-types
    assetFileSize({ maxFileSize = 2048 }), // Default max size of 2MB.
    assetDimensions({
      maxHeight: 1024,
      maxWidth: 2048,
      message: 'Minimum size of 640x480, maximum size of 2048x1024',
      minHeight: 480,
      minWidth: 640
    }) // Arguments are optional, asides from message
  ]);
```

The migration files have a timestamp prefix so they execute in a chronological order.

## Running Migrations

You can run a single migration or all migrations at once.

_To run a single migration file:_

```
yarn run migrate 1654856726435_some_migration_file
```

> You do not need to specify the file extension or directory, just the filename.

_To run all migrations:_

```
yarn run migrate
```

After running this command, you will get a simple summary of migrations which were successful, skipped and those which failed.

## Rolling back migrations

_To rollback the last known successful migration you can use:_

```
yarn run rollback
```

_You can rollback a specific migration file_

```
yarn run rollback 1654856726435_some_migration_file
```

_You can rollback to a specific migration file (this is not inclusive) in sequential order._

```
yarn run rollback:to 1654856726435_some_migration_file
```

_You can also rollback all migrations using_

```
yarn run rollback:all
```

### Guide to Migrations and Procedure

It is best to use the [chained notation](https://github.com/contentful/contentful-migration#chaining-vs-object-notation) when writing migration files. Documentation on chained methods can be found [here](https://github.com/contentful/contentful-migration/blob/59f0a3abcb7020f084aeb2d0fb33bb027e94d58c/index.d.ts#L79-L114).

### Linking to custom apps

To link a field to a custom app, it's required the ID of the field and the ID of the app.

To get the ID of the app, navigate to Apps > Your custom apps. Find your app and hit the ellipsis > Edit app definition. The app ID will be underneath the name of the app.

```
  {contentType}.changeFieldControl(
    '{fieldID}',
    'app',
    '{customAppID}'
  );
```

This requires the app being installed on the relevant environment. Back in the Your custom apps page, if the app has a check mark next to the name, this means it is installed. If not, hit the ellipsis and hit install.

## Planetscale Free Tier - Keeping the database awake

As part of this project, it felt like it would be a suitable idea to have a cron-job that can query the database every day to prevent it from going into sleep (part of Planetscale's free tier restrictions).

If this project is hosted on Vercel, the `vercel.json` file configures your project to run `/api/wake-up-db` on a daily basis at 5:00 am UTC.

### Useful resources

Updating field control (`changeFieldControl`):
https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/

Migration CLI:
https://github.com/contentful/contentful-migration

List of available Widget ID's:
https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/
