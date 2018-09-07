/*
Copyright 2017 apHarmony

This file is part of jsHarmony.

jsHarmony is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsHarmony is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this package.  If not, see <http://www.gnu.org/licenses/>.
*/
var Helper = require('./lib/Helper.js');

module.exports = exports = {};

/*******************
|    RENDER HTML   |
*******************/
exports.RenderListing = function () {
  var rslt = '<br/>&nbsp;';
  var components = { 'Local':[] };
  for (var modelid in this.Models) {
    var component = this.Models[modelid].component||'Local';
    if(!(component in components)) components[component] = [];
    components[component].push(modelid);
  }
  var has_models = false;
  for(var component in components){
    var modelids = components[component];
    modelids.sort();
    if(!modelids.length) continue;
    else has_models = true;
    rslt += '<h2>'+component+'</h2>';
    rslt += '<ul>';
    for (var i = 0; i < modelids.length; i++) {
      var modelid = modelids[i];
      rslt += '<li><a href="' + modelid + '" target="_blank">' + modelid + '</a></li>';
    }
    rslt += '</ul>';
  }
  if(!has_models) rslt += 'No models found';
  return rslt;
}

//Get global variables inserted into client window context
exports.getBaseJS = function (req, jsh) {
  var _this = this;
  var rslt = '';
  rslt += '_debug = ' + (req.jshconfig.show_system_errors?'true':'false') + ';';
  rslt += '_BASEURL = \'' + req.baseurl + '\';';
  rslt += 'forcequery = ' + JSON.stringify(req.forcequery) + ';';
  rslt += 'home_url = ' + JSON.stringify(jsh.Config.home_url) + ';';
  rslt += 'jshuimap = ' + JSON.stringify(jsh.uimap) + ';';
  if (req.isAuthenticated) {
    if (_this.Config.google_settings && _this.Config.google_settings.API_KEY) rslt += 'window.google_api_key = ' + JSON.stringify(_this.Config.google_settings.API_KEY) + ';';
  }
  return rslt;
}

//Return a 404 error page
exports.Gen404 = function (req, res) {
  res.status(404);
  if (req.accepts('html')) { res.render(this.getView(req, '404', { disable_override: true }), { url: req.url }); return; }
  if (req.accepts('json')) { res.send({ error: 'Not found' }); return; }
  res.type('txt').send('Not found');
}

exports.Redirect302 = Helper.Redirect302;
exports.RenderLogin = require('./render/RenderLogin.js');
exports.RenderLoginForgotPassword = require('./render/RenderLoginForgotPassword.js');
exports.RenderLoginForgotPasswordReset = require('./render/RenderLoginForgotPasswordReset.js');
exports.RenderLogout = require('./render/RenderLogout.js');
exports.RenderTemplate = require('./render/RenderTemplate.js');