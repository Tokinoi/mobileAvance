import { createContext, useContext, useState, ReactNode } from 'react';
import { Group } from '../types';

const MOCK_GROUPS: Group[] = [];

interface GroupsContextValue {
  groups: Group[];
  addGroup: (group: Omit<Group, 'id' | 'itemCount'>) => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);

  const addGroup = (data: Omit<Group, 'id' | 'itemCount'>) => {
    setGroups((prev) => [
      ...prev,
      { ...data, id: Date.now().toString(), itemCount: 0 },
    ]);
  };

  return (
    <GroupsContext.Provider value={{ groups, addGroup }}>
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}
