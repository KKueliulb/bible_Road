import React from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../constants/theme';
import { NODE_SIZE } from './RoadmapNode';

const NODE_CENTER_OFFSET = spacing.lg + NODE_SIZE / 2;
const CONNECTOR_HEIGHT = 40;

interface Props {
  /** 이 커넥터가 시작하는 쪽(이전 노드가 오른쪽 정렬이었는지) */
  startRight: boolean;
}

/**
 * 지그재그로 배치된 로드맵 노드 사이를 잇는 S자 곡선 점선. 화면 너비를 `useWindowDimensions`로
 * 구독해서, 기기마다 다른 화면 크기(또는 웹에서 창 크기 변경)에도 항상 노드 중심에 맞춰 그려진다.
 */
export default function RoadmapConnector({ startRight }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const x1 = startRight ? screenWidth - NODE_CENTER_OFFSET : NODE_CENTER_OFFSET;
  const x2 = startRight ? NODE_CENTER_OFFSET : screenWidth - NODE_CENTER_OFFSET;
  const midY = CONNECTOR_HEIGHT / 2;

  return (
    <Svg height={CONNECTOR_HEIGHT} width={screenWidth}>
      <Path
        d={`M ${x1} 0 C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${CONNECTOR_HEIGHT}`}
        fill="none"
        stroke={colors.border}
        strokeWidth={4}
        strokeDasharray="10,8"
        strokeLinecap="round"
      />
    </Svg>
  );
}
