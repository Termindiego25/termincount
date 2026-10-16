import { install } from 'undici';

// Keep matching, patched web APIs instead of Node's older embedded Undici.
install();
