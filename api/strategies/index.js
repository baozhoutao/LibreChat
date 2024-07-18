const passportLogin = require('./localStrategy');
const googleLogin = require('./googleStrategy');
const githubLogin = require('./githubStrategy');
const discordLogin = require('./discordStrategy');
const facebookLogin = require('./facebookStrategy');
const steedosLogin = require('./steedosStrategy');
const setupOpenId = require('./openidStrategy');
const jwtLogin = require('./jwtStrategy');
const ldapLogin = require('./ldapStrategy');

module.exports = {
  passportLogin,
  steedosLogin,
  googleLogin,
  githubLogin,
  discordLogin,
  jwtLogin,
  facebookLogin,
  setupOpenId,
  ldapLogin,
};
