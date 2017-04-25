import _ from 'lodash';
import Scanner from 'ui/utils/scanner';
import 'plugins/kibana/callflow/services/_callflow_settings';
import uiModules from 'ui/modules';
const module = uiModules.get('app/callflow');
import { SavedObjectLoader } from 'ui/courier/saved_object/saved_object_loader';

// bring in the factory


// Register this service with the saved object registry so it can be
// edited by the object editor.
require('plugins/kibana/management/saved_object_registry').register({
  service: 'callflowSettings',
  title: 'callflow settings'
});

// This is the only thing that gets injected into controllers
module.service('callflowSettings', function (CallFlowSettings, kbnIndex, esAdmin, kbnUrl) {
  return new SavedObjectLoader(CallFlowSettings, kbnIndex, esAdmin, kbnUrl);
});
/*
module.service('callflowSettings', function (Promise, CallFlowSettings, kbnIndex, esAdmin, kbnUrl) {
  var scanner = new Scanner(esAdmin, {
    index: kbnIndex,
    type: 'callflow_settings'
  });
  
  this.type = CallFlowSettings.type;
  this.Class = CallFlowSettings;


  this.loaderProperties = {
    name: 'callflow settings',
    noun: 'Callflow Settings',
    nouns: 'callflow settings'
  };

  this.get = function (id) {
    return (new CallFlowSettings(id)).init();
  };

  this.urlFor = function (id) {
    return kbnUrl.eval('#/callflow/settings/{{id}}', {id: id});
  };

  this.delete = function (ids) {
    ids = !_.isArray(ids) ? [ids] : ids;
    return Promise.map(ids, function (id) {
      return (new CallFlowSettings(id)).delete();
    });
  };

  this.scanAll = function (queryString, pageSize = 1000) {
    return scanner.scanAndMap(queryString, {
      pageSize,
      docCount: Infinity
    }, (hit) => this.mapHits(hit));
  };

  this.mapHits = function (hit) {
    var source = hit._source;
    source.id = hit._id;
    source.url = this.urlFor(hit._id);
    return source;
  };

  this.find = function (searchString, size = 100) {
    var body;
    if (searchString) {
      body = {
        query: {
          simple_query_string: {
            query: searchString + '*',
            fields: ['title^3', 'description'],
            default_operator: 'AND'
          }
        }
      };
    } else {
      body = { query: {match_all: {}}};
    }

    return esAdmin.search({
      index: kbnIndex,
      type: 'callflow_settings',
      body: body,
      size: size
    })
    .then((resp) => {
      return {
        total: resp.hits.total,
        hits: resp.hits.hits.map((hit) => this.mapHits(hit))
      };
    });
  };
});
*/