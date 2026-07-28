import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../constants/theme';
import { NODE_SIZE } from './RoadmapNode';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NODE_CENTER_OFFSET = spacing.lg + NODE_SIZE / 2;
const CONNECTOR_HEIGHT = 40;

interface Props {
  /** 이 커넥터가 시작하는 쪽(이전 노드가 오른쪽 정렬이었는지) */
  startRight: boolean;
}

/** 지그재그로 배치된 로드맵 노드 사이를 잇는 S자 곡선 점선. */
export default function RoadmapConnector({ startRight }: Props) {
  const x1 = startRight ? SCREEN_WIDTH - NODE_CENTER_OFFSET : NODE_CENTER_OFFSET;
  const x2 = startRight ? NODE_CENTER_OFFSET : SCREEN_WIDTH - NODE_CENTER_OFFSET;
  const midY = CONNECTOR_HEIGHT / 2;

  return (
    <Svg height={CONNECTOR_HEIGHT} width={SCREEN_WIDTH}>
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
