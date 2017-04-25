define(function (require, module, exports) {
  let _ = require('lodash');
  let html = require('plugins/kibana/callflow/directives/if.html');
  require('ui/modules').get('apps/callflow')
  .directive('ruleIf', function() {
    return {
      restrict: 'A',
      template: html,
      scope: {
        ruleValue: '=',
        ruleMaster: '=',
        showThis: '=',
        elementKey: '='
      },
      link: function($scope) {
        let hash = $scope.hash = $scope.elementKey;
        $scope.showThis = true;
        let conditionCollection = ['exists', 'equals', 'and', 'or'];
        
        $scope.conditionKey = _.find(_.keys($scope.ruleValue), function(key){
            return _.includes(conditionCollection, key);
          });
        $scope.conditionValue = _.get($scope.ruleValue, $scope.conditionKey);
        
        $scope.hasTrue = function() {
          return _.has($scope.ruleValue, 'true');
        }
        $scope.hasFalse = function() {
          return _.has($scope.ruleValue, 'false');
        }
        
        $scope.setSelected = function(event, type) {
          event.stopPropagation();
          if ($scope.ruleMaster.current.hash == hash && $scope.ruleMaster.current.type == type) {
            $scope.ruleMaster.current.hash = undefined;
            $scope.ruleMaster.current.type = '';
            $scope.ruleMaster.parent = undefined;
          } else {
            $scope.ruleMaster.current.hash = hash;
            $scope.ruleMaster.current.type = type;
            $scope.ruleMaster.parent = undefined;
          }
        }
        
        $scope.isSelected = function (hashKey, type) {
          return $scope.ruleMaster.current.hash == hashKey && $scope.ruleMaster.current.type == type;
        }
      }
    }
  })
})