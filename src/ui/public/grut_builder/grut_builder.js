define(function (require, module, exports) {
  let _ = require('lodash');
  let template = require('./grut_builder.html');
  require('ui/modules').get('kibana')
  .directive('grut', function($compile) {
    return {
      restrict: 'A',
      template: template,
      scope: {
        grutObject: '=',
        root: '='
      },
      link: function($scope, $element) {
        $scope.objects = {};
        $scope.keys = {};
        
        $scope.$watchCollection('grutObject', function(newGrut){
          $scope.objects = getObjects(newGrut);
          $scope.keys = getKeys(newGrut);
        })

        let getObjects = function(grut) {
          return _.map(_.filter(_.keys(grut), function(key){
                          return _.isObject(grut[key]);
                        }).sort(), 
                      function(key){
                        if (_.has(grut, key + '.name') && _.has(grut, key + '.value')) {
                          return {
                            key: grut[key].name,
                            value: grut[key].value,
                          }
                        } else {
                          return {
                            key: key.replace(/ /g,'_'),
                            value: grut[key],
                          }
                        }
                      }
                  );
        }
        let getKeys = function(grut) {
          return _.map(_.filter(_.keys(grut), function(key){
                          return !_.isObject(grut[key]);
                        }).sort(),
                      function(key){
                        return key.replace(/ /g,'_');
                      }
                  );
        }
        $scope.getValue = function(key){
          return $scope.grutObject[key];
        }
        /*
        $scope.$watch('grutObject', function(newGrut){
          
          if ($scope.root) {
            $element.html('');
          }
          let passiveElement = "";
          let $passiveScope = $scope.$new();
          _.forEach(_.keys(newGrut).sort(), function(key){
            let showSwitch = "";
            if (!$scope.root){
              showSwitch = ' ng-show="$parent.$parent.showChild"';
            }
            if (_.isObject(newGrut[key])) {
              let node ="['" + key + "']";
              let keyName = key.replace(/ /g,'&nbsp;');
              if (_.isArray(newGrut)) {
                node = "[" + key + "]";
              }
              if (_.has(newGrut, key + '.name') && _.has(newGrut, key + '.value')) {
                keyName = newGrut[key].name;
                node = "[" + key + "].value";
              }
              let $newScope = $scope.$new();
              let content = 
                '<ul class="detailed-message-group"' + showSwitch + ' ng-click="switchNode($event)" grut grut-object="grutObject' + node + '">' + 
                '<span class="group-text">' + 
                '<i class="fa fa-caret-right" aria-hidden="true" ng-show="!showChild"></i>' + 
                '<i class="fa fa-caret-down"  aria-hidden="true" ng-show="showChild"></i>' +
                keyName + '</span></ul>';
              
              $newScope.showChild = false;
              $newScope.showNode = false;
              
              $newScope.switchNode = function($event){
                $event.stopPropagation();
                $newScope.showChild = !$newScope.showChild;
              }
              
              $element.append($compile(content)($newScope));
            } else {
              passiveElement += '<li' + showSwitch + ' class="detailed-message-item"><span>' + key.replace(/ /g,'&nbsp;') + ':</span>&nbsp;' + newGrut[key] + '</li>';
            }
          });

          
          $passiveScope.showNode = false;
          $element.append($compile(passiveElement)($passiveScope));
        })
        */
      }
    }
  })
})
