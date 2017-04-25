import StateProvider from 'ui/state_management/state';
define(function (require) {
  var Promise = require('bluebird');
  var saveAs = require('@spalger/filesaver').saveAs;
  require('ui/directives/css_truncate');
  require('ui/typeahead');
  require('ui/grut_builder');
  require('ui/sequence_diagram');
  
  var _ = require('lodash');
  
  var parser = require('plugins/kibana/callflow/utils/parser');

  require('ui/routes')
  .when('/callflow/callflow/:id?', {
    template: require('plugins/kibana/callflow/sections/callflow/index.html'),
    reloadOnSearch: false,
    resolve: {
      ip: function (Promise, courier, config, $location, Private) {
        const State = Private(StateProvider);
        return courier.indexPatterns.getIds()
        .then(function (list) {
        /**
         *  In making the indexPattern modifiable it was placed in appState. Unfortunately,
         *  the load order of AppState conflicts with the load order of many other things
         *  so in order to get the name of the index we should use, and to switch to the
         *  default if necessary, we parse the appState with a temporary State object and
         *  then destroy it immediatly after we're done
         *
         *  @type {State}
         */
        const state = new State('_a', {});

        const specified = !!state.index;
        const exists = _.contains(list, state.index);
        const id = exists ? state.index : config.get('defaultIndex');
        state.destroy();

        return Promise.props({
          list: list,
          loaded: courier.indexPatterns.get(id),
          stateVal: state.index,
          stateValFound: specified && exists
        });
      });
      },
      settings: function(callflowSettings, $route, courier) {
        if ($route.current.params.id) {
          return callflowSettings.get($route.current.params.id)
          .catch(function(err){
            console.log(err);
          })
        } else {
          return callflowSettings.get();
        }          
      }
    }
  });
  
  require('ui/modules').get('apps/callflow')
  .controller('callflow', function($scope, $route, $http, AppState, config, courier, timefilter, kbnCredentials, sharedSettings){
    
    let searchSource = courier.createSource('search');
    $scope.diagramObject = [];
    $scope.indexPatternList = [];
    $scope.protocolList = [];
    $scope.diagramStatus = "Sequence Diagram";
    $scope.indexPattern = resolveIndexPatternLoading();
    $scope.selectedID = "";
    $scope.selectedSeqID = "";
    $scope.grutObject = {};
    $scope.showThis = true;
    $scope.format = "es";
    $scope.switchShowIndexPatternSelection = function() {
      $scope.showIndexPatternSelection = !$scope.showIndexPatternSelection
    }
    
    if (sharedSettings.state != undefined) {
      $scope.state = sharedSettings.state;
      $scope.state.save();
      $scope.indexPattern = sharedSettings.indexPattern;
    } else {
      $scope.state = new AppState({
        query: searchSource.get('query') || '',
        index: $scope.indexPattern.id,
        interval: 'auto',
      });
      sharedSettings.state = $scope.state;
      sharedSettings.indexPattern = $scope.indexPattern;
      console.log(sharedSettings.indexPattern);
    }
    
    var $state = $scope.state;
    
    $scope.subsIDs = $state.query;
    let flowObject = {};
    let detailedMessage = {}
    let diagramData = {};
    
    var settings = $scope.settings = $route.current.locals.settings;
    
    if ((sharedSettings.settings != undefined) && ((settings.id == sharedSettings.settings.id) || (settings.id == undefined))) {
      settings = $scope.settings = sharedSettings.settings;
    }
    
    let opts = $scope.opts = {};
    
    let sessionize = new (require('ui/sessionize'))($scope.indexPattern, courier);
    		
    $scope.init = function(){
      timefilter.enabled = true;
      $scope.indexPatternList = $route.current.locals.ip.list;
      opts = $scope.opts = {
        sampleSize: config.get('discover:sampleSize'),
        settings: settings,
        protocolColors: angular.fromJson(settings.protocolColorsJSON),
        font: angular.fromJson(settings.fontJSON),
        rule: angular.fromJson(settings.ruleJSON)
      };
    }
    
    function resolveIndexPatternLoading() {
      var props = $route.current.locals.ip;
      var loaded = props.loaded;
      var stateVal = props.stateVal;
      var stateValFound = props.stateValFound;

      var own = searchSource.getOwn('index');

      if (own && !stateVal) return own;
      if (stateVal && !stateValFound) {
        var err = '"' + stateVal + '" is not a configured pattern. ';
        if (own) {
          notify.warning(err + ' Using the saved index pattern: "' + own.id + '"');
          return own;
        }

        notify.warning(err + ' Using the default index pattern: "' + loaded.id + '"');
      }
      return loaded;
    }
    
    $scope.switchFormat = function() {
      if ($scope.format == 'es') {
        $scope.format = 'tshark';
      } else {
        $scope.format = 'es';
      }
    }
    
    $scope.getFormatClass = function(format) {
      if (format == $scope.format) {
        return 'format-name-active';
      } else {
        return 'format-name-passive';
      }
    }
    
    $scope.setIndexPattern = function(id){
      courier.indexPatterns.get(id).then(function(indexPattern){
        $state.index = id;
        $state.save();
        $scope.indexPattern = indexPattern;
        sessionize.setIndexPattern(indexPattern);
        sharedSettings.indexPattern = $scope.indexPattern;
        $scope.showIndexPatternSelection = false;
      });
    }
    
    $scope.showExportButton = function() {
      return !(_.get($scope.grutObject, 'raw.source_pcaps') == undefined);
    }
    
    let getTshark = function(pcapArray) {
      return new Promise(function(resolve, reject) {
        let str = '[' +
          _.map(pcapArray, function(pcap) {
            return '{' +
              pcap.topic + ',' +
              pcap.partition + ',' +
              pcap.offset + ',' +
              pcap.msgCrc +
              '}';
            })
          .join(',') +
        ']';
        $http({
          url: "/pcapexport/json",
          method: 'POST',
          data: str,
          transformResponse: [function (data) {
            return _.map(strToArray(data), function(str) {
                let jsonObj = strToObject(str);
                let id = jsonObj.topic + '_' + jsonObj.partition + '_' + jsonObj.offset;
                let source = strToObject(jsonObj.source);
                let strLayers = source.layers;
                let chunkNum = 0;
                
                let layers = _.flatten(_.map(strToObjArray(strLayers), function(layer){
                  let value = angular.fromJson(layer.value);
                  if (layer.name == 'sctp') {
                    let sackKey = _.find(_.keys(value), function(key) {
                      return key.indexOf('SACK chunk') != -1;
                    });
                    let dataKey = _.find(_.keys(value), function(key) {
                      return key.indexOf('DATA chunk') != -1;
                    });
                    let outVal = [];
                    if (!_.isUndefined(sackKey)) {
                      chunkNum++;
                      outVal.push(
                        {
                          name: layer.name,
                          chunk: chunkNum,
                          value: _.omit(value, dataKey)
                        }
                      );
                    }
                    if (!_.isUndefined(dataKey)) {
                      chunkNum++;
                      outVal.push(
                        {
                          name: layer.name,
                          chunk: chunkNum,
                          value: _.omit(value, sackKey)
                        }
                      );
                    }
                    return outVal;
                  } else {
                    return {
                      name: layer.name,
                      chunk: chunkNum,
                      value: value
                    }
                  }
                }));
                return {
                  id: id,
                  layers: layers
                };
            });
          }]
        }).success(function(data, status, headers){
          let frameNum = 1;
          let tsharkResp = {};
          _.forEach(data, function(frame) {
            let keyName = 'frame' + frameNum;
            let pcap = _.find(pcapArray, function(pcap){
              let id = pcap.topic + '_' + pcap.partition + '_' + pcap.offset;
              return id == frame.id;
            })
            let chunk = pcap.chunkId;
            frame.layers = _.filter(frame.layers, function(layer){
              return chunk == _.get(layer, 'chunk', chunk);
            })
            tsharkResp[keyName] = frame;
          })
          resolve(tsharkResp);
        })
        .error(function(data, status) {
          console.log(status)
          reject(null);
        });
      });
    }
    
    let strToObject = function(str) {
      let objArray = strToObjArray(str);
      let retVal = {};
      _.forEach(objArray, function(obj){
        retVal[obj.name] = obj.value;
      })
      return retVal;
    }
    
    let strToObjArray = function(str) {
      str = str.trim();
      let len = str.length;
      str = str.substring(1, len - 2).trim();
      len = str.length;
      let quoted = false;
      let brCnt = 0;
      let isObj = false;
      let key = '';
      let value = '';
      let position = 'k';
      let obj = [];
      for (pos =  0; pos < len; pos++) {
        if (!quoted && str[pos] == '{') {
          brCnt++;
        } else if (!quoted && str[pos] == '}') {
          brCnt--;
        }
        isObj = brCnt > 0;
        if (str[pos] == '"' && !isObj) {
          quoted = !quoted;
        } else if (!quoted && !isObj && str[pos] == ':') {
          position = 'v';
        } else if (!quoted && !isObj && str[pos] == ',') {
          position = 'k';
          obj.push({
            name: key.trim(),
            value: value.trim() 
          })
          key = '';
          value = '';
        } else if (position == 'k') {
          key += str[pos];
        } else {
          value += str[pos];
        }
      }
      obj.push({
        name: key.trim(),
        value: value.trim() 
      })
      return obj;
    }
    
    let strToArray = function(str) {
      str = str.trim();
      let len = str.length;
      let array = [];
      let strBuf = '';
      brCnt = 0;
      for (pos = 0; pos < len; pos++) {
        if (str[pos] == '[') {
          brCnt++;
        } else if (str[pos] == ']') {
          brCnt--;
        } else if (brCnt > 0) {
          strBuf += str[pos];
        } else if (brCnt == 0) {
          if (strBuf.length > 0) {
            array.push(strBuf.trim());
            strBuf = '';
          }
        }
      }
      if (strBuf.length > 0) {
        array.push(strBuf.trim());
      }
      return array;
    }

    $scope.exportPcap = function(){
      let pcapArray = _.get($scope.grutObject, 'raw.source_pcaps');
      let str = '[' +
        _.map(pcapArray, function(pcap) {
          return '{' +
            pcap.topic + ',' +
            pcap.partition + ',' +
            pcap.offset + ',' +
            pcap.msgCrc +
            '}';
          })
        .join(',') +
      ']';

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
    }

    $scope.actions = {
      getClass: function(id) {
        return [
          {'stroked': $scope.selectedID == id},
          {'red-color': isSeqSelected(id)}
        ]
      },
      showID: function(id) {
        let docs = _.find($scope.diagramObject.diagramm, function(doc){
          return doc.id == id;
        });

        $scope.grutObject = docs;
        getTshark(docs.raw.source_pcaps).then(function(resp){
          $scope.grutObject.tshark = resp;
          $scope.$apply()
        });
      }
    }
    
    let isSeqSelected = function(id) {
      let seqID = getSeqID(id);
      return seqID == $scope.selectedSeqID;
    }
    
    $scope.$on('applySettings', function(event, data){
      $scope.settingsData = data;
    })
    
    var getSeqID = function(id){
      return _.findKey(flowObject, function(ids){
        return _.contains(ids, id);
      });
    }
    
    var parseSubsIDs = function(subsIDs){
      $scope.diagramStatus = "Parsing query string";
      return '(' + _.map(subsIDs.split(','), function(subsID){
        return subsID.trim();
      }).join(' OR ') + ')';
    }
    
    let getDiagramData = function(subsIDs){
      $state.query = subsIDs;
      $state.save();
      return findIDs(parseSubsIDs(subsIDs));
    }
    
    let getProtocolObject = function(protocolName) {
      return _.find($scope.protocolList, function(protocol){
        return protocol.name == protocolName;
      })
    }
    
    $scope.switchProtocol = function(protocol){
      protocol.enabled = !protocol.enabled;
      drawDiagram(diagramData);
    }
    
    let drawDiagram = function(data, aply) {
        $scope.diagramObject = {
          font:   opts.font,
          colors: opts.protocolColors,
          sessions: flowObject,
          diagramm: _.filter(data, function(dataEntry){
            return getProtocolObject(dataEntry.protocol).enabled;
          })
        };
        $scope.diagramStatus = "Sequence Diagram";
        if (aply) {
          $scope.$apply();
        }
    }
    
    let createProtocolList = function(data) {
      $scope.protocolList = _.map(_.uniq(_.map(data, function(doc){
        return doc.protocol;
      })), function(protocolName){
        return {
          name: protocolName,
          enabled: true
        }
      });
    }
    
    $scope.drawDiagram = function(val){
      
      $scope.grutObject = {};
      getDiagramData(val).then(function(data){
        diagramData = data;
        createProtocolList(data);
        drawDiagram(data, true);        
      });
    }
    

    let getTime = function(strData) {
      let time = strData.split('T')[1].split('+')[0];
      let date = strData.split('T')[0];
      //let tz = strData.split('+')[1];
      return date.substring(0,4) + '-' + date.substring(4,6) + '-' + date.substring(6,8) + ' ' +
        time.substring(0,2) + ':' + time.substring(2,4) + ':' + time.substring(4);
    }
    
    let getInventoryNames = function(ipArray) {
      return new Promise(function(resolve, reject) {
        let promiseArray = [];
        let prefix = 'ip://';
        let ipArrayWithPrefix = _.map(ipArray, function(ip) { return prefix + ip});
        $http({
          url: "/inventory/keys",
          data: ipArrayWithPrefix,
          method: 'POST'
        }).success(function(data){
          resolve(
            arrayToMap(_.map(ipArray, function(ip) {
              let key = prefix + ip;
              let nameObj = _.find(data, function(obj) { return obj.key == key}) || {key: key, value: ip};
              return {
                ip: ip,
                name: nameObj.value
              }
            }))
          )
        })
        .error(function(data, status) {
          console.log('error');
          resolve(arrayToMap(_.map(ipArray, function(ip) {
            return {
                ip: ip,
                name: ip
              }
            })
          ))
        });
      })
    }

    let arrayToMap = function(array) {
      let resolveObj = {};
      _.forEach(array, function(obj){
        resolveObj[obj.ip] = obj.name;
      })
      return resolveObj;
    }

    let findIDs = function(subsIDs){
      $scope.diagramStatus = "Get docs of selected sessIDs";
      return new Promise(function(resolve, reject){
        if (subsIDs == "") {
          reject([]);
        }
        
        searchSource.index($scope.indexPattern);
        searchSource.query({query_string: {query: 'subsID:' + subsIDs}});
        searchSource.sort([{'timestamp': {'order': 'asc', 'unmapped_type': 'boolean'}}]);
        searchSource.size(500);
        courier.fetchThis(searchSource)
          .then(function(resp){
            $scope.diagramStatus = "Sessionize " + resp.hits.hits.length + " documents";
            sessionize.restore(resp.hits.hits, function(values) {
              if (_.isEmpty(values)){
                resolve([]);
                return;
              }
              flowObject = {};
              let flatIDs = _.uniq(_.flatten(values));
              _.forEach(values, function(value){
                let firstID = value[0];
                if (!_.has(flowObject, firstID)) {
                  flowObject[firstID] = value;
                }
              });

              $scope.diagramStatus = "Get sessions of " + flatIDs.length + " docs";
              let queryString = '_id:(' + flatIDs.join(' OR ') + ')';
              searchSource.query({query_string: {query: queryString}});
              searchSource.size(10000);
              courier.fetchThis(searchSource)
              .then(function(resp){
                let items = resp.hits.hits;
                getInventoryNames(_.uniq(_.flatten(_.map(items, function(item){
                  let doc = item._source;
                    return [doc.ip_src, doc.ip_dst];
                  }))
                  )
                ).then(function(ipMap){
                  resolve(_.map(items, function(item){
                      let doc = item._source;

                      let flowItem = {};

                      //flowItem.srcName = doc.srcNode_ip || doc.ip_src;
                      //flowItem.dstName = doc.dstNode_ip || doc.ip_dst;

                      flowItem.srcName = ipMap[ doc.ip_src ];
                      flowItem.dstName = ipMap[ doc.ip_dst ];

                      flowItem.datetime = getTime(doc.timestamp);
                      flowItem.message = parser(opts.rule, doc);
                      flowItem.raw = doc;
                      flowItem.id = item._id;

                      flowItem.protocol = doc.app_proto;
                      return flowItem;
                    })
                  );
                });
              })
            });
          });
        });
    }
  });
  return {
    order: Infinity,
    name: 'callflow',
    condition: function(credentials) {
	  return true;
	},
    display: 'CallFlow',
    url: '#/callflow/callflow'
  };
});
