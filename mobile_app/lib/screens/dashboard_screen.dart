import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _symptom = 'iPhone 12 auto restarts every 3 minutes';
  String _selectedBrand = 'Apple';
  String _selectedModel = 'iPhone 12';
  bool _running = false;
  Map<String, dynamic>? _result;

  void _runAiDiagnostics(String token) async {
    setState(() {
      _running = true;
      _result = null;
    });

    final res = await ApiService.submitDiagnosis(token, _symptom, _selectedModel);

    setState(() {
      _running = false;
      _result = res;
    });

    if (res == null) {
      // Fallback response for offline sandbox
      setState(() {
        _result = {
          'summary': 'The device suffers from a telemetry loop (prs0/mic1 failure).',
          'likelyFaults': [
            {
              'fault': 'prs0 Sensor Missing (Charge Port)',
              'confidence': 0.95,
              'reason': 'iOS periodically queries the barometer on I2C3 line; failures trigger a 180s watchdog reset.',
              'componentsToCheck': ['FPC connector pins', 'prs0 module'],
              'railsToMeasure': ['PP_VAR_S2_LDO1', 'I2C3_SDA'],
            }
          ],
          'stepByStepDiagnosis': [
            'Disconnect battery module.',
            'Examine charge flex connector under microscope.',
            'Replace charge dock assembly.'
          ],
          'repairDifficulty': 'MEDIUM',
        };
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    final token = args['token'] as String;
    final userName = args['userName'] as String;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Microsolder AI Mobile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back,', style: theme.textTheme.bodyMedium),
            Text(
              userName,
              style: theme.textTheme.titleLarge?.copyWith(fontSize: 22),
            ),
            const SizedBox(height: 20),
            
            // Symptom diagnosis panel
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AI Symptom Diagnostics',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _selectedBrand,
                      items: const [
                        DropdownMenuItem(value: 'Apple', child: Text('Apple')),
                        DropdownMenuItem(value: 'Samsung', child: Text('Samsung')),
                        DropdownMenuItem(value: 'Sony', child: Text('Sony')),
                      ],
                      onChanged: (val) => setState(() => _selectedBrand = val!),
                      decoration: const InputDecoration(labelText: 'Manufacturer'),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: _selectedModel,
                      items: const [
                        DropdownMenuItem(value: 'iPhone 12', child: Text('iPhone 12')),
                        DropdownMenuItem(value: 'MacBook Pro A2338', child: Text('MacBook Pro A2338')),
                        DropdownMenuItem(value: 'Galaxy S21 Ultra', child: Text('Galaxy S21 Ultra')),
                        DropdownMenuItem(value: 'PlayStation 5', child: Text('PlayStation 5')),
                      ],
                      onChanged: (val) => setState(() => _selectedModel = val!),
                      decoration: const InputDecoration(labelText: 'Model Target'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Observed Symptom',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (val) => _symptom = val,
                      controller: TextEditingController(text: _symptom),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.secondary,
                          foregroundColor: Colors.black,
                        ),
                        onPressed: _running ? null : () => _runAiDiagnostics(token),
                        child: _running
                            ? const CircularProgressIndicator(color: Colors.black)
                            : const Text('Analyze Symptom'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),

            // Diagnostic Results
            if (_result != null) ...[
              const Text(
                'AI Analysis Report',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 10),
              Card(
                color: const Color(0xFF171D34),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _result!['summary'] as String,
                        style: const TextStyle(fontSize: 14, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      const Divider(color: Colors.white10),
                      const SizedBox(height: 8),
                      Text(
                        'Suspected: ${(_result!['likelyFaults'] as List)[0]['fault']}',
                        style: TextStyle(
                          color: theme.colorScheme.error,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        'Reason: ${(_result!['likelyFaults'] as List)[0]['reason']}',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Diagnostic steps to follow:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      ...(_result!['stepByStepDiagnosis'] as List).map(
                        (step) => Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline, size: 16, color: Colors.green),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  step as String,
                                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
