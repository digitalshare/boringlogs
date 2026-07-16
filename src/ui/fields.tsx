import { useEffect, useState } from 'react'

/**
 * Numeric input that keeps a local text buffer while typing and commits the
 * parsed value on blur/Enter — avoids list re-sorts (samples/strata are kept
 * sorted by depth) yanking the row around mid-keystroke.
 */
export function NumInput({
  value,
  onCommit,
  step = 0.1,
  placeholder,
  required = false,
  width,
}: {
  value: number | undefined
  onCommit: (v: number | undefined) => void
  step?: number
  placeholder?: string
  required?: boolean
  width?: number
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  useEffect(() => {
    setText(value === undefined ? '' : String(value))
  }, [value])

  const commit = () => {
    const t = text.trim()
    if (t === '') {
      if (required) setText(value === undefined ? '' : String(value))
      else onCommit(undefined)
      return
    }
    const n = Number(t)
    if (Number.isFinite(n)) onCommit(n)
    else setText(value === undefined ? '' : String(value))
  }

  return (
    <input
      type="number"
      step={step}
      value={text}
      placeholder={placeholder}
      style={width ? { width } : undefined}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <label>{label}</label>
      {children}
    </>
  )
}
