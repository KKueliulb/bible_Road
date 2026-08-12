import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
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
      initialRouteName="RoadmapTab"
      screenOptions={{
        headerTintColor: colors.navy,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        // 웹에서는 세이프에어리어 인셋을 못 받아오면 탭바가 기기 기본값보다 얇아 보여서,
        // 최소 높이를 직접 지정해 항상 일정 두께 이상을 보장한다.
        tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 10 },
      }}
    >
      <Tab.Screen
        name="RankingTab"
        component={RankingScreen}
        options={{
          title: '랭킹',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'podium' : 'podium-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RoadmapTab"
        component={RoadmapStack}
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageScreen}
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
