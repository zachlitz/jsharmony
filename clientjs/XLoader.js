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

var $ = require('./jquery-1.11.2');
var _ = require('lodash');

exports = module.exports = function(jsh){

  function XLoader(){
    var _this = this;
    this.IsLoading = false;
    this.LoadQueue = new Array();
    this.MouseStack = 0;
    this.onSquashedClick = null;

    //Check if required elements have been rendered to the page
    if(!jsh.$root('.xloadingblock').length) console.error('xloadingblock not found on page during XLoader initialization');

    //Keep counter to match mousedown / mouseup events, to detect squashed clicks (clicks blocked by the transparent loading background)
    jsh.$root('.xloadingblock').on('mousedown', function(){
      _this.MouseStack++;
    });
    jsh.$root('.xloadingblock').on('click mouseup', function(e){
      if(_this.MouseStack<=0){ if(_this.onSquashedClick) _this.onSquashedClick(e); }
      _this.MouseStack--;
    });
  }

  XLoader.prototype.StartLoading = function(obj){
    if(!_.includes(this.LoadQueue,obj)) this.LoadQueue.push(obj);
    if(this.IsLoading) return;
    jsh.root.css('cursor','wait');
    this.IsLoading = true;
    this.MouseStack = 0;
    if(jsh.xDialog.length) jsh.$root('input,select,textarea').not(':button').blur();
    else jsh.$root('input,select,textarea').blur();
    jsh.$root('.xloadingbox').stop().fadeTo(0,0);
    jsh.$root('.xloadingblock').show();
    jsh.$root('.xloadingbox').fadeTo(2000,1);
  }

  XLoader.prototype.StopLoading = function (obj){
    _.remove(this.LoadQueue, function (val) { return obj == val; });
    if(this.LoadQueue.length != 0) return;
    this.StopLoadingBase();
  }

  XLoader.prototype.ClearLoading = function () {
    this.LoadQueue = [];
    this.StopLoadingBase();
  };

  XLoader.prototype.StopLoadingBase = function () {
    this.IsLoading = false;
    jsh.$root('.xloadingbox').stop();
    var curfade = GetOpacity(jsh.$root('.xloadingbox')[0]);
    jsh.$root('.xloadingbox').fadeTo(500 * curfade, 0, function () { if (!this.IsLoading) { jsh.$root('.xloadingblock').hide(); } });
    jsh.root.css('cursor', '');
  }

  function GetOpacity(elem) {
    var ori = $(elem).css('opacity');
    var ori2 = $(elem).css('filter');
    if (ori2) {
      ori2 = parseInt( ori2.replace(')','').replace('alpha(opacity=','') ) / 100;
      if (!isNaN(ori2) && ori2 != '') {
        ori = ori2;
      }
    }
    return ori;
  }

  return XLoader;
}
