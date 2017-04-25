import _ from 'lodash';
module.exports = function(ruleJSON, doc) {
  let conditionCollection = ['exists', 'equals', 'and', 'or'];
  let getTime = function(strData) {
    let rowTime = strData.split('T')[1].split('+')[0];
    let rowDate = strData.split('T')[0];
    let time = rowTime.substring(0,2) + ':' + rowTime.substring(2,4) + ':' + rowTime.substring(4);
    let date = rowDate.substring(0,4) + '-' + rowDate.substring(4,6) + '-' + rowDate.substring(6,8);
    
    let tz = strData.split('+')[1];
    return {
      time: time,
      date: date,
      datetime: date + ' ' + time,
      tz: tz
    }
  }
  let datetime = getTime(doc.timestamp);
  let separator = ruleJSON.separator;
  let defValue = ruleJSON.default;
  
  let getMessage = function(rules) {
    let message = [];
    _.forEach(rules, function(rule){
      let key = _.first(_.keys(rule));
      let value = _.get(rule, key);
      switch (key) {
        case 'const':
          message.push(value);
          break;
        case 'field':
          message.push(_.get(doc, value, defValue));
          break;
        case 'arrayField':
          let arrayValue = _.get(doc, value.field, defValue);
          
          message.push(_.isArray(arrayValue) ? arrayValue.join(_.has(value, 'connector') ? value.connector : connector) : arrayValue);
          break;
        case 'datetime':
          message.push(_.get(datetime, value));
          break;
        case 'if':
          let conditionKey = _.find(_.keys(value), function(key){
            return _.includes(conditionCollection, key);
          });
          let conditionValue = _.get(value, conditionKey);
          if (checkCondition[conditionKey](conditionValue)) {
            message.push(getMessage(value.true));
          } else if (_.has(value, 'false')) {
            message.push(getMessage(value.false));
          }
          break;
        case 'switch':
          let condition = _.get(doc, value.condition);
          let selectedValue = value.cases[condition];
          if (selectedValue == undefined) {
            message.push(defValue);
          } else {
            message.push(getMessage(selectedValue));
          }
          break;
        default:
          console.log('unexpected key: ' + key);
      }
    });
    return message.join(separator);
  }
  
  let checkCondition = {
    exists: function(value) {
      return _.has(doc, value)
    },
    and: function(value) {
      return _.every(value, function(obj){
        let key = _.first(_.keys(obj));
        let value = _.get(obj, key);
        return checkCondition[key](value)
      })
    },
    or: function(value) {
      return _.any(value, function(obj){
        let key = _.first(_.keys(obj));
        let value = _.get(obj, key);
        return checkCondition[key](value)
      })
    },
    equals: function(value){
      let messageArray = [];
      _.forIn(value, function(value, key, object){
        objArray.push(getMessage(object))
      });
      return _.uniq(objArray).length == 1;
    }
  }

  return getMessage(ruleJSON.rules);
}
