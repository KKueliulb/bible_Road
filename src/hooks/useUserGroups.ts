import { useEffect, useState } from 'react';
import { GroupMembership, subscribeToGroupMemberIds, subscribeToUserGroups } from '../services/groupsService';

interface UseUserGroupsResult {
  groups: GroupMembership[];
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string) => void;
  /** 현재 선택된 그룹(activeGroupId)에 속한 멤버들의 userId 집합. 그룹이 없으면 빈 집합. */
  groupMemberIds: Set<string>;
}

/**
 * 로드맵/랭킹 화면의 '그룹' 탭에 필요한 상태(내가 속한 그룹 목록, 선택된 그룹, 그 그룹의 멤버 id 집합)를
 * 한 곳에서 관리한다. 그룹이 여러 개면 첫 번째 그룹을 기본 선택하고, 선택된 그룹이 목록에서 사라지면
 * (탈퇴 등) 다시 첫 번째 그룹으로 되돌린다.
 */
export function useUserGroups(userId: string | null): UseUserGroupsResult {
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupMemberIds, setGroupMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    return subscribeToUserGroups(userId, setGroups);
  }, [userId]);

  useEffect(() => {
    if (groups.length === 0) {
      setActiveGroupId(null);
      return;
    }
    setActiveGroupId((current) => (current && groups.some((g) => g.groupId === current) ? current : groups[0].groupId));
  }, [groups]);

  useEffect(() => {
    if (!activeGroupId) {
      setGroupMemberIds(new Set());
      return;
    }
    return subscribeToGroupMemberIds(activeGroupId, setGroupMemberIds);
  }, [activeGroupId]);

  return { groups, activeGroupId, setActiveGroupId, groupMemberIds };
}
