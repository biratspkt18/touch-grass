import React, { Dispatch, SetStateAction } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';

type CategoryItem = {
  label: string;
  value: string;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  category: string | null;
  setCategory: (cat: string | null) => void;
  categories: CategoryItem[];
  setCategories: Dispatch<SetStateAction<CategoryItem[]>>;
};

export default function CategoryDropdown({ open, setOpen, category, setCategory, categories, setCategories }: Props) {
  return (
    <>
      <DropDownPicker
        open={open}
        value={category}
        items={categories}
        setOpen={setOpen}
        setValue={val => setCategory(typeof val === 'function' ? val('') : (val as string))}
        setItems={setCategories}
        placeholder="Select a category"
        style={{ borderColor: '#ddd', borderRadius: 10 }}
        containerStyle={{ marginBottom: 20 }}
        zIndex={5000}
      />
    </>
  );
} 