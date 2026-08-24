import 'package:flutter/material.dart';

void main() {
  runApp(const ZobraApp());
}

class ZobraApp extends StatelessWidget {
  const ZobraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zobra Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Text(
            'Zobra Mobile Customer App Foundation',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
