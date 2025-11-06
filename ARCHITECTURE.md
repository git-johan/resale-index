# Tings Resale Index - Architecture & Requirements Documentation

## 🎯 **Core Requirements**

### **User Experience Goals**
1. **Page loads** → User sees title
2. **Brand search** → Scrolls into view, becomes sticky
3. **Tag selection** → Tags smoothly move into sticky container (unified styling)
4. **Scrolling** → Font size smoothly scales down (33pt → 18pt) to show more selected tags
5. **Cohesive behavior** → Brand + selected tags move as one unified sticky unit

### **Technical Requirements**

#### **Sticky Behavior**
- **Single sticky container** holding brand search + selected tags
- **Unified positioning** - everything sticks/unsticks together
- **No individual tag sticky positioning** - simplified architecture
- **Smooth scrolling** to brand search after tag selection

#### **Font Scaling System**
- **Initial size**: 33pt for both brand and selected tags
- **Scroll-responsive scaling**: Smoothly animate to 18pt based on scroll position
- **Unified scaling**: Brand and selected tags scale together (same behavior)
- **Smooth interpolation**: Following scroll position, not just animate down

#### **Tag Management**
- **Capacity**: Optimized for 3-5 selected tags in sticky area
- **Compact stacking**: Vertical layout with reduced spacing (6pt gaps)
- **Visual unity**: Selected tags styled as continuation of brand search
- **AutoAnimate transitions**: Library handles smooth tag movements

#### **Visual Design**
- **Unified styling**: Brand and selected tags share same visual treatment
- **Font family**: SF Pro (-apple-system fallback)
- **Colors**: #1c1c1c background, #ffffff selected text, #9a9a9a unselected
- **No borders**: Clean, seamless appearance
- **Compact spacing**: Optimized for mobile viewing

## 🏗️ **Architecture Decisions**

### **HTML Structure**
```html
<!-- Single sticky container for unified behavior -->
<div class="sticky-brand-tags-container">
  <div class="brand-section">
    <input class="brand-input" />
    <a class="clear-link">clear</a>
  </div>
  <div class="selected-tags-container">
    <!-- Selected tags moved here dynamically -->
  </div>
</div>

<!-- Separate scroll area for unselected tags -->
<div class="unselected-tags-section">
  <ul class="unselected-tag-list">
    <!-- Unselected tags remain here -->
  </ul>
</div>
```

### **CSS Architecture**
- **CSS Custom Properties**: `--sticky-font-size` for responsive scaling
- **Single sticky layer**: Only the container is sticky, children are normal
- **Flexbox layout**: Simple column layout for tag stacking
- **Transition system**: Smooth font-size transitions (0.3s ease)

### **JavaScript Architecture**
- **AutoAnimate integration**: Handles all tag movement transitions
- **Simple DOM manipulation**: appendChild/insertBefore instead of CSS Grid
- **Scroll listener**: Controls font scaling via CSS custom property
- **State management**: includedTags, excludedTags, selectedTagsOrder arrays

### **Library Choices**
- **AutoAnimate (2KB)**: Automatic FLIP animations for tag transitions
- **Custom scroll scaling**: Lightweight implementation for font scaling
- **No complex animation libraries**: Minimal bundle size approach

## 🔄 **Migration from Previous System**

### **What We Replaced**
- ❌ **Individual sticky positioning** for each tag
- ❌ **CSS Grid with grid-row manipulation**
- ❌ **Complex FLIP animation system**
- ❌ **Hardcoded height calculations** (93px, 116px)
- ❌ **Separate sticky header bar**
- ❌ **Z-index layering complexity** (200, 100+)

### **What We Gained**
- ✅ **Single sticky container** - unified behavior
- ✅ **AutoAnimate transitions** - 90% less animation code
- ✅ **Responsive font scaling** - smooth scroll-based scaling
- ✅ **Simplified positioning** - no hardcoded calculations
- ✅ **Better performance** - GPU-accelerated transforms
- ✅ **Maintainable architecture** - cleaner separation of concerns

## 🎨 **Visual Design System**

### **Typography Scale**
- **Large state**: 33pt (brand + selected tags when at top)
- **Small state**: 18pt (brand + selected tags when scrolled)
- **Details text**: calc(var(--sticky-font-size) * 0.33) - proportional scaling
- **Static text**: 11pt (clear link, stats)

### **Spacing System**
- **Body padding**: 7.5pt (halved from 15pt for compact mobile design)
- **Sticky container padding**: 15pt vertical, 7.5pt horizontal
- **Selected tag gaps**: 6pt (compact stacking)
- **Unselected tag gaps**: 20pt (comfortable reading)

### **Color Palette**
- **Background**: #1c1c1c (main background)
- **Selected text**: #ffffff (high contrast)
- **Unselected text**: #9a9a9a (medium contrast)
- **Details text**: #9a9a9a (consistent with unselected)
- **Stats background**: #141414 (slightly darker for depth)

## 📱 **Responsive Behavior**

### **Mobile-First Design**
- **Compact spacing**: Halved margins for efficient screen usage
- **Touch targets**: Maintained 25pt button sizes
- **Readable fonts**: Proper scaling from 33pt to 18pt
- **Sticky optimization**: 3-5 tags capacity for mobile viewports

### **Scroll Interactions**
- **Auto-scroll**: Smooth scroll to brand search after tag selection
- **Font scaling**: Immediate response to scroll position
- **Minimum height**: 100vh ensures scrollable content
- **Smooth transitions**: 0.3s ease for font changes

## 🔧 **Implementation Notes**

### **Critical Dependencies**
- **AutoAnimate**: Required for tag transition animations
- **exclusions.js**: Tag filtering configuration
- **CSS Custom Properties**: Required for responsive font scaling

### **Performance Optimizations**
- **CSS transforms**: GPU-accelerated font scaling
- **RequestAnimationFrame**: Smooth scroll listeners
- **Minimal DOM manipulation**: AutoAnimate handles transitions
- **Efficient selectors**: Class-based styling over complex selectors

### **Browser Support**
- **Modern browsers**: CSS Custom Properties, Flexbox, Sticky positioning
- **Fallbacks**: -apple-system font stack for cross-platform support
- **Mobile compatibility**: Touch-optimized button sizes and spacing

## 🚨 **Potential Refactoring Areas**

### **Future Enhancements**
1. **Tag capacity scaling**: Dynamic font scaling based on number of selected tags
2. **Advanced scroll effects**: Parallax or staggered animations
3. **Gesture support**: Swipe interactions for tag selection
4. **Virtual scrolling**: For large tag lists (performance)

### **Technical Debt**
1. **Hardcoded measurements**: Some values still hardcoded (15pt, 7.5pt)
2. **Magic numbers**: Font scale factor (0.33) could be configurable
3. **Browser testing**: Need comprehensive cross-browser validation
4. **Accessibility**: ARIA labels and keyboard navigation improvements

This documentation should be updated whenever requirements change or architectural decisions are made.