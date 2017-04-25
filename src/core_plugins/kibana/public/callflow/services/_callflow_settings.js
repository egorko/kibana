define(function (require) {
  var module = require('ui/modules').get('apps/callflow');
  var angular = require('angular');
  var _ = require('lodash');
  var moment = require('moment');
  var strRules = require('plugins/kibana/callflow/utils/rule');

  module.factory('CallFlowSettings', function (courier) {
    _.class(CallFlowSettings).inherits(courier.SavedObject);
    function CallFlowSettings(id) {
      let colors = {
        cap: '#0000FF',
        map: '#8A2BE2',
        aiu: '#A52A2A',
        isup:'#FF8C00',
        sip: '#008000',
        diameter: '#FF00FF'
      };
      let font = {
        'font-family': "Arial, Helvetica, sans-serif",
        'font-size': 12
      };
      
      CallFlowSettings.Super.call(this, {
        type:         CallFlowSettings.type,
        mapping:      CallFlowSettings.mapping,
        searchSource: CallFlowSettings.searchsource,

        id: id,

        defaults: {
          title: 'New CallFlow Settings',
          protocolColorsJSON: angular.toJson(colors),
          fontJSON: angular.toJson(font),
          ruleJSON: strRules
        }
      });
    }

    // save these objects with the 'callflow' type
    CallFlowSettings.type = 'callflow_settings';
    
    // if type:dashboard has no mapping, we push this mapping into ES
    CallFlowSettings.mapping = {
      title: 'string',
      protocolColorsJSON: 'string',
      fontJSON: 'string',
      ruleJSON: 'string'
    };

    CallFlowSettings.searchsource = true;

    return CallFlowSettings;
  });
});
