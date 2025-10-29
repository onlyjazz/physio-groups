import { vi } from 'vitest';
// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    // Uncomment to suppress console output during tests
    // log: vi.fn(),
    // error: vi.fn(),
    // warn: vi.fn(),
    // info: vi.fn(),
    // debug: vi.fn(),
};
// Setup any global test utilities or configurations here
//# sourceMappingURL=setup.js.map