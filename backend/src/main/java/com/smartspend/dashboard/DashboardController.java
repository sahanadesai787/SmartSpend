package com.smartspend.dashboard;

import com.smartspend.transaction.*;
import com.smartspend.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final TransactionRepository transactions;
    private final UserRepository users;

    public DashboardController(TransactionRepository transactions, UserRepository users) {
        this.transactions = transactions;
        this.users = users;
    }

    public record CategoryBreakdown(String category, BigDecimal total) {}
    public record Summary(BigDecimal totalIncome, BigDecimal totalExpenses,
                          BigDecimal balance, List<CategoryBreakdown> expenseByCategory) {}

    @GetMapping("/summary")
    public Summary summary(Authentication auth,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        Long userId = users.findByEmailIgnoreCase(auth.getName()).orElseThrow().getId();
        LocalDate today = LocalDate.now();
        int selectedYear = year == null ? today.getYear() : year;
        int selectedMonth = month == null ? today.getMonthValue() : month;
        YearMonth ym = YearMonth.of(selectedYear, selectedMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal income = transactions.sumByUserAndTypeAndDate(userId, TransactionType.INCOME, start, end);
        BigDecimal expenses = transactions.sumByUserAndTypeAndDate(userId, TransactionType.EXPENSE, start, end);
        List<CategoryBreakdown> categories = transactions.expenseByCategory(userId, start, end)
                .stream().map(c -> new CategoryBreakdown(c.getCategory(), c.getTotal())).toList();

        return new Summary(income, expenses, income.subtract(expenses), categories);
    }
}
