import React, { createContext, useContext, useState, useMemo } from 'react';

export type ActivityItem = {
  id: string;
  type: 'insert' | 'update';
  client_name?: string;
  at: number;
  summary: string;
};

type ActivityCtx = {
  items: ActivityItem[];
  push: (i: ActivityItem) => void;
  clear: () => void;
};

const Ctx = createContext<ActivityCtx | null>(null);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const api = useMemo(() => ({
    items,
    push: (i: ActivityItem) => setItems(prev => [i, ...prev].slice(0, 20)),
    clear: () => setItems([]),
  }), [items]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};

export const useActivity = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useActivity must be used inside ActivityProvider');
  return v;
};