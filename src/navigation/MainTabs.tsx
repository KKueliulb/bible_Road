import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import RoadmapStack from './RoadmapStack';
import RankingScreen from '../screens/ranking/RankingScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import CheerInboxModal from '../components/reading/CheerInboxModal';
import { colors } from '../constants/theme';

export type MainTabsParamList = {
  RoadmapTab: undefined;
  RankingTab: undefined;
  MyPageTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <>
      <Tab.Navigator
        initialRouteName="RoadmapTab"
        screenOptions={{
          headerTintColor: colors.navy,
          tabBarActiveTintColor: colors.orange,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: false,
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
      <CheerInboxModal />
    </>
  );
}
