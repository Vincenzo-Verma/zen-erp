import { PageHeader } from '../components/ui/PageHeader';

interface PluginInfo {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: string;
    installed: boolean;
    version: string;
}

const plugins: PluginInfo[] = [
    { id: 'school-management', name: 'School Management', icon: '🏫', description: 'Student enrollment, attendance tracking, grade management, teacher scheduling, and report cards.', category: 'Education', installed: true, version: '1.2.0' },
    { id: 'inventory', name: 'Inventory Management', icon: '📦', description: 'Track stock levels, manage purchase orders, warehouse operations, and automated reorder points.', category: 'Operations', installed: true, version: '1.0.4' },
    { id: 'hospital-opd', name: 'Hospital OPD', icon: '🏥', description: 'Outpatient department management with appointment scheduling, patient records, and billing integration.', category: 'Healthcare', installed: false, version: '0.9.0' },
    { id: 'accounting', name: 'Accounting & Finance', icon: '💰', description: 'Double-entry bookkeeping, invoicing, expense tracking, financial reports, and tax calculations.', category: 'Finance', installed: false, version: '0.8.2' },
    { id: 'hrm', name: 'Human Resources', icon: '👥', description: 'Employee management, payroll processing, leave tracking, performance reviews, and onboarding workflows.', category: 'People', installed: false, version: '0.7.0' },
    { id: 'crm', name: 'CRM', icon: '🤝', description: 'Customer relationship management with sales pipeline, contact tracking, and email integration.', category: 'Sales', installed: false, version: '0.6.1' },
    { id: 'project', name: 'Project Management', icon: '📋', description: 'Task boards, Gantt charts, time tracking, sprint planning, and team collaboration tools.', category: 'Productivity', installed: false, version: '0.5.0' },
    { id: 'ecommerce', name: 'E-Commerce', icon: '🛒', description: 'Online storefront, product catalog, shopping cart, payment processing, and order fulfillment.', category: 'Commerce', installed: false, version: '0.4.0' },
];

export function PluginMarketplacePage() {
    const installed = plugins.filter((p) => p.installed);
    const available = plugins.filter((p) => !p.installed);

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Plugin Marketplace"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Plugins' },
                ]}
            />

            {/* Installed */}
            <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, background: 'var(--erp-success)' }} />
                Installed
                <span className="badge badge-soft-success">{installed.length}</span>
            </h6>
            <div className="row g-3 mb-4">
                {installed.map((plugin) => (
                    <div key={plugin.id} className="col-sm-6 col-lg-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '3px solid var(--erp-success)' }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span style={{ fontSize: 28 }}>{plugin.icon}</span>
                                    <span className="badge badge-soft-secondary" style={{ fontSize: 11 }}>{plugin.category}</span>
                                </div>
                                <h6 className="fw-semibold mb-1">{plugin.name}</h6>
                                <p className="text-muted mb-3" style={{ fontSize: 13 }}>{plugin.description}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">v{plugin.version}</small>
                                    <button className="btn btn-outline-secondary btn-sm">Manage</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Available */}
            <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, background: 'var(--erp-text-muted)' }} />
                Available
                <span className="badge badge-soft-secondary">{available.length}</span>
            </h6>
            <div className="row g-3">
                {available.map((plugin) => (
                    <div key={plugin.id} className="col-sm-6 col-lg-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span style={{ fontSize: 28 }}>{plugin.icon}</span>
                                    <span className="badge badge-soft-secondary" style={{ fontSize: 11 }}>{plugin.category}</span>
                                </div>
                                <h6 className="fw-semibold mb-1">{plugin.name}</h6>
                                <p className="text-muted mb-3" style={{ fontSize: 13 }}>{plugin.description}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">v{plugin.version}</small>
                                    <button className="btn btn-primary btn-sm">Install</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
