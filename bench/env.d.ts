/**
 * Minimalne deklaracje środowiska node dla bencha.
 *
 * Świadomie zamiast `@types/node`: bench używa dokładnie dwóch globalnych
 * rzeczy, a projekt nie ma innego powodu, żeby ciągnąć całe typy node.
 */
declare const console: {
  log(...args: unknown[]): void;
};

declare const process: {
  exitCode?: number;
};
