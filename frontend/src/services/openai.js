import OpenAI from 'openai'
import { OPENAI_CONFIG } from './config'

let openaiClient = null

/**
 * Initialize OpenAI client
 */
function getOpenAIClient() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: OPENAI_CONFIG.apiKey,
            dangerouslyAllowBrowser: true // For client-side usage
        })
    }
    return openaiClient
}

/**
 * Analyze lap performance and generate insights
 * @param {Object} params - Analysis parameters
 * @param {Array} params.lapData - Telemetry data for the lap
 * @param {Array} params.referenceLapData - Reference lap data for comparison (optional)
 * @param {Object} params.lapStats - Lap statistics
 * @returns {Promise<Object>} AI-generated insights
 */
export async function analyzeLapPerformance({ lapData, referenceLapData, lapStats }) {
    const client = getOpenAIClient()

    // Prepare telemetry summary
    const telemetrySummary = summarizeTelemetry(lapData)
    const referenceSummary = referenceLapData ? summarizeTelemetry(referenceLapData) : null

    // Build prompt
    let prompt = `You are an expert racing coach analyzing driver performance data from a Toyota GR Cup race. 

Current Lap Data:
- Lap Time: ${formatLapTime(lapStats.lapTime)}
- Max Speed: ${lapStats.maxSpeed?.toFixed(1)} km/h
- Avg Speed: ${lapStats.avgSpeed?.toFixed(1)} km/h
- Max RPM: ${lapStats.maxRPM}
- Telemetry Summary: ${JSON.stringify(telemetrySummary, null, 2)}
`

    if (referenceSummary) {
        prompt += `\nReference Lap (Faster) Data:
- Lap Time: ${formatLapTime(lapStats.referenceLapTime)}
- Max Speed: ${lapStats.referenceMaxSpeed?.toFixed(1)} km/h
- Avg Speed: ${lapStats.referenceAvgSpeed?.toFixed(1)} km/h
- Telemetry Summary: ${JSON.stringify(referenceSummary, null, 2)}
`
    }

    prompt += `\nProvide a detailed analysis in JSON format with the following structure:
{
  "overallAssessment": "Brief overall assessment of the lap",
  "strengths": ["List of 2-3 key strengths"],
  "weaknesses": ["List of 2-3 key areas for improvement"],
  "keyInsights": [
    {
      "area": "Braking" | "Acceleration" | "Cornering" | "Consistency" | "Racing Line",
      "insight": "Specific insight",
      "recommendation": "Actionable recommendation"
    }
  ],
  "improvementPriorities": [
    {
      "priority": 1-5,
      "area": "Area name",
      "description": "What to improve",
      "expectedGain": "Estimated time gain in seconds"
    }
  ]
}

Focus on actionable, specific advice that a driver can implement. Compare with reference lap if provided.`

    try {
        const response = await client.chat.completions.create({
            model: OPENAI_CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert racing coach specializing in driver development and performance analysis. Provide clear, actionable insights based on telemetry data.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
        })

        const insights = JSON.parse(response.choices[0].message.content)
        return {
            success: true,
            insights,
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        console.error('OpenAI API Error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Analyze racing line and provide optimization suggestions
 * @param {Object} params - Racing line parameters
 * @param {Array} params.lapData - Telemetry data with speed and steering
 * @param {Array} params.corners - Identified corners in the lap
 * @returns {Promise<Object>} Racing line analysis
 */
export async function analyzeRacingLine({ lapData, corners }) {
    const client = getOpenAIClient()

    const cornerAnalysis = corners.map(corner => ({
        name: corner.name,
        entrySpeed: corner.entrySpeed,
        apexSpeed: corner.apexSpeed,
        exitSpeed: corner.exitSpeed,
        brakingPoint: corner.brakingPoint,
        throttlePoint: corner.throttlePoint
    }))

    const prompt = `Analyze this racing line data from a Toyota GR Cup race and provide optimization suggestions.

Corner Analysis:
${JSON.stringify(cornerAnalysis, null, 2)}

Provide analysis in JSON format:
{
  "racingLineAssessment": "Overall assessment of the racing line",
  "cornerAnalysis": [
    {
      "corner": "Corner name",
      "assessment": "Current performance",
      "optimization": "How to optimize",
      "expectedGain": "Estimated time gain"
    }
  ],
  "generalTips": ["List of 3-5 general racing line tips"]
}`

    try {
        const response = await client.chat.completions.create({
            model: OPENAI_CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert racing coach specializing in racing line optimization and track analysis.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500,
            response_format: { type: 'json_object' }
        })

        const analysis = JSON.parse(response.choices[0].message.content)
        return {
            success: true,
            analysis,
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        console.error('OpenAI API Error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Summarize telemetry data for AI analysis
 */
function summarizeTelemetry(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) return {}

    const speeds = telemetryData.map(d => d.speed).filter(Boolean)
    const throttles = telemetryData.map(d => d.throttle).filter(Boolean)
    const brakes = telemetryData.map(d => d.brake).filter(Boolean)
    const rpms = telemetryData.map(d => d.rpm).filter(Boolean)

    return {
        dataPoints: telemetryData.length,
        speed: {
            max: Math.max(...speeds),
            avg: speeds.reduce((a, b) => a + b, 0) / speeds.length,
            min: Math.min(...speeds)
        },
        throttle: {
            max: Math.max(...throttles),
            avg: throttles.reduce((a, b) => a + b, 0) / throttles.length,
            fullThrottlePercent: (throttles.filter(t => t > 95).length / throttles.length * 100).toFixed(1)
        },
        brake: {
            max: Math.max(...brakes),
            avg: brakes.reduce((a, b) => a + b, 0) / brakes.length,
            brakingPercent: (brakes.filter(b => b > 10).length / brakes.length * 100).toFixed(1)
        },
        rpm: {
            max: Math.max(...rpms),
            avg: rpms.reduce((a, b) => a + b, 0) / rpms.length
        }
    }
}

/**
 * Format lap time in milliseconds to readable format
 */
function formatLapTime(ms) {
    if (!ms) return 'N/A'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = ms % 1000
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}
