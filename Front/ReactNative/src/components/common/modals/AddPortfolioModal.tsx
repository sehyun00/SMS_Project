import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../../types/theme';
import createStyles from '../../../styles/components/modals/addPortfolioModal.styles';

interface AddPortfolioModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  theme: Theme;
}

const AddPortfolioModal: React.FC<AddPortfolioModalProps> = ({
  visible,
  onClose,
  onConfirm,
  theme
}) => {
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <TouchableOpacity
        style={styles.modalBackground}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            새 포트폴리오 추가하기
          </Text>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
          >
            <Text style={styles.confirmButtonText}>추가하기</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default AddPortfolioModal; 