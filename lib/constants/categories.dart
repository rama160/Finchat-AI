import 'package:flutter/material.dart';

class CategoryItem {
  final String name;
  final String type; // 'expense' or 'income'
  final IconData icon;
  final Color color;
  final Color bgLight;

  const CategoryItem({
    required this.name,
    required this.type,
    required this.icon,
    required this.color,
    required this.bgLight,
  });
}

const List<CategoryItem> expenseCategories = [
  CategoryItem(
    name: 'Makanan',
    type: 'expense',
    icon: Icons.restaurant,
    color: Color(0xFFF97316),
    bgLight: Color(0xFFFFEDD5),
  ),
  CategoryItem(
    name: 'Transportasi',
    type: 'expense',
    icon: Icons.directions_car,
    color: Color(0xFF2563EB),
    bgLight: Color(0xFFDBEAFE),
  ),
  CategoryItem(
    name: 'Belanja',
    type: 'expense',
    icon: Icons.shopping_bag,
    color: Color(0xFFEC4899),
    bgLight: Color(0xFFFCE7F3),
  ),
  CategoryItem(
    name: 'Tagihan & Utilitas',
    type: 'expense',
    icon: Icons.receipt_long,
    color: Color(0xFFEAB308),
    bgLight: Color(0xFFFEF9C3),
  ),
  CategoryItem(
    name: 'Kesehatan',
    type: 'expense',
    icon: Icons.local_hospital,
    color: Color(0xFFEF4444),
    bgLight: Color(0xFFFEE2E2),
  ),
  CategoryItem(
    name: 'Hiburan',
    type: 'expense',
    icon: Icons.movie,
    color: Color(0xFF9333EA),
    bgLight: Color(0xFFF3E8FF),
  ),
  CategoryItem(
    name: 'Pendidikan',
    type: 'expense',
    icon: Icons.school,
    color: Color(0xFF0284C7),
    bgLight: Color(0xFFE0F2FE),
  ),
  CategoryItem(
    name: 'Lainnya',
    type: 'expense',
    icon: Icons.more_horiz,
    color: Color(0xFF64748B),
    bgLight: Color(0xFFF1F5F9),
  ),
];

const List<CategoryItem> incomeCategories = [
  CategoryItem(
    name: 'Gaji',
    type: 'income',
    icon: Icons.account_balance_wallet,
    color: Color(0xFF059669),
    bgLight: Color(0xFFD1FAE5),
  ),
  CategoryItem(
    name: 'Bonus',
    type: 'income',
    icon: Icons.military_tech,
    color: Color(0xFFD97706),
    bgLight: Color(0xFFFEF3C7),
  ),
  CategoryItem(
    name: 'Penjualan',
    type: 'income',
    icon: Icons.store,
    color: Color(0xFF2563EB),
    bgLight: Color(0xFFDBEAFE),
  ),
  CategoryItem(
    name: 'Transfer Masuk',
    type: 'income',
    icon: Icons.arrow_downward,
    color: Color(0xFF7C3AED),
    bgLight: Color(0xFFEDE9FE),
  ),
  CategoryItem(
    name: 'Hadiah',
    type: 'income',
    icon: Icons.card_giftcard,
    color: Color(0xFFEC4899),
    bgLight: Color(0xFFFCE7F3),
  ),
  CategoryItem(
    name: 'Investasi',
    type: 'income',
    icon: Icons.trending_up,
    color: Color(0xFF0D9488),
    bgLight: Color(0xFFCCFBF1),
  ),
  CategoryItem(
    name: 'Lainnya',
    type: 'income',
    icon: Icons.more_horiz,
    color: Color(0xFF64748B),
    bgLight: Color(0xFFF1F5F9),
  ),
];

CategoryItem getCategoryItem(String name, [String type = 'expense']) {
  final list = type == 'income' ? incomeCategories : expenseCategories;
  return list.firstWhere(
    (c) => c.name.toLowerCase() == name.toLowerCase(),
    orElse: () => CategoryItem(
      name: name,
      type: type,
      icon: Icons.category,
      color: const Color(0xFF64748B),
      bgLight: const Color(0xFFF1F5F9),
    ),
  );
}
