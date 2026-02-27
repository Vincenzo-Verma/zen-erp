import type { ApexOptions } from 'apexcharts';

function isDark(): boolean {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

function textColor(): string {
    return isDark() ? '#9CA3AF' : '#6B7280';
}

function gridColor(): string {
    return isDark() ? '#1B1632' : '#E5E7EB';
}

const baseOptions: Partial<ApexOptions> = {
    chart: {
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
    },
    grid: {
        borderColor: gridColor(),
        strokeDashArray: 3,
    },
    dataLabels: { enabled: false },
    legend: {
        labels: { colors: textColor() },
        fontSize: '12px',
    },
};

export function getBarOptions(categories: string[], colors?: string[]): ApexOptions {
    return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'bar' },
        colors: colors || ['#3D5EE1'],
        plotOptions: {
            bar: { borderRadius: 4, columnWidth: '50%' },
        },
        xaxis: {
            categories,
            labels: { style: { colors: textColor(), fontSize: '12px' } },
            axisBorder: { show: false },
        },
        yaxis: {
            labels: { style: { colors: textColor(), fontSize: '12px' } },
        },
        grid: { borderColor: gridColor(), strokeDashArray: 3 },
    };
}

export function getDonutOptions(labels: string[], colors?: string[]): ApexOptions {
    return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'donut' },
        colors: colors || ['#3D5EE1', '#1ABE17', '#EAB300', '#E82646', '#6FCCD8'],
        labels,
        stroke: { width: 0 },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            color: textColor(),
                        },
                    },
                },
            },
        },
        legend: {
            position: 'bottom',
            labels: { colors: textColor() },
            fontSize: '12px',
        },
    };
}

export function getAreaOptions(categories: string[], colors?: string[]): ApexOptions {
    return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'area' },
        colors: colors || ['#3D5EE1'],
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
        },
        xaxis: {
            categories,
            labels: { style: { colors: textColor(), fontSize: '12px' } },
            axisBorder: { show: false },
        },
        yaxis: {
            labels: { style: { colors: textColor(), fontSize: '12px' } },
        },
        grid: { borderColor: gridColor(), strokeDashArray: 3 },
    };
}

export function getRadialBarOptions(labels: string[], colors?: string[]): ApexOptions {
    return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'radialBar' },
        colors: colors || ['#3D5EE1'],
        labels,
        plotOptions: {
            radialBar: {
                hollow: { size: '60%' },
                dataLabels: {
                    name: { fontSize: '14px', color: textColor() },
                    value: { fontSize: '20px', fontWeight: 700, color: textColor() },
                },
            },
        },
    };
}
