import { useState, useEffect } from 'react';
import { Gauge } from '../components/MiniChart';
import './AdminSystemHealthPage.css';

interface ServiceStatus {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    latency: string;
    uptime: string;
}

const services: ServiceStatus[] = [
    { name: 'API Gateway', status: 'operational', latency: '12ms', uptime: '99.99%' },
    { name: 'Auth Service (gRPC)', status: 'operational', latency: '8ms', uptime: '99.98%' },
    { name: 'Tenancy Service (gRPC)', status: 'operational', latency: '6ms', uptime: '99.99%' },
    { name: 'Billing Service (gRPC)', status: 'degraded', latency: '45ms', uptime: '99.80%' },
    { name: 'Event Bus (NATS)', status: 'operational', latency: '2ms', uptime: '99.99%' },
    { name: 'PostgreSQL', status: 'operational', latency: '3ms', uptime: '99.99%' },
];

const statusIcon = { operational: '✅', degraded: '⚠️', down: '❌' };
const statusLabel = { operational: 'Operational', degraded: 'Degraded', down: 'Down' };
const statusClass = { operational: 'status-up', degraded: 'status-warn', down: 'status-down' };

export function AdminSystemHealthPage() {
    const [liveHealth, setLiveHealth] = useState<{ status: string } | null>(null);

    useEffect(() => {
        fetch('/health')
            .then((r) => r.json())
            .then(setLiveHealth)
            .catch(() => setLiveHealth({ status: 'unreachable' }));
    }, []);

    return (
        <div className="health-page animate-fadeIn">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">System Health</h1>
                    <p className="page-subtitle">Monitor service health, latency, and resource utilization</p>
                </div>
                <div className="health-live-dot">
                    <span className={`live-indicator ${liveHealth?.status === 'ok' ? 'live-ok' : 'live-warn'}`} />
                    Gateway: {liveHealth?.status || 'checking...'}
                </div>
            </div>

            {/* Service Status Cards */}
            <div className="health-services-grid">
                {services.map((svc) => (
                    <div key={svc.name} className={`service-card glass-card ${statusClass[svc.status]}`}>
                        <div className="service-header">
                            <span className="service-status-icon">{statusIcon[svc.status]}</span>
                            <span className="service-name">{svc.name}</span>
                        </div>
                        <div className="service-metrics">
                            <div className="service-metric">
                                <span className="sm-label">Status</span>
                                <span className={`sm-value sm-${svc.status}`}>{statusLabel[svc.status]}</span>
                            </div>
                            <div className="service-metric">
                                <span className="sm-label">Latency</span>
                                <span className="sm-value">{svc.latency}</span>
                            </div>
                            <div className="service-metric">
                                <span className="sm-label">Uptime</span>
                                <span className="sm-value">{svc.uptime}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resources */}
            <div className="health-resources glass-card">
                <h3 className="chart-title" style={{ marginBottom: 'var(--space-lg)' }}>Resource Utilization</h3>
                <div className="resource-gauges">
                    <Gauge value={35} max={100} label="CPU Usage" color="var(--accent-success)" />
                    <Gauge value={62} max={100} label="Memory" color="var(--accent-primary)" />
                    <Gauge value={18} max={50} label="DB Pool (18/50)" color="var(--accent-warning)" />
                    <Gauge value={3} max={10} label="NATS Streams" color="var(--accent-info)" />
                    <Gauge value={1.2} max={5} label="Disk IO (GB/s)" color="var(--accent-success)" />
                </div>
            </div>

            {/* Uptime History */}
            <div className="uptime-section glass-card">
                <h3 className="chart-title">Uptime History (30 days)</h3>
                <div className="uptime-bars">
                    {Array.from({ length: 30 }, (_, i) => {
                        const isDown = i === 14 || i === 22;
                        const isDegraded = i === 7 || i === 21;
                        return (
                            <div
                                key={i}
                                className={`uptime-bar ${isDown ? 'uptime-down' : isDegraded ? 'uptime-degraded' : 'uptime-up'}`}
                                title={`Day ${30 - i}: ${isDown ? 'Incident' : isDegraded ? 'Degraded' : 'Operational'}`}
                            />
                        );
                    })}
                </div>
                <div className="uptime-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-success)' }} />Operational</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-warning)' }} />Degraded</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-danger)' }} />Incident</span>
                </div>
            </div>
        </div>
    );
}
