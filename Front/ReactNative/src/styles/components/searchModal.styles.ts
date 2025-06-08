import { StyleSheet } from 'react-native';
import { Theme } from '../../types/theme';

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 15,
  },
  regionTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 5,
  },
  regionTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  regionTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    color: theme.colors.text,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  resultItemTicker: {
    fontSize: 14,
    color: theme.colors.text + '80',
    marginTop: 4,
  },
  resultItemPrice: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  emptyResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyResultText: {
    fontSize: 16,
    color: theme.colors.text + '80',
  },
});

export default createStyles; 