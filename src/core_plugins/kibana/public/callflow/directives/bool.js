define(function (require, module, exports) {
  let _ = require('lodash');
  let html = require('plugins/kibana/callflow/directives/bool.html');
  require('ui/modules').get('apps/callflow')
  .directive('ruleBool', function() {
    return {
      restrict: 'A',
      template: html,
      scope: {
        ruleValue: '=',
        boolType: '=',
        ruleMaster: '='
      },
      link: function($scope) {
        $scope.getKey = function(obj) {
          return _.first(_.keys(obj));
        }
      }
    }
  })
})