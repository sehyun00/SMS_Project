export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    textLight: string;
    textLighter: string;
    placeholder: string;
    border: string;
    card: string;
    notification?: string; 
    positive: string;
    negative: string;
    gain: string;
    loss: string;
  };
  text?: {
    primary: string;
    secondary: string;
    tertiary: string;
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
