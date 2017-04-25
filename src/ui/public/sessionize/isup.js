module.exports = function(indexPattern, courier) {
  var scope  = {
    courier: courier,
    indexPattern: indexPattern
  }
  this.setIndexPattern = function(indexPattern) {
    scope.indexPattern = indexPattern;
  }
  this.restore = function(doc) {
    let opc = doc._source.mtp3.opc;
    let dpc = doc._source.mtp3.dpc;
    let cic = doc._source.isup.cic;
    let currentId = doc._id;
    
    return getData(opc, dpc, cic, 0, 10000, currentId);
  }
  
  var createQuery = function(opc, dpc, cic) {
    return "   ((mtp3.opc:" + opc + " AND mtp3.dpc:" + dpc + ")" +
           " OR (mtp3.opc:" + dpc + " AND mtp3.dpc:" + opc + "))" +
		   " AND isup.cic:" + cic;
  }
  
  var getData = function(opc, dpc, cic, from, size, docID) {
    return new Promise(function(resolve, reject){
	  let query = createQuery(opc, dpc, cic);
      let searchSource = scope.courier.createSource('search');
      searchSource.index(scope.indexPattern);
      searchSource.query({query_string: {query: query}});
      searchSource.size(size);
      searchSource.from(from);
      searchSource.sort([{'timestamp': {'order': 'asc', 'unmapped_type': 'boolean'}}]);
      scope.courier.fetchThis(searchSource)
        .then(function(resp){
		  let hits = resp.hits.hits;
		  let docPos = _.findIndex(hits, function(hit){
		    return hit._id == docID;
		  });
		  let idArray = [];
		  
		  let iterator = docPos;
		  let currentDoc = hits[docPos];
		  while (iterator >= 0) {
			idArray.push(currentDoc._id);
		    if (currentDoc._source.isup.message_type_n == 'iam') {
		      break;
			} else {
			  iterator--;
			  currentDoc = hits[iterator];
			}
		  }
		  
		  iterator = docPos;
		  currentDoc = hits[docPos];
		  while (iterator < hits.length) {
		    idArray.push(currentDoc._id);
		    if (currentDoc._source.isup.message_type_n == 'rlc') {
		      break;
			} else {
			  iterator++;
			  currentDoc = hits[iterator];
			}
		  }
		  resolve(idArray);
		});
	});
  };
}