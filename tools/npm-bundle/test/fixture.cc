#include <node_api.h>

static napi_value Init(napi_env env, napi_value exports) {
  napi_value answer;
  napi_create_int32(env, 42, &answer);
  napi_set_named_property(env, exports, "answer", answer);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
