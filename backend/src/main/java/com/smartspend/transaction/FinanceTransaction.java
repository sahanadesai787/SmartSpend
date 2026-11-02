package com.smartspend.transaction;

import com.smartspend.user.AppUser;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
public class FinanceTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(length = 250)
    private String description;

    @Column(nullable = false)
    private LocalDate transactionDate;

    protected FinanceTransaction() {}

    public FinanceTransaction(AppUser user, TransactionType type, BigDecimal amount,
                              String category, String description, LocalDate transactionDate) {
        this.user = user;
        this.type = type;
        this.amount = amount;
        this.category = category;
        this.description = description;
        this.transactionDate = transactionDate;
    }

    public void update(TransactionType type, BigDecimal amount, String category,
                       String description, LocalDate date) {
        this.type = type;
        this.amount = amount;
        this.category = category;
        this.description = description;
        this.transactionDate = date;
    }

    public Long getId() { return id; }
    public TransactionType getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public LocalDate getTransactionDate() { return transactionDate; }
}
