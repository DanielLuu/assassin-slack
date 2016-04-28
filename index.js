'use strict';

/**
 * NorrisBot launcher script.
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */

var AssassinBot = require('./assassinbot');

/**
 * Environment variables used to configure the bot:
 *
 *  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
 *      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
 *  BOT_DB_PATH: the path of the SQLite database used by the bot
 *  BOT_NAME: the username you want to give to the bot within your organisation.
 */

var assassinbot = new AssassinBot({
    token: 'xoxb-36714040868-8061qPM5DJgelLGS0FwfZcI4'
});

assassinbot.run();
