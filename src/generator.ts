/* eslint-disable class-methods-use-this */
import fs, { promises as fsAsync } from 'fs';
import path from 'path';
import { dir } from './utils/Dir';
import Logger from './utils/Logger';

class Generator {
  generateTemplate(file: string): string {
    return `import Migration from 'contentful-migration';

// Add your migration commands here for ${file.replace(/^(.+)(.ts)$/, '$1')}

/**
 * This function executes when running a new migration.
 *
 * @param   {Migration}  migration
 *
 * @return  {void}
 */
const up = (migration: Migration): void => {

};

/**
 * This function executes when you rollback an existing migration.
 *
 * @param   {Migration}  migration
 *
 * @return  {void}
 */
const down = (migration: Migration): void => {

};

module.exports = {
  up,
  down
};
`;
  }

  async makeMigrationFile(mkFile: string): Promise<void> {
    if (mkFile.match(/[^a-zA-Z0-9_]/g)) {
      return Logger.error(
        `❌ "${mkFile}" contains invalid characters (names must consist of the following characters: a-zA-Z0-9_)`
      );
    }

    let file = path.basename(mkFile).replace(path.extname(mkFile), '');
    file = `${new Date().getTime()}_${file}.ts`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    return fsAsync
      .writeFile(path.join(dir, file), this.generateTemplate(file))
      .then(() => {
        Logger.success(`Created migration file: ${file} ✅`);
      });
  }
}

export default Generator;
