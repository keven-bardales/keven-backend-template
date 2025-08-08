// src/test/setup.ts

// Configuración global para tests
beforeAll(() => {
  process.env.TZ = 'UTC';
});

afterAll(() => {
  jest.clearAllMocks();
});

// Mock simple de console para tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Exportar para uso en tests si es necesario
export const consoleMock = global.console;
