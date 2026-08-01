import React from 'react';
import { Testament } from '../../types/models';
import SegmentedTabs from '../common/SegmentedTabs';

interface Props {
  value: Testament;
  onChange: (testament: Testament) => void;
}

const OPTIONS: { value: Testament; label: string }[] = [
  { value: 'OT', label: '구약' },
  { value: 'NT', label: '신약' },
];

export default function TestamentDropdown({ value, onChange }: Props) {
  return <SegmentedTabs options={OPTIONS} value={value} onChange={onChange} />;
}
