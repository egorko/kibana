import _ from 'lodash';
import 'ui/filters/short_dots';
import headerHtml from 'ui/doc_table/components/table_header.html';
import uiModules from 'ui/modules';
let module = uiModules.get('app/discover');


module.directive('kbnTableHeader', function (shortDotsFilter) {
  return {
    restrict: 'A',
    scope: {
      columns: '=',
      sorting: '=',
      indexPattern: '=',
      rows: '=',
      filterArray: '='
    },
    template: headerHtml,
    controller: function ($scope) {

      let sortableField = function (field) {
        if (!$scope.indexPattern) return;
        let sortable = _.get($scope.indexPattern.fields.byName[field], 'sortable');
        return sortable;
      };

      $scope.tooltip = function (column) {
        if (!sortableField(column)) return '';
        return 'Sort by ' + shortDotsFilter(column);
      };
      
      let iterateObj = function(obj, fieldMap) {
        let bufObj = obj;
        if (fieldMap.indexOf('.') == -1) return bufObj[fieldMap];
        let fieldArray = fieldMap.split('.');
        fieldArray.forEach(function(field) {
          if( bufObj[field] ) {
            bufObj = bufObj[field];
          }
        });
        return bufObj;
      }

      $scope.multiFilter = function (field, operation, boolOp) {
      $scope.filterArray(
        field, 
        _.uniq(
          _.map(
            _.filter($scope.rows, function(row) {
              return row.selected;
            })
            ,function(row){
              return iterateObj(row._source, field);
            }
          )
        ), 
        operation, 
        boolOp);
      };

      $scope.canRemove = function (name) {
        return (name !== '_source' || $scope.columns.length !== 1);
      };

      $scope.headerClass = function (column) {
        if (!sortableField(column)) return;

        let sorting = $scope.sorting;
        let defaultClass = ['fa', 'fa-sort-up', 'table-header-sortchange'];

        if (!sorting || column !== sorting[0]) return defaultClass;
        return ['fa', sorting[1] === 'asc' ? 'fa-sort-up' : 'fa-sort-down'];
      };

      $scope.moveLeft = function (column) {
        let index = _.indexOf($scope.columns, column);
        if (index === 0) return;

        _.move($scope.columns, index, --index);
      };

      $scope.moveRight = function (column) {
        let index = _.indexOf($scope.columns, column);
        if (index === $scope.columns.length - 1) return;

        _.move($scope.columns, index, ++index);
      };

      $scope.toggleColumn = function (fieldName) {
        _.toggleInOut($scope.columns, fieldName);
      };

      $scope.sort = function (column) {
        if (!column || !sortableField(column)) return;

        let sorting = $scope.sorting = $scope.sorting || [];

        let direction = sorting[1] || 'asc';
        if (sorting[0] !== column) {
          direction = 'asc';
        } else {
          direction = sorting[1] === 'asc' ? 'desc' : 'asc';
        }

        $scope.sorting[0] = column;
        $scope.sorting[1] = direction;
      };
      
      $scope.asAllSelected = false;
      
      $scope.selectAll = function(){
        _.forEach($scope.rows, function(row){
          row.selected = $scope.isAllSelected;
        })
      }
    }
  };
});
