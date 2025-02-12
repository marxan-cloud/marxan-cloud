import React, { useEffect, useRef, useMemo } from 'react';

import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

// Downshift;
import { useSelect, useMultipleSelection } from 'downshift';

import Checkbox from 'components/forms/checkbox';
import {
  flipModifier,
  hideModifier,
  sameWidthModifier,
  offsetModifier,
} from 'components/forms/select/constants/popper-modifiers';
import THEME from 'components/forms/select/constants/theme';
import Menu from 'components/forms/select/menu';
import Toggle from 'components/forms/select/toggle';
import { SelectProps, SelectOptionProps } from 'components/forms/select/types';
import { cn } from 'utils/cn';

export const MultiSelect: React.FC<SelectProps> = ({
  theme = 'dark',
  size = 'base',
  maxHeight = 300,
  status,
  prefix,
  options = [],
  values,
  initialValues = [],
  disabled = false,
  multiple = true,
  placeholder,
  clearSelectionActive = true,
  clearSelectionLabel = 'Clear selection',
  batchSelectionActive,
  batchSelectionLabel = 'Select all',
  onSelect,
  onFocus,
  onBlur,
}: SelectProps) => {
  const triggerRef = useRef();
  const menuRef = useRef();

  const getOptions: SelectOptionProps[] = useMemo(() => {
    return [
      ...(clearSelectionActive
        ? [
            {
              value: 'batch-clear-selection',
              label: clearSelectionLabel,
              enabled: false,
              checkbox: false,
            },
          ]
        : []),
      ...(batchSelectionActive
        ? [
            {
              value: 'batch-selection',
              label: batchSelectionLabel,
              enabled: false,
              checkbox: false,
            },
          ]
        : []),
      ...options.map((o) => ({ ...o, checkbox: true, enabled: true })),
    ];
  }, [
    options,
    clearSelectionActive,
    clearSelectionLabel,
    batchSelectionActive,
    batchSelectionLabel,
  ]);

  const getOptionsEnabled = useMemo(() => {
    return getOptions.filter((op) => !op.disabled && op.enabled);
  }, [getOptions]);

  const getInitialSelected = getOptions.filter((o) => initialValues.includes(`${o.value}`));

  const getSelected = values ? getOptions.filter((o) => values.includes(`${o.value}`)) : null;

  const isSelected = (selected: SelectOptionProps, selectedItms: SelectOptionProps[]) =>
    selectedItms.some((i) => i.value === selected.value);

  const handleSelectedItem = ({
    option,
    selectedItems,
    addSelectedItem,
    removeSelectedItem,
    setSelectedItems,
    reset,
  }) => {
    switch (option.value) {
      case 'batch-clear-selection':
        reset();
        break;
      case 'batch-selection':
        setSelectedItems(getOptionsEnabled);
        break;
      default:
        if (option.disabled) {
          break;
        }

        if (isSelected(option, selectedItems)) {
          removeSelectedItem(option);
          break;
        } else {
          addSelectedItem(option);
          break;
        }
    }
  };

  const {
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    setSelectedItems,
    selectedItems,
    reset,
  } = useMultipleSelection<SelectOptionProps>({
    ...(!!getSelected && {
      selectedItems: getSelected,
    }),
    ...(!!getInitialSelected && {
      initialSelectedItems: getInitialSelected,
    }),
    itemToString: (item) => {
      if (typeof item.label === 'string') {
        return item.label;
      }
      return `${item.value}`;
    }, // How the selected options is announced to screen readers
    stateReducer: (st, actionAndChanges) => {
      const { changes, type } = actionAndChanges;
      if (
        type === useMultipleSelection.stateChangeTypes.FunctionAddSelectedItem ||
        type === useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem ||
        type === useMultipleSelection.stateChangeTypes.FunctionSetSelectedItems ||
        type === useMultipleSelection.stateChangeTypes.FunctionReset
      ) {
        onSelect(changes.selectedItems);
      }

      return changes;
    },
  });

  const { isOpen, highlightedIndex, getToggleButtonProps, getMenuProps, getItemProps, closeMenu } =
    useSelect<SelectOptionProps>({
      items: getOptions,
      itemToString: (item) => {
        if (typeof item.label === 'string') {
          return item.label;
        }
        return `${item.value}`;
      }, // How the selected options is announced to screen readers
      stateReducer: (st, actionAndChanges) => {
        const { type, changes } = actionAndChanges;
        const { selectedItem: option } = changes;

        switch (type) {
          case useSelect.stateChangeTypes.MenuKeyDownEnter:
          case useSelect.stateChangeTypes.ItemClick:
            handleSelectedItem({
              option,
              selectedItems,
              addSelectedItem,
              removeSelectedItem,
              setSelectedItems,
              reset,
            });

            return {
              ...changes,
              highlightedIndex: st.highlightedIndex,
              isOpen: true,
            };
          default:
            return changes;
        }
      },
    });

  // 'usePopper'
  const { styles, attributes, update } = usePopper(triggerRef.current, menuRef.current, {
    placement: 'bottom',
    // strategy: 'fixed',
    modifiers: [offsetModifier, flipModifier, hideModifier, sameWidthModifier],
  });

  // Hide menu if reference is outside the boundaries
  const referenceHidden =
    attributes?.popper?.['data-popper-reference-hidden'] ||
    attributes?.popper?.['data-popper-reference-scaped'];
  useEffect(() => {
    if (referenceHidden) {
      closeMenu();
    }
  }, [referenceHidden, closeMenu]);

  useEffect(() => {
    if (update) update();
  }, [isOpen, update]);

  return (
    <div
      className={cn({
        'c-multi-select': true,
        'w-full overflow-hidden leading-tight': true,
        'pointer-events-none opacity-50': disabled,
        [THEME[theme].container]: true,
        [THEME[theme].closed]: true,
        [THEME.states[status]]: true,
      })}
    >
      <div className="relative w-full" ref={triggerRef}>
        <Toggle
          options={getOptionsEnabled}
          theme={theme}
          size={size}
          status={status}
          prefix={prefix}
          disabled={disabled}
          multiple
          opened={isOpen}
          selectedItems={selectedItems}
          placeholder={placeholder}
          getToggleButtonProps={getToggleButtonProps}
          getDropdownProps={getDropdownProps}
        />
      </div>

      {/* Menu */}
      {createPortal(
        <div
          className={cn({
            'c-multi-select-dropdown': true,
            'z-50': true,
            // The content of `<Menu />` must always be in the DOM so that Downshift can get the ref
            // to the `<ul />` element through `getMenuProps`
            invisible: !isOpen,
          })}
          ref={menuRef}
          style={styles.popper}
          {...attributes.popper}
        >
          <Menu
            theme={theme}
            size={size}
            status={status}
            disabled={disabled}
            multiple
            opened={isOpen}
            attributes={attributes}
          >
            <Toggle
              options={getOptionsEnabled}
              theme={theme}
              size={size}
              status={status}
              prefix={prefix}
              disabled={disabled}
              multiple={multiple}
              opened={isOpen}
              selectedItems={selectedItems}
              placeholder={placeholder}
              getToggleButtonProps={getToggleButtonProps}
              getDropdownProps={getDropdownProps}
            />

            <ul
              {...getMenuProps({ onFocus, onBlur })}
              className={cn({
                'overflow-y-auto overflow-x-hidden py-1 focus:outline-none': true,
              })}
              style={{
                maxHeight,
              }}
            >
              {getOptions.map((option, index) => (
                <li
                  className={cn({
                    'relative mt-0.5 cursor-pointer px-4 py-1': true,
                    [THEME[theme].item.base]: highlightedIndex !== index,
                    [THEME[theme].item.disabled]: option.disabled,
                    [THEME[theme].item.highlighted]:
                      (highlightedIndex === index && !option.disabled) ||
                      isSelected(option, selectedItems),
                  })}
                  key={`${option.value}`}
                  {...getItemProps({ item: option, index, disabled: option.disabled })}
                >
                  <span
                    className={cn({
                      'ml-6': !!option.checkbox,
                    })}
                  >
                    {option.label}
                  </span>

                  {option.checkbox && (
                    <Checkbox
                      className="absolute left-4 top-1.5 bg-opacity-0"
                      checked={isSelected(option, selectedItems)}
                      disabled={option.disabled}
                      onChange={() => {}}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Menu>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MultiSelect;
