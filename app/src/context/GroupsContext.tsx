import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group, Item, TemplateField } from '../types';
import { supabase } from '../lib/supabase';

interface GroupsContextValue {
  groups: Group[];
  items: Item[];
  loading: boolean;
  addGroup: (group: Omit<Group, 'id' | 'itemCount'>) => Promise<string | null>;
  updateGroup: (id: string, data: Partial<Omit<Group, 'id' | 'itemCount'>>) => Promise<string | null>;
  deleteGroup: (id: string) => Promise<string | null>;
  saveTemplate: (id: string, fields: TemplateField[]) => Promise<string | null>;
  addItem: (groupId: string, name: string, values: Record<string, any>) => Promise<string | null>;
  updateItem: (itemId: string, name: string, values: Record<string, any>) => Promise<string | null>;
  getGroupItems: (groupId: string) => Item[];
  refresh: () => Promise<void>;
  getSubGroups: (parentId: string) => Group[];
  resolveTemplate: (groupId: string) => TemplateField[] | null;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    const [groupsRes, itemsRes] = await Promise.all([
      supabase.from('groups').select('*').order('created_at', { ascending: false }),
      supabase.from('items').select('*').order('created_at', { ascending: false }),
    ]);

    if (!groupsRes.error && groupsRes.data) {
      setGroups(groupsRes.data.map((g) => ({
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

    if (!itemsRes.error && itemsRes.data) {
      setItems(itemsRes.data.map((i) => ({
        id: i.id,
        groupId: i.group_id,
        name: i.name,
        data: i.data ?? {},
        createdAt: i.created_at,
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

  const getGroupItems = (groupId: string) => items.filter((i) => i.groupId === groupId);

  const addItem = async (groupId: string, name: string, values: Record<string, any>): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Not authenticated';
    const { error } = await supabase.from('items').insert({
      user_id: user.id,
      group_id: groupId,
      name,
      data: values,
    });
    if (error) return error.message;
    await refreshItems();
    return null;
  };

  const refreshItems = async () => {
    const { data: updated } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (updated) {
      setItems(updated.map((i) => ({
        id: i.id,
        groupId: i.group_id,
        name: i.name,
        data: i.data ?? {},
        createdAt: i.created_at,
      })));
    }
  };

  const updateItem = async (itemId: string, name: string, values: Record<string, any>): Promise<string | null> => {
    const { error } = await supabase.from('items').update({ name, data: values }).eq('id', itemId);
    if (error) return error.message;
    await refreshItems();
    return null;
  };

  const resolveTemplate = (groupId: string): TemplateField[] | null => {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return null;
    if (g.template && g.template.length > 0) return g.template;
    if (g.parentId) return resolveTemplate(g.parentId);
    return null;
  };

  return (
    <GroupsContext.Provider value={{ groups, items, loading, addGroup, updateGroup, deleteGroup, saveTemplate, addItem, updateItem, getGroupItems, refresh: fetchGroups, getSubGroups, resolveTemplate }}>
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}
