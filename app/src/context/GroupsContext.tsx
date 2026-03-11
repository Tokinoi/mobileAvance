import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group } from '../types';
import { supabase } from '../lib/supabase';

interface GroupsContextValue {
  groups: Group[];
  loading: boolean;
  addGroup: (group: Omit<Group, 'id' | 'itemCount'>) => Promise<string | null>;
  refresh: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGroups(data.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        icon: g.icon,
        color: g.color,
        itemCount: g.item_count,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const addGroup = async (data: Omit<Group, 'id' | 'itemCount'>): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Not authenticated';

    const { error } = await supabase.from('groups').insert({
      user_id: user.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    });

    if (error) return error.message;
    await fetchGroups();
    return null;
  };

  return (
    <GroupsContext.Provider value={{ groups, loading, addGroup, refresh: fetchGroups }}>
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}
