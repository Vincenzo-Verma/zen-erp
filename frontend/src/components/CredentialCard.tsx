import { useState } from 'react';
import { BootstrapModal } from './ui/BootstrapModal';
import { IconCopy, IconCheck, IconPrinter } from '@tabler/icons-react';

interface CredentialCardProps {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    personName?: string;
    schoolName?: string;
    onClose: () => void;
}

export function CredentialCard({ title, subtitle, email, password, personName, schoolName, onClose }: CredentialCardProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=500');
        if (!printWindow) return;
        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Login Credentials</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 2rem; text-align: center; }
  .card { border: 2px solid #333; border-radius: 12px; padding: 2rem; max-width: 360px; margin: 0 auto; }
  .school-name { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.25rem; }
  .person-name { font-size: 1rem; color: #555; margin-bottom: 1.5rem; }
  .field { text-align: left; margin-bottom: 1rem; }
  .field-label { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
  .field-value { font-family: monospace; font-size: 1.1rem; font-weight: 600; word-break: break-all; }
  .note { font-size: 0.8rem; color: #888; margin-top: 1.5rem; font-style: italic; }
</style></head><body>
<div class="card">
  <div class="school-name">${schoolName || 'School'}</div>
  <div class="person-name">Login Credentials${personName ? ` for ${personName}` : ''}</div>
  <div class="field"><div class="field-label">Email / Username</div><div class="field-value">${email}</div></div>
  <div class="field"><div class="field-label">Temporary Password</div><div class="field-value">${password}</div></div>
  <div class="note">Please change your password on first login.</div>
</div></body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <BootstrapModal isOpen onClose={onClose} title={title} size="sm">
            <div className="text-center">
                <div className="alert alert-success py-2 mb-3">
                    {subtitle}
                </div>

                {personName && (
                    <p className="mb-3" style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{personName}</p>
                )}

                <div className="bg-body-tertiary rounded p-3 mb-3 text-start">
                    <div className="mb-3">
                        <small className="text-muted d-block mb-1">Login Email / Username</small>
                        <div className="d-flex align-items-center gap-2">
                            <code className="flex-grow-1" style={{ fontSize: 14, color: 'var(--erp-primary)', wordBreak: 'break-all' }}>{email}</code>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleCopy(email, 'email')}
                            >
                                {copiedField === 'email' ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <small className="text-muted d-block mb-1">Temporary Password</small>
                        <div className="d-flex align-items-center gap-2">
                            <code className="flex-grow-1" style={{ fontSize: 14, color: 'var(--erp-text-primary)' }}>{password}</code>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleCopy(password, 'password')}
                            >
                                {copiedField === 'password' ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary flex-fill" onClick={handlePrint}>
                        <IconPrinter size={16} className="me-1" /> Print
                    </button>
                    <button className="btn btn-primary flex-fill" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </BootstrapModal>
    );
}
