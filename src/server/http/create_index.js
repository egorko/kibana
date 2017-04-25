const elasticsearch = require('elasticsearch');
const _ = require('lodash');

module.exports = function(index, config) {
  return new Promise(function(resolve, reject) {
    try {
      let client = new elasticsearch.Client({
        host: config.get('elasticsearch.url'),
        log: "error"
      });
      client.indices.create({
        index: index,
        body: {
          settings: {
            number_of_shards: 1
          },
          mappings: {
            config: {
              properties: {
                buildNum: {
                  type: 'string',
                  index: 'not_analyzed'
                }
              }
            },
          server: {
            properties: {
              uuid: {
                type: 'keyword'
              }
            }
          }
          }
        }
      }).then(
      function (resp) {
        resolve({
          status: 'success',
          details: 'create',
          index_name: index
        });
      },
      function (err) {
        if(_.get(err, 'body.error.type') == 'index_already_exists_exception') {
          resolve({
            status: 'success',
            details: 'update',
            index_name: index
          });
        } else {
          reject({ status: 'failed to create index ' + index_name, error: err});
        }
      })
    } catch (ex) {
      reject({
        status: 'failed to create index ' + index_name,
        error: ex
      })
    }
  });
}