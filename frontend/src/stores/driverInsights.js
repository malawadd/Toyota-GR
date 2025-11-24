import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { analyzeLapPerformance, analyzeRacingLine } from '@/services/openai'
import {
    calculateLapStats,
    compareLaps,
    identifyBrakingZones,
    identifyCorners,
    calculateConsistency,
    calculateBrakingEfficiency,
    calculateThrottleEfficiency,
    calculateSectorTimes
} from '@/services/lapAnalysis'

export const useDriverInsightsStore = defineStore('driverInsights', () => {
    // State
    const selectedVehicleId = ref(null)
    const selectedLap1 = ref(null)
    const selectedLap2 = ref(null)
    const lap1Data = ref([])
    const lap2Data = ref([])
    const aiInsights = ref(null)
    const racingLineAnalysis = ref(null)
    const loading = ref(false)
    const analyzing = ref(false)
    const error = ref(null)

    // Computed
    const lap1Stats = computed(() => {
        if (!lap1Data.value || lap1Data.value.length === 0) return null
        return calculateLapStats(lap1Data.value)
    })

    const lap2Stats = computed(() => {
        if (!lap2Data.value || lap2Data.value.length === 0) return null
        return calculateLapStats(lap2Data.value)
    })

    const lapComparison = computed(() => {
        if (!lap1Data.value.length || !lap2Data.value.length) return null
        return compareLaps(lap1Data.value, lap2Data.value)
    })

    const lap1BrakingZones = computed(() => {
        if (!lap1Data.value.length) return []
        return identifyBrakingZones(lap1Data.value)
    })

    const lap2BrakingZones = computed(() => {
        if (!lap2Data.value.length) return []
        return identifyBrakingZones(lap2Data.value)
    })

    const lap1Corners = computed(() => {
        if (!lap1Data.value.length) return []
        return identifyCorners(lap1Data.value)
    })

    const lap2Corners = computed(() => {
        if (!lap2Data.value.length) return []
        return identifyCorners(lap2Data.value)
    })

    const lap1BrakingEfficiency = computed(() => {
        if (!lap1Data.value.length) return null
        return calculateBrakingEfficiency(lap1Data.value)
    })

    const lap2BrakingEfficiency = computed(() => {
        if (!lap2Data.value.length) return null
        return calculateBrakingEfficiency(lap2Data.value)
    })

    const lap1ThrottleEfficiency = computed(() => {
        if (!lap1Data.value.length) return null
        return calculateThrottleEfficiency(lap1Data.value)
    })

    const lap2ThrottleEfficiency = computed(() => {
        if (!lap2Data.value.length) return null
        return calculateThrottleEfficiency(lap2Data.value)
    })

    const lap1SectorTimes = computed(() => {
        if (!lap1Data.value.length) return []
        return calculateSectorTimes(lap1Data.value)
    })

    const lap2SectorTimes = computed(() => {
        if (!lap2Data.value.length) return []
        return calculateSectorTimes(lap2Data.value)
    })

    const performanceMetrics = computed(() => {
        if (!lap1Stats.value) return null

        return {
            lap1: {
                stats: lap1Stats.value,
                brakingEfficiency: lap1BrakingEfficiency.value,
                throttleEfficiency: lap1ThrottleEfficiency.value,
                sectorTimes: lap1SectorTimes.value,
                corners: lap1Corners.value.length,
                brakingZones: lap1BrakingZones.value.length
            },
            lap2: lap2Stats.value ? {
                stats: lap2Stats.value,
                brakingEfficiency: lap2BrakingEfficiency.value,
                throttleEfficiency: lap2ThrottleEfficiency.value,
                sectorTimes: lap2SectorTimes.value,
                corners: lap2Corners.value.length,
                brakingZones: lap2BrakingZones.value.length
            } : null,
            comparison: lapComparison.value
        }
    })

    // Actions
    const setLapData = (lap1, lap2 = null) => {
        lap1Data.value = lap1 || []
        lap2Data.value = lap2 || []
        // Clear previous AI insights when lap data changes
        aiInsights.value = null
        racingLineAnalysis.value = null
    }

    const analyzeLap = async (lapNumber = 1) => {
        const lapData = lapNumber === 1 ? lap1Data.value : lap2Data.value
        const referenceLapData = lapNumber === 1 ? lap2Data.value : lap1Data.value
        const lapStats = lapNumber === 1 ? lap1Stats.value : lap2Stats.value
        const referenceStats = lapNumber === 1 ? lap2Stats.value : lap1Stats.value

        if (!lapData || lapData.length === 0) {
            error.value = 'No lap data available for analysis'
            return
        }

        analyzing.value = true
        error.value = null

        try {
            // Get lap time from the data
            const lapTime = lapData[lapData.length - 1]?.timestamp
                ? new Date(lapData[lapData.length - 1].timestamp) - new Date(lapData[0].timestamp)
                : null

            const analysisParams = {
                lapData,
                lapStats: {
                    ...lapStats,
                    lapTime
                }
            }

            // Add reference lap if available
            if (referenceLapData && referenceLapData.length > 0) {
                const referenceLapTime = referenceLapData[referenceLapData.length - 1]?.timestamp
                    ? new Date(referenceLapData[referenceLapData.length - 1].timestamp) - new Date(referenceLapData[0].timestamp)
                    : null

                analysisParams.referenceLapData = referenceLapData
                analysisParams.lapStats.referenceLapTime = referenceLapTime
                analysisParams.lapStats.referenceMaxSpeed = referenceStats?.maxSpeed
                analysisParams.lapStats.referenceAvgSpeed = referenceStats?.avgSpeed
            }

            const result = await analyzeLapPerformance(analysisParams)

            if (result.success) {
                aiInsights.value = result.insights
            } else {
                error.value = result.error || 'Failed to analyze lap'
            }
        } catch (err) {
            console.error('Analysis error:', err)
            error.value = err.message || 'Failed to analyze lap'
        } finally {
            analyzing.value = false
        }
    }

    const analyzeRacingLineForLap = async (lapNumber = 1) => {
        const lapData = lapNumber === 1 ? lap1Data.value : lap2Data.value
        const corners = lapNumber === 1 ? lap1Corners.value : lap2Corners.value

        if (!lapData || lapData.length === 0) {
            error.value = 'No lap data available for racing line analysis'
            return
        }

        analyzing.value = true
        error.value = null

        try {
            const result = await analyzeRacingLine({
                lapData,
                corners
            })

            if (result.success) {
                racingLineAnalysis.value = result.analysis
            } else {
                error.value = result.error || 'Failed to analyze racing line'
            }
        } catch (err) {
            console.error('Racing line analysis error:', err)
            error.value = err.message || 'Failed to analyze racing line'
        } finally {
            analyzing.value = false
        }
    }

    const reset = () => {
        selectedVehicleId.value = null
        selectedLap1.value = null
        selectedLap2.value = null
        lap1Data.value = []
        lap2Data.value = []
        aiInsights.value = null
        racingLineAnalysis.value = null
        error.value = null
    }

    return {
        // State
        selectedVehicleId,
        selectedLap1,
        selectedLap2,
        lap1Data,
        lap2Data,
        aiInsights,
        racingLineAnalysis,
        loading,
        analyzing,
        error,

        // Computed
        lap1Stats,
        lap2Stats,
        lapComparison,
        lap1BrakingZones,
        lap2BrakingZones,
        lap1Corners,
        lap2Corners,
        lap1BrakingEfficiency,
        lap2BrakingEfficiency,
        lap1ThrottleEfficiency,
        lap2ThrottleEfficiency,
        lap1SectorTimes,
        lap2SectorTimes,
        performanceMetrics,

        // Actions
        setLapData,
        analyzeLap,
        analyzeRacingLineForLap,
        reset
    }
})
