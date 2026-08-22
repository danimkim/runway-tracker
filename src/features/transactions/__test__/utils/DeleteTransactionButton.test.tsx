import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeleteTransactionButton } from '@/features/transactions/components/DeleteTransactionButton'

vi.mock('@/features/transactions/actions/delete-transaction', () => ({
  deleteTransaction: vi.fn(),
}))

describe('DeleteTransactionButton', () => {
  it('opens a confirmation modal before deleting a transaction', () => {
    render(<DeleteTransactionButton transactionId="transaction-123" />)

    expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByText('Delete Transaction')).toBeInTheDocument()
    expect(screen.getByText('This transaction will be permanently deleted. Are you sure?')).toBeInTheDocument()
  })

  it('closes the confirmation modal when cancel is clicked', () => {
    render(<DeleteTransactionButton transactionId="transaction-123" />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument()
  })

  it('submits the transaction id when delete is confirmed', () => {
    const { container } = render(<DeleteTransactionButton transactionId="transaction-123" />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    const transactionIdInput = container.querySelector<HTMLInputElement>('input[name="id"]')
    const confirmButton = screen.getAllByRole('button', { name: 'Delete' }).at(-1)

    expect(transactionIdInput).toHaveValue('transaction-123')
    expect(confirmButton).toHaveAttribute('type', 'submit')
  })
})
