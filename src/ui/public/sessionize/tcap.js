module.exports = function(indexPattern, courier) {
  var debug = false;
  var scope  = {
    courier: courier,
    indexPattern: indexPattern
  }
  this.setIndexPattern = function(indexPattern) {
    scope.indexPattern = indexPattern;
  }
  var createQuery = function (otid, dtid, cgpn, cdpn) {
    if (dtid == 'missing') {
      //begin of dialogue
      return '(tcap.otid: "' + otid + '" AND sccp.cgpn_gt: "' + cgpn + '") ' +
          ' OR (tcap.dtid: "' + otid + '" AND sccp.cdpn_gt: "' + cgpn + '")';
      cdpn = 'missing';
    } else  if (otid == 'missing') {
      //end of dialogue
      return '(tcap.otid: "' + dtid + '" AND sccp.cgpn_gt: "' + cdpn + '" AND (!_exists_: "tcap.dtid" OR sccp.cdpn_gt: "' + cgpn + '")) ' +
          ' OR (tcap.dtid: "' + dtid + '" AND sccp.cdpn_gt: "' + cdpn + '" AND sccp.cgpn_gt: "' + cgpn + '")';
    } else {
      //continue of dialogue  
      return '(tcap.otid: "' + otid + '" AND sccp.cgpn_gt: "' + cgpn + '" AND tcap.dtid: "' + dtid + '" AND sccp.cdpn_gt: "' + cdpn + '") ' +
          ' OR (tcap.dtid: "' + otid + '" AND sccp.cdpn_gt: "' + cgpn + '" AND tcap.otid: "' + dtid + '" AND sccp.cgpn_gt: "' + cdpn + '") ' + 
          ' OR (tcap.otid: "' + otid + '" AND sccp.cgpn_gt: "' + cgpn + '" AND !_exists_: "tcap.dtid") ' +
          ' OR (tcap.otid: "' + dtid + '" AND sccp.cgpn_gt: "' + cdpn + '" AND !_exists_: "tcap.dtid") ' +
          ' OR (tcap.dtid: "' + otid + '" AND sccp.cdpn_gt: "' + cgpn + '" AND sccp.cgpn_gt: "' + cdpn + '" AND !_exists_: "tcap.otid") ' +
          ' OR (tcap.dtid: "' + dtid + '" AND sccp.cdpn_gt: "' + cdpn + '" AND sccp.cgpn_gt: "' + cgpn + '" AND !_exists_: "tcap.otid") ';
    }
  }
  
  var getData = function(otid, dtid, cgpn, cdpn, from, size, docID) {
  
    var defaultTimeout = 10;
  
    function hasMissingFields()  {
      return dtid == 'missing' || otid == 'missing' || cgpn == 'missing' || cdpn == 'missing';
    }
  
    function DocObject(id) {
      this.id = id;
      
      this.clear = function(){
        this.idArray = [];
        this.docArray = [];
        this.beginLastTime = 0;
        this.endLastTime = 0;
        this.docFound = false;
        this.hasBegin = false;
        this.hasContinue = false;
        this.hasEnd = false;
        this.ids = {
          otid: otid,
          dtid: dtid,
          cgpn: cgpn,
          cdpn:cdpn
        }
      };
      
      this.addDoc = function(doc) {
        this.docArray.push(doc);
        this.idArray.push(doc._id);
    
        if (this.id == doc._id) {
          this.docFound = true;
        }
    	
        switch(doc._source.tcap.primitive) {
          case 'begin':
            this.hasBegin = true;
            this.beginLastTime = doc._source.pcap_ts_sec;
            break;
          case 'continue':
            if ((!this.hasContinue || !this.docFound) && hasMissingFields()) {
              let tcap = doc._source.tcap;
              let primitive = tcap.primitive;
              let sccp = doc._source.sccp; 
              let docPair = [(otid == 'missing' ? '' : otid) + (cgpn == 'missing' ? '' : cgpn), (dtid == 'missing' ? '' : dtid) + (cdpn == 'missing' ? '' : cdpn)];
              let continuePair = [tcap.otid + sccp.cgpn_gt, tcap.dtid + sccp.cdpn_gt];
              if((continuePair[0].indexOf(docPair[0]) != -1 && continuePair[1].indexOf(docPair[1]) != -1) || (continuePair[0].indexOf(docPair[1]) != -1 && continuePair[1].indexOf(docPair[0]) != -1)) {
                this.ids.dtid = (dtid == 'missing' ? (otid == tcap.otid ? tcap.dtid : tcap.otid) : dtid);
                this.ids.otid = (otid == 'missing' ? (dtid == tcap.dtid ? tcap.otid : tcap.dtid) : otid);
                this.ids.cdpn = (cdpn == 'missing' ? (cgpn == sccp.cgpn_gt ? sccp.cdpn_gt : sccp.cgpn_gt) : cdpn);
                this.ids.cgpn = (cgpn == 'missing' ? (cdpn == sccp.cdpn_gt ? sccp.cgpn_gt : sccp.cdpn_gt) : cgpn);
                this.hasContinue = true;
              }
            }
            break;
          default:
            this.hasEnd = true;
            this.endLastTime = doc._source.pcap_ts_sec;
        }
      }
      this.clear();
    }
    let query = createQuery (otid, dtid, cgpn, cdpn);
    if (debug) {console.log(query)};
    return new Promise(function(resolve, reject){
      let searchSource = scope.courier.createSource('search');
      searchSource.index(scope.indexPattern);
      searchSource.query({query_string: {query: query}});
      searchSource.size(size);
      searchSource.from(from);
      searchSource.sort([{'timestamp': {'order': 'asc', 'unmapped_type': 'boolean'}}]);
      scope.courier.fetchThis(searchSource)
        .then(function(resp){
          let skipDefaultResolve = false;
          let docObject = new DocObject(docID);
          if (debug) {console.log(resp)};
          _.forEach(resp.hits.hits, function(hit){
            if (debug) {console.log(hit)};
            let docTime = hit._source.pcap_ts_sec;
            let tcap = hit._source.tcap;
            let primitive = tcap.primitive;
            switch(primitive) {
              case 'begin':
                if (docObject.docFound && docObject.hasEnd) {
                  resolve(docObject.idArray);
                  skipDefaultResolve = true;
                  return false;
                } else if (docObject.hasEnd) {
                    docObject.clear();
                } else if (docObject.hasBegin && ((docTime - docObject.beginLastTime) > defaultTimeout)) {
                    if (docObject.docFound) {
                      resolve(docObject.idArray);
                      skipDefaultResolve = true;
                      return false;
                    } else {
                      docObject.clear();
                    }
                }
              break;
              case 'continue':
  
              break;
              default:
  
              break;
            }
            if (docObject.docFound  && docObject.hasEnd && ((docTime - docObject.endLastTime) > defaultTimeout)) {
              return false;
            } 
            docObject.addDoc(hit);
            
            if (docObject.docFound && hasMissingFields() && docObject.hasContinue) {
              getData(docObject.ids.otid, docObject.ids.dtid, docObject.ids.cgpn, docObject.ids.cdpn, from, size, docID)
                .then(function(newArray){
                  resolve(_.union(docObject.idArray, newArray));
                });
                skipDefaultResolve = true;
                return false;  
            }
            if (debug) {console.log(
              'has end: ' + docObject.hasEnd + ', doc found: ' + docObject.docFound + ', id count: ' + docObject.idArray.length
            )};
          });
          if (!skipDefaultResolve) {
            resolve(docObject.idArray);
          }
        });
    });
  }
  this.restore = function(doc) {
    let doc_vlanid = doc._source.vlan_id || 'empty';
    let otid = doc._source.tcap.otid || 'missing';
    let dtid = doc._source.tcap.dtid || 'missing';
    let cgpn = doc._source.sccp.cgpn_gt;
    let cdpn = (dtid == 'missing' ? 'missing' : doc._source.sccp.cdpn_gt);
    let currentId = doc._id;
    
    return getData(otid, dtid, cgpn, cdpn, 0, 10000, currentId, doc_vlanid);
}
}
