interface AuthFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export function AuthField({ name, label, type = 'text', placeholder, required }: AuthFieldProps) {
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input className="field-input" id={name} name={name} type={type} placeholder={placeholder} required={required} />
    </div>
  );
}
