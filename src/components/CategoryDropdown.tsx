import React, { Dispatch, SetStateAction } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { colors, fonts, radius, shadow } from '../theme/theme';

type CategoryItem = {
  label: string;
  value: string;
  icon?: () => React.JSX.Element;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  category: string | null;
  setCategory: (cat: string | null) => void;
  categories: CategoryItem[];
  setCategories: Dispatch<SetStateAction<CategoryItem[]>>;
};

export default function CategoryDropdown({
  open,
  setOpen,
  category,
  setCategory,
  categories,
  setCategories,
}: Props) {
  return (
    <DropDownPicker
      open={open}
      value={category}
      items={categories}
      setOpen={setOpen}
      setValue={val => setCategory(typeof val === 'function' ? val('') : (val as string))}
      setItems={setCategories}
      placeholder="Pick a category (optional)"
      listMode="SCROLLVIEW"
      style={{
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        minHeight: 50,
      }}
      dropDownContainerStyle={{
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        ...shadow.card,
      }}
      textStyle={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink }}
      placeholderStyle={{ fontFamily: fonts.bodyMedium, color: colors.inkFaint }}
      labelStyle={{ fontFamily: fonts.bodyMedium, color: colors.ink }}
      selectedItemContainerStyle={{ backgroundColor: colors.primarySoft }}
      selectedItemLabelStyle={{ fontFamily: fonts.bodyBold, color: colors.primaryInk }}
      zIndex={5000}
    />
  );
}
