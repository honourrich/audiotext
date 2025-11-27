import { supabase } from './supabase';

// Types for personalization
export interface PersonalityProfile {
  id: string;
  user_id: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  avg_sentence_length: number;
  vocabulary_complexity: number;
  formality_score: number;
  enthusiasm_score: number;
  technical_depth: number;
  writing_patterns: Record<string, any>;
  analyzed_episodes: number;
  last_analysis_at: string;
}

export interface BrandVoiceProfile {
  id: string;
  user_id: string;
  brand_name?: string;
  formality_score: number;
  technical_level: number;
  enthusiasm_score: number;
  authenticity_score: number;
  liwc_analysis: Record<string, any>;
  brand_keywords: string[];
  tone_markers: Record<string, any>;
  source_content_urls: string[];
}

export interface GenreTemplate {
  id: string;
  genre_name: string;
  display_name: string;
  description?: string;
  structure_template: Record<string, any>;
  tone_guidelines: Record<string, any>;
  required_sections: string[];
  optional_sections: string[];
  formatting_rules: Record<string, any>;
  example_content?: string;
}

export interface ResourceItem {
  id: string;
  resource_name: string;
  resource_type: string;
  canonical_url?: string;
  alternative_names: string[];
  category?: string;
  description?: string;
  auto_link_enabled: boolean;
  usage_count?: number;
}

export interface PersonalizationSettings {
  id: string;
  user_id: string;
  enable_style_cloning: boolean;
  enable_brand_voice: boolean;
  enable_genre_detection: boolean;
  enable_personality_scoring: boolean;
  enable_resource_linking: boolean;
  preferred_genre?: string;
  manual_overrides: Record<string, any>;
  feedback_data: Record<string, any>;
}

export interface EpisodePersonalizationData {
  id: string;
  episode_id: string;
  user_id: string;
  detected_genre?: string;
  personality_fit_score?: number;
  brand_voice_score?: number;
  extracted_resources: Record<string, any>;
  personalization_applied: Record<string, any>;
  user_feedback: Record<string, any>;
}

export class PersonalizationAPI {
  // Writing Style Analysis
  static async analyzeWritingStyle(userId: string, episodeTexts: string[]): Promise<PersonalityProfile> {
    const analysis = this.performWritingAnalysis(episodeTexts);
    
    const { data, error } = await supabase
      .from('user_personality_profiles')
      .upsert({
        user_id: userId,
        ...analysis,
        analyzed_episodes: episodeTexts.length,
        last_analysis_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static performWritingAnalysis(texts: string[]) {
    const allText = texts.join(' ');
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = allText.split(/\s+/).filter(w => w.length > 0);
    
    // Calculate basic metrics
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    const vocabularyComplexity = this.calculateVocabularyComplexity(words);
    const formalityScore = this.calculateFormalityScore(allText);
    const enthusiasmScore = this.calculateEnthusiasmScore(allText);
    const technicalDepth = this.calculateTechnicalDepth(allText);

    // Big 5 personality estimation (simplified)
    const personality = this.estimatePersonalityTraits(allText);

    return {
      ...personality,
      avg_sentence_length: Math.round(avgSentenceLength),
      vocabulary_complexity: vocabularyComplexity,
      formality_score: formalityScore,
      enthusiasm_score: enthusiasmScore,
      technical_depth: technicalDepth,
      writing_patterns: {
        avg_words_per_sentence: avgSentenceLength,
        total_sentences: sentences.length,
        total_words: words.length,
        unique_words: new Set(words.map(w => w.toLowerCase())).size
      }
    };
  }

  private static calculateVocabularyComplexity(words: string[]): number {
    const complexWords = words.filter(word => word.length > 6).length;
    return Math.min(complexWords / words.length, 1);
  }

  private static calculateFormalityScore(text: string): number {
    const formalIndicators = [
      /\b(therefore|furthermore|consequently|nevertheless|moreover)\b/gi,
      /\b(shall|ought|must|should)\b/gi,
      /\b(utilize|implement|facilitate|demonstrate)\b/gi
    ];
    
    const informalIndicators = [
      /\b(gonna|wanna|kinda|sorta|yeah|ok|okay)\b/gi,
      /[!]{2,}/g,
      /\b(awesome|cool|amazing|super)\b/gi
    ];

    const formalCount = formalIndicators.reduce((count, regex) => count + (text.match(regex) || []).length, 0);
    const informalCount = informalIndicators.reduce((count, regex) => count + (text.match(regex) || []).length, 0);
    
    const totalIndicators = formalCount + informalCount;
    if (totalIndicators === 0) return 0.5;
    
    return formalCount / totalIndicators;
  }

  private static calculateEnthusiasmScore(text: string): number {
    const enthusiasmIndicators = [
      /[!]/g,
      /\b(amazing|incredible|fantastic|awesome|brilliant|excellent|outstanding)\b/gi,
      /\b(love|excited|thrilled|passionate)\b/gi,
      /[A-Z]{2,}/g // All caps words
    ];

    const matches = enthusiasmIndicators.reduce((count, regex) => count + (text.match(regex) || []).length, 0);
    const words = text.split(/\s+/).length;
    
    return Math.min(matches / (words * 0.01), 1); // Normalize to 0-1
  }

  private static calculateTechnicalDepth(text: string): number {
    const technicalIndicators = [
      /\b(algorithm|framework|methodology|implementation|architecture)\b/gi,
      /\b(API|SDK|database|server|client|protocol)\b/gi,
      /\b(analyze|optimize|integrate|configure|deploy)\b/gi,
      /\b(metrics|analytics|performance|scalability)\b/gi
    ];

    const matches = technicalIndicators.reduce((count, regex) => count + (text.match(regex) || []).length, 0);
    const words = text.split(/\s+/).length;
    
    return Math.min(matches / (words * 0.005), 1);
  }

  private static estimatePersonalityTraits(text: string): {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  } {
    // Simplified personality trait estimation based on linguistic patterns
    const opennessWords = /\b(creative|innovative|curious|explore|discover|imagine|artistic|novel)\b/gi;
    const conscientiousnessWords = /\b(organized|planned|systematic|detailed|careful|thorough|responsible)\b/gi;
    const extraversionWords = /\b(social|outgoing|energetic|talkative|assertive|active|enthusiastic)\b/gi;
    const agreeablenessWords = /\b(helpful|kind|cooperative|trusting|generous|friendly|considerate)\b/gi;
    const neuroticismWords = /\b(anxious|worried|stressed|nervous|tense|emotional|unstable)\b/gi;

    const wordCount = text.split(/\s+/).length;
    
    return {
      openness: Math.min((text.match(opennessWords) || []).length / (wordCount * 0.002), 1),
      conscientiousness: Math.min((text.match(conscientiousnessWords) || []).length / (wordCount * 0.002), 1),
      extraversion: Math.min((text.match(extraversionWords) || []).length / (wordCount * 0.002), 1),
      agreeableness: Math.min((text.match(agreeablenessWords) || []).length / (wordCount * 0.002), 1),
      neuroticism: Math.min((text.match(neuroticismWords) || []).length / (wordCount * 0.002), 1)
    };
  }

  // Brand Voice Analysis
  static async analyzeBrandVoice(userId: string, brandContent: string[], brandName?: string): Promise<BrandVoiceProfile> {
    const analysis = this.performBrandVoiceAnalysis(brandContent);
    
    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .upsert({
        user_id: userId,
        brand_name: brandName,
        ...analysis,
        last_analysis_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static performBrandVoiceAnalysis(contents: string[]) {
    const allContent = contents.join(' ');
    
    return {
      formality_score: this.calculateFormalityScore(allContent),
      technical_level: this.calculateTechnicalDepth(allContent),
      enthusiasm_score: this.calculateEnthusiasmScore(allContent),
      authenticity_score: this.calculateAuthenticityScore(allContent),
      liwc_analysis: this.performLIWCAnalysis(allContent),
      brand_keywords: this.extractBrandKeywords(allContent),
      tone_markers: this.extractToneMarkers(allContent)
    };
  }

  private static calculateAuthenticityScore(text: string): number {
    const authenticityIndicators = [
      /\b(honestly|truly|genuinely|personally|experience|believe)\b/gi,
      /\b(I|we|our|my)\b/gi, // Personal pronouns
      /\b(story|journey|learned|discovered)\b/gi
    ];

    const matches = authenticityIndicators.reduce((count, regex) => count + (text.match(regex) || []).length, 0);
    const words = text.split(/\s+/).length;
    
    return Math.min(matches / (words * 0.01), 1);
  }

  private static performLIWCAnalysis(text: string) {
    // Simplified LIWC-style analysis
    const categories = {
      positive_emotion: /\b(happy|joy|love|excited|amazing|great|wonderful|fantastic)\b/gi,
      negative_emotion: /\b(sad|angry|frustrated|disappointed|terrible|awful|hate)\b/gi,
      social: /\b(we|us|our|together|community|team|family|friends)\b/gi,
      cognitive: /\b(think|know|consider|understand|realize|analyze|believe)\b/gi,
      achievement: /\b(success|achieve|accomplish|win|goal|target|complete)\b/gi,
      power: /\b(control|influence|authority|lead|manage|command|strong)\b/gi
    };

    const results: Record<string, number> = {};
    const wordCount = text.split(/\s+/).length;

    for (const [category, regex] of Object.entries(categories)) {
      const matches = (text.match(regex) || []).length;
      results[category] = matches / wordCount;
    }

    return results;
  }

  private static extractBrandKeywords(text: string): string[] {
    // Extract frequently used words that might be brand-specific
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private static extractToneMarkers(text: string) {
    return {
      exclamation_frequency: (text.match(/!/g) || []).length / text.length,
      question_frequency: (text.match(/\?/g) || []).length / text.length,
      caps_frequency: (text.match(/[A-Z]/g) || []).length / text.length,
      emoji_usage: (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length
    };
  }

  // Genre Detection
  static async detectGenre(transcript: string, title: string): Promise<string> {
    const genreScores = await this.calculateGenreScores(transcript, title);
    return Object.entries(genreScores).reduce((a, b) => genreScores[a[0]] > genreScores[b[0]] ? a : b)[0];
  }

  private static async calculateGenreScores(transcript: string, title: string): Promise<Record<string, number>> {
    const { data: templates } = await supabase
      .from('genre_templates')
      .select('*')
      .eq('is_active', true);

    if (!templates) return { business: 1 };

    const scores: Record<string, number> = {};
    const content = `${title} ${transcript}`.toLowerCase();

    // Genre-specific keywords and patterns
    const genreIndicators = {
      business: [
        /\b(revenue|profit|business|startup|entrepreneur|investment|market|strategy|growth|sales|customer|product|company|CEO|founder)\b/gi,
        /\b(metrics|KPI|ROI|conversion|acquisition|retention|scaling|funding|valuation)\b/gi
      ],
      comedy: [
        /\b(funny|hilarious|joke|laugh|humor|comedy|comedian|stand-up|sketch|improv)\b/gi,
        /\b(haha|lol|lmao|rofl)\b/gi,
        /[!]{2,}/g
      ],
      education: [
        /\b(learn|teach|education|course|lesson|tutorial|study|research|academic|university|school|professor|student)\b/gi,
        /\b(concept|theory|method|principle|framework|knowledge|skill|training)\b/gi
      ],
      interview: [
        /\b(guest|interview|conversation|discuss|talk|chat|ask|question|answer|tell us|share|experience)\b/gi,
        /\b(background|journey|story|career|expertise|insights)\b/gi
      ],
      storytelling: [
        /\b(story|tale|narrative|character|plot|adventure|journey|experience|happened|remember)\b/gi,
        /\b(once|then|suddenly|finally|meanwhile|afterwards|beginning|end)\b/gi
      ]
    };

    for (const [genre, indicators] of Object.entries(genreIndicators)) {
      let score = 0;
      for (const regex of indicators) {
        const matches = content.match(regex) || [];
        score += matches.length;
      }
      scores[genre] = score / content.split(/\s+/).length; // Normalize by content length
    }

    return scores;
  }

  // Resource Extraction
  static async extractResources(text: string): Promise<ResourceItem[]> {
    const { data: resources } = await supabase
      .from('resource_database')
      .select('*')
      .eq('auto_link_enabled', true);

    if (!resources) return [];

    const extractedResources: ResourceItem[] = [];
    const lowerText = text.toLowerCase();

    for (const resource of resources) {
      const names = [resource.resource_name, ...resource.alternative_names];
      
      for (const name of names) {
        if (lowerText.includes(name.toLowerCase())) {
          extractedResources.push(resource);
          
          // Update usage count
          await supabase
            .from('resource_database')
            .update({ usage_count: resource.usage_count + 1 })
            .eq('id', resource.id);
          
          break; // Don't add the same resource multiple times
        }
      }
    }

    return extractedResources;
  }

  // Personality Scoring
  static calculatePersonalityFitScore(
    content: string,
    personalityProfile: PersonalityProfile
  ): number {
    const contentAnalysis = this.performWritingAnalysis([content]);
    
    // Calculate similarity between content and user's personality profile
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    let totalDifference = 0;

    for (const trait of traits) {
      const profileValue = personalityProfile[trait as keyof PersonalityProfile] as number;
      const contentValue = contentAnalysis[trait as keyof typeof contentAnalysis] as number;
      totalDifference += Math.abs(profileValue - contentValue);
    }

    // Convert difference to similarity score (0-1, where 1 is perfect match)
    return Math.max(0, 1 - (totalDifference / traits.length));
  }

  // Get user's personalization settings
  static async getPersonalizationSettings(userId: string): Promise<PersonalizationSettings | null> {
    const { data, error } = await supabase
      .from('personalization_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  // Update personalization settings
  static async updatePersonalizationSettings(
    userId: string,
    settings: Partial<PersonalizationSettings>
  ): Promise<PersonalizationSettings> {
    const { data, error } = await supabase
      .from('personalization_settings')
      .upsert({
        user_id: userId,
        ...settings
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get genre templates
  static async getGenreTemplates(): Promise<GenreTemplate[]> {
    const { data, error } = await supabase
      .from('genre_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return data || [];
  }

  // Save episode personalization data
  static async saveEpisodePersonalizationData(
    episodeId: string,
    userId: string,
    data: Partial<EpisodePersonalizationData>
  ): Promise<EpisodePersonalizationData> {
    const { data: result, error } = await supabase
      .from('episode_personalization_data')
      .upsert({
        episode_id: episodeId,
        user_id: userId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }
}