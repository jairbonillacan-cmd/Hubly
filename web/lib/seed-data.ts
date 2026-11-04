// Fachada de datos de ejemplo exclusivos del modo demo y del fixture de referencia visual.
// Se mantiene reexportando desde `lib/seed/` para no cambiar los imports existentes.
export { DEFAULT_ONBOARDING, DEFAULT_WIDGETS_CONFIG } from "./seed/dashboard";
export { DEFAULT_NOTEBOOKS } from "./seed/notebooks";
export {
  createSeedWorkspaceData,
  DEFAULT_AGENCY,
  DEFAULT_PROFILE,
  INITIAL_WORKSPACE_DATA,
  rebaseStaleFixture,
  REFERENCE_FIXTURE_CLOCK,
} from "./seed/workspace";
