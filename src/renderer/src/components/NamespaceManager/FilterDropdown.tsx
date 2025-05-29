import React, { useRef, useEffect } from 'react';
import { Input, Space, Button, InputRef } from 'antd';

interface FilterDropdownProps {
  placeholder: string;
  selectedKeys: React.Key[];
  setSelectedKeys: (keys: React.Key[]) => void;
  confirm: () => void;
  clearFilters?: () => void;
  visible?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  placeholder,
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  visible,
}) => {
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [visible]);

  return (
    <div style={{ padding: 8 }}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={selectedKeys[0]?.toString() || ''}
        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => confirm()}
        style={{ width: 188, marginBottom: 8, display: 'block' }}
      />
      <Space>
        <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
          搜索
        </Button>
        <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
          重置
        </Button>
      </Space>
    </div>
  );
};

export default FilterDropdown;
