define(function (require, module, exports) {
  let _ = require('lodash');
  let Raphael = require('raphael');
  let Schema = require('./schema');
  require('ui/modules').get('kibana')
  .directive('sequenceDiagram', function($compile) {
    return {
      restrict: 'E',
      scope: {
        diagram: '=',
        actions: '=?'
      },
      link: function($scope, $element) {

        let footer = Raphael($element[0], 10, 10);
        let body = Raphael($element[0], 10, 10);
        let header = Raphael($element[0], 10, 10);
        let schema = new Schema(header, body, footer);
        
        $scope.$watch('diagram', function(diagramObject){
          schema.clear();
          schema.setSessions(diagramObject.sessions);
          schema.setFont(diagramObject.font);
          schema.setColors(diagramObject.colors);
          if ($scope.actions != null) {
            schema.setSelectIdAction($scope.actions.showID);
          }
          _.forEach(diagramObject.diagramm, function(el){
            schema.addMessage(el);
          });
         schema.drawDiagram();
        });
      }
    }
  })
})
