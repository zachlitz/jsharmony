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
var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var path = require('path');
var Helper = require('./lib/Helper.js');
var DB = require('jsharmony-db');
var jsHarmonyCodeGen = require('./lib/CodeGen.js');

module.exports = exports = {};

function addFieldValidator(field, validator){
  if(!field.validation) field.validation = [];
  field.validation.push(validator);
}

exports.ParseTask = function(model){
  var _this = this;

  var task = model.task;
  if(!task) return;

  var params = {};
  _.each(model.fields, function(field){
    if(field.name) params[field.name] = true;
  });

  if(!('actions' in task)){ _this.LogInit_ERROR('Error loading' + model.id + ' task: Missing task.actions property'); return; }
  _.each(task.actions, function(action){ _this.ParseTaskAction(model, action, params); });

}

exports.ParseTaskValidation = function(obj, desc){
  var _this = this;
  obj.xvalidate = new _this.XValidate();
  _.each(obj.fields, function(field){
    _.each(_this.getDefaultValidators(field), function(validator){ addFieldValidator(field, validator); });
    field.actions = 'U';
  _.each(obj.fields, function(field){ _this.AddValidatorFuncs(obj.xvalidate, field, desc); });
  });
}

exports.getTaskActionDesc = function(action, options){
  var rslt = JSON.stringify(_.pick(action,['exec','db','sql','path','into','overwrite','dest','sqldata','headers','cmd','subject','to','bcc','cc']));
  if(options && options.exec_counter) rslt += ' #' + options.exec_counter.join('-');
  return rslt;
}

exports.ParseTaskAction = function(model, action, params){
  var _this = this;
  params = _.extend({}, params);

  _this.ParseTaskValidation(action, model.id);

  function parseChildActions(actionType, childActionProperty, variableDesc){
    if(action[childActionProperty]){
      if(variableDesc){
        if(!action.into) _this.LogInit_ERROR('Error loading task ' + model.id + ': '+actionType+'.'+childActionProperty+' requires '+actionType+'.into property to define the variable name for the '+variableDesc+' object');
        if(action.into in params) _this.LogInit_ERROR('Error loading task ' + model.id + ': '+actionType+'.into property would override an existing variable');
        params[action.into] = true;
      }
      _.each(action[childActionProperty], function(action){ _this.ParseTaskAction(model, action); });
    }
  }

  function validateActionProperties(props){
    for(var key in action){
      if(key == 'exec') continue;
      if(key == 'xvalidate') continue;
      if(!_.includes(props, key)) _this.LogInit_ERROR('Invalid ' + action.exec + ' action property: ' + key + ' in action ' + _this.getTaskActionDesc(action));
    }
  }

  if(action.exec == 'sql'){
    validateActionProperties(['sql','db','into','foreach_row','fields']);
    parseChildActions('sql', 'foreach_row', 'row');
  }
  else if(action.exec == 'sqltrans'){
    validateActionProperties(['db','actions']);
    parseChildActions('sqltrans', 'actions');
  }
  else if(action.exec == 'delete_folder'){
    validateActionProperties(['path','recursive']);
  }
  else if(action.exec == 'create_folder'){
    validateActionProperties(['path']);
  }
  else if(action.exec == 'list_files'){
    validateActionProperties(['path','matching','into','foreach_file']);
    if(action.matching && _.isString(action.matching)) action.matching = [action.matching];
    parseChildActions('list_files', 'foreach_file', 'file');
  }
  else if(action.exec == 'delete_file'){
    validateActionProperties(['path']);
  }
  else if(action.exec == 'copy_file'){
    validateActionProperties(['path','dest','overwrite']);
  }
  else if(action.exec == 'write_file'){
    validateActionProperties(['path','text','overwrite']);
  }
  else if(action.exec == 'append_file'){
    validateActionProperties(['path','text']);
  }
  else if(action.exec == 'read_file'){
    validateActionProperties(['path','into','foreach_line']);
    parseChildActions('read_file', 'foreach_line', 'line');
  }
  else if(action.exec == 'write_csv'){
    validateActionProperties(['path','db','data','sql','headers','overwrite','fields']);
    if(action.data){
      if(!_.isArray(action.data)) action.data = [action.data]; //{} => [{}]
      else if(!action.data.length || (!_.isArray(action.data[0]) && !_.isObject(action.data[0]))) action.data = [action.data]; //[] => [[]]
    }
  }
  else if(action.exec == 'append_csv'){
    validateActionProperties(['path','db','data','sql','headers','fields']);
    if(action.data){
      if(!_.isArray(action.data)) action.data = [action.data]; //{} => [{}]
      else if(!action.data.length || (!_.isArray(action.data[0]) && !_.isObject(action.data[0]))) action.data = [action.data]; //[] => [[]]
    }
  }
  else if(action.exec == 'read_csv'){
    validateActionProperties(['path','into','foreach_row','headers','fields']);
    parseChildActions('read_csv', 'foreach_row', 'row');
  }
  else if(action.exec == 'js'){
    validateActionProperties(['js','into','foreach']);
    parseChildActions('js', 'foreach', 'item');
  }
  else if(action.exec == 'email'){
    validateActionProperties(['email','jsharmony_txt']);
    if(action.email) for(var key in action.email){
      if(!_.includes(['to','cc','bcc','subject','text','html','attachments'], key)) _this.LogInit_ERROR('Invalid email action property: email.' + key + ' in action ' + _this.getTaskActionDesc(action));
    }
    if(action.txt) for(var key in action.jsharmony_txt){
      if(!_.includes(['txt_attrib','to','cc','bcc','attachments'], key)) _this.LogInit_ERROR('Invalid email action property: txt.' + key + ' in action ' + _this.getTaskActionDesc(action));
    }
  }
  else _this.LogInit_ERROR('Error loading task ' + model.id + ': Invalid action.exec "'+action.exec+'"');
}

exports.hasTask = function(req, modelid){
  var model = this.getModel(req, modelid);
  if(!model) return false;
  return !!model.task;
}