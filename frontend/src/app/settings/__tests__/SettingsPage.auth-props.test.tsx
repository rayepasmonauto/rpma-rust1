import React from 'react';
import { redirect } from 'next/navigation';
import { render } from '@testing-library/react';
import SettingsPage from '../page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('SettingsPage auth props', () => {
  it('redirects to profile tab', () => {
    render(<SettingsPage />);
    expect(redirect).toHaveBeenCalledWith('/settings/profile');
  });
});
