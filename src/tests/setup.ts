import { vi } from 'vitest';

// Mock global objects
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn().mockReturnValue('blob:mock-url')
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn()
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue({
    click: vi.fn(),
    href: '',
    download: ''
  })
});

// Mock window methods
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true
});

// Mock navigator clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  writable: true
});

// Mock AbortController
global.AbortController = vi.fn(() => ({
  abort: vi.fn(),
  signal: {}
})) as any;

// Mock setTimeout
global.setTimeout = vi.fn((fn: any) => {
  fn();
  return {} as any;
}) as any;
