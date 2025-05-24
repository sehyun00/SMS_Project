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
            List<Accounts> userAccounts = accountRepository.findByUserId(request.getUser_id());

            if (userAccounts.isEmpty()) {
                throw new RuntimeException("사용자의 계좌가 존재하지 않습니다: " + request.getUser_id());
            }

            boolean accountExists = userAccounts.stream()
                    .anyMatch(acc -> acc.getAccount().equals(request.getAccount()));

            if (!accountExists) {
                String accountList = userAccounts.stream()
                        .map(Accounts::getAccount)
                        .collect(Collectors.joining(", "));
                throw new RuntimeException("선택한 계좌가 존재하지 않습니다. 보유 계좌: " + accountList);
            }

            // 2. 리벨런싱 기록 생성 (user_id와 account 모두 저장)
            SaveRebalancing saveRebalancing = SaveRebalancing.builder()
                    .user_id(request.getUser_id())
                    .account(request.getAccount())
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
    public List<SaveRebalancingResponse> getRebalancingRecords(String account, String user_id) {
        try {
            // 직접 user_id와 account로 조회
            List<SaveRebalancing> records = saveRebalancingRepository
                    .findByUserIdAndAccountOrderByRecordDateDesc(user_id, account);

            return records.stream()
                    .map(SaveRebalancingResponse::new)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public SaveRebalancingResponse getRebalancingRecord(int record_id) {
        try {
            SaveRebalancing record = saveRebalancingRepository.findById(record_id)
                    .orElseThrow(() -> new RuntimeException("기록을 찾을 수 없습니다: " + record_id));

            return new SaveRebalancingResponse(record);

        } catch (Exception e) {
            throw new RuntimeException("리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

//    @Transactional(readOnly = true)
//    public List<SaveRebalancingResponse> getRebalancingRecordsByDate(String user_id, String account, LocalDate date) {
//        try {
//            // 1. 계좌 존재 여부 확인
//            List<Accounts> userAccounts = accountRepository.findByUserId(user_id);
//            boolean accountExists = userAccounts.stream()
//                    .anyMatch(acc -> acc.getAccount().equals(account));
//
//            if (!accountExists) {
//                throw new RuntimeException("계좌를 찾을 수 없습니다: " + account);
//            }
//
//            // 2. 특정 계좌의 특정 날짜 리벨런싱 기록 조회
//            LocalDateTime startOfDay = date.atStartOfDay();
//            LocalDateTime endOfDay = date.atTime(23, 59, 59);
//
//            List<SaveRebalancing> dateRecords = saveRebalancingRepository
//                    .findByUser_idAndAccountAndRecord_dateBetween(user_id, account, startOfDay, endOfDay);
//
//            return dateRecords.stream()
//                    .map(SaveRebalancingResponse::new)
//                    .collect(Collectors.toList());
//
//        } catch (Exception e) {
//            throw new RuntimeException("날짜별 리벨런싱 기록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
//        }
//    }
//
//    // 사용자의 계좌 목록 조회 메서드
//    @Transactional(readOnly = true)
//    public List<String> getUserAccounts(String user_id) {
//        try {
//            List<Accounts> userAccounts = accountRepository.findByUserId(user_id);
//
//            return userAccounts.stream()
//                    .map(Accounts::getAccount)
//                    .collect(Collectors.toList());
//
//        } catch (Exception e) {
//            throw new RuntimeException("사용자 계좌 목록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
//        }
//    }
}
