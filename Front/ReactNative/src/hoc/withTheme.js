// 경로: src/hoc/withTheme.js
import React from 'react';
import { useTheme } from '../styles/hooks/useTheme';

const withTheme = (Component) => {
  return (props) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default withTheme;
