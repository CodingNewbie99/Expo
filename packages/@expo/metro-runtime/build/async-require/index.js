"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const buildAsyncRequire_1 = require("./buildAsyncRequire");
global[`${global.__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`] = (0, buildAsyncRequire_1.buildAsyncRequire)();
//# sourceMappingURL=index.js.map