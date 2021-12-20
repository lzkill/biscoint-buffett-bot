import * as joi from 'joi';
import * as schemas from './config-schemas';

class ConfigHelper {
  createConfiguration() {
    const loadConfig = require('load-config-file');
    loadConfig.register('.json', JSON.parse);
    const json = loadConfig('config');

    const app = joi.attempt(json.app, schemas.appSchema);
    const biscoint = joi.attempt(json.biscoint, schemas.biscointSchema);
    const bot = joi.attempt(json.bot, schemas.botSchema);
    const telegram = joi.attempt(json.telegram, schemas.telegramSchema);
    const papertrail = joi.attempt(json.papertrail, schemas.papertrailSchema);

    return {
      app: app,
      biscoint: biscoint,
      bot: bot,
      telegram: telegram,
      papertrail: papertrail,
    };
  }
}

const configHelper = new ConfigHelper();
export default configHelper;
