import React from 'react';

const FormInput = React.memo(({ 
  type, 
  name, 
  value, 
  onChange, 
  placeholder, 
  maxLength, 
  style, 
  label,
  noMargin = false
}) => (
  <div style={{ marginBottom: noMargin ? '0' : '15px' }}>
    {label && (
      <label style={{ 
        color: '#9ca3af', 
        display: 'block', 
        marginBottom: '5px', 
        fontSize: '14px' 
      }}>
        {label}
      </label>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        ...style,
        boxSizing: 'border-box'
      }}
    />
  </div>
));

FormInput.displayName = 'FormInput';

export default FormInput;
