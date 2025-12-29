import React from 'react';
import {
  BaseComponentProps,
  LeafComponentProps,
//  ContainerComponentProps,
//  defineContainerComponent,
  defineLeafComponent,
  PropsOf,
  ComponentRenderer,
  withProps,
} from './reactComponentTypes';

/**
 * Higher-order component (HOC) type definition
 * This takes a component and returns an enhanced version of that component
 */
export type HOC<InProps extends BaseComponentProps, OutProps extends BaseComponentProps> = 
  <C extends ComponentRenderer<InProps>>(Component: C) => ComponentRenderer<OutProps>;

/**
 * Compose multiple higher-order components together
 */
export function composeHOCs<P extends BaseComponentProps>(...hocs: Array<HOC<any, any>>): HOC<P, any> {
  return <C extends ComponentRenderer<P>>(Component: C) => {
    return hocs.reduceRight((acc, hoc) => hoc(acc), Component as any);
  };
}

/**
 * Example HOC: Add a tooltip to any component
 */
interface WithTooltipProps extends BaseComponentProps {
  tooltip?: string;
}

export const withTooltip = <P extends BaseComponentProps>(
  Component: ComponentRenderer<P>
): ComponentRenderer<P & WithTooltipProps> => {
  return (props: P & WithTooltipProps) => {
    const { tooltip, ...componentProps } = props;
    
    if (!tooltip) {
      return Component(componentProps as P);
    }
    
    return (
      <div className="tooltip-container">
        {Component(componentProps as P)}
        <div className="tooltip">{tooltip}</div>
      </div>
    );
  };
};

/**
 * Example HOC: Add loading state to any component
 */
interface WithLoadingProps extends BaseComponentProps {
  isLoading?: boolean;
  loadingMessage?: string;
}

export const withLoading = <P extends BaseComponentProps>(
  Component: ComponentRenderer<P>
): ComponentRenderer<P & WithLoadingProps> => {
  return (props: P & WithLoadingProps) => {
    const { isLoading, loadingMessage = 'Loading...', ...componentProps } = props;
    
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">{loadingMessage}</div>
        </div>
      );
    }
    
    return Component(componentProps as P);
  };
};

/**
 * Example HOC: Add theme support to any component
 */
interface WithThemeProps extends BaseComponentProps {
  theme?: 'light' | 'dark' | 'custom';
  customThemeClass?: string;
}

export const withTheme = <P extends BaseComponentProps>(
  Component: ComponentRenderer<P>
): ComponentRenderer<P & WithThemeProps> => {
  return (props: P & WithThemeProps) => {
    const { theme = 'light', customThemeClass, className, ...componentProps } = props;
    
    const themeClass = theme === 'custom' && customThemeClass
      ? customThemeClass
      : `theme-${theme}`;
    
    const mergedClassName = className 
      ? `${className} ${themeClass}`
      : themeClass;
    
    return Component({
      ...componentProps as P,
      className: mergedClassName,
    });
  };
};

/**
 * Example base component to enhance
 */
interface ButtonProps extends LeafComponentProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const BasicButton = defineLeafComponent<ButtonProps>((props) => {
  const { label, onClick, variant = 'primary', disabled, className, style, id } = props;
  
  const buttonClass = `button button--${variant} ${disabled ? 'button--disabled' : ''} ${className || ''}`;
  
  return (
    <button
      id={id}
      className={buttonClass}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
});

/**
 * Create an enhanced button using composed HOCs
 */
export const EnhancedButton = composeHOCs<ButtonProps>(
  withTheme,
  withTooltip,
  withLoading
)(BasicButton);

// Type for the enhanced button's props (automatically includes all the HOC props)
// type EnhancedButtonProps = PropsOf<typeof EnhancedButton>;

/**
 * Example usage of the enhanced button
 */
export const EnhancedButtonExample: React.FC = () => {
  return (
    <div>
      {/* Basic usage */}
      {withProps(EnhancedButton, {
        label: 'Click Me',
        variant: 'primary',
        onClick: () => console.log('Button clicked'),
      })}
      
      {/* With tooltip */}
      {withProps(EnhancedButton, {
        label: 'Hover Me',
        tooltip: 'This is a helpful tooltip!',
        onClick: () => console.log('Tooltip button clicked'),
      })}
      
      {/* With loading state */}
      {withProps(EnhancedButton, {
        label: 'Loading...',
        isLoading: true,
        loadingMessage: 'Processing your request...',
      })}
      
      {/* With theme */}
      {withProps(EnhancedButton, {
        label: 'Dark Theme Button',
        theme: 'dark',
        onClick: () => console.log('Dark theme button clicked'),
      })}
      
      {/* With all enhancements */}
      {withProps(EnhancedButton, {
        label: 'Full Example',
        tooltip: 'All features combined',
        theme: 'custom',
        customThemeClass: 'blue-theme',
        isLoading: false,
        onClick: () => console.log('Enhanced button clicked'),
      })}
    </div>
  );
};

/**
 * Utility function to create component variants with preset props
 */
export function createVariant<
  C extends ComponentRenderer<any>,
  P extends PropsOf<C>,
  D extends Partial<P>
>(
  Component: C,
  defaultProps: D
): ComponentRenderer<Omit<P, keyof D> & Partial<D>> {
  return ((props: Omit<P, keyof D> & Partial<D>) => {
    // Merge the default props with the provided props
    const mergedProps = { ...defaultProps, ...props } as P;
    return Component(mergedProps);
  }) as ComponentRenderer<Omit<P, keyof D> & Partial<D>>;
}

/**
 * Create a primary button variant with default props
 */
export const PrimaryButton = createVariant(EnhancedButton, {
  variant: 'primary',
  theme: 'light',
});

/**
 * Create a secondary button variant with default props
 */
export const SecondaryButton = createVariant(EnhancedButton, {
  variant: 'secondary',
  theme: 'light',
});

/**
 * Create a dark theme button variant with default props
 */
export const DarkButton = createVariant(EnhancedButton, {
  variant: 'primary',
  theme: 'dark',
});

/**
 * Example usage of button variants
 */
export const ButtonVariantsExample: React.FC = () => {
  return (
    <div>
      {/* Using the primary button variant */}
      {withProps(PrimaryButton, {
        label: 'Primary Button',
        onClick: () => console.log('Primary button clicked'),
        // variant is already set to 'primary'
      })}
      
      {/* Using the secondary button variant */}
      {withProps(SecondaryButton, {
        label: 'Secondary Button',
        onClick: () => console.log('Secondary button clicked'),
        // variant is already set to 'secondary'
      })}
      
      {/* Using the dark theme button variant */}
      {withProps(DarkButton, {
        label: 'Dark Button',
        onClick: () => console.log('Dark button clicked'),
        // theme is already set to 'dark'
      })}
    </div>
  );
};
