// 파일 경로: src/screens/auth/SignUpPage.tsx
// 컴포넌트 흐름: App.js > AuthNavigator.tsx > SignUpPage.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  UIManager,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext'; // AuthContext 불러오기
import { sendVerificationEmail, verifyEmailCode, EmailVerificationResponse } from '../../api/authApi';

// 스타일 임포트
import createStyles from '../../styles/pages/signUpPage.styles';
import withTheme from '../../hoc/withTheme';
import { Theme } from '../../types/theme';
import { LoginPageNavigationProp } from '../../types/navigation';

// 컴포넌트 props 인터페이스 정의
interface SignUpPageProps {
  theme: Theme;
}

interface SignUpPageStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  formContainer: ViewStyle;
  headerTitle: TextStyle;
  inputLabel: TextStyle;
  input: TextStyle;
  passwordInput: TextStyle;
  passwordContainer: ViewStyle;
  eyeIcon: ViewStyle;
  errorText: TextStyle;
  signupButton: ViewStyle;
  signupButtonText: TextStyle;
  backButton: ViewStyle;
  backButtonText: TextStyle;
  termsText: TextStyle;
  requiredMark: TextStyle;
  emailContainer: ViewStyle;
  emailInput: TextStyle;
  verificationButton: ViewStyle;
  verifiedButton: ViewStyle;
  verificationButtonText: TextStyle;
  verificationCodeContainer: ViewStyle;
  verificationCodeInput: TextStyle;
  verifyButton: ViewStyle;
  verifyButtonText: TextStyle;
  inputError: ViewStyle;
  phoneContainer: ViewStyle;
  phoneInput: TextStyle;
  carrierLabel: TextStyle;
  verifiedInput: ViewStyle;
  scrollViewContent: ViewStyle;
  carrierModal: ViewStyle;
  carrierModalContent: ViewStyle;
  carrierOption: ViewStyle;
  carrierOptionText: TextStyle;
  carrierCloseButton: ViewStyle;
  carrierCloseButtonText: TextStyle;
  carrierSelector: ViewStyle;
  carrierText: TextStyle;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ theme }) => {
  // 폼 상태 관리
  const [email, setEmail] = useState('');
  const [name, setName] = useState(''); // 이름 상태 추가
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 이메일 인증 관련 상태 추가
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // UI 상태 관리
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // 단계별 표시 상태
  const [isEmailEntered, setIsEmailEntered] = useState(false);
  const [isNameEntered, setIsNameEntered] = useState(false); // 이름 입력 상태 추가
  const [isPasswordEntered, setIsPasswordEntered] = useState(false);
  const [isConfirmPasswordEntered, setIsConfirmPasswordEntered] = useState(false);

  // 애니메이션 값 정의
  const nameAnimation = useState(new Animated.Value(0))[0]; // 이름 애니메이션 추가
  const pwdAnimation = useState(new Animated.Value(0))[0];
  const confirmPwdAnimation = useState(new Animated.Value(0))[0];
  const phoneAnimation = useState(new Animated.Value(0))[0];
  const signUpBtnAnimation = useState(new Animated.Value(0))[0];

  // AuthContext 사용
  const { signup, loading: authLoading } = useAuth();

  const styles = createStyles(theme);
  const navigation = useNavigation<LoginPageNavigationProp>();

  // 통신사 관련 상태 추가
  const [carrier, setCarrier] = useState('선택');
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  
  // 통신사 목록
  const carriers = ['SKT', 'KT', 'LG U+', 'SKT 알뜰폰', 'KT 알뜰폰', 'LG U+ 알뜰폰'];

  // 추가 스타일 정의
  const additionalStyles = StyleSheet.create({
    passwordHint: {
      fontSize: 12,
      color: theme.colors.text,
      marginTop: 4,
      marginLeft: 2,
      marginBottom: 16, // 비밀번호 확인 필드와의 간격 추가
    },
    carrierModal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    carrierModalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '50%',
    },
    carrierOption: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    carrierOptionText: {
      fontSize: 16,
      color: '#000000',
      textAlign: 'center',
    },
    carrierCloseButton: {
      marginTop: 10,
      paddingVertical: 15,
      alignItems: 'center',
    },
    carrierCloseButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    carrierSelector: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    carrierText: {
      fontSize: 14,
      color: carrier === '선택' ? '#888888' : '#000000',
      marginLeft: 5,
    },
  });

  // 비밀번호 일치 여부 체크
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const conditions = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
    const passedConditions = conditions.filter(condition => condition).length;

    if (password.length < minLength) {
      setPasswordError('비밀번호는 최소 8자리 이상이어야 합니다.');
      return false;
    }
    
    if (passedConditions < 3) {
      setPasswordError('영문 대소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.');
      return false;
    }

    setPasswordError('');
    return true;
  };

  // 이메일 입력 처리
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const newIsEmailEntered = text.length > 0;

    if (newIsEmailEntered !== isEmailEntered) {
      setIsEmailEntered(newIsEmailEntered);

      if (!newIsEmailEntered) {
        // 이메일이 비어있을 때만 모든 필드 초기화
        setIsNameEntered(false);
        setIsPasswordEntered(false);
        setIsConfirmPasswordEntered(false);

        // 애니메이션 값 초기화
        Animated.parallel([
          Animated.timing(nameAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(pwdAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(confirmPwdAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(phoneAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(signUpBtnAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();
      }
    }
  };

  // 이름 입력 처리
  const handleNameChange = (text: string) => {
    setName(text);
    const newIsNameEntered = text.length > 0;

    if (newIsNameEntered !== isNameEntered) {
      setIsNameEntered(newIsNameEntered);

      if (newIsNameEntered) {
        // 비밀번호 필드 표시 애니메이션
        Animated.timing(pwdAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
      } else {
        // 비밀번호 필드 숨김 애니메이션
        Animated.timing(pwdAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 다음 단계도 초기화
        setIsPasswordEntered(false);
        setIsConfirmPasswordEntered(false);

        // 애니메이션 값 초기화
        Animated.parallel([
          Animated.timing(confirmPwdAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(phoneAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(signUpBtnAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();
      }
    }
  };

  // 비밀번호 입력 처리
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const isValid = validatePassword(text);
    const newIsPasswordEntered = text.length > 0 && isValid;

    // 비밀번호가 유효하지 않으면 비밀번호 확인 필드 초기화
    if (!isValid) {
      setConfirmPassword('');
      setIsConfirmPasswordEntered(false);
    }

    if (newIsPasswordEntered !== isPasswordEntered) {
      setIsPasswordEntered(newIsPasswordEntered);

      if (newIsPasswordEntered) {
        // 비밀번호 확인 필드 표시 애니메이션
        Animated.timing(confirmPwdAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
      } else {
        // 비밀번호 확인 필드 숨김 애니메이션
        Animated.timing(confirmPwdAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 다음 단계도 초기화
        setIsConfirmPasswordEntered(false);

        // 애니메이션 값 초기화
        Animated.parallel([
          Animated.timing(phoneAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(signUpBtnAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();
      }
    }
  };

  // 비밀번호 확인 입력 처리
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    const newIsConfirmPasswordEntered = text.length > 0;
    const doPasswordsMatch = text === password;

    if (newIsConfirmPasswordEntered !== isConfirmPasswordEntered) {
      setIsConfirmPasswordEntered(newIsConfirmPasswordEntered);
    }

    // 비밀번호가 일치하지 않으면 휴대폰 입력 필드 초기화
    if (!doPasswordsMatch) {
      setPhoneNumber('');
    }

    // 비밀번호가 일치할 때만 휴대폰 번호 입력 필드 표시
    if (doPasswordsMatch && text.length > 0) {
      Animated.timing(phoneAnimation, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
    } else {
      // 비밀번호가 일치하지 않으면 휴대폰 번호 입력 필드와 가입하기 버튼 숨김
      Animated.parallel([
        Animated.timing(phoneAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }),
        Animated.timing(signUpBtnAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        })
      ]).start();
    }
  };

  // 휴대폰 번호 입력 처리
  const handlePhoneNumberChange = (text: string) => {
    // 숫자만 추출
    const cleaned = text.replace(/\D/g, '');

    // 포맷팅
    let formatted = '';
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }

    setPhoneNumber(formatted);

    // 전화번호가 유효한 길이(10-11자리)인지 확인
    if (cleaned.length >= 10) {
      // 가입하기 버튼 표시 애니메이션
      Animated.timing(signUpBtnAnimation, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
    } else {
      // 가입하기 버튼 숨김 애니메이션
      Animated.timing(signUpBtnAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }).start();
    }
  };

  // 이메일 인증 코드 전송
  const handleSendVerification = async () => {
    console.log(email);
    if (!email) {
      Alert.alert('입력 오류', '이메일을 입력해주세요.');
      return;
    }

    try {
      setVerificationLoading(true);
      await sendVerificationEmail(email);
      setIsVerificationSent(true);
      Alert.alert('인증 코드 전송', '입력하신 이메일로 인증 코드가 전송되었습니다.');
    } catch (error) {
      Alert.alert('오류 발생', '인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // 이메일 인증 코드 확인
  const handleVerifyCode = async () => {
    console.log(verificationCode);
    if (!verificationCode) {
      Alert.alert('입력 오류', '인증 코드를 입력해주세요.');
      return;
    }

    try {
      setVerificationLoading(true);
      const response = await verifyEmailCode(email, verificationCode);
      
      if (response.verified) {
        setIsEmailVerified(true);
        Alert.alert('인증 완료', '이메일 인증이 완료되었습니다.');
        // 이름 입력란 애니메이션 시작
        Animated.timing(nameAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
      } else {
        Alert.alert('인증 실패', '잘못된 인증 코드입니다.');
      }
    } catch (error) {
      Alert.alert('인증 실패', '잘못된 인증 코드입니다.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // 통신사 선택 핸들러
  const handleCarrierSelect = (selectedCarrier: string) => {
    setCarrier(selectedCarrier);
    setShowCarrierModal(false);
  };

  // 회원가입 처리 - 서버 연동 기능 추가
  const handleSignUp = async () => {
    Keyboard.dismiss();

    if (!isEmailVerified) {
      Alert.alert('이메일 인증 필요', '이메일 인증을 완료해주세요.');
      return;
    }

    // 유효성 검사 - 이름 필드 추가
    if (!email || !name || !password || !confirmPassword || !phoneNumber) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (!passwordsMatch) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('입력 오류', '유효한 휴대폰 번호를 입력해주세요.');
      return;
    }

    try {
      // AuthContext의 signup 함수 호출
      // user_id는 이메일로 사용
      const result = await signup(email, password, name, phoneDigits);
      console.log('회원가입 결과:', result);

      const { success, errorMessage } = result;
      console.log('성공 여부:', success, '오류 메시지:', errorMessage);

      // setTimeout 사용하여 Alert 표시 지연
      if (success === true) { // 명시적 비교
        setTimeout(() => {
          Alert.alert(
            '회원가입 성공',
            '회원가입이 성공적으로 완료되었습니다.',
            [{
              text: '확인',
              onPress: () => {
                console.log('네비게이션 실행');
                navigation.navigate('로그인 페이지');
              }
            }],
            { cancelable: false } // 백그라운드 터치로 Alert 닫기 방지
          );
        }, 300);
      } else {
        setTimeout(() => {
          Alert.alert(
            '회원가입 실패',
            errorMessage || '회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
            [{ text: '확인' }],
            { cancelable: false }
          );
          navigation.navigate('회원가입 페이지');
        }, 300);
      }
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      setTimeout(() => {
        Alert.alert(
          '오류 발생',
          '서버 연결 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.',
          [{ text: '확인' }],
          { cancelable: false }
        );
      }, 300);
    }
  };

  // 로그인 페이지로 돌아가기
  const handleBackToLogin = () => {
    navigation.navigate('로그인 페이지');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.headerTitle}>회원가입</Text>

            {/* 이메일 입력 필드 수정 */}
            <Text style={styles.inputLabel}>이메일 <Text style={styles.requiredMark}>*</Text></Text>
            <View style={styles.emailContainer}>
              <TextInput
                style={[styles.emailInput, isEmailVerified && styles.verifiedInput]}
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="예) superant@gmail.com"
                editable={!isEmailVerified}
              />
              <TouchableOpacity
                style={[
                  styles.verificationButton,
                  isEmailVerified && styles.verifiedButton
                ]}
                onPress={handleSendVerification}
                disabled={isEmailVerified || verificationLoading}
              >
                {verificationLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.verificationButtonText}>
                    {isEmailVerified ? '인증완료' : '인증코드 전송'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 인증 코드 입력 필드 */}
            {isVerificationSent && !isEmailVerified && (
              <View style={styles.verificationCodeContainer}>
                <TextInput
                  style={styles.verificationCodeInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="인증 코드 6자리 입력"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleVerifyCode}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyButtonText}>확인</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 이름 입력 필드 - 이메일 인증 완료 후 표시 */}
            {isEmailVerified && (
              <Animated.View style={{
                opacity: nameAnimation,
                transform: [{
                  translateY: nameAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }],
              }}>
                <Text style={styles.inputLabel}>이름 <Text style={styles.requiredMark}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={handleNameChange}
                  placeholder="이름을 입력하세요"
                />
              </Animated.View>
            )}

            {/* 비밀번호 입력 필드 - 이름 입력 후 표시 */}
            {isNameEntered && (
              <Animated.View style={{
                opacity: pwdAnimation,
                transform: [{
                  translateY: pwdAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }],
              }}>
                <Text style={styles.inputLabel}>비밀번호 <Text style={styles.requiredMark}>*</Text></Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    placeholder="비밀번호를 입력하세요"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : password.length === 0 ? (
                  <Text style={additionalStyles.passwordHint}>
                    * 8자리 이상, 영문 대소문자/숫자/특수문자 중 3가지 이상 포함
                  </Text>
                ) : null}
              </Animated.View>
            )}

            {/* 비밀번호 확인 필드 - 비밀번호 입력 후 표시 */}
            {isPasswordEntered && (
              <Animated.View style={{
                opacity: confirmPwdAnimation,
                transform: [{
                  translateY: confirmPwdAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }],
              }}>
                <Text style={styles.inputLabel}>비밀번호 확인 <Text style={styles.requiredMark}>*</Text></Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      !passwordsMatch && confirmPassword ? styles.inputError : null
                    ]}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
                {!passwordsMatch && confirmPassword ? (
                  <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
                ) : null}
              </Animated.View>
            )}

            {/* 휴대폰 번호 입력 필드 - 애니메이션과 함께 표시 */}
            <Animated.View style={{
              opacity: phoneAnimation,
              transform: [{
                translateY: phoneAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }],
            }}>
              <Text style={styles.inputLabel}>휴대폰 번호 <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="phone-pad"
                  placeholder="010-0000-0000"
                  maxLength={13}
                />
                <TouchableOpacity
                  onPress={() => setShowCarrierModal(true)}
                  style={additionalStyles.carrierSelector}
                >
                  <Text style={additionalStyles.carrierText}>{carrier}</Text>
                  <Ionicons name="chevron-down" size={16} color="#888888" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* 가입하기 버튼 - 애니메이션과 함께 표시 */}
            <Animated.View style={{
              opacity: signUpBtnAnimation,
              transform: [{
                translateY: signUpBtnAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }],
            }}>
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignUp}
                disabled={!email || !name || !password || !confirmPassword || !phoneNumber || !passwordsMatch || authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.signupButtonText}>가입하기</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* 로그인으로 돌아가기 버튼 - 항상 표시 */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
              <Text style={styles.backButtonText}>로그인으로 돌아가기</Text>
            </TouchableOpacity>

            {/* 약관 안내 - 항상 표시 */}
            <Text style={styles.termsText}>
              가입하면 Superant의 이용약관, 개인정보 처리방침, 쿠키 정책에 동의하게 됩니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 통신사 선택 모달 */}
      <Modal
        visible={showCarrierModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCarrierModal(false)}
      >
        <TouchableOpacity
          style={additionalStyles.carrierModal}
          activeOpacity={1}
          onPress={() => setShowCarrierModal(false)}
        >
          <View style={additionalStyles.carrierModalContent}>
            {carriers.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={additionalStyles.carrierOption}
                onPress={() => handleCarrierSelect(item)}
              >
                <Text style={additionalStyles.carrierOptionText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={additionalStyles.carrierCloseButton}
              onPress={() => setShowCarrierModal(false)}
            >
              <Text style={additionalStyles.carrierCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default withTheme(SignUpPage);
