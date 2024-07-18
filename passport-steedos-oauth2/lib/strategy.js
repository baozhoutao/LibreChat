// Load modules.
var OAuth2Strategy = require('passport-oauth2'),
  util = require('util'),
  uri = require('url'),
  SteedosPlusProfile = require('./profile/steedosplus'),
  OpenIDProfile = require('./profile/openid'),
  InternalOAuthError = require('passport-oauth2').InternalOAuthError,
  SteedosPlusAPIError = require('./errors/steedosplusapierror'),
  UserInfoError = require('./errors/userinfoerror');

/**
 * `Strategy` constructor.
 *
 * The Steedos authentication strategy authenticates requests by delegating to
 * Steedos using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Steedos application's client id
 *   - `clientSecret`  your Steedos application's client secret
 *   - `callbackURL`   URL to which Steedos will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new SteedosStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/google/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL =
    options.authorizationURL || 'https://3000-panva-nodeoidcprovider-5p9tnw5b7u2.ws-us115.gitpod.io/auth';
  options.tokenURL = options.tokenURL || 'https://3000-panva-nodeoidcprovider-5p9tnw5b7u2.ws-us115.gitpod.io/token';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'steedos';
  this._userProfileURL = options.userProfileURL || 'https://3000-panva-nodeoidcprovider-5p9tnw5b7u2.ws-us115.gitpod.io/me';

  var url = uri.parse(this._userProfileURL);
  if (url.pathname.indexOf('/userinfo') == url.pathname.length - '/userinfo'.length) {
    this._userProfileFormat = 'steedos';
  } else {
    this._userProfileFormat = 'steedos+'; // Google Sign-In
  }
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Google.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `google`
 *   - `id`
 *   - `username`
 *   - `displayName`
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {

  this._oauth2.useAuthorizationHeaderforGET(true);

  var self = this;
  // eslint-disable-next-line no-unused-vars
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    var json;

    if (err) {
      if (err.data) {
        try {
          json = JSON.parse(err.data);
        } catch (_) { /* empty */ }
      }

      if (json && json.error && json.error.message) {
        return done(new SteedosPlusAPIError(json.error.message, json.error.code));
      } else if (json && json.error && json.error_description) {
        return done(new UserInfoError(json.error_description, json.error));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile;
    switch (self._userProfileFormat) {
      case 'openid':
        profile = OpenIDProfile.parse(json);
        break;
      default: // Google Sign-In
        profile = SteedosPlusProfile.parse(json);
        break;
    }

    profile.provider = 'steedos';
    profile._raw = body;
    profile._json = json;

    done(null, profile);
  });
};

/**
 * Return extra Google-specific parameters to be included in the authorization
 * request.
 *
 * @param {object} options
 * @return {object}
 * @access protected
 */
Strategy.prototype.authorizationParams = function (options) {
  var params = {};

  // https://developers.google.com/identity/protocols/OAuth2WebServer
  if (options.accessType) {
    params['access_type'] = options.accessType;
  }
  if (options.prompt) {
    params['prompt'] = options.prompt;
  }
  if (options.loginHint) {
    params['login_hint'] = options.loginHint;
  }
  if (options.includeGrantedScopes) {
    params['include_granted_scopes'] = true;
  }

  // https://developers.google.com/identity/protocols/OpenIDConnect
  if (options.display) {
    // Specify what kind of display consent screen to display to users.
    //   https://developers.google.com/accounts/docs/OpenIDConnect#authenticationuriparameters
    params['display'] = options.display;
  }

  // Google Apps for Work
  if (options.hostedDomain || options.hd) {
    // This parameter is derived from Google's OAuth 1.0 endpoint, and (although
    // undocumented) is supported by Google's OAuth 2.0 endpoint was well.
    //   https://developers.google.com/accounts/docs/OAuth_ref
    params['hd'] = options.hostedDomain || options.hd;
  }

  // Google+
  if (options.requestVisibleActions) {
    // Space separated list of allowed app actions
    // as documented at:
    //  https://developers.google.com/+/web/app-activities/#writing_an_app_activity_using_the_google_apis_client_libraries
    //  https://developers.google.com/+/api/moment-types/
    params['request_visible_actions'] = options.requestVisibleActions;
  }

  // OpenID 2.0 migration
  if (options.openIDRealm) {
    // This parameter is needed when migrating users from Google's OpenID 2.0 to OAuth 2.0
    //   https://developers.google.com/accounts/docs/OpenID?hl=ja#adjust-uri
    params['openid.realm'] = options.openIDRealm;
  }

  // Undocumented
  if (options.approvalPrompt) {
    params['approval_prompt'] = options.approvalPrompt;
  }
  if (options.userID) {
    // Undocumented, but supported by Google's OAuth 2.0 endpoint.  Appears to
    // be equivalent to `login_hint`.
    params['user_id'] = options.userID;
  }

  return params;
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
