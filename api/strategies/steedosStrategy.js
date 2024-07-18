const { Strategy: SteedosStrategy } = require('../../passport-steedos-oauth2');
const socialLogin = require('./socialLogin');

const getProfileDetails = (profile) => {
  console.log('profile===>', profile);
  const _json = profile._json;

  if (!profile.id) {
    return {
      email: _json.email,
      id: _json.email,
      avatarUrl: _json.picture,
      username: _json.preferred_username,
      name: _json.name,
      emailVerified: _json.email_verified,
    };
  }

  return {
    email: profile.emails[0].value,
    id: profile.id,
    avatarUrl: profile.photos[0].value,
    username: profile.name.givenName,
    name: `${profile.name.givenName} ${profile.name.familyName}`,
    emailVerified: profile.emails[0].verified,
  };
};

const steedosLogin = socialLogin('steedos', getProfileDetails);

module.exports = () =>
  new SteedosStrategy(
    {
      clientID: process.env.STEEDOS_CLIENT_ID,
      clientSecret: process.env.STEEDOS_CLIENT_SECRET,
      callbackURL: `${process.env.DOMAIN_SERVER}${process.env.STEEDOS_CALLBACK_URL}`,
      proxy: true,
    },
    steedosLogin,
  );
