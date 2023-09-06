"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfigExport = exports.evalConfig = void 0;
const fs_1 = require("fs");
const require_from_string_1 = __importDefault(require("require-from-string"));
const sucrase_1 = require("sucrase");
const Errors_1 = require("./Errors");
const Serialize_1 = require("./Serialize");
/**
 * Transpile and evaluate the dynamic config object.
 * This method is shared between the standard reading method in getConfig, and the headless script.
 *
 * @param options configFile path to the dynamic app.config.*, request to send to the dynamic config if it exports a function.
 * @returns the serialized and evaluated config along with the exported object type (object or function).
 */
function evalConfig(configFile, request) {
    const contents = (0, fs_1.readFileSync)(configFile, 'utf8');
    let result;
    try {
        const { code } = (0, sucrase_1.transform)(contents, {
            filePath: configFile,
            transforms: ['typescript', 'imports'],
        });
        result = (0, require_from_string_1.default)(code, configFile);
    }
    catch (error) {
        const location = extractLocationFromSyntaxError(error);
        // Apply a code frame preview to the error if possible, sucrase doesn't do this by default.
        if (location) {
            const { codeFrameColumns } = require('@babel/code-frame');
            const codeFrame = codeFrameColumns(contents, { start: error.loc }, { highlightCode: true });
            error.codeFrame = codeFrame;
            error.message += `\n${codeFrame}`;
        }
        else {
            const importantStack = extractImportantStackFromNodeError(error);
            if (importantStack) {
                error.message += `\n${importantStack}`;
            }
        }
        throw error;
    }
    return resolveConfigExport(result, configFile, request);
}
exports.evalConfig = evalConfig;
function extractLocationFromSyntaxError(error) {
    // sucrase provides the `loc` object
    if (error.loc) {
        return error.loc;
    }
    // `SyntaxError`s provide the `lineNumber` and `columnNumber` properties
    if ('lineNumber' in error && 'columnNumber' in error) {
        return { line: error.lineNumber, column: error.columnNumber };
    }
    return null;
}
// These kinda errors often come from syntax errors in files that were imported by the main file.
// An example is a module that includes an import statement.
function extractImportantStackFromNodeError(error) {
    if (isSyntaxError(error)) {
        const traces = error.stack?.split('\n').filter((line) => !line.startsWith('    at '));
        if (!traces)
            return null;
        // Remove redundant line
        if (traces[traces.length - 1].startsWith('SyntaxError:')) {
            traces.pop();
        }
        return traces.join('\n');
    }
    return null;
}
function isSyntaxError(error) {
    return error instanceof SyntaxError || error.constructor.name === 'SyntaxError';
}
/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param result
 * @param configFile
 * @param request
 */
function resolveConfigExport(result, configFile, request) {
    if (result.default != null) {
        result = result.default;
    }
    const exportedObjectType = typeof result;
    if (typeof result === 'function') {
        result = result(request);
    }
    if (result instanceof Promise) {
        throw new Errors_1.ConfigError(`Config file ${configFile} cannot return a Promise.`, 'INVALID_CONFIG');
    }
    // If the expo object exists, ignore all other values.
    if (result?.expo) {
        result = (0, Serialize_1.serializeSkippingMods)(result.expo);
    }
    else {
        result = (0, Serialize_1.serializeSkippingMods)(result);
    }
    return { config: result, exportedObjectType };
}
exports.resolveConfigExport = resolveConfigExport;
