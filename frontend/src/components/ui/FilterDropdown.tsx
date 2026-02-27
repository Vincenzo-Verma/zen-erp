import type { ReactNode } from 'react';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterField {
    key: string;
    label: string;
    options: FilterOption[];
}

interface Props {
    filters: FilterField[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    onApply: () => void;
    onReset: () => void;
    children?: ReactNode;
}

export function FilterDropdown({ filters, values, onChange, onApply, onReset }: Props) {
    return (
        <div className="card border shadow-sm mb-3">
            <div className="card-body py-3">
                <div className="row g-2 align-items-end">
                    {filters.map((f) => (
                        <div key={f.key} className="col-auto" style={{ minWidth: 160 }}>
                            <label className="form-label mb-1" style={{ fontSize: 12 }}>{f.label}</label>
                            <select
                                className="form-select form-select-sm"
                                value={values[f.key] || ''}
                                onChange={(e) => onChange(f.key, e.target.value)}
                            >
                                <option value="">All</option>
                                {f.options.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <div className="col-auto d-flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={onApply}>Apply</button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={onReset}>Reset</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
