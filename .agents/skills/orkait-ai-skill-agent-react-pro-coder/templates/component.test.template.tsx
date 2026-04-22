import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { {{ComponentName}} } from './{{fileBase}}';

describe('{{ComponentName}}', () => {
  it('renders and is queryable via an accessible role', () => {
    render(<{{ComponentName}}>content</{{ComponentName}}>);
    expect(screen.getByRole('{{role}}')).toBeInTheDocument();
  });
});
