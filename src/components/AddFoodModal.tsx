import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { FoodItem, MealItem, MealLog, MealType } from '../types';
import { FOOD_DATABASE } from '../data/foodDatabase';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  defaultMealType: MealType;
  onSaveMealItem: (mealType: MealType, item: MealItem) => void;
}

const PORTION_OPTIONS = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  visible,
  onClose,
  defaultMealType,
  onSaveMealItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [vegOnlyFilter, setVegOnlyFilter] = useState<boolean>(false);

  // Sync defaultMealType when opened
  React.useEffect(() => {
    setSelectedMealType(defaultMealType);
  }, [defaultMealType]);

  const filteredFoods = useMemo(() => {
    return FOOD_DATABASE.filter((food) => {
      if (vegOnlyFilter && !food.isVeg) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        food.name.toLowerCase().includes(query) ||
        food.cuisine.toLowerCase().includes(query) ||
        (food.regionalName && food.regionalName.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, vegOnlyFilter]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setPortionMultiplier(1.0);
  };

  const handleConfirmAdd = () => {
    if (!selectedFood) return;

    const effectiveCalories = Math.round(selectedFood.calories * portionMultiplier);
    const effectiveProteinG = Math.round(selectedFood.proteinG * portionMultiplier * 10) / 10;
    const effectiveCarbsG = Math.round(selectedFood.carbsG * portionMultiplier * 10) / 10;
    const effectiveFatG = Math.round(selectedFood.fatG * portionMultiplier * 10) / 10;
    const effectiveFiberG = Math.round(selectedFood.fiberG * portionMultiplier * 10) / 10;

    const mealItem: MealItem = {
      ...selectedFood,
      portionMultiplier,
      effectiveCalories,
      effectiveProteinG,
      effectiveCarbsG,
      effectiveFatG,
      effectiveFiberG,
      confidence: 'High',
    };

    onSaveMealItem(selectedMealType, mealItem);
    setSelectedFood(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Food Item</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Meal Type Selector */}
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.mealTypeChip,
                selectedMealType === type.key && styles.mealTypeChipActive,
              ]}
              onPress={() => setSelectedMealType(type.key)}
            >
              <Text
                style={[
                  styles.mealTypeChipText,
                  selectedMealType === type.key && styles.mealTypeChipTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dosa, dal, biryani, thali, oats..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, vegOnlyFilter && styles.filterChipActive]}
            onPress={() => setVegOnlyFilter(!vegOnlyFilter)}
          >
            <View style={[styles.vegSmallDot, { borderColor: Colors.vegGreen }]}>
              <View style={[styles.vegInnerSmallDot, { backgroundColor: Colors.vegGreen }]} />
            </View>
            <Text style={[styles.filterChipText, vegOnlyFilter && styles.filterChipTextActive]}>
              Vegetarian Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Food List */}
        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedFood?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.foodCard, isSelected && styles.foodCardSelected]}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodInfoCol}>
                  <View style={styles.nameRow}>
                    <View
                      style={[
                        styles.vegDot,
                        { borderColor: item.isVeg ? Colors.vegGreen : Colors.nonVegRed },
                      ]}
                    >
                      <View
                        style={[
                          styles.vegInnerDot,
                          { backgroundColor: item.isVeg ? Colors.vegGreen : Colors.nonVegRed },
                        ]}
                      />
                    </View>
                    <Text style={styles.foodItemTitle}>{item.name}</Text>
                  </View>
                  <Text style={styles.cuisineTag}>
                    {item.cuisine} • {item.servingSize}
                  </Text>
                  <Text style={styles.sourceTag}>Source: {item.source}</Text>
                </View>

                <View style={styles.foodCaloriesCol}>
                  <Text style={styles.foodCaloriesText}>{item.calories} kcal</Text>
                  <Text style={styles.foodMacrosSummary}>
                    P: {item.proteinG}g • C: {item.carbsG}g
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Portion Selector & Add Footer (when item selected) */}
        {selectedFood && (
          <View style={styles.portionFooter}>
            <View style={styles.portionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedFoodName} numberOfLines={1}>
                  {selectedFood.name}
                </Text>
                <Text style={styles.selectedFoodServing}>
                  {Math.round(selectedFood.servingWeightG * portionMultiplier)}g total portion
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.calculatedCalories}>
                  {Math.round(selectedFood.calories * portionMultiplier)} kcal
                </Text>
                <Text style={styles.calculatedMacros}>
                  P: {Math.round(selectedFood.proteinG * portionMultiplier * 10) / 10}g • C:{' '}
                  {Math.round(selectedFood.carbsG * portionMultiplier * 10) / 10}g • F:{' '}
                  {Math.round(selectedFood.fatG * portionMultiplier * 10) / 10}g
                </Text>
              </View>
            </View>

            {/* Multiplier Pills */}
            <View style={styles.portionPillsRow}>
              <Text style={styles.portionLabel}>Portion:</Text>
              {PORTION_OPTIONS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.portionPill,
                    portionMultiplier === val && styles.portionPillActive,
                  ]}
                  onPress={() => setPortionMultiplier(val)}
                >
                  <Text
                    style={[
                      styles.portionPillText,
                      portionMultiplier === val && styles.portionPillTextActive,
                    ]}
                  >
                    {val}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Log Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmAdd}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.surface} />
              <Text style={styles.confirmButtonText}>
                Log {selectedFood.name.split(' ')[0]} to {selectedMealType.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mealTypeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTypeChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  mealTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mealTypeChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.vegGreenSoft,
    borderColor: Colors.vegGreen,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.vegGreen,
    fontWeight: '700',
  },
  vegSmallDot: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInnerSmallDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 160,
    paddingTop: Spacing.xs,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  foodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  foodInfoCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegDot: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2,
  },
  foodItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cuisineTag: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sourceTag: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  foodCaloriesCol: {
    alignItems: 'flex-end',
  },
  foodCaloriesText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  foodMacrosSummary: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  portionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.elevated,
  },
  portionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedFoodName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectedFoodServing: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  calculatedCalories: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  calculatedMacros: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  portionPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  portionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
});
