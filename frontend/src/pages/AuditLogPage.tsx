import { useState, useEffect, useCallback } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { IconUser, IconClock, IconGlobe, IconSearch } from '@tabler/icons-react';

type LogType = 'all' | 'auth' | 'student' | 'staff' | 'role' | 'config';

interface AuditEvent {
    id: string;
    tenant_id: string;
    user_id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details_json: string;
    ip_address: string;
    created_at: string;
}

interface AuditResponse {
    events: AuditEvent[];
    total_count: number;
}

const badgeVariants: Record<string, string> = {
    auth: 'primary',
    student: 'success',
    staff: 'info',
    role: 'warning',
    config: 'secondary',
};

const filters: { label: string; value: LogType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Auth', value: 'auth' },
    { label: 'Students', value: 'student' },
    { label: 'Staff', value: 'staff' },
    { label: 'Roles', value: 'role' },
    { label: 'Config', value: 'config' },
];

const studentActionFilters: { label: string; value: string }[] = [
    { label: 'All Student Actions', value: '' },
    { label: 'Admitted', value: 'STUDENT_ADMITTED' },
    { label: 'Updated', value: 'STUDENT_UPDATED' },
    { label: 'Deleted', value: 'STUDENT_DELETED' },
];

function mapResourceType(rt: string): string {
    if (['auth', 'student', 'staff', 'role'].includes(rt)) return rt;
    return 'config';
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function parseDetails(json: string): string {
    try {
        const obj = JSON.parse(json);
        return Object.entries(obj)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
    } catch {
        return json || '\u2014';
    }
}

function formatAction(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditLogPage() {
    const { currentSchool } = useSchoolContext();
    const [filter, setFilter] = useState<LogType>('all');
    const [actionFilter, setActionFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 50;

    const tenantId = currentSchool?.id || '';

    const fetchEvents = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('resource_type', filter);
            if (actionFilter) params.set('action', actionFilter);
            params.set('limit', String(limit));
            params.set('offset', String(offset));

            const token = localStorage.getItem('erp_token');
            const res = await apiRequest<AuditResponse>(
                `/api/v1/audit/${tenantId}?${params.toString()}`,
                { token }
            );
            setEvents(res.events || []);
            setTotalCount(res.total_count || 0);
        } catch (err) {
            console.error('Failed to load audit events', err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [tenantId, filter, actionFilter, offset]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        setOffset(0);
    }, [filter, actionFilter]);

    // Reset action filter when switching away from student
    useEffect(() => {
        if (filter !== 'student') {
            setActionFilter('');
        }
    }, [filter]);

    // Client-side search filtering on displayed events
    const displayedEvents = searchTerm.trim()
        ? events.filter((e) => {
            const term = searchTerm.toLowerCase();
            return (
                e.action.toLowerCase().includes(term) ||
                e.user_email.toLowerCase().includes(term) ||
                e.resource_type.toLowerCase().includes(term) ||
                parseDetails(e.details_json).toLowerCase().includes(term)
            );
        })
        : events;

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Audit Log"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Audit Log' },
                ]}
            />

            {totalCount > 0 && (
                <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                    Tracking all actions across your organization ({totalCount} events)
                </p>
            )}

            {/* Filter pills */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                {filters.map((f) => (
                    <button
                        key={f.value}
                        className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Action sub-filters for Students */}
            {filter === 'student' && (
                <div className="d-flex flex-wrap gap-2 mb-3">
                    {studentActionFilters.map((af) => (
                        <button
                            key={af.value}
                            className={`btn btn-sm ${actionFilter === af.value ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setActionFilter(af.value)}
                        >
                            {af.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Search bar */}
            <div className="d-flex align-items-center mb-4" style={{ maxWidth: 400 }}>
                <div className="input-group input-group-sm">
                    <span className="input-group-text">
                        <IconSearch size={14} />
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by action, user, or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading audit events...
                </div>
            ) : displayedEvents.length === 0 ? (
                <div className="text-center py-5 text-muted">No audit events found.</div>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {displayedEvents.map((entry) => {
                        const logType = mapResourceType(entry.resource_type);
                        const variant = badgeVariants[logType] || 'secondary';
                        return (
                            <div key={entry.id} className="card border-0 shadow-sm">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-start gap-3">
                                        <div
                                            className="rounded flex-shrink-0"
                                            style={{ width: 4, minHeight: 40, background: `var(--bs-${variant})` }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <span style={{ fontWeight: 600, color: 'var(--erp-text-primary)', fontSize: 14 }}>
                                                    {formatAction(entry.action)}
                                                </span>
                                                <span className={`badge badge-soft-${variant}`}>{entry.resource_type}</span>
                                            </div>
                                            <p className="mb-2 text-muted" style={{ fontSize: 13 }}>
                                                {parseDetails(entry.details_json)}
                                            </p>
                                            <div className="d-flex flex-wrap gap-3" style={{ fontSize: 12 }}>
                                                <span className="d-inline-flex align-items-center gap-1 text-muted">
                                                    <IconUser size={12} />
                                                    {entry.user_email || entry.user_id}
                                                </span>
                                                <span className="d-inline-flex align-items-center gap-1 text-muted">
                                                    <IconClock size={12} />
                                                    {formatDate(entry.created_at)}
                                                </span>
                                                {entry.ip_address && (
                                                    <span className="d-inline-flex align-items-center gap-1 text-muted">
                                                        <IconGlobe size={12} />
                                                        {entry.ip_address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalCount > limit && (
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={offset === 0}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                        Previous
                    </button>
                    <small className="text-muted">
                        {offset + 1}&ndash;{Math.min(offset + limit, totalCount)} of {totalCount}
                    </small>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={offset + limit >= totalCount}
                        onClick={() => setOffset(offset + limit)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
