module.exports = '{                                                      \n' + 
' "default": "unknown",                                                  \n' +
' "separator": ";",                                                      \n' +
' "rules": [                                                             \n' +
'   { "field": "app_proto" },                                            \n' +
'   { "if": {                                                            \n' +
'       "exists": "tcap",                                                \n' +
'       "true": [                                                        \n' +
'         { "switch": {                                                  \n' +
'             "condition": "tcap.primitive",                             \n' +
'             "cases": {                                                 \n' +
'               "begin":                                                 \n' +
'                 [ { "const": "TC-b" } ],                               \n' +
'               "continue":                                              \n' +
'                 [ { "const": "TC-c" } ],                               \n' +
'               "end":                                                   \n' +
'                 [ { "const": "TC-e" } ],                               \n' +
'               "abort":                                                 \n' +
'                 [ { "const": "TC-a" } ]                                \n' +
'             }                                                          \n' +
'           }                                                            \n' +
'         },                                                             \n' +
'         { "if": {                                                      \n' +
'             "exists": "cap",                                           \n' +
'             "true": [                                                  \n' +
'               {                                                        \n' +
'                 "arrayField": {                                        \n' +
'                   "field": "cap.opcode_n",                             \n' +
'                   "connector": ";"                                     \n' +
'                 }                                                      \n' +
'               }                                                        \n' +
'             ],                                                         \n' +
'             "false": [                                                 \n' +
'               { "if": {                                                \n' +
'                   "exists": "map",                                     \n' +
'                   "true": [                                            \n' +
'                     {                                                  \n' +
'                       "arrayField": {                                  \n' +
'                         "field": "map.opcode_n",                       \n' +
'                         "connector": ";"                               \n' +
'                       }                                                \n' +
'                     }                                                  \n' +
'                   ]                                                    \n' +
'                 }                                                      \n' +
'               }                                                        \n' +
'             ]                                                          \n' +
'           }                                                            \n' +
'         }                                                              \n' +
'       ],                                                               \n' +
'       "false": [                                                       \n' +
'         { "if": {                                                      \n' +
'             "and": [                                                   \n' +
'               { "exists": "mtp3.opc" },                                \n' +
'               { "exists": "mtp3.dpc" },                                \n' +
'               { "or": [                                                \n' +
'                   { "exists": "sccp.src_local_ref" },                  \n' +
'                   { "exists": "sccp.dst_local_ref" }                   \n' +
'                 ]                                                      \n' +
'               }                                                        \n' +
'             ],                                                         \n' +
'             "true": [                                                  \n' +
'               { "field": "sccp.message_type_n" },                      \n' +
'               { "if": {                                                \n' +
'                   "exists": "dtap",                                    \n' +
'                   "true": [                                            \n' +
'                     { "field": "dtap.message_type" }                   \n' +
'                   ],                                                   \n' +
'                   "false": [                                           \n' +
'                     { "if": {                                          \n' +
'                         "exists": "ranap",                             \n' +
'                         "true": [                                      \n' +
'                           { "field": "ranap.message_n" }               \n' +
'                         ],                                             \n' +
'                         "false": [                                     \n' +
'                           { "if": {                                    \n' +
'                               "exists": "bssmap",                      \n' +
'                               "true": [                                \n' +
'                                 { "field": "bssmap.message_type_n" }   \n' +
'                               ]                                        \n' +
'                             }                                          \n' +
'                           }                                            \n' +
'                         ]                                              \n' +
'                       }                                                \n' +
'                     }                                                  \n' +
'                   ]                                                    \n' +
'                 }                                                      \n' +
'               }                                                        \n' +
'             ],                                                         \n' +
'             "false": [                                                 \n' +
'               { "if": {                                                \n' +
'                   "exists": "isup",                                    \n' +
'                   "true": [                                            \n' +
'                     { "field": "isup.message_type_n" }                 \n' +
'                   ],                                                   \n' +
'                   "false": [                                           \n' +
'                     { "if": {                                          \n' +
'                         "exists": "diameter",                          \n' +
'                         "true": [                                      \n' +
'                           { "field": "diameter.command-code_n" }       \n' +
'                         ],                                             \n' +
'                         "false": [                                     \n' +
'                           { "if": {                                    \n' +
'                               "exists": "sip",                         \n' +
'                               "true": [                                \n' +
'                                 { "field": "sip.isup.message_type_n" } \n' +
'                               ],                                       \n' +
'                               "false": [                               \n' +
'                                 { "const": "unknown protocol" }        \n' +
'                               ]                                        \n' +
'                             }                                          \n' +
'                           }                                            \n' +
'                         ]                                              \n' +
'                       }                                                \n' +
'                     }                                                  \n' +
'                   ]                                                    \n' +
'                 }                                                      \n' +
'               }                                                        \n' +
'             ]                                                          \n' +
'           }                                                            \n' +
'         }                                                              \n' +
'       ]                                                                \n' +
'     }                                                                  \n' +
'   },                                                                   \n' +
'   { "datetime": "time" }                                               \n' +
' ]}                                                                     \n';