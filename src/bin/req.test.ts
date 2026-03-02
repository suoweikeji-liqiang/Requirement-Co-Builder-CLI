import { buildProgram } from './req.js';

describe('req CLI command wiring', () => {
  it('registers project lifecycle commands', () => {
    const program = buildProgram();
    const names = program.commands.map((cmd: { name: () => string }) => cmd.name());
    expect(names).toContain('new');
    expect(names).toContain('list');
    expect(names).toContain('open');
    expect(names).toContain('delete');
    expect(names).toContain('snapshot');
    expect(names).toContain('build');
    expect(names).toContain('research');
  });
});
