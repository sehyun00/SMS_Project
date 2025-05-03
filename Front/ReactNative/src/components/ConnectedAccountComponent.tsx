// 파일 경로: src/components/ConnectedAccountComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > ConnectedAccountComponent.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

// 공통 Theme 타입 가져오기
import { Theme } from '../types/theme';
import withTheme from '../hoc/withTheme';

// data import
import { findSecuritiesFirmByName, SECURITIES_FIRMS } from '../data/organizationData';
import { useAuth } from '../context/AuthContext';
import { verifySocialInfo, registerAccount, getAccountBalance } from '../api/connectedAccountApi';

/**
 * ConnectedAccountComponent Props
 * @typedef {Object} ConnectedAccountComponentProps
 * @property {boolean} isVisible - 모달의 가시성 여부
 * @property {function} onClose - 모달을 닫는 함수
 * @property {Theme} theme - 테마 객체
 */

interface ConnectedAccountComponentProps {
  isVisible: boolean;
  onClose: () => void;
  theme: Theme;
}

const ConnectedAccountComponent: React.FC<ConnectedAccountComponentProps> = ({
  isVisible,
  onClose,
  theme
}) => {
  const { loggedInId, loggedToken } = useAuth();
  // 단계 상태 관리
  const [currentStep, setCurrentStep] = useState(1);

  // 입력 필드 상태 관리
  const [securityCompany, setSecurityCompany] = useState('');
  const [socialId, setSocialId] = useState('');
  const [socialPassword, setSocialPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountList, setAccountList] = useState<string[]>([]);
  const [connectedId, setConnectedId] = useState<string>('');

  // UI 상태 관리
  const [showSocialPassword, setShowSocialPassword] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 필드 입력 상태
  const [isSecurityCompanySelected, setIsSecurityCompanySelected] = useState(false);
  const [isSocialIdEntered, setIsSocialIdEntered] = useState(false);
  const [isSocialPasswordEntered, setIsSocialPasswordEntered] = useState(false);
  const [isAccountNumberEntered, setIsAccountNumberEntered] = useState(false);
  const [isAccountPasswordEntered, setIsAccountPasswordEntered] = useState(false);

  // 애니메이션 값
  const socialIdAnimation = useRef(new Animated.Value(0)).current;
  const socialPasswordAnimation = useRef(new Animated.Value(0)).current;
  const nextButtonAnimation = useRef(new Animated.Value(0)).current;
  const accountNumberAnimation = useRef(new Animated.Value(0)).current;
  const accountPasswordAnimation = useRef(new Animated.Value(0)).current;
  const registerButtonAnimation = useRef(new Animated.Value(0)).current;

  // 스크롤 관리
  const scrollViewRef = useRef<ScrollView>(null);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isVisible) {
      resetForm();
    }
  }, [isVisible]);

  // 단계가 변경될 때 스크롤 조정
  useEffect(() => {
    if (currentStep > 1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [currentStep]);

  // 폼 초기화 함수
  const resetForm = () => {
    setCurrentStep(1);
    setSecurityCompany('');
    setSocialId('');
    setSocialPassword('');
    setAccountNumber('');
    setAccountPassword('');
    setShowSocialPassword(false);
    setShowAccountPassword(false);
    setIsSecurityCompanySelected(false);
    setIsSocialIdEntered(false);
    setIsSocialPasswordEntered(false);
    setIsAccountNumberEntered(false);
    setIsAccountPasswordEntered(false);

    // 애니메이션 값 초기화
    socialIdAnimation.setValue(0);
    socialPasswordAnimation.setValue(0);
    nextButtonAnimation.setValue(0);
    accountNumberAnimation.setValue(0);
    accountPasswordAnimation.setValue(0);
    registerButtonAnimation.setValue(0);
  };

  // 증권사 선택 처리
  const handleSecurityCompanyChange = (value: string) => {
    setSecurityCompany(value);
    const isSelected = value !== '';

    if (isSelected !== isSecurityCompanySelected) {
      setIsSecurityCompanySelected(isSelected);

      if (isSelected) {
        // 소셜 아이디 필드 표시 애니메이션
        Animated.timing(socialIdAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
        setCurrentStep(2);
      } else {
        // 소셜 아이디 필드 숨김 애니메이션
        Animated.timing(socialIdAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 다른 필드도 초기화
        setIsSocialIdEntered(false);
        setIsSocialPasswordEntered(false);
        setIsAccountNumberEntered(false);
        setIsAccountPasswordEntered(false);

        // 다른 애니메이션도 초기화
        socialPasswordAnimation.setValue(0);
        nextButtonAnimation.setValue(0);
        accountNumberAnimation.setValue(0);
        accountPasswordAnimation.setValue(0);
        registerButtonAnimation.setValue(0);

        setCurrentStep(1);
      }
    }
  };

  // 소셜 아이디 입력 처리
  const handleSocialIdChange = (text: string) => {
    setSocialId(text);
    const isEntered = text.trim() !== '';

    if (isEntered !== isSocialIdEntered) {
      setIsSocialIdEntered(isEntered);

      if (isEntered) {
        // 소셜 비밀번호 필드 표시 애니메이션
        Animated.timing(socialPasswordAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
        setCurrentStep(3);
      } else {
        // 소셜 비밀번호 필드 숨김 애니메이션
        Animated.timing(socialPasswordAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 다음 필드들도 초기화
        setIsSocialPasswordEntered(false);
        setIsAccountNumberEntered(false);
        setIsAccountPasswordEntered(false);

        // 다음 애니메이션도 초기화
        nextButtonAnimation.setValue(0);
        accountNumberAnimation.setValue(0);
        accountPasswordAnimation.setValue(0);
        registerButtonAnimation.setValue(0);

        setCurrentStep(2);
      }
    }
  };

  // 소셜 비밀번호 입력 처리
  const handleSocialPasswordChange = (text: string) => {
    setSocialPassword(text);
    const isEntered = text.trim() !== '';

    if (isEntered !== isSocialPasswordEntered) {
      setIsSocialPasswordEntered(isEntered);

      if (isEntered) {
        // 다음 버튼 표시 애니메이션
        Animated.timing(nextButtonAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
      } else {
        // 다음 버튼 숨김 애니메이션
        Animated.timing(nextButtonAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 다음 필드들도 초기화
        setIsAccountNumberEntered(false);
        setIsAccountPasswordEntered(false);

        // 다음 애니메이션도 초기화
        accountNumberAnimation.setValue(0);
        accountPasswordAnimation.setValue(0);
        registerButtonAnimation.setValue(0);
      }
    }
  };

  // 계좌번호 입력 처리
  const handleAccountNumberChange = (text: string) => {
    setAccountNumber(text);
    const isEntered = text.trim() !== '';

    if (isEntered !== isAccountNumberEntered) {
      setIsAccountNumberEntered(isEntered);

      if (isEntered) {
        // 계좌 비밀번호 필드 표시 애니메이션
        Animated.timing(accountPasswordAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
        setCurrentStep(5);
      } else {
        // 계좌 비밀번호 필드 숨김 애니메이션
        Animated.timing(accountPasswordAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 계좌 비밀번호 초기화
        setIsAccountPasswordEntered(false);

        // 등록 버튼 애니메이션 초기화
        registerButtonAnimation.setValue(0);

        setCurrentStep(4);
      }
    }
  };

  // 계좌 비밀번호 입력 처리
  const handleAccountPasswordChange = (text: string) => {
    setAccountPassword(text);
    const isEntered = text.trim() !== '';

    if (isEntered !== isAccountPasswordEntered) {
      setIsAccountPasswordEntered(isEntered);

      if (isEntered) {
        // 계좌등록 버튼 표시 애니메이션
        Animated.timing(registerButtonAnimation, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();
      } else {
        // 계좌등록 버튼 숨김 애니메이션
        Animated.timing(registerButtonAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();
      }
    }
  };

  /**
   * 소셜 정보 검증을 위한 다음 버튼 클릭 핸들러
   * @async
   * @function handleNextButtonClick
   * @returns {Promise<void>}
   */
  const handleNextButtonClick = async () => {
    Keyboard.dismiss();
    setLoading(true);

    try {
      // 증권사 이름을 기관코드로 변환
      const firmInfo = findSecuritiesFirmByName(securityCompany);
      if (!firmInfo) {
        Alert.alert('오류', '선택한 증권사 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 요청 페이로드 준비
      const payload = {
        id: socialId,
        password: socialPassword,
        organization: firmInfo.code
      };

      console.log('전송 데이터:', payload);

      // 플라스크 API 호출 - 소셜 정보 검증
      const response = await verifySocialInfo(payload);

      // 성공적으로 응답 받고 accountList와 connectedId가 있는지 확인
      if (response.data && response.data.connectedId && response.data.accountList) {
        // connectedId와 accountList 저장
        const receivedConnectedId = response.data.connectedId;
        const receivedAccountList = response.data.accountList;

        setConnectedId(receivedConnectedId);
        setAccountList(receivedAccountList);

        console.log('연결 ID:', receivedConnectedId);
        console.log('계좌 목록:', receivedAccountList);

        // 다음 버튼 숨김
        Animated.timing(nextButtonAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }).start();

        // 계좌번호 필드 표시 애니메이션
        Animated.timing(accountNumberAnimation, {
          toValue: 1,
          duration: 300,
          delay: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }).start();

        setCurrentStep(4);
      } else {
        // 응답은 받았지만 필요한 데이터가 없는 경우
        const errorMessage = response.data?.message || '증권사 연동에 실패했습니다.';
        Alert.alert(
          '연동 실패',
          errorMessage,
          [{ text: '확인' }]
        );
        setSocialPassword('');
        setIsSocialPasswordEntered(false);
      }
    } catch (error) {
      console.error('소셜 정보 검증 중 오류:', error);
      Alert.alert(
        '연결 오류',
        '서버 연결 중 오류가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // 계좌번호 Picker 부분 수정
  // renderAccountPickerItems 함수 추가
  const renderAccountPickerItems = () => {
    return [
      <Picker.Item key="empty" label="계좌번호 선택" value="" />,
      ...accountList.map(account => (
        <Picker.Item key={account} label={account} value={account} />
      ))
    ];
  };


  // Picker 항목 생성을 위한 함수 추가
  const renderSecuritiesPickerItems = () => {
    return [
      <Picker.Item key="empty" label="증권사 선택" value="" />,
      ...SECURITIES_FIRMS.map(firm => (
        <Picker.Item key={firm.code} label={firm.name} value={firm.name} />
      ))
    ];
  };

  // 계좌등록 버튼 클릭 처리
  const handleRegisterAccount = async () => {
    Keyboard.dismiss();
    setLoading(true);

    try {
      const firmInfo = findSecuritiesFirmByName(securityCompany);
      // 플라스크 API 호출 - 계좌 정보 등록
      const response = await getAccountBalance({
        organization: firmInfo?.code || '',      // 증권사 코드
        connectedId: connectedId,                // '다음' 버튼에서 받아온 connectedId
        account: accountNumber,                  // 사용자가 선택한 계좌번호
        account_password: accountPassword,        // 사용자가 입력한 계좌 비밀번호
      });

      const company = securityCompany                     //증권사명
      const account = response.data.resAccount            //계좌번호
      const connected_id = connectedId                    // 커넥티드 아이디
      const principal = response.data.resDepositReceived  //시작 잔고
      const user_id = loggedInId                          //유저 아이디
      const token = `Bearer ${loggedToken}`
      console.log(`Bearer ${loggedToken}`);

      const addstockaccount = await registerAccount({ company, account, connected_id, principal }, token);

      // 성공적으로 응답 받음
      console.log(addstockaccount.data);

      if (response.data) {
        Alert.alert(
          '계좌 연동 성공',
          '계좌가 성공적으로 연동되었습니다.',
          [{
            text: '확인',
            onPress: () => {
              // 모달 닫기
              onClose();
            }
          }]
        );
      } else {
        // 등록 실패
        Alert.alert(
          '오류',
          '계좌 비밀번호가 올바르지 않습니다.',
          [{ text: '확인' }]
        );
        setAccountPassword('');
        setIsAccountPasswordEntered(false);
        registerButtonAnimation.setValue(0);
      }
    } catch (error) {
      console.error('계좌 등록 중 오류:', error);
      Alert.alert(
        '연결 오류',
        '서버 연결 중 오류가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {/* 증권사 선택 - 항상 표시 */}
              <View style={styles.stepContainer}>
                <Text style={styles.stepText}>step 1/5</Text>
                <Text style={styles.inputLabel}>증권사 <Text style={styles.requiredMark}>*</Text></Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={securityCompany}
                    onValueChange={handleSecurityCompanyChange}
                    style={styles.picker}
                  >
                    {renderSecuritiesPickerItems()}
                  </Picker>
                </View>
              </View>

              {/* 소셜 아이디 입력 - 애니메이션과 함께 표시 */}
              {currentStep >= 2 && (
                <Animated.View
                  style={[
                    styles.stepContainer,
                    {
                      opacity: socialIdAnimation,
                      transform: [{
                        translateY: socialIdAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.stepText}>step 2/5</Text>
                  <Text style={styles.inputLabel}>소셜 아이디 <Text style={styles.requiredMark}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={socialId}
                    onChangeText={handleSocialIdChange}
                    placeholder="증권 어플의 아이디를 입력해주세요."
                    placeholderTextColor="#999"
                  />
                </Animated.View>
              )}

              {/* 소셜 비밀번호 입력 - 애니메이션과 함께 표시 */}
              {currentStep >= 3 && (
                <Animated.View
                  style={[
                    styles.stepContainer,
                    {
                      opacity: socialPasswordAnimation,
                      transform: [{
                        translateY: socialPasswordAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.stepText}>step 3/5</Text>
                  <Text style={styles.inputLabel}>소셜 비밀번호 <Text style={styles.requiredMark}>*</Text></Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={socialPassword}
                      onChangeText={handleSocialPasswordChange}
                      secureTextEntry={!showSocialPassword}
                      placeholder="증권 어플의 비밀번호를 입력해주세요."
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowSocialPassword(!showSocialPassword)}
                    >
                      <Ionicons
                        name={showSocialPassword ? "eye" : "eye-off"}
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* 계좌번호 입력 - 애니메이션과 함께 표시 */}
              {currentStep >= 4 && (
                <Animated.View
                  style={[
                    styles.stepContainer,
                    {
                      opacity: accountNumberAnimation,
                      transform: [{
                        translateY: accountNumberAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.stepText}>step 4/5</Text>
                  <Text style={styles.inputLabel}>계좌번호 <Text style={styles.requiredMark}>*</Text></Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={accountNumber}
                      onValueChange={handleAccountNumberChange}
                      style={styles.picker}
                    >
                      {renderAccountPickerItems()}
                    </Picker>
                  </View>
                </Animated.View>
              )}

              {/* 계좌 비밀번호 입력 - 애니메이션과 함께 표시 */}
              {currentStep >= 5 && (
                <Animated.View
                  style={[
                    styles.stepContainer,
                    {
                      opacity: accountPasswordAnimation,
                      transform: [{
                        translateY: accountPasswordAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.stepText}>step 5/5</Text>
                  <Text style={styles.inputLabel}>계좌 비밀번호 <Text style={styles.requiredMark}>*</Text></Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={accountPassword}
                      onChangeText={handleAccountPasswordChange}
                      secureTextEntry={!showAccountPassword}
                      placeholder="계좌 비밀번호를 입력해주세요."
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowAccountPassword(!showAccountPassword)}
                    >
                      <Ionicons
                        name={showAccountPassword ? "eye" : "eye-off"}
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* 다음 버튼 - 소셜 비밀번호 입력 후 */}
            {currentStep === 3 && isSocialPasswordEntered && (
              <Animated.View
                style={{
                  opacity: nextButtonAnimation,
                  transform: [{
                    translateY: nextButtonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  style={styles.buttonStyle}
                  onPress={handleNextButtonClick}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>다음</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* 계좌등록 버튼 - 계좌 비밀번호 입력 후 */}
            {currentStep === 5 && isAccountPasswordEntered && (
              <Animated.View
                style={{
                  opacity: registerButtonAnimation,
                  transform: [{
                    translateY: registerButtonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.buttonStyle,
                    { backgroundColor: '#4A69FF' }
                  ]}
                  onPress={handleRegisterAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>계좌 등록</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollViewContent: {
    paddingTop: 30,
    paddingBottom: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  requiredMark: {
    color: '#f03e3e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  eyeIcon: {
    padding: 10,
  },
  buttonStyle: {
    backgroundColor: '#999',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default withTheme(ConnectedAccountComponent);
