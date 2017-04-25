let _ = require('lodash');
export default function mapTermsProvider(Promise, courier) {
  return function (filter) {
      let boolOps = {'or': 'should', 'and': 'must'};
      if (_.has(filter, 'meta.filter_array')) {
        let boolOper = filter.meta.filter_array.bool_op;
        return courier
        .indexPatterns
        .get(filter.meta.index).then(function (indexPattern) {
          let field = filter.meta.filter_array.field;
          let es_op = boolOps[boolOper];
          let value = _.map(filter.query.bool[es_op], function(obj) { return obj.term[field]});
          return { key: field, value: value };
        });
      } else 
      return Promise.reject(filter);
  };
};