/**
 * `SteedosPlusAPIError` error.
 *
 * References:
 *   - https://developers.steedos.com/+/web/api/rest/
 *
 * @constructor
 * @param {string} [message]
 * @param {number} [code]
 * @access public
 */
function SteedosPlusAPIError(message, code) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'SteedosPlusAPIError';
  this.message = message;
  this.code = code;
}

// Inherit from `Error`.
SteedosPlusAPIError.prototype.__proto__ = Error.prototype;

// Expose constructor.
module.exports = SteedosPlusAPIError;
