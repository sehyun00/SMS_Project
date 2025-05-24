package com.upwardright.rebalancing.rebalancing.service;

import com.upwardright.rebalancing.rebalancing.domain.Accounts;
import com.upwardright.rebalancing.rebalancing.domain.SaveRebalancing;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingRequest;
import com.upwardright.rebalancing.rebalancing.dto.SaveRebalancingResponse;
import com.upwardright.rebalancing.rebalancing.repository.AccountRepository;
import com.upwardright.rebalancing.rebalancing.repository.SaveRebalancingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaveRebalancingService {

    private final SaveRebalancingRepository saveRebalancingRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public SaveRebalancingResponse saveRebalancing(SaveRebalancingRequest request) {
        try {
            // 1. 계좌 존재 여부 확인
            boolean accountExists = accountRepository.existsByAccountAndUser_id(
                    request.getAccountNumber(),
                    request.getUserId()
            );

            if (!accountExists) {
                throw new RuntimeException("계좌를 찾을 수 없습니다: " + request.getAccountNumber());
            }

            // 2. 사용자의 계좌 목록에서 해당 계좌 찾기
            List<Accounts> userAccounts = accountRepository.findByUserId(request.getUserId());
            Accounts account = userAccounts.stream()
                    .filter(acc -> acc.getAccount().equals(request.getAccountNumber()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다: " + request.getAccountNumber()));

            // 3. 리벨런싱 기록 생성
            SaveRebalancing saveRebalancing = SaveRebalancing.builder()
                    .account(account)
                    .record_date(LocalDateTime.now())
                    .total_balance(request.getTotalBalance())
                    .record_name(request.getRecordName())
                    .memo(request.getMemo())
                    .profit_rate(request.getProfitRate())
                    .build();

            SaveRebalancing savedRecord = saveRebalancingRepository.save(saveRebalancing);

            return new SaveRebalancingResponse(savedRecord);

        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<SaveRebalancingResponse> getRebalancingRecords(String accountNumber, String userId) {
        try {
            // 1. 계좌 존재 여부 확인
            boolean accountExists = accountRepository.existsByAccountAndUser_id(accountNumber, userId);

            if (!accountExists) {
                throw new RuntimeException("계좌를 찾을 수 없습니다: " + accountNumber);
            }

            // 2. 사용자의 계좌 목록에서 해당 계좌 찾기
            List<Accounts> userAccounts = accountRepository.findByUserId(userId);
            Accounts account = userAccounts.stream()
                    .filter(acc -> acc.getAccount().equals(accountNumber))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다: " + accountNumber));

            // 3. 리벨런싱 기록 조회
            List<SaveRebalancing> records = saveRebalancingRepository.findByAccountOrderByRecord_dateDesc(account);

            return records.stream()
                    .map(SaveRebalancingResponse::new)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public SaveRebalancingResponse getRebalancingRecord(int recordId) {
        try {
            SaveRebalancing record = saveRebalancingRepository.findById(recordId)
                    .orElseThrow(() -> new RuntimeException("기록을 찾을 수 없습니다: " + recordId));

            return new SaveRebalancingResponse(record);

        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<SaveRebalancingResponse> getUserRebalancingRecords(String userId) {
        try {
            // 사용자의 모든 계좌 조회
            List<Accounts> userAccounts = accountRepository.findByUserId(userId);

            if (userAccounts.isEmpty()) {
                throw new RuntimeException("사용자의 계좌를 찾을 수 없습니다: " + userId);
            }

            // 모든 계좌의 리벨런싱 기록 조회
            List<SaveRebalancing> allRecords = userAccounts.stream()
                    .flatMap(account -> saveRebalancingRepository.findByAccountOrderByRecord_dateDesc(account).stream())
                    .toList();

            return allRecords.stream()
                    .map(SaveRebalancingResponse::new)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("사용자 리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<SaveRebalancingResponse> getRebalancingRecordsByDate(String userId, LocalDate date) {
        try {
            // 사용자의 모든 계좌 조회
            List<Accounts> userAccounts = accountRepository.findByUserId(userId);

            if (userAccounts.isEmpty()) {
                throw new RuntimeException("사용자의 계좌를 찾을 수 없습니다: " + userId);
            }

            // 특정 날짜의 리벨런싱 기록 조회
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);

            List<SaveRebalancing> dateRecords = userAccounts.stream()
                    .flatMap(account -> saveRebalancingRepository
                            .findByAccountAndRecord_dateBetween(account, startOfDay, endOfDay).stream())
                    .toList();

            return dateRecords.stream()
                    .map(SaveRebalancingResponse::new)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("날짜별 리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
