import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from './src/theme/colors';
import { DailyLog, MealType, UserProfile } from './src/types';
import {
  DEFAULT_PROFILE,
  createEmptyDailyLog,
  getDailyLog,
  getTodayDateString,
  getUserProfile,
  saveDailyLog,
  seedInitialDataIfEmpty,
} from './src/utils/storage';
import { Header } from './src/components/Header';
import { BottomTabBar, TabKey } from './src/components/BottomTabBar';
import { AddFoodModal } from './src/components/AddFoodModal';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { LogScreen } from './src/screens/LogScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [dailyLog, setDailyLog] = useState<DailyLog>(createEmptyDailyLog(getTodayDateString()));
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [streakDays, setStreakDays] = useState(3); // active streak count

  // Quick Add Modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalMealType, setAddModalMealType] = useState<MealType>('lunch');

  const todayStr = getTodayDateString();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const loadData = async () => {
    try {
      await seedInitialDataIfEmpty();
      const savedProfile = await getUserProfile();
      setProfile(savedProfile);

      const log = await getDailyLog(todayStr);
      setDailyLog(log);
    } catch (err) {
      console.error('Failed to load local data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = (mealType: MealType) => {
    setAddModalMealType(mealType);
    setAddModalVisible(true);
  };

  const handleFinishOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setActiveTab('home');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If user hasn't completed onboarding, present guided questionnaire
  if (!profile.isOnboardingCompleted) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen
          initialProfile={profile}
          onFinishOnboarding={handleFinishOnboarding}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.appContainer}>
        {/* Persistent App Header (except inside scan tab) */}
        {activeTab !== 'scan' && (
          <Header
            userName={profile.name}
            formattedDate={formattedDate}
            streakDays={streakDays}
            onProfilePress={() => setActiveTab('profile')}
          />
        )}

        {/* Tab Body Content */}
        <View style={styles.contentArea}>
          {activeTab === 'home' && (
            <HomeScreen
              profile={profile}
              dailyLog={dailyLog}
              onRefreshData={loadData}
              onNavigateToScan={() => setActiveTab('scan')}
              onNavigateToLog={() => setActiveTab('log')}
            />
          )}

          {activeTab === 'trends' && (
            <TrendsScreen
              profile={profile}
              activeDailyLog={dailyLog}
            />
          )}

          {activeTab === 'scan' && (
            <ScanScreen
              profile={profile}
              onMealSaved={async () => {
                await loadData();
                setActiveTab('home');
              }}
            />
          )}

          {activeTab === 'log' && (
            <LogScreen
              profile={profile}
              activeDailyLog={dailyLog}
              onRefreshData={loadData}
              onOpenAddModal={handleOpenAddModal}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              onProfileUpdated={(updated) => setProfile(updated)}
              onRedoOnboarding={() => {
                setProfile({ ...profile, isOnboardingCompleted: false });
              }}
            />
          )}
        </View>

        {/* Persistent Bottom Tab Bar */}
        <BottomTabBar
          currentTab={activeTab}
          onTabSelect={(tab) => setActiveTab(tab)}
        />

        {/* Global Quick Add Food Modal */}
        <AddFoodModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          defaultMealType={addModalMealType}
          onSaveMealItem={async (mealType, item) => {
            const existingMeal = dailyLog.meals.find((m) => m.mealType === mealType);
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (existingMeal) {
              existingMeal.items.push(item);
              existingMeal.totalCalories += item.effectiveCalories;
              existingMeal.totalProteinG =
                Math.round((existingMeal.totalProteinG + item.effectiveProteinG) * 10) / 10;
              existingMeal.totalCarbsG =
                Math.round((existingMeal.totalCarbsG + item.effectiveCarbsG) * 10) / 10;
              existingMeal.totalFatG =
                Math.round((existingMeal.totalFatG + item.effectiveFatG) * 10) / 10;
              existingMeal.totalFiberG =
                Math.round((existingMeal.totalFiberG + item.effectiveFiberG) * 10) / 10;
            } else {
              dailyLog.meals.push({
                id: `meal_${mealType}_${Date.now()}`,
                date: todayStr,
                mealType,
                time: nowTime,
                items: [item],
                totalCalories: item.effectiveCalories,
                totalProteinG: item.effectiveProteinG,
                totalCarbsG: item.effectiveCarbsG,
                totalFatG: item.effectiveFatG,
                totalFiberG: item.effectiveFiberG,
              });
            }

            await saveDailyLog(dailyLog);
            await loadData();
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentArea: {
    flex: 1,
  },
});
