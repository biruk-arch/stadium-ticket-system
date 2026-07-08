// Central error handler. Controllers call next(err) with an optional err.status;
// anything unexpected falls back to 500 so the API never leaks stack traces to clients.
module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error.' });
};
