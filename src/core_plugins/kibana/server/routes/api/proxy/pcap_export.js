export default function (server) {
    let gwConfig = server.config();
    let pcapGwHost = gwConfig.get('kibana.pcapexportHost');
    let pcapGwPort = gwConfig.get('kibana.pcapexportPort');
    let pcapExportPath = gwConfig.get('kibana.pcapexportPath');

    server.route(
      {
        method: ['POST', 'GET'],
        path: pcapExportPath + '/{path*}',
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