import { format } from 'url';
import { resolve } from 'path';
import _ from 'lodash';
import fs from 'fs';
import Boom from 'boom';
import Hapi from 'hapi';
import CookieAuth from 'hapi-auth-cookie';
import getDefaultRoute from './get_default_route';
import versionCheckMixin from './version_check';
import { handleShortUrlError } from './short_url_error';
import { shortUrlAssertValid } from './short_url_assert_valid';
import create_index from './create_index';
import update_index from './update_index';
import Auth from './authentification';

module.exports = async function (kbnServer, server, config) {

  server = kbnServer.server = new Hapi.Server();
  let auth = new Auth(config);

  const shortUrlLookup = require('./short_url_lookup')(server);
  await kbnServer.mixin(require('./register_hapi_plugins'));
  await kbnServer.mixin(require('./setup_connection'));
  
  async function create_kibana_index (index_name, config) {
    let response = await create_index(index_name, config)
    if (response.details == 'create') {
      await update_index(index_name, config);
    }
    return response;
  }
  
  async function login (request, reply){
    let missingUsername = '';
    let missingPassword = '';
    console.log(request.query);
    if (request.query.username || request.query.password) {
      let username = request.query.username ? request.query.username : '';
      let passwd = request.query.password ? request.query.password : '';
      let message = '';
      let queryParams = [];
      if (!request.query.username) {
        missingUsername = 'error-field';
        message = 'Missing username';
      }
      if (!request.query.password) {
        missingPassword = 'error-field';
        if (message) {
          message += ' and password';
        } else {
          message = 'Missing password';
        }
      }
      if (request.query.password && request.query.username) {
        let result = await auth.getData(request.query.username, request.query.password)
        if (result.result) {
          let index_name = '.' + result.message.org.toLowerCase().replace(/ /g, '_');
          try {
            await create_kibana_index(index_name, config);
            result.message.index = index_name;
            request.cookieAuth.set(result.message);
            return reply.view('root_redirect', {
              hashRoute: `${config.get('server.basePath')}/app/kibana`,
              defaultRoute: getDefaultRoute(kbnServer),
            });
          } catch (err) {
            return reply.view('login', {
              username: username,
              password: passwd,
              kibanaPayload: {basePath: `${config.get('server.basePath')}`},
              message: err
            });
          }
        } else {
          return reply.view('login', {
            username: username,
            password: passwd,
            kibanaPayload: {basePath: `${config.get('server.basePath')}`},
            message: 'Invalid user name or password'
          });
        }        
      } else {
        return reply.view('login', {
          message: message,
          username: username,
          password: passwd,
          missingUsername: missingUsername,
          missingPassword: missingPassword,
          kibanaPayload: {basePath: `${config.get('server.basePath')}`},
        });        
      }
    } else {
      return reply.view('login', {
        username: '',
        password: '',
        kibanaPayload: {basePath: `${config.get('server.basePath')}`},
			});
    }
  }

  server.register(CookieAuth, function(err) {
    server.auth.strategy('simple', 'cookie', 
    { 
      password: 'qd5tSVgrUHUjUNa7KrnxmvZ5FjlInKad',
      cookie: 'habana',
      redirectTo: '/login',
      isSecure: false,
      appendNext: true,
      validateFunc: async function(request, session, callback) {
        await create_kibana_index (session.index, config);
        return callback(null, true);
      }
    });
    server.auth.default('simple');
  });
  
  // provide a simple way to expose static directories
  server.decorate('server', 'exposeStaticDir', function (routePath, dirPath) {
    this.route({
      path: routePath,
      method: 'GET',
      handler: {
        directory: {
          path: dirPath,
          listing: false,
          lookupCompressed: true
        }
      },
      config: {auth: false}
    });
  });

  // provide a simple way to expose static files
  server.decorate('server', 'exposeStaticFile', function (routePath, filePath) {
    this.route({
      path: routePath,
      method: 'GET',
      handler: {
        file: filePath
      },
      config: {auth: false}
    });
  });

  // helper for creating view managers for servers
  server.decorate('server', 'setupViews', function (path, engines) {
    this.views({
      path: path,
      isCached: config.get('optimize.viewCaching'),
      engines: _.assign({ jade: require('jade') }, engines || {})
    });
  });

  server.decorate('server', 'redirectToSlash', function (route) {
    this.route({
      path: route,
      method: 'GET',
      handler: function (req, reply) {
        return reply.redirect(format({
          search: req.url.search,
          pathname: req.url.pathname + '/',
        }));
      }
    });
  });

  // attach the app name to the server, so we can be sure we are actually talking to kibana
  server.ext('onPreResponse', function (req, reply) {
    let response = req.response;

    if (response.isBoom) {
      response.output.headers['kbn-name'] = kbnServer.name;
      response.output.headers['kbn-version'] = kbnServer.version;
    } else {
      response.header('kbn-name', kbnServer.name);
      response.header('kbn-version', kbnServer.version);
    }

    return reply.continue();
  });

  server.route({
    path: '/',
    method: 'GET',
    handler: function (req, reply) {
      return reply.view('root_redirect', {
        hashRoute: `${config.get('server.basePath')}/app/kibana`,
        defaultRoute: getDefaultRoute(kbnServer),
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/{p*}',
    handler: function (req, reply) {
      let path = req.path;
      if (path === '/' || path.charAt(path.length - 1) !== '/') {
        return reply(Boom.notFound());
      }
      const pathPrefix = config.get('server.basePath') ? `${config.get('server.basePath')}/` : '';
      return reply.redirect(format({
        search: req.url.search,
        pathname: pathPrefix + path.slice(0, -1),
      }))
      .permanent(true);
    }
  });

  server.route({
    method: 'GET',
    path: '/goto/{urlId}',
    handler: async function (request, reply) {
      try {
        const url = await shortUrlLookup.getUrl(request.params.urlId, request);
        shortUrlAssertValid(url);
        reply().redirect(config.get('server.basePath') + url);
      } catch (err) {
        reply(handleShortUrlError(err));
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/shorten',
    handler: async function (request, reply) {
      try {
        shortUrlAssertValid(request.payload.url);
        const urlId = await shortUrlLookup.generateUrlId(request.payload.url, request);
        reply(urlId);
      } catch (err) {
        reply(handleShortUrlError(err));
      }
    }
  });

  server.route({
    method: 'GET', 
    path: '/login', 
    config: { 
       handler: login, 
       auth: { mode: 'try' }, 
       plugins: { 
         'hapi-auth-cookie': { redirectTo: false } 
       } 
    }
  });
  
  server.route({
    method: 'GET',
    path: '/logout',
    config: {
      handler: function(req, reply) {
        req.cookieAuth.clear();
        return reply.redirect('/');
      }
    }
  });  
  
  // Expose static assets (fonts, favicons).
  server.exposeStaticDir( '/ui/fonts/{path*}',    resolve(__dirname, '../../ui/public/assets/fonts'));
  server.exposeStaticDir( '/ui/favicons/{path*}', resolve(__dirname, '../../ui/public/assets/favicons'));
  server.exposeStaticDir( '/ui/font-awesome/{path*}', resolve('node_modules/font-awesome'));
  
  kbnServer.mixin(versionCheckMixin);
  
  return kbnServer.mixin(require('./xsrf'));
};
