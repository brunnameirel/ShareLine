import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home page', () => {
  it('renders ShareLine hero branding', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const headings = await screen.findAllByText('ShareLine');
    expect(headings.length).toBeGreaterThan(0);
  });
});
