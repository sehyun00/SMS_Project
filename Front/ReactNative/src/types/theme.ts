export interface Theme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      placeholder: string;
    };
    fonts: {
      regular: string;
      medium: string;
      bold: string;
    };
    spacing: {
      small: number;
      medium: number;
      large: number;
    };
  }
  