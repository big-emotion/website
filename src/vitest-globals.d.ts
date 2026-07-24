// Vitest runs with `globals: true`, so tests may use describe/it/expect/vi without
// importing them. `tsc --noEmit` has no knowledge of the Vitest config, so without
// this reference those files fail to compile even though they run fine.
/// <reference types="vitest/globals" />
