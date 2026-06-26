// Shared type for the platform-specific Car3D implementations (Car3D.web.tsx / Car3D.native.tsx).
export interface Car3DProps {
  /** Body paint colour. Defaults to the theme accent. */
  paint?: string;
  /** Glass / greenhouse colour. */
  glass?: string;
  /** Canvas height in px. */
  height?: number;
  /** Auto-rotate the model. */
  autoRotate?: boolean;
}

export function Car3D(props: Car3DProps): JSX.Element;
