import { createRouter, createWebHistory } from "vue-router"

import MainView from "@/views/MainView.vue"
import DashboardView from "@/views/DashboardView.vue"
import RaceOverview from "@/views/dashboard/RaceOverview.vue"
import LiveTelemetry from "@/views/dashboard/LiveTelemetry.vue"
import LapTimeAnalysis from "@/views/dashboard/LapTimeAnalysis.vue"
import VehicleComparison from "@/views/dashboard/VehicleComparison.vue"
import Leaderboard from "@/views/dashboard/Leaderboard.vue"
import WeatherConditions from "@/views/dashboard/WeatherConditions.vue"
import SectionTimes from "@/views/dashboard/SectionTimes.vue"
import VehicleDetail from "@/views/dashboard/VehicleDetail.vue"
import DriverInsightsView from "@/views/dashboard/DriverInsightsView.vue"
import PostEventAnalysis from "@/views/dashboard/PostEventAnalysis.vue"

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "main",
			component: MainView,
		},
		{
			path: "/dashboard",
			name: "dashboard",
			component: DashboardView,
			redirect: "/dashboard/race-overview",
			children: [
				{
					path: "race-overview",
					name: "race-overview",
					component: RaceOverview,
				},
				{
					path: "live-telemetry",
					name: "live-telemetry",
					component: LiveTelemetry,
				},
				{
					path: "lap-time-analysis",
					name: "lap-time-analysis",
					component: LapTimeAnalysis,
				},
				{
					path: "vehicle-comparison",
					name: "vehicle-comparison",
					component: VehicleComparison,
				},
				{
					path: "leaderboard",
					name: "leaderboard",
					component: Leaderboard,
				},
				{
					path: "weather-conditions",
					name: "weather-conditions",
					component: WeatherConditions,
				},
				{
					path: "section-times",
					name: "section-times",
					component: SectionTimes,
				},
				{
					path: "driver-insights",
					name: "driver-insights",
					component: DriverInsightsView,
				},
				{
					path: "post-event-analysis",
					name: "post-event-analysis",
					component: PostEventAnalysis,
				},
				{
					path: "vehicle/:vehicleId",
					name: "vehicle-detail",
					component: VehicleDetail,
					props: true,
				},
			],
		},
	],
})

export default router
