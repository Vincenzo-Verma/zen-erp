import './BillingPage.css';

export function BillingPage() {
    return (
        <div className="billing-page animate-fadeIn">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Billing & Wallet</h1>
                    <p className="page-subtitle">Manage your wallet balance and view transaction history</p>
                </div>
                <button className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Top Up Wallet
                </button>
            </div>

            {/* Balance Cards */}
            <div className="billing-cards">
                <div className="billing-card glass-card">
                    <span className="billing-card-label">Current Balance</span>
                    <span className="billing-card-value billing-card-value-lg">$0.00</span>
                    <span className="billing-card-hint">USD</span>
                </div>
                <div className="billing-card glass-card">
                    <span className="billing-card-label">Daily Burn Rate</span>
                    <span className="billing-card-value">$0.00</span>
                    <span className="billing-card-hint">per day</span>
                </div>
                <div className="billing-card glass-card">
                    <span className="billing-card-label">Runway</span>
                    <span className="billing-card-value">∞</span>
                    <span className="billing-card-hint">days remaining</span>
                </div>
            </div>

            {/* Transaction History */}
            <div className="billing-section glass-card">
                <h2 className="billing-section-title">Transaction History</h2>
                <div className="billing-table-wrapper">
                    <table className="billing-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="billing-empty-row">
                                <td colSpan={4}>
                                    <div className="billing-empty">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                            <line x1="1" y1="10" x2="23" y2="10" />
                                        </svg>
                                        <span>No transactions yet</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
