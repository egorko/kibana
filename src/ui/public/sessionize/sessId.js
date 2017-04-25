module.exports = function(indexPattern, courier) {
  var scope  = {
    courier: courier,
    indexPattern: indexPattern
  }
  this.setIndexPattern = function(indexPattern) {
    scope.indexPattern = indexPattern;
  }
  this.restore = function(fieldName, sessID) {
    let query = fieldName + ":" + sessID;
    
    return getData(query, 0, 10000);
  }
  
  let getData = function(query, from, size) {
    return new Promise(function(resolve, reject){
	  let searchSource = scope.courier.createSource('search');
      searchSource.index(scope.indexPattern);
      searchSource.query({query_string: {query: query}});
      searchSource.size(size);
      searchSource.from(from);
      searchSource.sort([{'timestamp': {'order': 'asc', 'unmapped_type': 'boolean'}}]);
      scope.courier.fetchThis(searchSource)
        .then(function(resp){
		  let hits = resp.hits.hits;
		  let idArray = [];
		  _.forEach(hits, function(hit){
		    idArray.push(hit._id);
		  });
		  resolve(idArray);
		});
	});
  }
}