package com.upwardright.rebalancing.reblancing.repository;

import com.upwardright.rebalancing.reblancing.domain.Accounts;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Accounts, String> {
}
