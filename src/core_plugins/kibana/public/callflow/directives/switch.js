define(function (require, module, exports) {
  let _ = require('lodash');
  let html = require('plugins/kibana/callflow/directives/switch.html');
  require('ui/modules').get('apps/callflow')
  .directive('ruleSwitch', function() {
    return {
      restrict: 'A',
      template: html,
      scope: {
        ruleValue: '=',
        ruleMaster: '='
      },
      link: function($scope) {
        let ruleValue = $scope.ruleValue;
        $scope.condition = ruleValue.condition;
        $scope.keySet = _.keys(ruleValue.cases);
      }
    }
  })
})