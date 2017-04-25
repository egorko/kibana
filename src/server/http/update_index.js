const elasticsearch = require('elasticsearch');
module.exports = function(index, config) {
  return new Promise(function(resolve, reject) {
    try {
      let client = new elasticsearch.Client({
        host: config.get('elasticsearch.url'),
        log: "error"
      });
      client.index({
        index: index,
        type: 'config',
        id: config.get('pkg.version'),
        body: {
          buildNum: config.get('pkg.version')
        }
      }).then(
      function (resp) {
        resolve({
          status: 'success',
          index_name: index
        });
      },
      function (err) {
        reject({ status: 'failed to update index data', error: err});
      })
    } catch (ex) {
      reject({
        status: 'failed to update index data',
        error: ex
      })
    }
  });
}