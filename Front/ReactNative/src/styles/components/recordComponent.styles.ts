// 경로: src/styles/components/recordComponent.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../../types/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
    },
    accountCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    accountHeader: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    accountCompanay: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingRight: 5,
        color: theme.colors.text,
    },
    accountNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: theme.colors.placeholder,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
    },
    positiveValue: {
        color: theme.colors.positive,
    },
    negativeValue: {
        color: theme.colors.negative,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginTop: 8,
    },
    headerText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.placeholder,
        flex: 1,
        textAlign: 'center',
    },
    recordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    recordName: {
        fontSize: 13,
        flex: 1,
        paddingRight: 8,
        color: theme.colors.text,
    },
    recordDate: {
        fontSize: 13,
        color: theme.colors.placeholder,
        flex: 1,
        textAlign: 'center',
    },
    recordProfit: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        color: theme.colors.text,
    },
    selectedRecord: {
        backgroundColor: theme.colors.primary + '20', // 투명도 20% 적용
    },
    recordDetail: {
        marginTop: 10,
        padding: 12,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    recordDetailTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
        color: theme.colors.text,
    },
});
