'use client'

import { StackItem } from '@/components/StackItem'

interface SectionTitleProps {
  title: string
  action?: {
    text: string
    onClick: () => void
    disabled?: boolean
  }
  showTopBorder?: boolean
  enableGroupHover?: boolean
  className?: string
}

export function SectionTitle({
  title,
  action,
  showTopBorder = false,
  enableGroupHover = false,
  className = ''
}: SectionTitleProps) {
  const content = enableGroupHover && action ? (
    // Custom rendering with group hover when enabled
    <div className={`pt-5pt pb-0 px-12pt flex justify-between items-center font-sf-pro w-full bg-brand-darker ${className}`}>
      <div className="text-10pt font-light text-text-secondary">
        {title}
      </div>
      <div className="flex gap-8pt ml-15pt flex-shrink-0 items-start">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!action.disabled) {
              action.onClick()
            }
          }}
          className={`text-10pt font-normal transition-colors duration-200 flex-shrink-0 ${
            action.disabled
              ? 'text-text-secondary cursor-not-allowed opacity-50'
              : 'text-text-primary cursor-pointer group-hover:underline'
          }`}
          title={action.text}
        >
          {action.text}
        </a>
      </div>
    </div>
  ) : (
    // Standard StackItem rendering
    <StackItem
      variant="subtitle"
      content={title}
      actions={action ? [{
        type: 'link' as const,
        text: action.text,
        onClick: action.onClick,
        disabled: action.disabled,
        title: action.text
      }] : undefined}
      className={className}
    />
  )

  return showTopBorder ? (
    <div className="border-t border-border-subtle">
      {content}
    </div>
  ) : content
}