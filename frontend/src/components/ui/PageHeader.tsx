import type { ReactNode } from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface Props {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    children?: ReactNode;
}

export function PageHeader({ title, breadcrumbs, children }: Props) {
    return (
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
                <h3 className="page-title mb-1">{title}</h3>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            {breadcrumbs.map((item, i) => (
                                <li
                                    key={i}
                                    className={`breadcrumb-item${i === breadcrumbs.length - 1 ? ' active' : ''}`}
                                    aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
                                >
                                    {item.href && i !== breadcrumbs.length - 1 ? (
                                        <a href={item.href}>{item.label}</a>
                                    ) : (
                                        item.label
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>
            {children && (
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                    {children}
                </div>
            )}
        </div>
    );
}
