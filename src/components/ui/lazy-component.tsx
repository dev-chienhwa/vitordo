'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from './loading-spinner';
import { ErrorBoundary } from './error-boundary';
import { useIntersectionObserver } from '@/hooks/usePerformance';

export interface LazyComponentProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  delay?: number;
  className?: string;
  loadOnVisible?: boolean;
  rootMargin?: string;
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {}
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: P & LazyComponentProps) {
    const {
      fallback = <LoadingSpinner size="md" />,
      errorFallback,
      delay = 0,
      className,
      loadOnVisible = false,
      rootMargin = '50px',
      ...componentProps
    } = { ...options, ...props };

    const { elementRef, isIntersecting } = useIntersectionObserver({
      rootMargin,
      threshold: 0.1,
    });

    // If loadOnVisible is enabled and component is not visible, show placeholder
    if (loadOnVisible && !isIntersecting) {
      return (
        <div 
          ref={elementRef} 
          className={className}
          style={{ minHeight: '100px' }} // Prevent layout shift
        >
          {fallback}
        </div>
      );
    }

    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback}>
          <LazyComponent {...(componentProps as P)} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Lazy image component with progressive loading
export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver();

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder or blur image */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          {blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm"
            />
          )}
          {placeholder && !blurDataURL && (
            <div className="flex items-center justify-center h-full text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      )}

      {/* Actual image */}
      {isIntersecting && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
          Failed to load image
        </div>
      )}
    </div>
  );
}

// Lazy route component for code splitting
export function LazyRoute({
  component: Component,
  fallback = <LoadingSpinner size="lg" />,
  ...props
}: {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Progressive enhancement wrapper
export function ProgressiveEnhancement({
  children,
  fallback,
  condition,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  condition: boolean;
}) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

// Preload component for critical resources
export function ResourcePreloader({
  images = [],
  scripts = [],
  stylesheets = [],
}: {
  images?: string[];
  scripts?: string[];
  stylesheets?: string[];
}) {
  React.useEffect(() => {
    // Preload images
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Preload scripts
    scripts.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      document.head.appendChild(link);
    });

    // Preload stylesheets
    stylesheets.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });
  }, [images, scripts, stylesheets]);

  return null;
}

// Bundle analyzer component (development only)
export function BundleAnalyzer() {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log bundle information
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      console.group('Bundle Analysis');
      console.log('Scripts loaded:', scripts.length);
      console.log('Stylesheets loaded:', stylesheets.length);
      
      scripts.forEach((script: any) => {
        console.log('Script:', script.src);
      });
      
      stylesheets.forEach((link: any) => {
        console.log('Stylesheet:', link.href);
      });
      
      console.groupEnd();
    }
  }, []);

  return null;
}