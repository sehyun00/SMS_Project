// 경로: src/styles/pages/signUpPage.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Dimensions } from 'react-native';
import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface SignUpPageStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  formContainer: ViewStyle;
  headerTitle: TextStyle;
  inputLabel: TextStyle;
  requiredMark: TextStyle;
  input: TextStyle;
  inputError: TextStyle;
  passwordContainer: ViewStyle;
  passwordInput: TextStyle;
  eyeIcon: ViewStyle;
  phoneContainer: ViewStyle;
  phoneInput: TextStyle;
  carrierLabel: TextStyle;
  signupButton: ViewStyle;
  signupButtonText: TextStyle;
  backButton: ViewStyle;
  backButtonText: TextStyle;
  termsText: TextStyle;
  errorText: TextStyle;
  emailContainer: ViewStyle;
  emailInput: TextStyle;
  verifiedInput: TextStyle;
  verificationButton: ViewStyle;
  verifiedButton: ViewStyle;
  verificationButtonText: TextStyle;
  verificationCodeContainer: ViewStyle;
  verificationCodeInput: TextStyle;
  verifyButton: ViewStyle;
  verifyButtonText: TextStyle;
}

export default function createStyles(theme: Theme): SignUpPageStyles {
  const { width, height } = Dimensions.get('window');

  return StyleSheet.create<SignUpPageStyles>({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    formContainer: {
      width: width,
      backgroundColor: theme.colors.background,
      padding: 20,
      paddingTop: 50,
      paddingBottom: 30,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 30,
      marginTop: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000000',
      marginBottom: 10,
    },
    requiredMark: {
      color: '#FF0000',
    },
    input: {
      width: '100%',
      height: 50,
      borderBottomWidth: 1,
      borderBottomColor: '#DDDDDD',
      fontSize: 16,
      color: '#000000',
      marginBottom: 20,
    },
    inputError: {
      borderBottomColor: '#FF0000',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#DDDDDD',
      marginBottom: 20,
    },
    passwordInput: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: '#000000',
    },
    eyeIcon: {
      padding: 10,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#DDDDDD',
      marginBottom: 20,
    },
    phoneInput: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: '#000000',
    },
    carrierLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000000',
      marginLeft: 5,
    },
    signupButton: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 15,
    },
    signupButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    backButton: {
      width: '100%',
      height: 50,
      backgroundColor: '#F5F5F5',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButtonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '500',
    },
    termsText: {
      fontSize: 12,
      color: '#888888',
      textAlign: 'center',
      marginTop: 10,
    },
    errorText: {
      color: '#FF0000',
      fontSize: 12,
      marginTop: -15,
      marginBottom: 15,
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    emailInput: {
      flex: 1,
      height: 50,
      borderBottomWidth: 1,
      borderBottomColor: '#DDDDDD',
      fontSize: 16,
      color: '#000000',
      marginRight: 10,
    },
    verifiedInput: {
      borderBottomColor: theme.colors.primary,
    },
    verificationButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 100,
    },
    verifiedButton: {
      backgroundColor: '#4CAF50',
    },
    verificationButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    verificationCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    verificationCodeInput: {
      flex: 1,
      height: 50,
      borderBottomWidth: 1,
      borderBottomColor: '#DDDDDD',
      fontSize: 16,
      color: '#000000',
      marginRight: 10,
    },
    verifyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 60,
    },
    verifyButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
  });
}
