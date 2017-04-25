define(function (require, module, exports) {
  let _ = require('lodash');
  let html = require('plugins/kibana/callflow/directives/array_fields.html');
  require('ui/modules').get('apps/callflow')
  .directive('ruleArrayField', function() {
    return {
      restrict: 'A',
      template: html,
      scope: {
        ruleValue: '=',
        ruleMaster: '='
      },
      link: function($scope) {

      }
    }
  })
})