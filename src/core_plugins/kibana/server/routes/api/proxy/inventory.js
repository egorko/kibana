export default function (server) {
    let gwConfig = server.config();
    let pcapGwHost = gwConfig.get('kibana.pcapexportHost');
    let pcapGwPort = gwConfig.get('kibana.pcapexportPort');
    let inventoryPath = gwConfig.get('kibana.inventoryPath');

    console.log('create proxy for ' + inventoryPath + '/{path*} to ' + pcapGwHost + ':' + pcapGwPort);
    server.route(
      {
        method: ['POST', 'GET'],
        path: inventoryPath + '/{path*}',
        handler: {
          proxy: {
            host: pcapGwHost,
            port: pcapGwPort,
            protocol: 'http',
            passThrough: true,
            xforward: true
          }
        } 
      }
    );
}