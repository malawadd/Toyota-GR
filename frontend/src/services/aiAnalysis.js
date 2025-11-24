const OPENAI_API_KEY = 'null'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Call OpenAI API with the given messages
 */
async function callOpenAI(messages, options = {}) {
    const {
        model = 'gpt-4',
        temperature = 0.7,
        maxTokens = 1000
    } = options

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'OpenAI API request failed')
        }

        const data = await response.json()
        return data.choices[0].message.content
    } catch (error) {
        console.error('OpenAI API Error:', error)
        throw error
    }
}

/**
 * Generate a compelling race narrative from race data
 */
export async function generateRaceNarrative(raceData) {
    const { results, fastestLaps, weather, statistics } = raceData

    const prompt = `You are a professional motorsport commentator. Create a compelling 2-3 paragraph narrative about this race based on the following data:

Race Results (Top 5):
${results.slice(0, 5).map((r, i) => `${i + 1}. Car #${r.car_number} - ${r.class} class - ${r.laps} laps - Best lap: ${formatTime(r.best_lap_time)}`).join('\n')}

Fastest Laps:
${fastestLaps.slice(0, 3).map((l, i) => `${i + 1}. Car #${l.car_number} - Lap ${l.lap} - ${formatTime(l.lap_time)}`).join('\n')}

Weather: ${weather?.conditions || 'Clear'}
Total Vehicles: ${statistics?.totalVehicles || results.length}

Write an exciting narrative that captures the drama, key battles, and standout performances. Focus on what made this race memorable.`

    const messages = [
        { role: 'system', content: 'You are an expert motorsport commentator known for creating engaging race narratives.' },
        { role: 'user', content: prompt }
    ]

    return await callOpenAI(messages, { maxTokens: 500 })
}

/**
 * Detect and analyze key moments in the race
 */
export async function detectKeyMoments(raceData) {
    const { results, fastestLaps, lapTimes, weather, sectionLeaders } = raceData

    // Identify potential key moments from data
    const moments = []

    // Fastest lap moments
    if (fastestLaps && fastestLaps.length > 0) {
        const fastest = fastestLaps[0]
        moments.push({
            type: 'fastest_lap',
            lap: fastest.lap,
            vehicleId: fastest.vehicle_id,
            carNumber: fastest.car_number,
            time: fastest.lap_time,
            description: `Car #${fastest.car_number} sets the fastest lap of the race`,
            impact: 'high',
            timestamp: fastest.timestamp
        })
    }

    // Section leaders (strategic moments)
    if (sectionLeaders) {
        Object.entries(sectionLeaders).forEach(([section, data]) => {
            if (data && data.vehicle_id) {
                moments.push({
                    type: 'section_leader',
                    section,
                    lap: data.lap,
                    vehicleId: data.vehicle_id,
                    time: data.time,
                    description: `Fastest through ${section.toUpperCase()}`,
                    impact: 'medium',
                    timestamp: data.timestamp
                })
            }
        })
    }

    // Weather changes
    if (weather?.hasRain) {
        moments.push({
            type: 'weather_change',
            description: 'Rain affects track conditions',
            impact: 'high',
            weatherData: weather
        })
    }

    // Position battles (analyze lap time patterns)
    if (lapTimes && lapTimes.length > 0) {
        // Group by vehicle and look for close battles
        const vehicleLaps = {}
        lapTimes.forEach(lap => {
            if (!vehicleLaps[lap.vehicle_id]) {
                vehicleLaps[lap.vehicle_id] = []
            }
            vehicleLaps[lap.vehicle_id].push(lap)
        })

        // Find close lap times indicating battles
        const vehicles = Object.keys(vehicleLaps)
        for (let i = 0; i < vehicles.length - 1; i++) {
            for (let j = i + 1; j < vehicles.length; j++) {
                const v1Laps = vehicleLaps[vehicles[i]]
                const v2Laps = vehicleLaps[vehicles[j]]

                // Check for laps where times were within 1 second
                v1Laps.forEach(lap1 => {
                    const lap2 = v2Laps.find(l => l.lap === lap1.lap)
                    if (lap2 && Math.abs(lap1.lap_time - lap2.lap_time) < 1000) {
                        moments.push({
                            type: 'close_battle',
                            lap: lap1.lap,
                            vehicles: [lap1.vehicle_id, lap2.vehicle_id],
                            timeDiff: Math.abs(lap1.lap_time - lap2.lap_time),
                            description: `Intense battle between cars`,
                            impact: 'medium'
                        })
                    }
                })
            }
        }
    }

    // Sort by impact and timestamp
    moments.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 }
        return impactOrder[b.impact] - impactOrder[a.impact]
    })

    // Use AI to enhance descriptions
    const topMoments = moments.slice(0, 8)
    const enhancedMoments = await enhanceMomentDescriptions(topMoments, raceData)

    return enhancedMoments
}

/**
 * Enhance moment descriptions with AI
 */
async function enhanceMomentDescriptions(moments, raceData) {
    if (moments.length === 0) return moments

    const prompt = `Enhance these race moment descriptions to be more engaging and insightful:

${moments.map((m, i) => `${i + 1}. ${m.description} (${m.type}, Lap ${m.lap || 'N/A'})`).join('\n')}

For each moment, provide a brief (1 sentence) enhanced description that adds context and excitement. Return as a JSON array of strings.`

    const messages = [
        { role: 'system', content: 'You are a motorsport analyst providing insightful commentary.' },
        { role: 'user', content: prompt }
    ]

    try {
        const response = await callOpenAI(messages, { maxTokens: 400, temperature: 0.8 })
        const enhanced = JSON.parse(response)

        return moments.map((moment, i) => ({
            ...moment,
            enhancedDescription: enhanced[i] || moment.description
        }))
    } catch (error) {
        console.error('Failed to enhance moments:', error)
        return moments.map(m => ({ ...m, enhancedDescription: m.description }))
    }
}

/**
 * Generate strategic insights from race data
 */
export async function generateStrategicInsights(raceData) {
    const { results, lapTimes, weather, telemetryStats } = raceData

    const insights = []

    // Analyze lap time consistency
    if (lapTimes && lapTimes.length > 0) {
        const vehicleLaps = {}
        lapTimes.forEach(lap => {
            if (!vehicleLaps[lap.vehicle_id]) {
                vehicleLaps[lap.vehicle_id] = []
            }
            vehicleLaps[lap.vehicle_id].push(lap.lap_time)
        })

        Object.entries(vehicleLaps).forEach(([vehicleId, times]) => {
            const avg = times.reduce((a, b) => a + b, 0) / times.length
            const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length
            const stdDev = Math.sqrt(variance)

            if (stdDev < 1000) { // Very consistent (< 1 second variation)
                insights.push({
                    category: 'consistency',
                    vehicleId,
                    title: 'Exceptional Consistency',
                    description: `Maintained remarkably consistent lap times throughout the race`,
                    confidence: 'high',
                    data: { avgTime: avg, stdDev }
                })
            }
        })
    }

    // Weather impact analysis
    if (weather?.hasRain) {
        insights.push({
            category: 'weather_strategy',
            title: 'Weather Adaptation',
            description: 'Rain conditions required strategic tire and pace management',
            confidence: 'high',
            data: weather
        })
    }

    // Overtaking opportunities
    const topFinishers = results.slice(0, 3)
    if (topFinishers.length > 0) {
        insights.push({
            category: 'race_craft',
            title: 'Winning Strategy',
            description: `Top finishers demonstrated superior race pace and strategic decision-making`,
            confidence: 'medium',
            data: { topFinishers }
        })
    }

    // Use AI to generate additional insights
    const aiInsights = await generateAIInsights(raceData)

    return [...insights, ...aiInsights]
}

/**
 * Generate AI-powered strategic insights
 */
async function generateAIInsights(raceData) {
    const { results, fastestLaps, weather } = raceData

    const prompt = `Analyze this race data and provide 3 strategic insights:

Top 3 Finishers:
${results.slice(0, 3).map((r, i) => `${i + 1}. Car #${r.car_number} - ${r.laps} laps - Best: ${formatTime(r.best_lap_time)}`).join('\n')}

Fastest Laps:
${fastestLaps.slice(0, 3).map((l, i) => `${i + 1}. Car #${l.car_number} - ${formatTime(l.lap_time)}`).join('\n')}

Weather: ${weather?.conditions || 'Clear'}

Provide insights about:
1. What separated the winners from the rest
2. Key tactical decisions that influenced the outcome
3. Performance patterns or trends

Return as JSON array with format: [{"category": "string", "title": "string", "description": "string", "confidence": "high|medium|low"}]`

    const messages = [
        { role: 'system', content: 'You are a professional motorsport strategist and data analyst.' },
        { role: 'user', content: prompt }
    ]

    try {
        const response = await callOpenAI(messages, { maxTokens: 600, temperature: 0.7 })
        const insights = JSON.parse(response)
        return insights
    } catch (error) {
        console.error('Failed to generate AI insights:', error)
        return []
    }
}

/**
 * Generate performance highlights
 */
export async function generatePerformanceHighlights(raceData) {
    const { results, fastestLaps, sectionLeaders } = raceData

    const highlights = []

    // Race winner
    if (results && results.length > 0) {
        const winner = results[0]
        highlights.push({
            type: 'race_winner',
            title: 'Race Winner',
            vehicleId: winner.vehicle_id,
            carNumber: winner.car_number,
            description: `Dominated the race with ${winner.laps} laps completed`,
            data: winner
        })
    }

    // Fastest lap holder
    if (fastestLaps && fastestLaps.length > 0) {
        const fastest = fastestLaps[0]
        highlights.push({
            type: 'fastest_lap',
            title: 'Fastest Lap',
            vehicleId: fastest.vehicle_id,
            carNumber: fastest.car_number,
            description: `Set the fastest lap of ${formatTime(fastest.lap_time)} on lap ${fastest.lap}`,
            data: fastest
        })
    }

    // Section masters
    if (sectionLeaders) {
        Object.entries(sectionLeaders).forEach(([section, data]) => {
            if (data && data.vehicle_id) {
                highlights.push({
                    type: 'section_master',
                    title: `${section.toUpperCase()} Master`,
                    vehicleId: data.vehicle_id,
                    section,
                    description: `Fastest through ${section.toUpperCase()} with ${data.time}s`,
                    data
                })
            }
        })
    }

    return highlights
}

/**
 * Format time in milliseconds to readable format
 */
function formatTime(ms) {
    if (!ms || ms === 0) return 'N/A'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}

export default {
    generateRaceNarrative,
    detectKeyMoments,
    generateStrategicInsights,
    generatePerformanceHighlights
}
