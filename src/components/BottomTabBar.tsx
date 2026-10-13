import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';

export type TabKey = 'home' | 'trends' | 'scan' | 'log' | 'profile';

interface BottomTabBarProps {
  currentTab: TabKey;
  onTabSelect: (tab: TabKey) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentTab, onTabSelect }) => {
  return (
    <View style={styles.container}>
      {/* 1. Home */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabSelect('home')}
        activeOpacity={0.7}
        accessibilityLabel="Home tab"
      >
        <Ionicons
          name={currentTab === 'home' ? 'home' : 'home-outline'}
          size={22}
          color={currentTab === 'home' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            currentTab === 'home' && styles.tabLabelActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Trends */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabSelect('trends')}
        activeOpacity={0.7}
        accessibilityLabel="Trends tab"
      >
        <Ionicons
          name={currentTab === 'trends' ? 'stats-chart' : 'stats-chart-outline'}
          size={22}
          color={currentTab === 'trends' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            currentTab === 'trends' && styles.tabLabelActive,
          ]}
        >
          Trends
        </Text>
      </TouchableOpacity>

      {/* 3. Scan — Prominent Central Action */}
      <View style={styles.centerScanWrapper}>
        <TouchableOpacity
          style={styles.scanRaisedButton}
          onPress={() => onTabSelect('scan')}
          activeOpacity={0.85}
          accessibilityLabel="Scan food camera"
        >
          <Ionicons name="camera" size={26} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.scanLabel}>Scan</Text>
      </View>

      {/* 4. Log */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabSelect('log')}
        activeOpacity={0.7}
        accessibilityLabel="Meal Log tab"
      >
        <Ionicons
          name={currentTab === 'log' ? 'book' : 'book-outline'}
          size={22}
          color={currentTab === 'log' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            currentTab === 'log' && styles.tabLabelActive,
          ]}
        >
          Log
        </Text>
      </TouchableOpacity>

      {/* 5. Profile */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabSelect('profile')}
        activeOpacity={0.7}
        accessibilityLabel="Profile tab"
      >
        <Ionicons
          name={currentTab === 'profile' ? 'person' : 'person-outline'}
          size={22}
          color={currentTab === 'profile' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            currentTab === 'profile' && styles.tabLabelActive,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.card,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  centerScanWrapper: {
    alignItems: 'center',
    marginTop: -24,
    flex: 1,
  },
  scanRaisedButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.elevated,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  scanLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
});
