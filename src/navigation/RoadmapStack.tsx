import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoadmapScreen from '../screens/roadmap/RoadmapScreen';
import ReadingPlaceholderScreen from '../screens/reading/ReadingPlaceholderScreen';
import { colors } from '../constants/theme';

export type RoadmapStackParamList = {
  RoadmapHome: undefined;
  Reading: { bookId: string; bookName: string };
};

const Stack = createNativeStackNavigator<RoadmapStackParamList>();

export default function RoadmapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <Stack.Screen name="RoadmapHome" component={RoadmapScreen} options={{ title: '로드맵' }} />
      <Stack.Screen name="Reading" component={ReadingPlaceholderScreen} options={{ title: '읽기' }} />
    </Stack.Navigator>
  );
}
