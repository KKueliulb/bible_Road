import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RoadmapStack from './RoadmapStack';
import RankingScreen from '../screens/ranking/RankingScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import { colors } from '../constants/theme';

export type MainTabsParamList = {
  RoadmapTab: undefined;
  RankingTab: undefined;
  MyPageTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

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
