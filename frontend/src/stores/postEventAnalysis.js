import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    fetchRaceResults,
    fetchFastestLaps,
    fetchLapTimes,
    fetchWeatherSummary,
    fetchSectionLeaders,
    fetchVehicles,
    fetchStatisticsOverview
} from '@/services/api/racing'
import {
    generateRaceNarrative,
    detectKeyMoments,
    generateStrategicInsights,
    generatePerformanceHighlights
} from '@/services/aiAnalysis'

export const usePostEventAnalysisStore = defineStore('postEventAnalysis', () => {
    // State
    const raceResults = ref([])
    const fastestLaps = ref([])
    const lapTimes = ref([])
    const weather = ref(null)
    const sectionLeaders = ref(null)
    const vehicles = ref([])
    const statistics = ref(null)

    const raceNarrative = ref('')
    const keyMoments = ref([])
    const strategicInsights = ref([])
    const performanceHighlights = ref([])

    const loading = ref(false)
    const loadingNarrative = ref(false)
    const loadingMoments = ref(false)
    const loadingInsights = ref(false)
    const error = ref(null)

    const analysisGenerated = ref(false)

    // Computed
    const topFinishers = computed(() => raceResults.value.slice(0, 5))

    const classResults = computed(() => {
        const grouped = { Pro: [], Am: [] }
        raceResults.value.forEach(result => {
            if (grouped[result.class]) {
                grouped[result.class].push(result)
            }
        })
        return grouped
    })

    const momentsByType = computed(() => {
        const grouped = {}
        keyMoments.value.forEach(moment => {
            if (!grouped[moment.type]) {
                grouped[moment.type] = []
            }
            grouped[moment.type].push(moment)
        })
        return grouped
    })

    const insightsByCategory = computed(() => {
        const grouped = {}
        strategicInsights.value.forEach(insight => {
            if (!grouped[insight.category]) {
                grouped[insight.category] = []
            }
            grouped[insight.category].push(insight)
        })
        return grouped
    })

    const raceStatistics = computed(() => {
        if (raceResults.value.length === 0) return null

        const totalLaps = raceResults.value.reduce((sum, r) => sum + (r.laps || 0), 0)
        const avgLaps = totalLaps / raceResults.value.length

        return {
            totalVehicles: raceResults.value.length,
            totalLaps,
            avgLaps: Math.round(avgLaps),
            fastestLap: fastestLaps.value[0]?.lap_time || 0,
            winner: raceResults.value[0]
        }
    })

    // Actions
    async function loadRaceData() {
        loading.value = true
        error.value = null

        try {
            const [
                resultsData,
                fastestData,
                lapTimesData,
                weatherData,
                leadersData,
                vehiclesData,
                statsData
            ] = await Promise.all([
                fetchRaceResults({ sortBy: 'position', order: 'asc' }),
                fetchFastestLaps({ limit: 10 }),
                fetchLapTimes({ limit: 1000 }),
                fetchWeatherSummary(),
                fetchSectionLeaders(),
                fetchVehicles(),
                fetchStatisticsOverview()
            ])

            raceResults.value = resultsData.data || []
            fastestLaps.value = fastestData.data || []
            lapTimes.value = lapTimesData.data || []
            weather.value = weatherData.data || null
            sectionLeaders.value = leadersData.data || null
            vehicles.value = vehiclesData.data || []
            statistics.value = statsData.data || null

        } catch (err) {
            console.error('Failed to load race data:', err)
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    async function generateAnalysis() {
        if (raceResults.value.length === 0) {
            error.value = 'No race data available for analysis'
            return
        }

        const raceData = {
            results: raceResults.value,
            fastestLaps: fastestLaps.value,
            lapTimes: lapTimes.value,
            weather: weather.value,
            sectionLeaders: sectionLeaders.value,
            vehicles: vehicles.value,
            statistics: statistics.value
        }

        // Generate narrative
        loadingNarrative.value = true
        try {
            raceNarrative.value = await generateRaceNarrative(raceData)
        } catch (err) {
            console.error('Failed to generate narrative:', err)
            raceNarrative.value = 'Unable to generate race narrative at this time.'
        } finally {
            loadingNarrative.value = false
        }

        // Detect key moments
        loadingMoments.value = true
        try {
            keyMoments.value = await detectKeyMoments(raceData)
        } catch (err) {
            console.error('Failed to detect key moments:', err)
            keyMoments.value = []
        } finally {
            loadingMoments.value = false
        }

        // Generate insights
        loadingInsights.value = true
        try {
            const insights = await generateStrategicInsights(raceData)
            const highlights = await generatePerformanceHighlights(raceData)

            strategicInsights.value = insights
            performanceHighlights.value = highlights
        } catch (err) {
            console.error('Failed to generate insights:', err)
            strategicInsights.value = []
            performanceHighlights.value = []
        } finally {
            loadingInsights.value = false
        }

        analysisGenerated.value = true
    }

    async function loadAndAnalyze() {
        await loadRaceData()
        if (!error.value) {
            await generateAnalysis()
        }
    }

    function reset() {
        raceResults.value = []
        fastestLaps.value = []
        lapTimes.value = []
        weather.value = null
        sectionLeaders.value = null
        vehicles.value = []
        statistics.value = null
        raceNarrative.value = ''
        keyMoments.value = []
        strategicInsights.value = []
        performanceHighlights.value = []
        analysisGenerated.value = false
        error.value = null
    }

    return {
        // State
        raceResults,
        fastestLaps,
        lapTimes,
        weather,
        sectionLeaders,
        vehicles,
        statistics,
        raceNarrative,
        keyMoments,
        strategicInsights,
        performanceHighlights,
        loading,
        loadingNarrative,
        loadingMoments,
        loadingInsights,
        error,
        analysisGenerated,

        // Computed
        topFinishers,
        classResults,
        momentsByType,
        insightsByCategory,
        raceStatistics,

        // Actions
        loadRaceData,
        generateAnalysis,
        loadAndAnalyze,
        reset
    }
})
