const { Router } = require('express');
const { UnauthorizedError, BadRequestError } = require('../../lib/ApiError');

module.exports = ({ passport }) => {
  const router = new Router();

  router.get(
    '/',
    passport.authenticate('login', {
      scope: 'openid email profile',
      audience: 'com.pocketlaw.app-back-end',
    })
  );

  router.get('/callback', (req, res, next) => {
    // Hacky use of middleware. Passport.js is to blame...
    const middleware = passport.authenticate('login', (error, user) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return next(new UnauthorizedError());
      }

      return req.logIn(user, loginError => {
        if (loginError) {
          return next(loginError);
        }

        const { returnTo } = req.session;
        req.session.returnTo = undefined;
        if (!returnTo) {
          return next(new BadRequestError('Unable to resolve redirect destination.'));
        }

        return res.redirect(returnTo);
      });
    });

    return middleware(req, res, next);
  });

  return router;
};
