import React from 'react'
import { StackItemProps, Action } from '@/lib/types'

/**
 * Unified StackItem Component
 * Single component with 6 variants - preserves the original architectural decision
 *
 * Variants:
 * - brand-search: Header with border
 * - brand: 33pt 500 white text
 * - selected-included: 33pt 300 white text
 * - selected-excluded: 33pt 300 gray text with strikethrough
 * - unselected: 33pt 300 gray text
 * - estimate: Dark background, bottom positioning
 */
export function StackItem({
  variant,
  content,
  details,
  actions,
  className = '',
  onClick
}: StackItemProps) {
  // 7 variants including the new brand-searching state
  const variantClasses = {
    'brand-search': 'text-20pt font-medium text-text-primary border-b border-border-subtle bg-brand-darker',
    'brand': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'brand-searching': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'selected-included': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'selected-excluded': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'unselected': 'text-20pt font-medium text-text-primary',
    'estimate': 'text-20pt font-medium text-text-primary bg-brand-darker'
  }

  return (
    <div
      className={`py-8pt px-12pt flex justify-between items-center font-sf-pro w-full ${variantClasses[variant]} ${className} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-10pt flex-1 min-w-0">
        <h3
          className="leading-1.2 m-0 font-medium"
          style={variant === 'selected-excluded' ? { textDecoration: 'line-through' } : {}}
        >
          {content}
        </h3>
        {details && (
          <div className="flex flex-col items-start text-left">
            {(() => {
              // Parse details string like "+8.0 | 1750-2799kr | 2.0k listings"
              const parts = details.split(' | ')
              const score = parts[0] // "+8.0"
              const priceRange = parts[1] // "1750-2799kr"

              return (
                <>
                  <div className={`text-10pt font-light leading-1.2 ${className || 'text-green-500'}`}>
                    {score}
                  </div>
                  {priceRange && (
                    <div className="text-10pt font-light text-text-secondary leading-1.2">
                      {priceRange}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>
      {actions && actions.length > 0 && <StackActions actions={actions} />}
    </div>
  )
}

/**
 * StackActions Component
 * Handles the action buttons and links for each StackItem
 */
function StackActions({ actions }: { actions: Action[] }) {
  return (
    <div className="flex gap-8pt ml-15pt flex-shrink-0 items-start">
      {actions.map((action, index) => {
        if (action.type === 'link') {
          return (
            <a
              key={index}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                action.onClick()
              }}
              className="text-10pt font-normal text-text-primary cursor-pointer hover:underline transition-opacity flex-shrink-0"
              title={action.title}
            >
              {action.text}
            </a>
          )
        }

        // Include (+) and Exclude (-) buttons
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
            }}
            className={`w-6 h-33pt rounded-none border-none text-20pt cursor-pointer flex items-center justify-center transition-all duration-200 p-1 bg-transparent ${
              action.active
                ? 'text-text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary font-normal'
            }`}
            title={action.title}
          >
            {action.type === 'include' ? '+' : '−'}
          </button>
        )
      })}
    </div>
  )
}

export default StackItem