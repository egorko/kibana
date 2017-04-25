define(function (require) {
  // each of these private modules returns an object defining that section, their properties
  // are used to create the nav bar
  return [
    require('plugins/kibana/callflow/sections/callflow/index'),
    require('plugins/kibana/callflow/sections/settings/index')
  ];
});
