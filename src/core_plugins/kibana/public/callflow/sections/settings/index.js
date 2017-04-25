define(function (require) {
  var _ = require('lodash');
  //var ConfigTemplate = require('ui/ConfigTemplate');
  
  require('ui/notify');
  require('ui/sequence_diagram');
  //require('plugins/kibana/callflow/directives/rules');
  
  require('ui/routes')
  .when('/callflow/settings', {
    template: require('plugins/kibana/callflow/sections/settings/index.html'),
    resolve: {
      settings: function(callflowSettings) {
        return callflowSettings.get();
      }
    }
  }).when('/callflow/settings/:id?', {
    template: require('plugins/kibana/callflow/sections/settings/index.html'),
    resolve: {
      settings: function(callflowSettings, $route, courier) {
        return callflowSettings.get($route.current.params.id)
        .catch(function(err){
          console.log(err);
        })
          
      }
    }
  });

  require('ui/modules').get('apps/callflow')
  .controller('callflowSettingsCtl', function($scope, $route, callflowSettings, config, courier, Notifier, kbnUrl, timefilter, kbnCredentials, sharedSettings){
    
    var notify = new Notifier({
      location: 'CallFlow'
    });
    
    var settings = $scope.settings = $route.current.locals.settings;
    
    if ((sharedSettings.settings != undefined) && ((settings.id == sharedSettings.settings.id) || (settings.id == undefined))) {
      settings = $scope.settings = sharedSettings.settings;
    } else {
      sharedSettings.settings = settings;
    }
    
    $scope.opts = {};
    
    $scope.ruleMaster = {
      current: ""
    }
    
    $scope.init = function(){
      $scope.diagramID = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      _.assign($scope.opts,
        {
          sampleSize: config.get('discover:sampleSize'),
          settings: settings,
          rule: angular.fromJson(settings.ruleJSON),
          protocolColors: angular.fromJson(settings.protocolColorsJSON),
          font: angular.fromJson(settings.fontJSON)
        });
      generateDiagramm();
    };
    /*
    $scope.configTemplate = new ConfigTemplate({
      load: require('plugins/kibana/callflow/partials/load_settings.html'),
      save: require('plugins/kibana/callflow/partials/save_settings.html')
    });
    */
    $scope.opts.saveSettings = function() {
      settings.id = settings.title;
      settings.save()
        .then(function (id) {
          if (id) {
            notify.info('Saved Data Source "' + settings.title + '"');
            if (settings.id !== $route.current.params.id) {
              kbnUrl.change('/callflow/settings/{{id}}', { id: settings.id });
            } else {
              // Update defaults so that "reload saved query" functions correctly
              //$state.setDefaults(getStateDefaults());
            }
          }
        });
    }
    $scope.topNavMenu = [{
      key: 'new',
      description: 'New CallFlow settings',
      run: function () { newQuery(); },
      testId: 'callflowNewButton',
    }, {
      key: 'save',
      description: 'Save Callflow settings',
      template: require('plugins/kibana/callflow/partials/save_settings.html'),
      testId: 'callflowSaveButton',
    }, {
      key: 'open',
      description: 'Open Saved Callflow settings',
      template: require('plugins/kibana/callflow/partials/load_settings.html'),
      testId: 'callflowOpenButton',
    }];
  
    let newQuery = function() {
      callflowSettings.get().then(function(newSetting){
        settings = $scope.settings = sharedSettings.settings = newSetting;
        $scope.init();  
      });      
    }
    
    $scope.changeSettings = function(){
      settings.protocolColorsJSON = angular.toJson($scope.opts.protocolColors);
      settings.fontJSON = angular.toJson($scope.opts.font);
      generateDiagramm();
    }
    
    let protocolList = $scope.protocolList = ['cap', 'map', 'aiu', 'isup', 'sip', 'diameter'];
    let fontList = $scope.fontList = [
      {name: 'Georgia', value: 'Georgia, serif'},
      {name: 'Palatino Linotype', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif'},
      {name: 'Times New Roman', value: '"Times New Roman", Times, serif'},
      {name: 'Arial', value: 'Arial, Helvetica, sans-serif'},
      {name: 'Arial Black', value: '"Arial Black", Gadget, sans-serif'},
      {name: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif'},
      {name: 'Impact', value: 'Impact, Charcoal, sans-serif'},
      {name: 'Lucida Sans Unicode', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif'},
      {name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif'},
      {name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif'},
      {name: 'Verdana', value: 'Verdana, Geneva, sans-serif'},
      {name: 'Courier New', value: '"Courier New", Courier, monospace'},
      {name: 'Lucida Console', value: '"Lucida Console", Monaco, monospace'}
    ];
    let fontSizes = $scope.fontSizes = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
    //console.log(_.sortBy(colorList, 'value'));
    
    let generateDiagramm = function() {
      $scope.diagramObject = {
        font: $scope.opts.font,
        colors: $scope.opts.protocolColors,
        diagramm: _.map(protocolList, function(protocolName) {
            return {
              srcName: 'Source',
              dstName: 'Destination',
              message: protocolName,
              protocol: protocolName
            }
          })
      };
    }
  })

  return {
    order: Infinity,
    name: 'settings',
    condition: function(credentials) {
	  return true;
	},
    display: 'Settings',
    url: '#/callflow/settings'
  };
});
