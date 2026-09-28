import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MerchantAutocomplete } from '@/features/transactions/components/MerchantAutocomplete';
import { searchMerchantNames } from '@/features/transactions/actions/search-merchant-names';

vi.mock('@/features/transactions/actions/search-merchant-names', () => ({
  searchMerchantNames: vi.fn(),
}));

const searchMock = vi.mocked(searchMerchantNames);

describe('MerchantAutocomplete', () => {
  beforeEach(() => {
    searchMock.mockReset();
    searchMock.mockResolvedValue(['Pret A Manger', 'Pretto']);
  });

  it('shows suggestions on focus and selects one by touch or click', async () => {
    render(<MerchantAutocomplete />);
    const input = screen.getByRole('combobox', { name: 'Merchant' });

    fireEvent.focus(input);
    fireEvent.click(await screen.findByRole('option', { name: 'Pret A Manger' }));

    expect(searchMock).toHaveBeenCalledWith('');
    expect(input).toHaveValue('Pret A Manger');
    expect(input).toHaveAttribute('name', 'merchantName');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('queries typed text and selects with arrow keys and Enter', async () => {
    render(<MerchantAutocomplete />);
    const input = screen.getByRole('combobox', { name: 'Merchant' });

    fireEvent.change(input, { target: { value: 'Pre' } });
    fireEvent.focus(input);
    await screen.findByRole('option', { name: 'Pretto' });
    expect(searchMock).toHaveBeenCalledWith('Pre');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input).toHaveValue('Pretto');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keeps a freely typed name when suggestions are dismissed', async () => {
    render(<MerchantAutocomplete defaultValue="Old merchant" />);
    const input = screen.getByRole('combobox', { name: 'Merchant' });
    expect(input).toHaveValue('Old merchant');

    fireEvent.focus(input);
    await screen.findByRole('listbox');
    fireEvent.change(input, { target: { value: 'New merchant' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveValue('New merchant');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('allows typing when the suggestion lookup fails', async () => {
    searchMock.mockRejectedValueOnce(new Error('network error'));
    render(<MerchantAutocomplete />);
    const input = screen.getByRole('combobox', { name: 'Merchant' });

    fireEvent.focus(input);
    await waitFor(() => expect(searchMock).toHaveBeenCalled());
    fireEvent.change(input, { target: { value: 'New merchant' } });

    expect(input).toHaveValue('New merchant');
  });

  it('ignores an older lookup that finishes after a newer one', async () => {
    const pending = new Map<string, (names: string[]) => void>();
    searchMock.mockImplementation((query) => new Promise((resolve) => pending.set(query, resolve)));
    render(<MerchantAutocomplete />);
    const input = screen.getByRole('combobox', { name: 'Merchant' });

    fireEvent.change(input, { target: { value: 'Pre' } });
    fireEvent.focus(input);
    await waitFor(() => expect(pending.has('Pre')).toBe(true));

    fireEvent.change(input, { target: { value: 'Pret' } });
    await waitFor(() => expect(pending.has('Pret')).toBe(true));
    await act(async () => pending.get('Pret')?.(['Pret A Manger']));
    expect(screen.getByRole('option', { name: 'Pret A Manger' })).toBeInTheDocument();

    await act(async () => pending.get('Pre')?.(['Pretto']));
    expect(screen.queryByRole('option', { name: 'Pretto' })).not.toBeInTheDocument();
  });
});
