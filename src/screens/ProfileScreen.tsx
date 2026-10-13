import React, { useState } from 'react';
import {
  Alert,
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
import { ActivityLevel, UserProfile, WeightGoal } from '../types';
import {
  ACTIVITY_MULTIPLIERS,
  calculateBMR,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateTDEE,
} from '../utils/metabolic';
import { clearAllLocalData, saveUserProfile, seedInitialDataIfEmpty } from '../utils/storage';

interface ProfileScreenProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  onRedoOnboarding: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onProfileUpdated,
  onRedoOnboarding,
}) => {
  const [weightStr, setWeightStr] = useState(String(profile.weightKg));
  const [heightStr, setHeightStr] = useState(String(profile.heightCm));
  const [ageStr, setAgeStr] = useState(String(profile.age));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<WeightGoal>(profile.goal);

  const handleSaveBiometrics = async () => {
    const parsedWeight = parseFloat(weightStr) || profile.weightKg;
    const parsedHeight = parseFloat(heightStr) || profile.heightCm;
    const parsedAge = parseInt(ageStr, 10) || profile.age;

    const { bmr } = calculateBMR(parsedWeight, parsedHeight, parsedAge, profile.sex);
    const tdee = calculateTDEE(bmr, activityLevel);
    const { target } = calculateDailyCalorieTarget(tdee, goal, profile.sex, parsedAge);
    const macroTargets = calculateMacroTargets(target);

    const updated: UserProfile = {
      ...profile,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      age: parsedAge,
      activityLevel,
      goal,
      calculatedBMR: bmr,
      calculatedTDEE: tdee,
      dailyCalorieTarget: target,
      macroTargets,
      updatedAt: new Date().toISOString(),
    };

    await saveUserProfile(updated);
    onProfileUpdated(updated);
    Alert.alert('Profile Saved', 'Your metabolic targets have been recalculated.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all local meal logs and restore initial sample state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllLocalData();
            await seedInitialDataIfEmpty();
            onRedoOnboarding();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSub}>
            {profile.dietaryPreference.toUpperCase()} • {profile.sex.toUpperCase()} • {profile.age} YRS
          </Text>

          {/* Quick Metabolic Summary */}
          <View style={styles.metabolicRow}>
            <View style={styles.metabolicBox}>
              <Text style={styles.metabolicLabel}>BMR</Text>
              <Text style={styles.metabolicVal}>{profile.calculatedBMR}</Text>
              <Text style={styles.metabolicUnit}>kcal</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.metabolicBox}>
              <Text style={styles.metabolicLabel}>TDEE</Text>
              <Text style={styles.metabolicVal}>{profile.calculatedTDEE}</Text>
              <Text style={styles.metabolicUnit}>kcal</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.metabolicBox}>
              <Text style={styles.metabolicLabel}>DAILY GOAL</Text>
              <Text style={[styles.metabolicVal, { color: Colors.primary }]}>
                {profile.dailyCalorieTarget}
              </Text>
              <Text style={styles.metabolicUnit}>kcal</Text>
            </View>
          </View>
        </View>

        {/* Editable Biometrics Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Update Measurements</Text>

          <View style={styles.twoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={weightStr}
                onChangeText={setWeightStr}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={heightStr}
                onChangeText={setHeightStr}
              />
            </View>
          </View>

          {/* Activity Selector */}
          <Text style={[styles.inputLabel, { marginTop: Spacing.sm }]}>Activity Level</Text>
          <View style={styles.optionsCol}>
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((lvl) => {
              const info = ACTIVITY_MULTIPLIERS[lvl];
              const isSelected = activityLevel === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.activityOption, isSelected && styles.activityOptionSelected]}
                  onPress={() => setActivityLevel(lvl)}
                >
                  <Text
                    style={[styles.activityTitle, isSelected && styles.activityTitleSelected]}
                  >
                    {info.label} ({info.multiplier}x)
                  </Text>
                  <Text style={styles.activitySub}>{info.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Goal Selector */}
          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Weight Goal</Text>
          <View style={styles.goalsRow}>
            {[
              { key: 'lose', label: 'Lose (-400)' },
              { key: 'maintain', label: 'Maintain (0)' },
              { key: 'gain', label: 'Gain (+350)' },
            ].map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalChip, goal === g.key && styles.goalChipSelected]}
                onPress={() => setGoal(g.key as WeightGoal)}
              >
                <Text style={[styles.goalChipText, goal === g.key && styles.goalChipTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveBiometrics}>
            <Ionicons name="save-outline" size={18} color={Colors.surface} />
            <Text style={styles.saveButtonText}>Recalculate & Save</Text>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Data & Onboarding</Text>

          <TouchableOpacity style={styles.actionRow} onPress={onRedoOnboarding}>
            <Ionicons name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.actionRowText}>Redo Setup Questionnaire</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleResetData}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={[styles.actionRowText, { color: Colors.error }]}>Reset All Local Records</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Health & Safety Disclaimer (Section 21) */}
        <View style={styles.safetyDisclaimerCard}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Health & Data Safety Notice</Text>
            <Text style={styles.safetyBody}>
              CaloEat is a general wellness application and not a medical diagnostic device. Calorie and nutrient estimates reflect verified databases (IFCT & USDA). Nutritional needs vary based on metabolic health, pregnancy, and medical conditions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  profileHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileSub: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metabolicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metabolicBox: {
    alignItems: 'center',
  },
  metabolicLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metabolicVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metabolicUnit: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  twoCols: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  optionsCol: {
    gap: 6,
    marginTop: 4,
  },
  activityOption: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityOptionSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activityTitleSelected: {
    color: Colors.primaryDark,
  },
  activitySub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: Spacing.base,
  },
  goalChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalChipSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  goalChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  goalChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
    ...Shadows.elevated,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.surface,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  actionRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  safetyDisclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  safetyBody: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
});
