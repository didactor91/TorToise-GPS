import React from 'react'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import DataTable, { type Column } from './DataTable'
import { testI18n } from '../../test/i18n'
import { renderWithI18n } from '../../test/renderWithI18n'

type Row = { id: string; name: string }

const columns: Column<Row>[] = [{ key: 'name', label: 'Name' }]

describe('DataTable', () => {
  it('renders empty state then data without hook-order crash', async () => {
    const { rerender } = await renderWithI18n(
      <DataTable<Row> columns={columns} rows={[]} />
    )

    expect(screen.getByText(testI18n.t('table.noItems'))).toBeTruthy()

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
