// app/services/dashboard.service.ts
import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

export interface DashboardStats {
    summary: {
        total_jobs: number;
        total_assignments: number;
        total_categories: number;
        total_pending_materials: number;
        total_po_services: number;
        active_workers: number;
    };
    jobs: any;
    assignments: any;
    categories: any;
    pending_materials: any;
    po_services: any;
    recent_activities: any[];
    monthly_trends: any;
    status_distribution: any;
    urgent_items: any;
    last_updated: string;
}

export interface RealTimeStats {
    active_jobs: number;
    pending_reviews: number;
    today_completed: number;
    pending_assignments: number;
    recent_completions: any[];
    timestamp: string;
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await axiosProvider.get('/fineengg_erp/dashboard/stats/');
        return response.data.data;
    },

    getRealTimeStats: async (): Promise<RealTimeStats> => {
        const response = await axiosProvider.get('/fineengg_erp/dashboard/realtime');
        return response.data.data;
    },

    getWorkerPerformance: async (params?: { worker_name?: string; from_date?: string; to_date?: string; limit?: number }) => {
        // Fix: Use config object with params property
        const config: any = {};
        if (params) {
            config.params = params;
        }
        const response = await axiosProvider.get('/fineengg_erp/dashboard/worker-performance', config);
        return response.data;
    },

    getMachineUtilization: async () => {
        const response = await axiosProvider.get('/fineengg_erp/dashboard/machine-utilization');
        return response.data;
    },

    getClientDashboard: async (client_name?: string) => {
        const config: any = {};
        if (client_name) {
            config.params = { client_name };
        }
        const response = await axiosProvider.get('/fineengg_erp/dashboard/client-dashboard', config);
        return response.data;
    },

    exportData: async (type?: string, from_date?: string, to_date?: string) => {
        const config: any = {};
        if (type || from_date || to_date) {
            config.params = { type, from_date, to_date };
        }
        const response = await axiosProvider.get('/fineengg_erp/dashboard/export', config);
        return response.data;
    }
};