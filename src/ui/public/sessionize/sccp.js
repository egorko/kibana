module.exports = function(indexPattern, courier) {
  var scope  = {
    courier: courier,
    indexPattern: indexPattern
  }
  
  let debug = false;
  
  this.setIndexPattern = function(indexPattern) {
    scope.indexPattern = indexPattern;
  }
  this.restore = function(doc) {
    let opc = doc._source.mtp3.opc;
    let dpc = doc._source.mtp3.dpc;
    let dlr = doc._source.sccp.dst_local_ref || 'missing';
    let slr = doc._source.sccp.src_local_ref || 'missing';
    let currentId = doc._id;
    
    return getData(opc, dpc, dlr, slr, 0, 10000, currentId);
  }
  
  var createQuery = function(opc, dpc, dlr, slr, docID) {
	  if (dlr == 'missing') {
        return '    (mtp3.opc:' + opc + ' AND mtp3.dpc:' + dpc + ' AND sccp.src_local_ref:' + slr + ' AND _exists_:sccp.dst_local_ref)' +
               ' OR (mtp3.opc:' + dpc + ' AND mtp3.dpc:' + opc + ' AND sccp.dst_local_ref:' + slr + ' AND _exists_:sccp.src_local_ref)' +
			   ' OR (_id:' + docID + ')';
	  } else
	  if (slr == 'missing') {
        return '    (mtp3.opc:' + opc + ' AND mtp3.dpc:' + dpc + ' AND sccp.dst_local_ref:' + dlr + ' AND _exists_:sccp.src_local_ref)' +
               ' OR (mtp3.opc:' + dpc + ' AND mtp3.dpc:' + opc + ' AND sccp.src_local_ref:' + dlr + ' AND _exists_:sccp.dst_local_ref)' +
			   ' OR (_id:' + docID + ')';
	  } else  {
        return '    (mtp3.opc:' + opc + ' AND mtp3.dpc:' + dpc + ' AND sccp.src_local_ref:' + slr + ' AND (sccp.dst_local_ref:' + dlr + ' OR !_exists_:sccp.dst_local_ref))' +
		       ' OR (mtp3.opc:' + opc + ' AND mtp3.dpc:' + dpc + ' AND (sccp.src_local_ref:' + slr + ' OR !_exists_:sccp.src_local_ref) AND sccp.dst_local_ref:' + dlr + ')' +
			   ' OR (mtp3.opc:' + dpc + ' AND mtp3.dpc:' + opc + ' AND (sccp.src_local_ref:' + dlr + ' OR !_exists_:sccp.src_local_ref) AND sccp.dst_local_ref:' + slr + ')' +
			   ' OR (mtp3.opc:' + dpc + ' AND mtp3.dpc:' + opc + ' AND sccp.src_local_ref:' + dlr + ' AND (sccp.dst_local_ref:' + slr + ' OR !_exists_:sccp.dst_local_ref))';
	  }
    }
  
  var getData = function(opc, dpc, dlr, slr, from, size, docID) {
    return new Promise(function(resolve, reject){
	    let hasMissing = (dlr == 'missing' || slr == 'missing');
	    let query = createQuery(opc, dpc, dlr, slr, docID);
      if (debug) {console.log(query)};
      let searchSource = scope.courier.createSource('search');
      searchSource.index(scope.indexPattern);
      searchSource.query({query_string: {query: query}});
      searchSource.size(size);
      searchSource.from(from);
      searchSource.sort([{'timestamp': {'order': 'asc', 'unmapped_type': 'boolean'}}]);
      scope.courier.fetchThis(searchSource)
        .then(function(resp){
          if (debug){console.log(resp)};
          let hits = resp.hits.hits;
          let docPos = _.findIndex(hits, function(hit){
            return hit._id == docID;
          });
          if (hits.length <= 1) {
            console.log('empty response');
            resolve([docID])
          } else if (hasMissing) {
            if (debug) {console.log('Search creteria has missing fields:')};
            if (debug) {console.log('opc: ' + opc + ' dpc: ' + dpc + ' dlr: ' + dlr + ' slr: ' + slr)};
            let thisDoc = hits[docPos];
            let fullDoc = thisDoc;
            if (docPos == 0 && hits.length > 1) {
              fullDoc = hits[docPos + 1];
            } else if (docPos == hits.length - 1 && docPos != 0) {
              fullDoc = hits[docPos - 1];
            } else {
              let prevDoc = hits[docPos - 1];
              let nextDoc = hits[docPos + 1];
              let thisTime = thisDoc._source.pcap_ts_sec * 1000 + thisDoc._source.pcap_ts_usec/1000;
              let prevTime = prevDoc._source.pcap_ts_sec * 1000 + prevDoc._source.pcap_ts_usec/1000;
              let nextTime = nextDoc._source.pcap_ts_sec * 1000 + nextDoc._source.pcap_ts_usec/1000;
              let prevDelta = prevTime - thisTime;
              let nextDelta = thisTime - nextTime;
              if (prevDelta < nextDelta) {
                fullDoc = prevDoc;
              } else {
                fullDoc = nextDoc;
              }
            }
            let ndDlr = fullDoc._source.sccp.dst_local_ref;
            let ndSlr = fullDoc._source.sccp.src_local_ref;
            if (dlr == ndDlr)
            {
              slr = ndSlr;
            } else if (dlr == ndSlr)
            {
              slr = ndDlr;
            } else if (slr == ndSlr)
            {
              dlr = ndDlr;
            } else if (slr == ndDlr)
            {
              dlr = ndSlr;
            }
            getData(opc, dpc, dlr, slr, from, size, docID)
            .then(function(idArray){
              resolve(idArray);
            })
          } else {
            if (debug) {console.log('Search creteria is full:')};
            if (debug) {console.log('opc: ' + opc + ' dpc: ' + dpc + ' dlr: ' + dlr + ' slr: ' + slr)};
            let idArray = [];
            let docFound = false;
            let hasEnd = false;
            let skip = false;
            let lastTime = 0;
            _.forEach(hits, function(hit){
              switch(hit._source.sccp.message_type_n)
              {
                case "cr":
                  if (docFound) {
                  skip = true;
                } else {
                  idArray = [];
                }
                  break;
                case "rlc":
                  if (docFound) {
                  hasEnd = true;
                }
                  break;
                default:
                  break;
              }
              if (hit._id == docID) {
                docFound = true;
              }
              if (!skip) {
                let currentTime = hit._source.pcap_ts_sec;
              if (lastTime !=0 && currentTime - lastTime > 10 && hasEnd) {
                skip = true;
              } else {
                idArray.push(hit._id);
                lastTime = currentTime;
              }				    
              }
            });
            resolve(idArray);
          }
        });
    });
  }
}