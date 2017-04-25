import _ from 'lodash';
import Promise from 'bluebird';
import filesaver from '@spalger/filesaver';
let saveAs = filesaver.saveAs;
import uiModules from 'ui/modules';
let module = uiModules.get('app/discover');

import 'ui/filters/short_dots';

module.directive('kbnTableMenu', function (shortDotsFilter, $http, config) {
  var menuHtml = require('ui/doc_table/components/table_menu.html');
  return {
    restrict: 'A',
    scope: {
      filterArray: '=',
      indexPattern: '=?',
      rows: '='
    },
    template: menuHtml,
    controller: function ($scope, courier, getAppState) {
      let $state = getAppState();

      let sessionize = new (require('ui/sessionize'))($scope.indexPattern, courier);

      $scope.inProgress = false;
      
      $scope.sessionize = function() {
        sessionize.setIndexPattern($scope.indexPattern);
        $scope.inProgress = true;
        sessionize.restore(_.filter($scope.rows, function(value){ return value.selected }),
          function(values) { 
            $scope.inProgress = false;
            if (_.isEmpty(values)){
              return;
            }
            $state.query=null;
            $state.filters = null;
            $scope.filterArray('_id',_.uniq(_.flatten(values)), '+', 'or');
          });
      }
      
      $scope.exportPcap = function(){
       let pcapArray =
         _.uniq(
           _.compact(
             _.flatten(
               _.map(
                 _.filter( $scope.rows,
                   function(value){
                     return value.selected;
                   }), 
                 function(selectedRow){
                   pcapArray = selectedRow._source.source_pcaps;
                   return _.map(pcapArray, function(pcap) {
                     return '{' +
                       pcap.topic + ',' + 
                       pcap.partition + ',' + 
                       pcap.offset + ',' + 
                       pcap.msgCrc + 
                       '}';
                     })
                 })
             )
           )
         );
         let str = '[' + pcapArray.join(',') + ']';
         $http({
           url: "/pcapexport",
           method: 'POST',
           responseType: 'blob',
           data: str
         }).success(function(data, status, headers){
                    let disposition = headers('content-disposition');
           let filename = disposition.match(/filename="(.+)"/)[1];
                    saveAs(data, filename);
         })
         .error(function(data, status) {console.log(status)});
      };
    }
  };
});
