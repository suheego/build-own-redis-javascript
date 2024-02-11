const REDIS_MAIN = {
  REDIS_MAGIC_STRING: 5,
  RDB_VERSION: 4,
};

const OP_CODES = {
  EOF: 0xff,
  SELECTDB: 0xfe,
  EXPIRE_TIME: 0xfd,
  EXPRIE_TIME_MS: 0xfc,
  RESIZE_DB: 0xfb,
  AUX: 0xfa,
};

const VALUE_TYPE = {
  STRING: 0,
  LIST: 1,
  SET: 2,
  SORTED_ST: 3,
  HASH: 4,
  ZIP_MAP: 9,
  ZIP_LIST: 10,
  ZIP_SET: 11,
  SORTED_SET_IN_ZIP_LIST: 12,
  HASHMAP_IN_ZIP_LIST: 13,
  LIST_QUICK_LIST: 14,
};

module.exports = {
  REDIS_MAIN,
  OP_CODES,
  VALUE_TYPE,
};
