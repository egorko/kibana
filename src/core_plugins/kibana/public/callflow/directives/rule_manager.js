define(function (require, module, exports) {
  let _ = require('lodash');
  let html = require('plugins/kibana/callflow/directives/rule_manager.html');
  require('ui/modules').get('apps/callflow')
  .directive('ruleManager', function() {
    return {
      restrict: 'A',
      template: html,
      scope: {
        ruleMaster: '='
      },
      link: function($scope) {
        let index = -1;
        let ruleMaster = $scope.ruleMaster;
        $scope.$watch('ruleMaster', function(newRule) {
          console.log('ruleMaster changed');
          console.log(ruleMaster.parent);
          console.log(ruleMaster.current.hash);
          if (ruleMaster.parent == undefined) {
            $scope.canMoveUp = false;
            $scope.canMoveDown = false;
          } else {
              index = _.findIndex(ruleMaster.parent, function(element) {
              console.log(element);
              console.log(element.$$hashKey);
              return element.$$hashKey == ruleMaster.current.hash;
            });
            console.log(index);
            $scope.canMoveUp = !(index == 0);
            $scope.canMoveDown = (index < ruleMaster.parent.length - 1);

          }
        }, true);
        
        $scope.moveDown = function() {
          let tmpObj = ruleMaster.parent[index];
          ruleMaster.parent[index] = ruleMaster.parent[index + 1];
          ruleMaster.parent[index + 1] = tmpObj;
        }
        
        $scope.moveUp = function() {
          let tmpObj = ruleMaster.parent[index];
          ruleMaster.parent[index] = ruleMaster.parent[index - 1];
          ruleMaster.parent[index - 1] = tmpObj;
        }
      }
    }
  })
});