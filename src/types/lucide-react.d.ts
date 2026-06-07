declare module 'lucide-react' {
  import * as React from 'react';

  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
  }

  export const Upload: React.FC<IconProps>;
  export const Plus: React.FC<IconProps>;
  export const Trash2: React.FC<IconProps>;
  export const Images: React.FC<IconProps>;
  export const X: React.FC<IconProps>;
  export const Calendar: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
  export const MapPin: React.FC<IconProps>;
}