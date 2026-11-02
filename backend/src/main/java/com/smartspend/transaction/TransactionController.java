package com.smartspend.transaction;

import com.smartspend.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionRepository transactions;
    private final UserRepository users;

    public TransactionController(TransactionRepository transactions, UserRepository users) {
        this.transactions = transactions;
        this.users = users;
    }

    public record TransactionRequest(
            @NotNull TransactionType type,
            @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank @Size(max = 60) String category,
            @Size(max = 250) String description,
            @NotNull LocalDate transactionDate) {}
    public record TransactionResponse(Long id, TransactionType type, BigDecimal amount,
            String category, String description, LocalDate transactionDate) {}

    @GetMapping
    public List<TransactionResponse> list(Authentication auth) {
        Long userId = userId(auth);
        return transactions.findAllByUserIdOrderByTransactionDateDescIdDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @PostMapping
    public TransactionResponse create(@Valid @RequestBody TransactionRequest request, Authentication auth) {
        var user = users.findById(userId(auth)).orElseThrow();
        var saved = transactions.save(new FinanceTransaction(user, request.type(), request.amount(),
                request.category().trim(), clean(request.description()), request.transactionDate()));
        return toResponse(saved);
    }

    @PutMapping("/{id}")
    public TransactionResponse update(@PathVariable Long id, @Valid @RequestBody TransactionRequest request,
                                      Authentication auth) {
        var item = transactions.findByIdAndUserId(id, userId(auth))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Transaction not found"));
        item.update(request.type(), request.amount(), request.category().trim(),
                clean(request.description()), request.transactionDate());
        return toResponse(transactions.save(item));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication auth) {
        var item = transactions.findByIdAndUserId(id, userId(auth))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Transaction not found"));
        transactions.delete(item);
    }

    private Long userId(Authentication auth) {
        return users.findByEmailIgnoreCase(auth.getName()).orElseThrow().getId();
    }

    private String clean(String value) { return value == null ? "" : value.trim(); }

    private TransactionResponse toResponse(FinanceTransaction t) {
        return new TransactionResponse(t.getId(), t.getType(), t.getAmount(), t.getCategory(),
                t.getDescription(), t.getTransactionDate());
    }
}
