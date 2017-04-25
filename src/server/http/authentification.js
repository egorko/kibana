import pg from 'pg';
import crypto from 'crypto';
import _ from 'lodash';

module.exports = function(config) {
  this.getData = function(login, passwd){
    return new Promise(function(resolve, reject){
      let client = new pg.Client(
        {
          user: config.get('authentification.user'),
          database: config.get('authentification.database'),
          password: config.get('authentification.password'),
          host: config.get('authentification.host'),
          port: config.get('authentification.port'),
        }
      );
      client.connect(function (err) {
        if (err) reject(err);
      
        // execute a query on our database
        let query = "SELECT users.salt, users.password, users.name, users.email,";
        query    += " org.name, org.id as org_id, org_user.role, def_org.name as def_org, users.org_id as def_org_id";
        query    += " from public.user as users, public.org_user, public.org,  public.org as def_org";
        query    += " where users.id=org_user.user_id and org_user.org_id=org.id and";
        query    += " def_org.id = users.org_id and users.login='" + login + "'";

        client.query(query, function (err, result) {
          if (err) reject(err);
          if (result.rows.length == 0) {
            resolve({
              result: false,
              message: 'User not found'
            })
          } else {
            let user = result.rows[0];
            let hash = user.password;
            let salt = user.salt;
            let defaultRole = '';
            
            if (hash.toUpperCase() === saltPasswd(passwd, salt, 10000, 50).toUpperCase()) {
              let orgList = _.map(result.rows, function(row){
                if (row.org_id == user.def_org_id) {
                  defaultRole = row.role;
                }
                return {
                  id: row.org_id,
                  org: row.name,
                  role: row.role
                }
              });
              resolve({
                result: true,
                message: {
                  login: login,
                  name: (user.name == '' ? login : user.name),
                  email: user.email,
                  org: user.def_org,
                  role: defaultRole,
                  orgList: orgList
                }
              })
            } else {
              resolve({
                result: false,
                message: 'Invalid username or password'
              })
            }
          }
      
          // disconnect the client
          client.end(function (err) {
            if (err) reject(err);
          });
        });
      })
    })
  }
  
  let saltPasswd = function(password, salt, iter, keyLen){

    let hashLen = crypto.createHmac('sha256', password).digest().length;
    let numBlocks = ((keyLen + hashLen - 1) / hashLen) | 0;
    let dk = Buffer.alloc(0);

    for (let block = 1; block <= numBlocks; block++) {
      var hash = crypto.createHmac('sha256', password);
      hash.update(salt);
      const buf = Buffer.alloc(4);
      buf[0] = block >> 24;
      buf[1] = block >> 16;
      buf[2] = block >> 8;
      buf[3] = block;

      hash.update(buf);
      dk = Buffer.concat([dk, hash.digest()]);

      let T = dk.slice(dk.length - hashLen);
      let U = Buffer.from(T);
      for (let n = 2; n <= iter; n++) {
        let xorHash = crypto.createHmac('sha256', password);
        xorHash.update(U);
        U = xorHash.digest();
        for ( const x of U.entries()) {
          T[x[0]] ^= x[1];
        }
      }
    }
    return dk.slice(0, keyLen).toString('hex');
  };  
}