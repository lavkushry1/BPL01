describe('Sanity Check', () => {
  let initialized = false;

  beforeAll(async () => {
    console.log('Sanity: Starting beforeAll');
    initialized = true;
    console.log('Sanity: Initialized =', initialized);
  });

  it('should run beforeAll', () => {
    console.log('Sanity: Running test');
    expect(initialized).toBe(true);
  });
});
