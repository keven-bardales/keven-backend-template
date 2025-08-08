// src/__tests__/simple.test.ts
describe('Simple test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    const greeting = 'Hello World';
    expect(greeting).toContain('Hello');
  });
});
