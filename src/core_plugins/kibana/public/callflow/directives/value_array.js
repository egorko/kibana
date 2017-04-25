define(function (require, module, exports) {
  let _ = require('lodash');
  let html = require('plugins/kibana/callflow/directives/value_array.html');
  require('ui/modules').get('apps/callflow')
  .directive('ruleValueArray', function() {
    return {
      restrict: 'A',
      template: html,
      scope: {
        ruleValue: '=',
        ruleMaster: '='
      },
      link: function($scope) {
        $scope.getSize = function(content) {
          return {
            'width': content.length + 'em'
          }
        }
        $scope.getKey = function(obj) {
          return _.first(_.keys(obj));
        }
        $scope.getValue = function(obj) {
          return obj[0];
        }
        
        $scope.setCurrent = function(event, hashKey) {
          console.log($scope.ruleValue);
          event.stopPropagation();
          if ($scope.ruleMaster.current.hash == hashKey && $scope.ruleMaster.current.type == 'general') {
            $scope.ruleMaster.current.hash = undefined;
            $scope.ruleMaster.current.type = '';
            $scope.ruleMaster.parent = undefined;
          } else {
            $scope.ruleMaster.current.hash = hashKey;
            $scope.ruleMaster.current.type = 'general';
            $scope.ruleMaster.parent = $scope.ruleValue;
          }
        }
        
        $scope.isSelected = function (hashKey) {
          return $scope.ruleMaster.current.hash == hashKey && $scope.ruleMaster.current.type == 'general';
        }
      }
    }
  })
})