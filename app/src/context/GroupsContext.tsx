import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group, TemplateField } from '../types';
import { supabase } from '../lib/supabase';

interface GroupsContextValue {
  groups: Group[];
  loading: boolean;
  addGroup: (group: Omit<Group, 'id' | 'itemCount'>) => Promise<string | null>;
  updateGroup: (id: string, data: Partial<Omit<Group, 'id' | 'itemCount'>>) => Promise<string | null>;
  deleteGroup: (id: string) => Promise<string | null>;
  saveTemplate: (id: string, fields: TemplateField[]) => Promise<string | null>;
  refresh: () => Promise<void>;
  getSubGroups: (parentId: string) => Group[];
  resolveTemplate: (group: Group) => { fields: TemplateField[]; inherited: boolean } | null;
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
        parentId: g.parent_id ?? undefined,
        template: g.template ?? undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const addGroup = async (data: Omit<Group, 'id' | 'itemCount'>): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Not authenticated';
    const { error } = await supabase.from('groups').insert({
      user_id: user.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      parent_id: data.parentId ?? null,
    });
    if (error) return error.message;
    await fetchGroups();
    return null;
  };

  const updateGroup = async (id: string, data: Partial<Omit<Group, 'id' | 'itemCount'>>): Promise<string | null> => {
    const { error } = await supabase.from('groups').update({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    }).eq('id', id);
    if (error) return error.message;
    await fetchGroups();
    return null;
  };

  const deleteGroup = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) return error.message;
    await fetchGroups();
    return null;
  };

  const saveTemplate = async (id: string, fields: TemplateField[]): Promise<string | null> => {
    const { error } = await supabase.from('groups').update({ template: fields }).eq('id', id);
    if (error) return error.message;
    await fetchGroups();
    return null;
  };

  const getSubGroups = (parentId: string) => groups.filter((g) => g.parentId === parentId);

  const resolveTemplate = (group: Group): { fields: TemplateField[]; inherited: boolean } | null => {
    if (group.template && group.template.length > 0) return { fields: group.template, inherited: false };
    if (group.parentId) {
      const parent = groups.find((g) => g.id === group.parentId);
      if (parent?.template && parent.template.length > 0) return { fields: parent.template, inherited: true };
    }
    return null;
  };

  return (
    <GroupsContext.Provider value={{ groups, loading, addGroup, updateGroup, deleteGroup, saveTemplate, refresh: fetchGroups, getSubGroups, resolveTemplate }}>
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}
