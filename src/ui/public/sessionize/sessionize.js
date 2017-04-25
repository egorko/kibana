module.exports = function(indexPattern, courier) {
  
  let restoreTcap = new (require('./tcap'))(indexPattern, courier);
  let restoreSccp = new (require('./sccp'))(indexPattern, courier);
  let restoreIsup = new (require('./isup'))(indexPattern, courier);
  let restoreSess = new (require('./sessId'))(indexPattern, courier);
  
  this.setIndexPattern = function(indexPattern) {
    restoreTcap.setIndexPattern(indexPattern);
    restoreSccp.setIndexPattern(indexPattern);
    restoreIsup.setIndexPattern(indexPattern);
    restoreSess.setIndexPattern(indexPattern);
  }
  
  this.restore = function(docArray, callback) {
    let promiseArray = [];
    _.forEach(docArray, function(doc){
      let source = doc._source;
      if (_.has(source, 'tcap')) {
        promiseArray.push(new Promise(function(resolve, reject) {
          restoreTcap.restore(doc).then(function(resp){resolve(resp)});
        }))
      } else if (_.has(source, 'mtp3') && _.has(source, 'sccp')){
      if (_.has(source.mtp3, 'opc') && _.has(source.mtp3, 'dpc') && (_.has(source.sccp, 'src_local_ref') || _.has(source.sccp, 'dst_local_ref'))) {
        promiseArray.push(new Promise(function(resolve, reject) {
          restoreSccp.restore(doc).then(function(resp){resolve(resp)})
          }))
        }
      } else if (_.has(source, 'diameter')){
        if (_.has(source.diameter, 'session-id')) {
        let id = source.diameter['session-id'];
          promiseArray.push(new Promise(function(resolve, reject) {
          restoreSess.restore('diameter.session-id', id).then(function(resp){resolve(resp)})
          }))
        }
      } else if (_.has(source, 'sip')){
        if (_.has(source.sip, 'Call-ID')) {
        let id = source.sip['Call-ID'];
          promiseArray.push(new Promise(function(resolve, reject) {
          restoreSess.restore('sip.Call-ID', id).then(function(resp){resolve(resp)})
          }))
        }
      } else if (_.has(source, 'isup')) {
        promiseArray.push(new Promise(function(resolve, reject) {
          restoreIsup.restore(doc).then(function(resp){resolve(resp)});
        }))
      } else {
        promiseArray.push(new Promise(function(resolve, reject) {
          resolve([doc._id]);
        }))
      };
    });
    if (_.isEmpty(promiseArray)) {
      callback([]);
      return;
    }
    Promise.all(promiseArray).then(callback);
  }
}