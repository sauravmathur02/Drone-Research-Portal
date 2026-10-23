const { GoogleGenAI } = require('@google/genai');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.client = this.apiKey ? new GoogleGenAI({ apiKey: this.apiKey }) : null;
  }

  /**
   * Analyzes a news article title & snippet to determine if a new drone/UAV was unveiled
   * and extracts structured specifications for automatic database ingestion.
   */
  async extractDroneFromArticle(article) {
    const text = `${article.title}\n${article.contentSnippet || article.content || ''}`;

    if (!this.client) {
      return this.fallbackRegexExtractor(article);
    }

    try {
      const prompt = `
You are an aerospace data extraction engine for a Drone Research Portal.
Analyze the following news item and determine if it announces or profiles a specific Unmanned Aerial Vehicle (UAV / Drone / eVTOL).
If it does NOT mention a specific named drone model, return {"isDrone": false}.
If it DOES mention a specific named drone model, return ONLY valid JSON matching this structure:
{
  "isDrone": true,
  "name": "Exact Model Name",
  "manufacturer": "Company or Lab Name",
  "country": "Country of Origin",
  "category": "One of: Academic & Research | Commercial & Photography | Agricultural | Urban Air Mobility (eVTOL) | Heavy Lift & Logistics | Micro / Nano UAV | MALE / HALE Surveillance | Tactical / Loitering | Autonomous Swarm | Experimental",
  "role": "Primary mission or use case",
  "introducedYear": 2026,
  "status": "Prototype | Active | In Development",
  "specifications": {
    "maxSpeedKmh": number or 0,
    "rangeKm": number or 0,
    "enduranceHours": number or 0,
    "maxTakeoffWeightKg": number or 0,
    "payloadCapacityKg": number or 0,
    "propulsionType": "Electric Brushless | LiPo Multirotor | Turboprop | Turbofan | Piston Engine | Hybrid-Electric | Hydrogen Fuel Cell | Solar-Electric"
  },
  "academicNotes": {
    "aerodynamicProfile": "Brief description of airframe/lift physics",
    "controlArchitecture": "Flight controller or autonomy stack details",
    "sensorSuite": ["Sensor 1", "Sensor 2"],
    "learningTakeaways": ["Key engineering innovation"]
  },
  "description": "2-3 sentence technical overview",
  "confidenceScore": 0.0 to 1.0
}

News Item:
${text}
`;

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text);
      return parsed;
    } catch (error) {
      console.error('[AIService] Structured extraction error:', error.message);
      return { isDrone: false };
    }
  }

  /**
   * Fallback deterministic extractor when no LLM API key is provided
   */
  fallbackRegexExtractor(article) {
    const title = article.title || '';
    const match = title.match(/\b([A-Z][A-Za-z0-9]+-[A-Z0-9]+|[A-Z][a-z]+\s(?:UAV|Drone|X\d+|V\d+))\b/);
    if (!match) return { isDrone: false };

    return {
      isDrone: true,
      name: match[1],
      manufacturer: 'Global Aerospace Lab',
      country: 'International',
      category: 'Experimental',
      role: 'Next-Generation Autonomous UAV',
      introducedYear: new Date().getFullYear(),
      status: 'Prototype',
      specifications: {
        maxSpeedKmh: 120,
        rangeKm: 80,
        enduranceHours: 2.5,
        maxTakeoffWeightKg: 25,
        payloadCapacityKg: 5,
        propulsionType: 'Hybrid-Electric'
      },
      academicNotes: {
        aerodynamicProfile: 'Modular composite airframe optimized for low drag',
        controlArchitecture: 'Redundant flight control with onboard edge AI',
        sensorSuite: ['EO/IR Gimbal', 'LiDAR', 'RTK-GNSS'],
        learningTakeaways: ['Automated news ingestion discovery candidate']
      },
      description: article.contentSnippet || title,
      confidenceScore: 0.65
    };
  }

  /**
   * Academic Tutor & Research Assistant Q&A
   */
  async askAcademicTutor(question, contextDrones = []) {
    const contextText = contextDrones
      .map(
        (d) =>
          `- ${d.name} (${d.country}, ${d.category}): Max Speed ${d.specifications?.maxSpeedKmh} km/h, Endurance ${d.specifications?.enduranceHours} hrs, Payload ${d.specifications?.payloadCapacityKg} kg. Propulsion: ${d.specifications?.propulsionType}. Notes: ${d.description}`
      )
      .join('\n');

    if (!this.client) {
      return {
        answer: `Based on our local repository database:\n\n${
          contextText || 'No exact match found in local records.'
        }\n\n*Tip: Add a \`GEMINI_API_KEY\` in your \`.env\` file to enable full generative academic explanations.*`,
        sources: contextDrones.map((d) => d.name)
      };
    }

    const prompt = `
You are an Aerospace & UAV Engineering Professor assisting students and researchers on the Drone Research Portal.
Use the following verified database entries when relevant, and explain the underlying physics, aerodynamics, avionics, or engineering trade-offs clearly.

Database Context:
${contextText}

Student/Researcher Question:
${question}
`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return {
      answer: response.text,
      sources: contextDrones.map((d) => d.name)
    };
  }
}

module.exports = new AIService();
