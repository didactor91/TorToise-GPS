import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataTable, { type Column } from './DataTable'

type Row = { id: string; name: string }

const columns: Column<Row>[] = [{ key: 'name', label: 'Name' }]

describe('DataTable', () => {
  it('renders empty state then data without hook-order crash', () => {
    const { rerender } = render(
      <DataTable<Row> columns={columns} rows={[]} emptyMessage="No rows" />
    )

    expect(screen.getByText('No rows')).toBeTruthy()

    rerender(
      <DataTable<Row>
        columns={columns}
        rows={[
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' }
        ]}
      />
    )

    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
  })
})
