// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
const oldJoin = path.join;
path.join = function(...args) {
    return oldJoin(...args).replace(/\\/g, '/');
};
