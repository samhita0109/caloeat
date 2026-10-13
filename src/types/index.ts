export type Sex = 'male' | 'female';
export type UnitPreference = 'metric' | 'imperial';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
export type WeightGoal = 'lose' | 'maintain' | 'gain';
export type DietaryPreference = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian' | 'other';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type Mood = 'great' | 'good' | 'neutral' | 'tired' | 'stressed';

export interface MacroTargets {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  bodyFatPercentage?: number;
  unitPreference: UnitPreference;
  activityLevel: ActivityLevel;
  goal: WeightGoal;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  isOnboardingCompleted: boolean;
  
  // Calculated metabolic stats
  calculatedBMR: number;
  calculatedTDEE: number;
  dailyCalorieTarget: number;
  macroTargets: MacroTargets;
  
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  regionalName?: string;
  cuisine: string;
  servingSize: string;
  servingUnit: string;
  servingWeightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG?: number;
  sodiumMg?: number;
  isVeg: boolean;
  source: 'IFCT' | 'USDA' | 'OpenFoodFacts' | 'UserCreated' | 'AI_Estimate';
  description?: string;
}

export interface MealItem extends FoodItem {
  portionMultiplier: number; // e.g. 0.5 to 4.0, default 1.0
  effectiveCalories: number;
  effectiveProteinG: number;
  effectiveCarbsG: number;
  effectiveFatG: number;
  effectiveFiberG: number;
  confidence?: ConfidenceLevel;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  time: string; // HH:mm
  items: MealItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  imageUri?: string;
  notes?: string;
  isScanned?: boolean;
  aiInsight?: string;
}

export interface WellnessData {
  waterGlasses: number; // 250ml each
  waterGoalGlasses: number; // default 8
  sleepHours: number;
  steps: number;
  activeCalories: number;
  mood?: Mood;
  notes?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealLog[];
  wellness: WellnessData;
  totalCaloriesConsumed: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
}

export interface ScanResult {
  dishName: string;
  regionalCuisine: string;
  confidence: ConfidenceLevel;
  isVeg: boolean;
  calorieRange: { min: number; max: number };
  detectedItems: MealItem[];
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy';
  ingredientsNote?: string;
  aiInsight: string;
}
