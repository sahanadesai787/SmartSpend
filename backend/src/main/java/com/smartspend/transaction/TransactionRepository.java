package com.smartspend.transaction;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<FinanceTransaction, Long> {
    List<FinanceTransaction> findAllByUserIdOrderByTransactionDateDescIdDesc(Long userId);
    Optional<FinanceTransaction> findByIdAndUserId(Long id, Long userId);

    @Query("select coalesce(sum(t.amount), 0) from FinanceTransaction t where t.user.id = :userId and t.type = :type and t.transactionDate between :start and :end")
    BigDecimal sumByUserAndTypeAndDate(@Param("userId") Long userId,
            @Param("type") TransactionType type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select t.category as category, sum(t.amount) as total from FinanceTransaction t where t.user.id = :userId and t.type = com.smartspend.transaction.TransactionType.EXPENSE and t.transactionDate between :start and :end group by t.category order by sum(t.amount) desc")
    List<CategoryTotal> expenseByCategory(@Param("userId") Long userId,
            @Param("start") LocalDate start, @Param("end") LocalDate end);

    interface CategoryTotal {
        String getCategory();
        BigDecimal getTotal();
    }
}
