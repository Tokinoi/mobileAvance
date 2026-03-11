export type FieldType = 'text' | 'number' | 'date' | 'rating' | 'dropdown' | 'toggle' | 'image' | 'location';

export interface TemplateField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  options?: string[];
}

export interface Item {
  id: string;
  groupId: string;
  name: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  itemCount: number;
  parentId?: string;
  template?: TemplateField[];
}
