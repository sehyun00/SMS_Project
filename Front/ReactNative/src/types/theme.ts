export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    placeholder: string;
  };
  fonts?: {
    fontSize: {
      small: number;
      medium: number;
      large: number;
    };
    fontFamily: {
      regular: string;
      bold: string;
    };
  };
  spacing?: {
    small: number;
    medium: number;
    large: number;
  };
  mode?: string;
}
