import React from 'react'
import { StackItemProps, Action } from '@/lib/types'

/**
 * Unified StackItem Component
 * Single component with 8 variants - preserves the original architectural decision
 *
 * Variants:
 * - brand-search: Header with border
 * - brand: 33pt 500 white text
 * - brand-searching: 33pt 300 white text
 * - selected-included: 33pt 300 white text
 * - selected-excluded: 33pt 300 gray text with strikethrough
 * - unselected: 33pt 300 gray text
 * - estimate: Dark background, bottom positioning
 * - subtitle: Section header for tags/estimate sections
 */
export function StackItem({
  variant,
  content,
  details,
  actions,
  className = '',
  onClick
}: StackItemProps) {
  // 8 variants including the new brand-searching state and subtitle
  const variantClasses = {
    'brand-search': 'text-20pt font-medium text-text-primary border-b border-border-subtle bg-brand-darker',
    'brand': 'text-20pt font-bold text-text-primary border-b border-border-subtle bg-brand-darker',
    'brand-searching': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'selected-included': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'selected-excluded': 'text-20pt font-medium text-text-primary bg-brand-darker',
    'unselected': 'text-20pt font-medium text-text-secondary',
    'estimate': 'text-20pt font-bold text-text-primary bg-brand-darker',
    'subtitle': 'text-10pt font-light text-text-secondary'
  }

  return (
    <div
      className={`${variant === 'subtitle' ? 'pt-5pt pb-0' : 'py-8pt'} px-12pt flex justify-between items-center font-sf-pro w-full ${variantClasses[variant]} ${className} ${onClick ? 'cursor-pointer hover:text-text-primary transition-colors duration-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-10pt flex-1 min-w-0">
        <h3
          className="leading-1.2 m-0"
          style={variant === 'selected-excluded' ? { textDecoration: 'line-through' } : {}}
        >
          {content}
        </h3>
        {details && (
          <div className="flex flex-col items-start text-left">
            {(() => {
              // Handle different formats: "+8.0 | 1750-2799kr | 2.0k listings" or "575 - 1600 kr • 782 listings"
              let score, priceRange, listingCount;

              if (details.includes(' • ')) {
                // Estimate format: "575 - 1600 kr • 782 listings"
                const parts = details.split(' • ')
                priceRange = parts[0]?.replace(/ - /g, '-').replace(/ kr/g, 'kr') // Normalize: "575-1600kr"
                listingCount = parts[1] // "782 listings"
                score = null // No score for estimate
              } else {
                // Standard format: "+8.0 | 1750-2799kr | 2.0k listings"
                const parts = details.split(' | ')
                score = parts[0] // "+8.0"
                priceRange = parts[1] // "1750-2799kr"
                listingCount = parts[2] // "2.0k listings"
              }

              return (
                <>
                  {/* Hide score for selected tags */}
                  {score && variant !== 'selected-included' && variant !== 'selected-excluded' && (
                    <div className={`text-10pt font-light leading-1.2 ${
                      variant === 'estimate' ? 'text-text-secondary' : (className || 'text-green-500')
                    }`}>
                      {score}
                    </div>
                  )}
                  {priceRange && (
                    <div className="text-10pt font-light leading-1.2 text-text-secondary">
                      {priceRange}
                    </div>
                  )}
                  {listingCount && (
                    <div className="text-10pt font-light leading-1.2 text-text-secondary">
                      {listingCount}
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
                if (!action.disabled) {
                  action.onClick()
                }
              }}
              className={`text-10pt font-normal transition-colors duration-200 flex-shrink-0 ${
                action.disabled
                  ? 'text-text-secondary cursor-not-allowed opacity-50'
                  : 'text-text-primary cursor-pointer hover:underline'
              }`}
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
            disabled={action.disabled}
            onClick={(e) => {
              e.stopPropagation()
              if (!action.disabled) {
                action.onClick()
              }
            }}
            className={`w-6 h-33pt rounded-none border-none text-20pt flex items-center justify-center transition-colors duration-200 p-1 bg-transparent ${
              action.disabled
                ? 'text-text-secondary cursor-not-allowed opacity-50'
                : action.active
                ? 'text-text-primary font-medium cursor-pointer'
                : 'text-text-secondary hover:text-text-primary font-normal cursor-pointer'
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