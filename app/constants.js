export const REDIS_MAIN = {
  REDIS_MAGIC_STRING: 5,
  RDB_VERSION: 4,
};

export const OP_CODES = {
  EOF: 0xff,
  SELECTDB: 0xfe,
  EXPIRE_TIME: 0xfd,
  EXPRIE_TIME_MS: 0xfc,
  RESIZE_DB: 0xfb,
  AUX: 0xfa,
};
