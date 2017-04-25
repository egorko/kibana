import _ from 'lodash';
define(function (require, module, exports) {
    console.log('load callflow module');
  let callFlowTabs = require('plugins/kibana/callflow/sections/index');
  var options = {};
  require('plugins/kibana/callflow/styles/main.less');
  require('ui/saved_objects/saved_object_registry').register(require('plugins/kibana/callflow/services/callflow_settings_register'));
  require('plugins/kibana/callflow/services/callflow_settings');
  
  require('ui/routes')
    .when('/callflow', {
      redirectTo: '/callflow/settings/'
  });
  
  require('ui/modules')
  .get('apps/callflow')
  .service('sharedSettings', function(){
      this.settings = undefined;
      this.state = undefined;
      this.indexPattern = undefined;
  })
  .directive('kbnCallflowApp', function (Private, $route, $timeout, timefilter, indexPatterns, kbnCredentials) {
    return {
      restrict: 'E',
      template: require('plugins/kibana/callflow/app.html'),
      transclude: {
        'buttons': '?callflowButtons',
        'body': 'callflowBody'
      },
      scope: {
        sectionName: '@section',
        settingId: '=?',
        options: '=?'
      },
      link: function ($scope, $el, $sce) {
        timefilter.enabled = true;

        $scope.getKbnURL = function(section) {
          return (settingId) ? (section.url + '/' + settingId) : section.url;
        }
        $scope.callFlowTabs = _.filter(callFlowTabs, function(tab) { return tab.condition(kbnCredentials) });
        $scope.callFlowTab = _.find($scope.callFlowTabs, { name: $scope.sectionName });
        $scope.callFlowTabs.forEach(function (section) {
          section.class = (section === $scope.callFlowTab) ? 'active' : void 0;
        });
	  }
	}
  })
});