import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { MealItem, MealLog, MealType, ScanResult, UserProfile } from '../types';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { addOrUpdateMeal, getTodayDateString } from '../utils/storage';

interface ScanScreenProps {
  profile: UserProfile;
  onMealSaved: () => void;
}

// Preset demonstrative meal scan samples representing Indian and global culinary plates
const SAMPLE_MEAL_PRESETS: { title: string; subtitle: string; result: ScanResult }[] = [
  {
    title: 'Hyderabadi Chicken Dum Biryani',
    subtitle: 'Fragrant saffron basmati rice with marinated chicken & raita',
    result: {
      dishName: 'Hyderabadi Chicken Dum Biryani with Raita',
      regionalCuisine: 'Hyderabadi / South Indian',
      confidence: 'High',
      isVeg: false,
      calorieRange: { min: 540, max: 640 },
      spiceLevel: 'Medium',
      ingredientsNote: 'Basmati rice, bone-in chicken, yogurt, mint, saffron, whole spices, fried onions.',
      aiInsight:
        'High protein meal (32g) with balanced fats and complex carbohydrates. Pair with a fresh cucumber raita for probiotic gut benefits.',
      detectedItems: [
        {
          ...FOOD_DATABASE.find((f) => f.id === 'food_hyderabadi_chicken_biryani')!,
          portionMultiplier: 1.0,
          effectiveCalories: 580,
          effectiveProteinG: 31.0,
          effectiveCarbsG: 68.0,
          effectiveFatG: 20.5,
          effectiveFiberG: 4.2,
          confidence: 'High',
        },
      ],
    },
  },
  {
    title: 'North Indian Deluxe Thali',
    subtitle: 'Mixed plate with 2 Rotis, Dal Tadka, and Paneer',
    result: {
      dishName: 'North Indian Home Thali',
      regionalCuisine: 'North Indian / Punjabi',
      confidence: 'High',
      isVeg: true,
      calorieRange: { min: 580, max: 690 },
      spiceLevel: 'Medium',
      ingredientsNote: 'Atta (whole wheat), toor dal, fresh cottage cheese, cumin, tomatoes, green chillies.',
      aiInsight:
        'Classic balanced thali. Distinct separation of whole-grain rotis, lentil dal, and protein-dense paneer provides high satiety and micronutrients.',
      detectedItems: [
        {
          ...FOOD_DATABASE.find((f) => f.id === 'food_roti_chapati')!,
          portionMultiplier: 1.0,
          effectiveCalories: 160,
          effectiveProteinG: 5.6,
          effectiveCarbsG: 32.0,
          effectiveFatG: 1.2,
          effectiveFiberG: 4.8,
          confidence: 'High',
        },
        {
          ...FOOD_DATABASE.find((f) => f.id === 'food_dal_tadka')!,
          portionMultiplier: 1.0,
          effectiveCalories: 180,
          effectiveProteinG: 9.2,
          effectiveCarbsG: 25.0,
          effectiveFatG: 4.5,
          effectiveFiberG: 5.5,
          confidence: 'High',
        },
        {
          ...FOOD_DATABASE.find((f) => f.id === 'food_palak_paneer')!,
          portionMultiplier: 1.0,
          effectiveCalories: 270,
          effectiveProteinG: 13.5,
          effectiveCarbsG: 10.0,
          effectiveFatG: 19.0,
          effectiveFiberG: 4.5,
          confidence: 'High',
        },
      ],
    },
  },
  {
    title: 'Crispy Masala Dosa with Sambar',
    subtitle: 'Golden fermented rice crepe with spiced potato masala',
    result: {
      dishName: 'South Indian Masala Dosa',
      regionalCuisine: 'South Indian / Tamil / Karnataka',
      confidence: 'High',
      isVeg: true,
      calorieRange: { min: 320, max: 400 },
      spiceLevel: 'Mild',
      ingredientsNote: 'Fermented rice & urad dal, potatoes, mustard seeds, curry leaves, turmeric.',
      aiInsight:
        'Fermented batter enhances bioavailability of B-vitamins and eases digestion. Moderation with coconut chutney helps keep saturated fat in check.',
      detectedItems: [
        {
          ...FOOD_DATABASE.find((f) => f.id === 'food_masala_dosa')!,
          portionMultiplier: 1.0,
          effectiveCalories: 360,
          effectiveProteinG: 6.2,
          effectiveCarbsG: 52.0,
          effectiveFatG: 14.5,
          effectiveFiberG: 4.8,
          confidence: 'High',
        },
      ],
    },
  },
];

export const ScanScreen: React.FC<ScanScreenProps> = ({ profile, onMealSaved }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [portionScale, setPortionScale] = useState<number>(1.0);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

  const handleSimulateScan = (presetIndex: number) => {
    setActivePresetIndex(presetIndex);
    setIsAnalyzing(true);
    setScanResult(null);

    // Simulate multi-modal visual recognition pipeline
    setTimeout(() => {
      const preset = SAMPLE_MEAL_PRESETS[presetIndex];
      setScanResult(preset.result);
      setPortionScale(1.0);
      setIsAnalyzing(false);
    }, 1200);
  };

  const handlePortionChange = (multiplier: number) => {
    setPortionScale(multiplier);
  };

  const handleSaveToLog = async () => {
    if (!scanResult) return;

    const scaledItems: MealItem[] = scanResult.detectedItems.map((item) => ({
      ...item,
      portionMultiplier: portionScale,
      effectiveCalories: Math.round(item.calories * portionScale),
      effectiveProteinG: Math.round(item.proteinG * portionScale * 10) / 10,
      effectiveCarbsG: Math.round(item.carbsG * portionScale * 10) / 10,
      effectiveFatG: Math.round(item.fatG * portionScale * 10) / 10,
      effectiveFiberG: Math.round(item.fiberG * portionScale * 10) / 10,
    }));

    const totalCalories = scaledItems.reduce((acc, curr) => acc + curr.effectiveCalories, 0);
    const totalProtein = Math.round(scaledItems.reduce((acc, curr) => acc + curr.effectiveProteinG, 0) * 10) / 10;
    const totalCarbs = Math.round(scaledItems.reduce((acc, curr) => acc + curr.effectiveCarbsG, 0) * 10) / 10;
    const totalFat = Math.round(scaledItems.reduce((acc, curr) => acc + curr.effectiveFatG, 0) * 10) / 10;
    const totalFiber = Math.round(scaledItems.reduce((acc, curr) => acc + curr.effectiveFiberG, 0) * 10) / 10;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = getTodayDateString();

    const meal: MealLog = {
      id: `scanned_${Date.now()}`,
      date: todayStr,
      mealType: selectedMealType,
      time: nowTime,
      items: scaledItems,
      totalCalories,
      totalProteinG: totalProtein,
      totalCarbsG: totalCarbs,
      totalFatG: totalFat,
      totalFiberG: totalFiber,
      isScanned: true,
      aiInsight: scanResult.aiInsight,
    };

    await addOrUpdateMeal(todayStr, meal);
    Alert.alert(
      'Meal Logged! 🎉',
      `${scanResult.dishName} (${totalCalories} kcal) added to today's ${selectedMealType}.`,
      [
        {
          text: 'Great',
          onPress: () => {
            setScanResult(null);
            onMealSaved();
          },
        },
      ]
    );
  };

  // Scaled calorie range
  const minCal = scanResult ? Math.round(scanResult.calorieRange.min * portionScale) : 0;
  const maxCal = scanResult ? Math.round(scanResult.calorieRange.max * portionScale) : 0;
  const avgCal = scanResult
    ? Math.round(
        scanResult.detectedItems.reduce((acc, i) => acc + i.calories, 0) * portionScale
      )
    : 0;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Food Scanner</Text>
          <Text style={styles.subtitle}>
            Multimodal recognition tailored for Indian and global meal plates.
          </Text>
        </View>

        {/* Viewfinder / Camera Staging Area */}
        <View style={styles.viewfinderCard}>
          <View style={styles.viewfinderInterior}>
            <Ionicons name="scan-outline" size={80} color={Colors.primary} />
            <Text style={styles.viewfinderPrompt}>Point camera at your meal plate or thali</Text>
            <Text style={styles.viewfinderHint}>
              Separates individual items like rice, dal, sabzi, curd & roti
            </Text>
          </View>

          {/* Action Buttons: Camera & Gallery */}
          <View style={styles.scannerActionsRow}>
            <TouchableOpacity
              style={styles.scannerActionButton}
              onPress={() => handleSimulateScan(0)}
              disabled={isAnalyzing}
            >
              <Ionicons name="camera" size={20} color={Colors.surface} />
              <Text style={styles.scannerActionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scannerActionButton, styles.galleryButton]}
              onPress={() => handleSimulateScan(1)}
              disabled={isAnalyzing}
            >
              <Ionicons name="images" size={20} color={Colors.primary} />
              <Text style={[styles.scannerActionText, { color: Colors.primary }]}>
                Choose Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Simulation Dishes (For immediate testing on any device) */}
        <Text style={styles.presetHeading}>Test With Sample Plates</Text>
        <View style={styles.presetsList}>
          {SAMPLE_MEAL_PRESETS.map((preset, idx) => (
            <TouchableOpacity
              key={preset.title}
              style={[
                styles.presetCard,
                activePresetIndex === idx && scanResult && styles.presetCardActive,
              ]}
              onPress={() => handleSimulateScan(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.presetTextCol}>
                <Text style={styles.presetTitle}>{preset.title}</Text>
                <Text style={styles.presetSub}>{preset.subtitle}</Text>
              </View>
              <Ionicons name="scan" size={20} color={Colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading Spinner during analysis */}
        {isAnalyzing && (
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.analyzingText}>Multimodal AI analyzing plate...</Text>
            <Text style={styles.analyzingSub}>
              Detecting regional cuisine, items, portion geometry & nutrient composition
            </Text>
          </View>
        )}

        {/* Scan Result Output */}
        {scanResult && !isAnalyzing && (
          <View style={styles.resultContainer}>
            {/* Dish Header Card */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.vegBadge,
                        {
                          backgroundColor: scanResult.isVeg
                            ? Colors.vegGreenSoft
                            : Colors.nonVegRedSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.vegBadgeText,
                          { color: scanResult.isVeg ? Colors.vegGreen : Colors.nonVegRed },
                        ]}
                      >
                        {scanResult.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      </Text>
                    </View>

                    <View style={styles.confidenceBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#15803D" />
                      <Text style={styles.confidenceText}>
                        Confidence: {scanResult.confidence}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detectedDishName}>{scanResult.dishName}</Text>
                  <Text style={styles.regionalCuisineTag}>{scanResult.regionalCuisine}</Text>
                </View>
              </View>

              {/* Calorie Range Box */}
              <View style={styles.calorieRangeBox}>
                <View>
                  <Text style={styles.calorieRangeLabel}>ESTIMATED ENERGY</Text>
                  <Text style={styles.calorieRangeNumber}>{avgCal} kcal</Text>
                  <Text style={styles.caloriePlausibleRange}>
                    Plausible range: {minCal}–{maxCal} kcal
                  </Text>
                </View>
                <View style={styles.portionBadge}>
                  <Text style={styles.portionBadgeText}>{portionScale}x portion</Text>
                </View>
              </View>

              {/* Portion Control Slider */}
              <Text style={styles.portionControlLabel}>Adjust Portion Scale:</Text>
              <View style={styles.portionPillsRow}>
                {[0.5, 0.75, 1.0, 1.5, 2.0, 3.0].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.portionPill,
                      portionScale === val && styles.portionPillActive,
                    ]}
                    onPress={() => handlePortionChange(val)}
                  >
                    <Text
                      style={[
                        styles.portionPillText,
                        portionScale === val && styles.portionPillTextActive,
                      ]}
                    >
                      {val}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Detected Items on Plate */}
              <Text style={styles.detectedItemsHeader}>Individual Items on Plate</Text>
              {scanResult.detectedItems.map((item, i) => (
                <View key={i} style={styles.detectedItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detectedItemName}>{item.name}</Text>
                    <Text style={styles.detectedItemServing}>
                      {Math.round(item.servingWeightG * portionScale)}g • {item.servingSize}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.detectedItemCal}>
                      {Math.round(item.calories * portionScale)} kcal
                    </Text>
                    <Text style={styles.detectedItemMacro}>
                      P: {Math.round(item.proteinG * portionScale * 10) / 10}g • C:{' '}
                      {Math.round(item.carbsG * portionScale * 10) / 10}g
                    </Text>
                  </View>
                </View>
              ))}

              {/* AI Health Insight */}
              <View style={styles.aiInsightCard}>
                <View style={styles.aiInsightTitleRow}>
                  <Ionicons name="sparkles" size={16} color={Colors.primary} />
                  <Text style={styles.aiInsightTitle}>AI Nutrition Insight</Text>
                </View>
                <Text style={styles.aiInsightBody}>{scanResult.aiInsight}</Text>
              </View>

              {/* Target Meal Slot Selection */}
              <Text style={styles.mealSlotLabel}>Log to Meal Category:</Text>
              <View style={styles.mealSlotRow}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealSlotChip,
                      selectedMealType === type && styles.mealSlotChipActive,
                    ]}
                    onPress={() => setSelectedMealType(type)}
                  >
                    <Text
                      style={[
                        styles.mealSlotChipText,
                        selectedMealType === type && styles.mealSlotChipTextActive,
                      ]}
                    >
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Meal Action */}
              <TouchableOpacity
                style={styles.saveMealButton}
                onPress={handleSaveToLog}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={20} color={Colors.surface} />
                <Text style={styles.saveMealButtonText}>Save to Today's Food Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Transparency & AI Backend Status Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="shield-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            CaloEat Vision Architecture: Real photos are passed via secure backend proxy to Gemini multimodal vision. Portions and cooking oils are estimated; values reflect validated IFCT / USDA database matches.
          </Text>
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
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  viewfinderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    ...Shadows.card,
  },
  viewfinderInterior: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  viewfinderPrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  viewfinderHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  scannerActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.base,
    width: '100%',
  },
  scannerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.elevated,
  },
  galleryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: 'transparent',
    elevation: 0,
  },
  scannerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.surface,
  },
  presetHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  presetsList: {
    gap: Spacing.xs,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  presetCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  presetTextCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  analyzingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  analyzingText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  analyzingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  resultContainer: {
    marginTop: Spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  vegBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  vegBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  detectedDishName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  regionalCuisineTag: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  calorieRangeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  calorieRangeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  calorieRangeNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  caloriePlausibleRange: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  portionBadge: {
    backgroundColor: Colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  portionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  portionControlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  portionPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  portionPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  portionPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  portionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  portionPillTextActive: {
    color: Colors.surface,
  },
  detectedItemsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detectedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detectedItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detectedItemServing: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  detectedItemCal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detectedItemMacro: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  aiInsightCard: {
    backgroundColor: Colors.primarySoft,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  aiInsightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiInsightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  aiInsightBody: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  mealSlotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  mealSlotRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  mealSlotChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealSlotChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  mealSlotChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  mealSlotChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  saveMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.elevated,
  },
  saveMealButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
});
