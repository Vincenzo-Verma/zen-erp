import { useState, useMemo, type ReactNode } from 'react';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (row: T, index: number) => ReactNode;
    width?: string | number;
    className?: string;
}

interface Props<T> {
    columns: Column<T>[];
    data: T[];
    rowKey: keyof T | ((row: T, index: number) => string | number);
    pageSize?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[];
    emptyMessage?: string;
    toolbar?: ReactNode;
    loading?: boolean;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    rowKey,
    pageSize = 10,
    searchable = true,
    searchPlaceholder = 'Search...',
    searchKeys,
    emptyMessage = 'No data found.',
    toolbar,
    loading = false,
}: Props<T>) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // Filter
    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter((row) => {
            const keys = searchKeys || (Object.keys(row) as (keyof T)[]);
            return keys.some((k) => {
                const val = row[k];
                return val != null && String(val).toLowerCase().includes(q);
            });
        });
    }, [data, search, searchKeys]);

    // Sort
    const sorted = useMemo(() => {
        if (!sortCol) return filtered;
        const arr = [...filtered];
        arr.sort((a, b) => {
            const av = a[sortCol] as string | number;
            const bv = b[sortCol] as string | number;
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            const cmp = typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [filtered, sortCol, sortDir]);

    // Paginate
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    const getRowKey = (row: T, idx: number): string | number => {
        if (typeof rowKey === 'function') return rowKey(row, idx);
        return row[rowKey] as string | number;
    };

    const handleSort = (colKey: string) => {
        if (sortCol === colKey) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortCol(colKey);
            setSortDir('asc');
        }
    };

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body">
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    {searchable && (
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ maxWidth: 280 }}
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    )}
                    {toolbar && <div className="d-flex gap-2">{toolbar}</div>}
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        style={{ width: col.width, cursor: col.sortable ? 'pointer' : undefined }}
                                        className={col.className}
                                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                    >
                                        <span className="d-inline-flex align-items-center gap-1">
                                            {col.label}
                                            {col.sortable && sortCol === col.key && (
                                                <span style={{ fontSize: 10 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-4 text-muted">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((row, idx) => (
                                    <tr key={getRowKey(row, (safePage - 1) * pageSize + idx)}>
                                        {columns.map((col) => (
                                            <td key={col.key} className={col.className}>
                                                {col.render
                                                    ? col.render(row, (safePage - 1) * pageSize + idx)
                                                    : (row[col.key] as ReactNode) ?? '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted">
                            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
                        </small>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item${safePage === 1 ? ' disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(safePage - 1)}>Prev</button>
                                </li>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (safePage <= 3) {
                                        pageNum = i + 1;
                                    } else if (safePage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = safePage - 2 + i;
                                    }
                                    return (
                                        <li key={pageNum} className={`page-item${pageNum === safePage ? ' active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(pageNum)}>{pageNum}</button>
                                        </li>
                                    );
                                })}
                                <li className={`page-item${safePage === totalPages ? ' disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(safePage + 1)}>Next</button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}
