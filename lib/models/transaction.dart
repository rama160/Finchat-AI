enum TransactionType { expense, income }

class TransactionModel {
  final String id;
  final String description;
  final int amount;
  final TransactionType type;
  final String category;
  final String transactionDate;
  final String transactionTime;
  final String merchant;
  final String notes;
  final String paymentMethod;
  final String source;

  TransactionModel({
    required this.id,
    required this.description,
    required this.amount,
    required this.type,
    required this.category,
    required this.transactionDate,
    required this.transactionTime,
    this.merchant = '',
    this.notes = '',
    this.paymentMethod = 'Tunai',
    this.source = 'manual',
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      description: json['description'] ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      type: json['type'] == 'income' ? TransactionType.income : TransactionType.expense,
      category: json['category'] ?? 'Lainnya',
      transactionDate: json['transaction_date'] ?? DateTime.now().toIso8601String().split('T')[0],
      transactionTime: json['transaction_time'] ?? '12:00:00',
      merchant: json['merchant'] ?? '',
      notes: json['notes'] ?? '',
      paymentMethod: json['payment_method'] ?? 'Tunai',
      source: json['source'] ?? 'manual',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'description': description,
      'amount': amount,
      'type': type == TransactionType.income ? 'income' : 'expense',
      'category': category,
      'transaction_date': transactionDate,
      'transaction_time': transactionTime,
      'merchant': merchant,
      'notes': notes,
      'payment_method': paymentMethod,
      'source': source,
    };
  }
}
