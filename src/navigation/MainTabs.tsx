import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlaceholderScreen from '../screens/placeholder/PlaceholderScreen';
import RoadmapStack from './RoadmapStack';
import { colors } from '../constants/theme';

export type MainTabsParamList = {
  RoadmapTab: undefined;
  RankingTab: undefined;
  MyPageTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

function RankingScreen() {
  return <PlaceholderScreen label="랭킹" />;
}

function MyPageScreen() {
  return <PlaceholderScreen label="마이페이지" />;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTintColor: colors.navy,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="RoadmapTab"
        component={RoadmapStack}
        options={{ title: '홈', headerShown: false }}
      />
      <Tab.Screen name="RankingTab" component={RankingScreen} options={{ title: '랭킹' }} />
      <Tab.Screen name="MyPageTab" component={MyPageScreen} options={{ title: '마이페이지' }} />
    </Tab.Navigator>
  );
}
