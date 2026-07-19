import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // Strażnik determinizmu: losowość w logice gry wyłącznie przez seedowany RNG (src/sim/rng.ts).
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Użyj seedowanego RNG z src/sim/rng.ts — determinizm pod co-op (gdd.md sekcja 7).',
        },
      ],
    },
  },
);
