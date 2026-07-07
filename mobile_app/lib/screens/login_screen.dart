import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'tech@microsolder.ai');
  final _passwordController = TextEditingController(text: 'Password123!');
  bool _loading = false;

  void _handleLogin() async {
    setState(() => _loading = true);
    
    final result = await ApiService.login(
      _emailController.text,
      _passwordController.text,
    );

    setState(() => _loading = false);

    if (result != null && result.containsKey('access_token')) {
      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          '/dashboard',
          arguments: {
            'token': result['access_token'],
            'userName': result['user']['name'],
            'role': result['user']['role'],
          },
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification Failed. Offline Sandbox mode initialized.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
        // Fallback for demonstration inside standard simulator context
        Navigator.pushReplacementNamed(
          context,
          '/dashboard',
          arguments: {
            'token': 'mock-demo-token-123',
            'userName': 'Workbench Tech (Demo Mode)',
            'role': 'TECHNICIAN',
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.bolt, size: 36, color: Colors.white),
              ),
              const SizedBox(height: 16),
              Text(
                'Microsolder AI',
                style: theme.textTheme.displayMedium?.copyWith(
                  fontSize: 28,
                  fontFamily: 'Outfit',
                ),
              ),
              const SizedBox(height: 6),
              const Text('Workbench Mobile Diagnostics'),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock),
                ),
                obscureText: true,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: _loading ? null : _handleLogin,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Sign In to Node',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
