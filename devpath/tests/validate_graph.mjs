import { report } from "../js/validateGraph.js";

const result = report();
process.exit(result.ok ? 0 : 1);