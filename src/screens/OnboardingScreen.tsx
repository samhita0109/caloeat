import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { ActivityLevel, DietaryPreference, Sex, UnitPreference, UserProfile, WeightGoal } from '../types';
import {
  ACTIVITY_MULTIPLIERS,
  calculateBMR,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateTDEE,
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
} from '../utils/metabolic';
import { saveUserProfile } from '../utils/storage';

interface OnboardingScreenProps {
  initialProfile?: UserProfile;
  onFinishOnboarding: (profile: UserProfile) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  initialProfile,
  onFinishOnboarding,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Form State
  const [name, setName] = useState(initialProfile?.name || '');
  const [age, setAge] = useState(initialProfile?.age ? String(initialProfile.age) : '22');
  const [sex, setSex] = useState<Sex>(initialProfile?.sex || 'male');
  const [unitPref, setUnitPref] = useState<UnitPreference>(initialProfile?.unitPreference || 'metric');
  
  // Height & Weight
  const [heightCmStr, setHeightCmStr] = useState(initialProfile?.heightCm ? String(initialProfile.heightCm) : '175');
  const [weightKgStr, setWeightKgStr] = useState(initialProfile?.weightKg ? String(initialProfile.weightKg) : '70');
  const [bodyFatStr, setBodyFatStr] = useState(
    initialProfile?.bodyFatPercentage ? String(initialProfile.bodyFatPercentage) : ''
  );

  // Lifestyle & Goals
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel || 'moderately_active'
  );
  const [goal, setGoal] = useState<WeightGoal>(initialProfile?.goal || 'maintain');
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>(
    initialProfile?.dietaryPreference || 'vegetarian'
  );

  const parsedAge = parseInt(age, 10) || 22;
  const parsedHeight = parseFloat(heightCmStr) || 175;
  const parsedWeight = parseFloat(weightKgStr) || 70;
  const parsedBodyFat = bodyFatStr.trim() ? parseFloat(bodyFatStr) : undefined;

  // Real-time metabolic preview
  const { bmr, formulaUsed } = calculateBMR(parsedWeight, parsedHeight, parsedAge, sex, parsedBodyFat);
  const tdee = calculateTDEE(bmr, activityLevel);
  const { target: calorieTarget, warning: safetyWarning } = calculateDailyCalorieTarget(
    tdee,
    goal,
    sex,
    parsedAge
  );
  const macroTargets = calculateMacroTargets(calorieTarget);

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('Required', 'Please enter your name or a display nickname.');
      return;
    }
    if (step === 2) {
      if (parsedAge < 12 || parsedAge > 100) {
        Alert.alert('Age Check', 'Please enter a valid age between 12 and 100.');
        return;
      }
      if (parsedHeight < 100 || parsedHeight > 240) {
        Alert.alert('Height Check', 'Please enter a realistic height in cm (100–240).');
        return;
      }
      if (parsedWeight < 30 || parsedWeight > 300) {
        Alert.alert('Weight Check', 'Please enter a realistic weight in kg (30–300).');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    const updatedProfile: UserProfile = {
      id: initialProfile?.id || `user_${Date.now()}`,
      name: name.trim() || 'Foodie',
      age: parsedAge,
      sex,
      heightCm: Math.round(parsedHeight),
      weightKg: Math.round(parsedWeight * 10) / 10,
      bodyFatPercentage: parsedBodyFat,
      unitPreference: unitPref,
      activityLevel,
      goal,
      dietaryPreference: dietaryPref,
      allergies: [],
      isOnboardingCompleted: true,
      calculatedBMR: bmr,
      calculatedTDEE: tdee,
      dailyCalorieTarget: calorieTarget,
      macroTargets,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveUserProfile(updatedProfile);
    onFinishOnboarding(updatedProfile);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          {step > 1 ? (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <Text style={styles.stepIndicator}>
            Step {step} of {totalSteps}
          </Text>

          <View style={{ width: 36 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* STEP 1: Welcome & Basics */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Welcome to CaloEat</Text>
              <Text style={styles.subtitle}>
                Your AI companion for Indian and global nutrition tracking. Let's personalize your metabolic equation.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What should we call you?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Samitha / Arjun"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Biological Sex (required for BMR equation)</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleButton, sex === 'male' && styles.toggleButtonActive]}
                    onPress={() => setSex('male')}
                  >
                    <Ionicons
                      name="male"
                      size={18}
                      color={sex === 'male' ? Colors.surface : Colors.textSecondary}
                    />
                    <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>
                      Male (+5 BMR)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleButton, sex === 'female' && styles.toggleButtonActive]}
                    onPress={() => setSex('female')}
                  >
                    <Ionicons
                      name="female"
                      size={18}
                      color={sex === 'female' ? Colors.surface : Colors.textSecondary}
                    />
                    <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>
                      Female (-161 BMR)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Body Biometrics */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Your Measurements</Text>
              <Text style={styles.subtitle}>
                We use the clinically verified Mifflin-St Jeor formula to determine your basal metabolic energy requirements.
              </Text>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                    maxLength={3}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={heightCmStr}
                    onChangeText={setHeightCmStr}
                  />
                </View>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={weightKgStr}
                    onChangeText={setWeightKgStr}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Body Fat % (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 18"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={bodyFatStr}
                    onChangeText={setBodyFatStr}
                  />
                </View>
              </View>

              {/* Informative note */}
              <View style={styles.infoCallout}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.infoCalloutText}>
                  {parsedBodyFat
                    ? 'Body fat provided: Katch-McArdle formula will be used based on lean body mass.'
                    : 'Standard Mifflin-St Jeor formula will estimate your basal metabolic rate.'}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 3: Activity & Goal */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Activity & Goals</Text>
              <Text style={styles.subtitle}>
                Choose your average physical movement to estimate your Total Daily Energy Expenditure (TDEE).
              </Text>

              <Text style={styles.sectionHeader}>Activity Level</Text>
              {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => {
                const info = ACTIVITY_MULTIPLIERS[level];
                const isSelected = activityLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setActivityLevel(level)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionHeader}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {info.label} ({info.multiplier}x)
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.optionSub}>{info.description}</Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Primary Goal</Text>
              <View style={styles.goalsRow}>
                {[
                  { key: 'lose', label: 'Lose Weight', sub: '-400 kcal/day' },
                  { key: 'maintain', label: 'Maintain', sub: '0 kcal' },
                  { key: 'gain', label: 'Gain Muscle', sub: '+350 kcal/day' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.goalCard,
                      goal === item.key && styles.goalCardSelected,
                    ]}
                    onPress={() => setGoal(item.key as WeightGoal)}
                  >
                    <Text
                      style={[
                        styles.goalTitle,
                        goal === item.key && styles.goalTitleSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.goalSub}>{item.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 4: Review Metabolic Plan */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Your Metabolic Target</Text>
              <Text style={styles.subtitle}>
                Calculated scientifically from your physiology. Here is your daily roadmap:
              </Text>

              {/* Big Calorie Target Card */}
              <View style={styles.calorieResultCard}>
                <Text style={styles.calorieResultLabel}>DAILY CALORIE TARGET</Text>
                <Text style={styles.calorieResultNumber}>{calorieTarget}</Text>
                <Text style={styles.calorieResultUnit}>kcal / day</Text>

                <View style={styles.equationBreakdownRow}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>BMR ({formulaUsed})</Text>
                    <Text style={styles.breakdownVal}>{bmr} kcal</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>TDEE (Daily Burn)</Text>
                    <Text style={styles.breakdownVal}>{tdee} kcal</Text>
                  </View>
                </View>
              </View>

              {safetyWarning && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning-outline" size={16} color={Colors.warning} />
                  <Text style={styles.warningText}>{safetyWarning}</Text>
                </View>
              )}

              {/* Macro Distribution Cards */}
              <Text style={styles.sectionHeader}>Recommended Macronutrient Split</Text>
              <View style={styles.macroCardsGrid}>
                <View style={[styles.macroGridCard, { backgroundColor: Colors.proteinSoft }]}>
                  <Text style={[styles.macroGridTitle, { color: Colors.protein }]}>Protein</Text>
                  <Text style={styles.macroGridValue}>{macroTargets.proteinGrams}g</Text>
                  <Text style={styles.macroGridSub}>25% • 4 kcal/g</Text>
                </View>
                <View style={[styles.macroGridCard, { backgroundColor: Colors.carbsSoft }]}>
                  <Text style={[styles.macroGridTitle, { color: '#B45309' }]}>Carbs</Text>
                  <Text style={styles.macroGridValue}>{macroTargets.carbsGrams}g</Text>
                  <Text style={styles.macroGridSub}>45% • 4 kcal/g</Text>
                </View>
                <View style={[styles.macroGridCard, { backgroundColor: Colors.fatSoft }]}>
                  <Text style={[styles.macroGridTitle, { color: Colors.fat }]}>Fats</Text>
                  <Text style={styles.macroGridValue}>{macroTargets.fatGrams}g</Text>
                  <Text style={styles.macroGridSub}>30% • 9 kcal/g</Text>
                </View>
              </View>

              <Text style={styles.dietaryTitle}>Dietary Preference</Text>
              <View style={styles.dietaryRow}>
                {[
                  { key: 'vegetarian', label: 'Vegetarian' },
                  { key: 'non_vegetarian', label: 'Non-Veg' },
                  { key: 'vegan', label: 'Vegan' },
                  { key: 'eggetarian', label: 'Eggetarian' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    style={[
                      styles.dietaryChip,
                      dietaryPref === d.key && styles.dietaryChipSelected,
                    ]}
                    onPress={() => setDietaryPref(d.key as DietaryPreference)}
                  >
                    <Text
                      style={[
                        styles.dietaryChipText,
                        dietaryPref === d.key && styles.dietaryChipTextSelected,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Next Button */}
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextButtonText}>
              {step === totalSteps ? 'Start CaloEat' : 'Continue'}
            </Text>
            <Ionicons
              name={step === totalSteps ? 'checkmark-circle' : 'arrow-forward'}
              size={18}
              color={Colors.surface}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: 6,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  stepContainer: {
    paddingTop: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.surface,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  infoCalloutText: {
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 17,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optionTitleSelected: {
    color: Colors.primaryDark,
  },
  optionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goalCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  goalCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  goalTitleSelected: {
    color: Colors.primaryDark,
  },
  goalSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  calorieResultCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
    marginVertical: Spacing.md,
  },
  calorieResultLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  calorieResultNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  calorieResultUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: -4,
  },
  equationBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningSoft,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  macroCardsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  macroGridCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  macroGridTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroGridValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginVertical: 2,
  },
  macroGridSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  dietaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  dietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietaryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dietaryChipSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  dietaryChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dietaryChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  footerContainer: {
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.elevated,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
});
