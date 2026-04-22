# Mobile-First Development Guidelines

## Quick Reference for Responsive Design

### Spacing Scale
```
Mobile:  px-2.5, py-2, gap-1.5
XS-SM:   px-3, py-2.5, gap-2
MD:      px-4, py-3, gap-3
LG+:     px-5, py-4, gap-4
```

### Typography Scale
```
xs:text-xs      → xs screen (8-10px)
text-xs         → base/default (10-12px)
sm:text-sm      → sm screen (12-14px)
text-sm         → base size (14px)
md:text-base    → md screen
text-base       → 16px
md:text-lg      → lg screen
text-lg         → 18px
md:text-xl      → xl screen
text-xl         → 20px
sm:text-2xl     → 24px
text-2xl        → 28px
md:text-3xl     → sm screen 32px
text-3xl        → 30px
```

### Component Template

#### Grid Layouts
```jsx
// Mobile-first grid (1 col, then 2, then 3)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  {/* items */}
</div>
```

#### Responsive Padding
```jsx
// Padding scales: mobile → tablet → desktop
<div className="p-3 xs:p-4 sm:p-5 md:p-6">
  {/* content */}
</div>
```

#### Responsive Text
```jsx
// Text sizing
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
  Heading
</h1>
```

#### Responsive Button
```jsx
<button className="px-3 py-2 xs:px-4 xs:py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm md:text-base">
  Click me
</button>
```

#### Responsive Form
```jsx
<div className="grid gap-3 sm:gap-4 md:grid-cols-2">
  <input className="input-modern text-xs xs:text-sm md:text-base" />
  <select className="input-modern text-xs xs:text-sm md:text-base" />
</div>
```

### Icon Sizing
```jsx
// Icons scale with screen size
<Icon size={14} className="xs:size-16 md:size-20" />

// Shorthand
<Icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5" />
```

### Common Responsive Classes

#### Display
- `lg:hidden` - hide on desktop
- `hidden sm:block` - show only on tablet+
- `flex-col xs:flex-row` - stack on mobile, row on tablet+
- `grid-cols-1 md:grid-cols-2` - 1 column mobile, 2 columns desktop

#### Sizing
- `w-full sm:max-w-md md:max-w-2xl` - responsive max-width
- `text-xs sm:text-sm md:text-base` - responsive text
- `rounded-lg xs:rounded-xl md:rounded-2xl` - responsive radius

#### Spacing
- `p-3 xs:p-4 sm:p-5` - responsive padding
- `gap-2 sm:gap-3 md:gap-4` - responsive gaps
- `mt-2 xs:mt-3 sm:mt-4` - responsive margins

#### Flexbox
- `items-start xs:items-center` - responsive alignment
- `flex-wrap xs:flex-nowrap` - responsive wrapping
- `justify-between gap-2 xs:gap-3` - responsive spacing

## Breakpoint Strategy

### Mobile First Approach
1. Write base styles for mobile (smallest screen)
2. Add tablet styles with `sm:` or `md:`
3. Add desktop styles with `lg:` or `xl:`

### Example:
```jsx
// BAD - Desktop first
<div className="p-8 md:p-6 sm:p-4"> {/* Wrong order */}

// GOOD - Mobile first
<div className="p-4 sm:p-6 md:p-8"> {/* Correct order */}
```

## Touch Targets
- Minimum size: 44x44px (accessibility standard)
- Spacing between targets: 8-16px
- Tap area should be generous on mobile

```css
/* Ensure touch-friendly sizes */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

## Common Mistakes to Avoid

### ❌ DON'T
```jsx
// Don't use px for everything
<div className="px-8">

// Don't forget mobile-first order
<div className="md:p-4 p-8 sm:p-6">

// Don't hide content on mobile only
<div className="hidden">Only on desktop</div>

// Don't make buttons too small
<button className="p-1">Small</button>

// Don't use static widths
<div className="w-80">Fixed width</div>
```

### ✅ DO
```jsx
// Use responsive padding
<div className="px-3 xs:px-4 sm:px-5">

// Proper mobile-first order
<div className="p-4 sm:p-6 md:p-8">

// Use responsive display
<div className="hidden md:block">Desktop only</div>

// Make buttons touch-friendly
<button className="p-2 sm:p-3 md:p-4">Tap me</button>

// Use responsive widths
<div className="w-full md:max-w-2xl">Fluid width</div>
```

## Testing Checklist

### Mobile (320-480px)
- [ ] All text is readable
- [ ] Images scale properly
- [ ] Forms are easy to use
- [ ] Buttons are large enough
- [ ] No horizontal scrolling
- [ ] Navigation is accessible

### Tablet (768-1024px)
- [ ] Grid layouts work
- [ ] Images look good
- [ ] Sidebar is positioned correctly
- [ ] Modals are properly sized

### Desktop (1024px+)
- [ ] Multi-column layouts work
- [ ] Hover effects function
- [ ] Full typography displays
- [ ] Buttons have proper spacing

## Performance Tips

1. **Minimize Media Queries**
   - Use mobile-first utilities
   - Avoid excessive breakpoints
   - Leverage CSS inheritance

2. **Optimize Images**
   - Use responsive images
   - Consider picture element
   - Lazy load when appropriate

3. **Reduce JavaScript**
   - Use CSS for responsive behavior
   - Avoid mobile-specific JS
   - Progressive enhancement

4. **Prioritize Critical Content**
   - Essential info above fold
   - Lazy load secondary content
   - Optimize for fast networks

## Resources

- Tailwind Responsive Design: https://tailwindcss.com/docs/responsive-design
- Mobile Design Guide: https://www.nngroup.com/articles/mobile-first-web-design/
- Touch Targets: https://www.smashingmagazine.com/2022/09/inline-expansion-mobile-design/

## Questions?

Refer to:
1. This file for guidelines
2. Existing components for patterns
3. Tailwind docs for utility classes
4. MOBILE_RESPONSIVENESS_IMPROVEMENTS.md for implementation details
