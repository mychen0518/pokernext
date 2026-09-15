/**
 * @fileoverview Entry point for applying the committed SQL migrations, used by
 * deploy steps, the demo and the test template; never by request handling.
 */

export {migrateDatabase} from './lib/migrations';
